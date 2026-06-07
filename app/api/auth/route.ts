import { NextRequest, NextResponse } from 'next/server';

const VALID_USERNAME = 'R.Amisha';
const VALID_PASSWORD = 'mouse12345';

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') || '';
  const isLoggedIn = cookieHeader.includes('cms_logged_in=true');
  
  if (isLoggedIn) {
    return NextResponse.json({
      authenticated: true,
      user: {
        id: 'usr-1',
        name: 'R.Amisha',
        role: 'Administrator'
      }
    });
  }
  
  return NextResponse.json({ authenticated: false, user: null });
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    if (username !== VALID_USERNAME || password !== VALID_PASSWORD) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: 'usr-1',
        name: 'R.Amisha',
        role: 'Administrator'
      }
    });
    response.headers.set('Set-Cookie', 'cms_logged_in=true; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400');
    return response;
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.headers.set('Set-Cookie', 'cms_logged_in=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
  return response;
}
