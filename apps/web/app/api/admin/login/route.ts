import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    // Get admin password from environment variables
    const adminPassword = process.env.ADMIN_PASSWORD || 'metapulse2024';
    
    if (password === adminPassword) {
      return NextResponse.json({ 
        success: true, 
        message: 'Authentication successful' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid password' 
      }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Authentication failed' 
    }, { status: 500 });
  }
}