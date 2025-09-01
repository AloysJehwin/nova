import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const ORG_SECRET = process.env.SENSAY_ORG_SECRET;
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log the user creation attempt
    console.log('Creating/updating user in Sensay:', body.id, body.email);
    
    const response = await fetch(`${API_URL}/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ORGANIZATION-SECRET': ORG_SECRET!,
        'X-API-Version': API_VERSION!,
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    // Log the response for debugging
    console.log('Sensay user response:', response.status, data);
    
    if (response.ok) {
      return NextResponse.json(data);
    } else if (response.status === 409) {
      // User already exists, this is fine
      console.log('User already exists in Sensay, continuing...');
      return NextResponse.json({ ...body, exists: true }, { status: 200 });
    } else {
      console.error('Sensay user creation error:', data);
      return NextResponse.json(data, { status: response.status });
    }
  } catch (error) {
    console.error('User creation exception:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`${API_URL}/v1/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-ORGANIZATION-SECRET': ORG_SECRET!,
        'X-API-Version': API_VERSION!,
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return NextResponse.json(data);
    } else {
      return NextResponse.json(data, { status: response.status });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}