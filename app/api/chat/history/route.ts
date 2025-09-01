import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const ORG_SECRET = process.env.SENSAY_ORG_SECRET;
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const replicaUUID = searchParams.get('replicaUUID');
    const userId = searchParams.get('userId');
    
    if (!replicaUUID || !userId) {
      return NextResponse.json(
        { error: 'Missing replicaUUID or userId' },
        { status: 400 }
      );
    }

    console.log('🔍 CHAT HISTORY REQUEST:');
    console.log('  📱 Replica UUID:', replicaUUID);
    console.log('  👤 User ID:', userId);
    console.log('  🔗 API URL:', `${API_URL}/v1/replicas/${replicaUUID}/chat/history/web`);

    // Fetch chat history from Sensay API using the web-specific endpoint
    const response = await fetch(
      `${API_URL}/v1/replicas/${replicaUUID}/chat/history/web`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-ORGANIZATION-SECRET': ORG_SECRET!,
          'X-USER-ID': userId,
          'X-API-Version': API_VERSION!,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('📦 Raw Sensay API response:', JSON.stringify(data, null, 2));
      
      // Transform the API response to match our chat interface format
      const messages = data.items?.map((item: any) => ({
        id: item.id,
        content: item.content,
        role: item.role,
        timestamp: new Date(item.created_at),
        source: item.source,
        isPrivate: item.is_private,
        originalMessageId: item.original_message_id,
        sources: item.sources || []
      })) || [];

      console.log(`✅ Loaded ${messages.length} chat history messages`);

      return NextResponse.json({
        success: true,
        messages: messages.sort((a: any, b: any) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ),
        total: messages.length
      });
    } else {
      const errorText = await response.text();
      console.error('❌ CHAT HISTORY API ERROR:');
      console.error('  📊 Status:', response.status);
      console.error('  📝 Response:', errorText);
      console.error('  🔐 Headers used:', {
        'X-ORGANIZATION-SECRET': ORG_SECRET ? '[REDACTED]' : '[MISSING]',
        'X-USER-ID': userId,
        'X-API-Version': API_VERSION
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch chat history',
          details: `API returned ${response.status}: ${errorText}`,
          userId: userId,
          replicaUUID: replicaUUID
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Chat history error:', error);
    return NextResponse.json(
      { error: 'Failed to load chat history' },
      { status: 500 }
    );
  }
}