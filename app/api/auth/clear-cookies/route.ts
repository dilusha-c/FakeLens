import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = cookies();
  
  // Clear all auth-related cookies
  const authCookies = [
    'authjs.session-token',
    'authjs.csrf-token',
    'authjs.callback-url',
    '__Secure-authjs.session-token',
    '__Host-authjs.csrf-token',
  ];

  authCookies.forEach(name => {
    cookieStore.delete(name);
  });

  return NextResponse.json({ 
    success: true, 
    message: 'Auth cookies cleared. Please refresh and login again.' 
  });
}
