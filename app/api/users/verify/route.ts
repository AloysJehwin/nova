import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const ORG_SECRET = process.env.SENSAY_ORG_SECRET;
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION;

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
    
    console.log('Verifying user in Sensay:', userId);
    
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
      console.log('User verified successfully:', userId);
      return NextResponse.json({
        exists: true,
        user: data
      });
    } else if (response.status === 404) {
      console.log('User not found in Sensay:', userId);
      return NextResponse.json({
        exists: false,
        error: 'User not found'
      }, { status: 404 });
    } else {
      console.error('Error verifying user:', data);
      return NextResponse.json(data, { status: response.status });
    }
  } catch (error) {
    console.error('User verification exception:', error);
    return NextResponse.json(
      { error: 'Failed to verify user' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();
    
    if (!userId || !email) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
        { status: 400 }
      );
    }
    
    console.log('Ensuring user exists in Sensay:', userId, email);
    
    // First check if user exists
    const checkResponse = await fetch(`${API_URL}/v1/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-ORGANIZATION-SECRET': ORG_SECRET!,
        'X-API-Version': API_VERSION!,
      },
    });
    
    if (checkResponse.ok) {
      console.log('User already exists in Sensay:', userId);
      const userData = await checkResponse.json();
      return NextResponse.json({
        exists: true,
        user: userData
      });
    }
    
    // User doesn't exist, create them
    console.log('User not found, creating in Sensay:', userId);
    
    const createResponse = await fetch(`${API_URL}/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ORGANIZATION-SECRET': ORG_SECRET!,
        'X-API-Version': API_VERSION!,
      },
      body: JSON.stringify({
        id: userId,
        email: email,
      }),
    });
    
    const createData = await createResponse.json();
    
    if (createResponse.ok || createResponse.status === 201 || createResponse.status === 409) {
      console.log('User ensured in Sensay:', userId);
      return NextResponse.json({
        exists: createResponse.status === 409,
        created: createResponse.status !== 409,
        user: createData
      });
    } else {
      console.error('Failed to ensure user in Sensay:', createData);
      return NextResponse.json(createData, { status: createResponse.status });
    }
  } catch (error) {
    console.error('User ensure exception:', error);
    return NextResponse.json(
      { error: 'Failed to ensure user exists' },
      { status: 500 }
    );
  }
}