import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const ORG_SECRET = process.env.SENSAY_ORG_SECRET;
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log the bot creation attempt
    console.log('Bot creation request received');
    console.log('Owner ID:', body.ownerID);
    console.log('Bot name:', body.name);
    console.log('Model:', body.llm?.model);
    
    // First, ensure the user exists in Sensay before creating bot
    if (body.ownerID) {
      console.log('Verifying owner exists in Sensay:', body.ownerID);
      try {
        const userVerifyResponse = await fetch(`${API_URL}/v1/users/${body.ownerID}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-ORGANIZATION-SECRET': ORG_SECRET!,
            'X-API-Version': API_VERSION!,
          },
        });
        
        if (!userVerifyResponse.ok) {
          console.error('Owner does not exist in Sensay:', body.ownerID);
          return NextResponse.json({
            error: `Owner "${body.ownerID}" does not exist. Please sign out and sign in again to refresh your account.`,
            needsReauth: true
          }, { status: 400 });
        }
        
        console.log('Owner verified in Sensay:', body.ownerID);
      } catch (error) {
        console.error('Error verifying owner:', error);
        return NextResponse.json({
          error: 'Failed to verify user. Please try again.',
          needsReauth: true
        }, { status: 500 });
      }
    }
    
    // Add retry logic with timeout for unreliable Sensay API
    let lastError;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
        
        const response = await fetch(`${API_URL}/v1/replicas`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-ORGANIZATION-SECRET': ORG_SECRET!,
            'X-API-Version': API_VERSION!,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        // Log the response for debugging
        console.log('Sensay replica response status:', response.status);
        
        if (response.ok || response.status === 201) {
          console.log('Bot created successfully:', data.uuid || data.id);
          return NextResponse.json(data);
        } else {
          // Log the specific error
          console.error('Bot creation failed with status:', response.status);
          console.error('Error details:', JSON.stringify(data, null, 2));
          
          if (data.error && typeof data.error === 'string') {
            if (data.error.includes('Owner') && data.error.includes('does not exist')) {
              console.error('CRITICAL: Owner does not exist in Sensay');
              console.error('Owner ID that failed:', body.ownerID);
              console.error('This user needs to be recreated in Sensay');
            }
          }
          
          return NextResponse.json(data, { status: response.status });
        }
      } catch (error: unknown) {
        lastError = error;
        if (attempt < 2) {
          console.log(`Attempt ${attempt + 1} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    throw lastError;
  } catch (error: unknown) {
    console.error('Replica creation error:', error);
    const errorMessage = error instanceof Error && error.name === 'AbortError' 
      ? 'Request timeout - Sensay API is slow' 
      : 'Failed to create replica';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerID = searchParams.get('ownerID');
    
    let url = `${API_URL}/v1/replicas`;
    if (ownerID) {
      url += `?ownerID=${ownerID}`;
    }
    
    const response = await fetch(url, {
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
  } catch (err) {
    console.error('Replicas fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch replicas' },
      { status: 500 }
    );
  }
}