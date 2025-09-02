import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const ORG_SECRET = process.env.SENSAY_ORG_SECRET;
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION;

export async function POST(request: NextRequest) {
  try {
    const { replicaUUID, content, userId } = await request.json();
    
    if (!replicaUUID || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Add timeout for slow Sensay API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for chat
    
    const response = await fetch(
      `${API_URL}/v1/replicas/${replicaUUID}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-ORGANIZATION-SECRET': ORG_SECRET!,
          'X-USER-ID': userId || '',
          'X-API-Version': API_VERSION!,
        },
        body: JSON.stringify({
          content,
          source: 'web',
        }),
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);
    
    const data = await response.json();
    
    if (response.ok) {
      return NextResponse.json(data);
    } else {
      return NextResponse.json(data, { status: response.status });
    }
  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}