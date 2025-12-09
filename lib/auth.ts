import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
// Avoid importing `bcryptjs` at module scope because it uses Node APIs
// that are incompatible with the Edge runtime. Import dynamically
// inside server-only functions instead.

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          throw new Error("User not found");
        }

        const { compare } = await import('bcryptjs');
        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
    // Add Google OAuth provider when configured in environment
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        // For Google OAuth, we need to fetch/create the user in our DB first
        if (account?.provider === 'google' && user.email) {
          try {
            const dbUser = await prisma.user.upsert({
              where: { email: user.email },
              update: { name: user.name || '' },
              create: { 
                email: user.email, 
                name: user.name || '', 
                role: 'user', 
                password: '' 
              },
            });
            token.id = dbUser.id;
            token.role = dbUser.role;
          } catch (err) {
            console.error('Failed to upsert Google user in JWT callback:', err);
          }
        } else {
          // For credentials login, user already has DB id
          token.id = user.id;
          token.role = user.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      // Events are for side effects only - user creation is now handled in JWT callback
      try {
        if (account?.provider === 'google' && user?.email) {
          console.log('Google user signed in:', user.email);
        }
      } catch (err) {
        console.error('Sign-in event error:', err);
      }
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});
