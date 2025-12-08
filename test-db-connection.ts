import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_Le72BsHVkhxz@ep-cold-mountain-ahzchw7o-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    },
  },
});

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('PostgreSQL Version:', result);
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
