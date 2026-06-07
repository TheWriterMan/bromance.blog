import { NextRequest, NextResponse } from 'next/server';

// In a real Vercel / Supabase DB build, we would use Supabase Auth.
// Here we simulate the session seamlessly.
export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') || '';
  const isLoggedIn = cookieHeader.includes('cms_logged_in=true');
  
  if (isLoggedIn) {
    return NextResponse.json({
      authenticated: true,
      user: {
        id: 'usr-1',
        email: 'slipperyslipped@gmail.com',
        name: 'Slippery Slipped',
        role: 'Administrator'
      }
    });
  }
  
  return NextResponse.json({ authenticated: false, user: null });
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    // Accept any password, but check email or make it flexible for flow
    if (email) {
      const response = NextResponse.json({
        success: true,
        user: {
          id: 'usr-1',
          email: email,
          name: 'Slippery Slipped',
          role: 'Administrator'
        }
      });
      // Set a cookie that will match the login
      response.headers.set('Set-Cookie', 'cms_logged_in=true; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400');
      return response;
    }
    
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.headers.set('Set-Cookie', 'cms_logged_in=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
  return response;
}
