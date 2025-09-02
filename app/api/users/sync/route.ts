import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface SensayUser {
  id: string;
  email: string;
  created_at?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const ORG_SECRET = process.env.SENSAY_ORG_SECRET;
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION;

// File-based storage for user data
const USER_DB_PATH = path.join(process.cwd(), 'data', 'users.json');

async function getUserDatabase(): Promise<Record<string, { id: string; email: string; createdAt: string }>> {
  try {
    const data = await fs.readFile(USER_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading user database:', err);
    return {};
  }
}

async function saveUserDatabase(users: Record<string, { id: string; email: string; createdAt: string }>) {
  try {
    const dataDir = path.dirname(USER_DB_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(USER_DB_PATH, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving user database:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('🔄 SYNC: Syncing user with Sensay:', email);

    // Get all users from Sensay
    const getUserResponse = await fetch(`${API_URL}/v1/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-ORGANIZATION-SECRET': ORG_SECRET!,
        'X-API-Version': API_VERSION!,
      },
    });

    if (!getUserResponse.ok) {
      const errorText = await getUserResponse.text();
      console.error('❌ SYNC: Failed to fetch users from Sensay:', getUserResponse.status, errorText);
      return NextResponse.json(
        { 
          error: 'Failed to fetch users from Sensay',
          details: `API returned ${getUserResponse.status}: ${errorText}`
        },
        { status: 500 }
      );
    }

    const usersData = await getUserResponse.json();
    console.log('Sensay users response structure:', typeof usersData, Object.keys(usersData || {}));
    
    // Handle different possible response structures
    let users = [];
    if (usersData.items && Array.isArray(usersData.items)) {
      users = usersData.items;
    } else if (usersData.users && Array.isArray(usersData.users)) {
      users = usersData.users;
    } else if (Array.isArray(usersData)) {
      users = usersData;
    }

    console.log('Found', users.length, 'total users in Sensay');

    // Find user by email
    const existingSensayUser = users.find((u: SensayUser) => u.email === email);

    if (existingSensayUser) {
      console.log('Found user in Sensay:', existingSensayUser.id, existingSensayUser.email);

      // Save to local database
      const localDatabase = await getUserDatabase();
      localDatabase[existingSensayUser.id] = {
        id: existingSensayUser.id,
        email: existingSensayUser.email,
        createdAt: existingSensayUser.createdAt || new Date().toISOString()
      };
      await saveUserDatabase(localDatabase);

      return NextResponse.json({
        found: true,
        user: {
          id: existingSensayUser.id,
          email: existingSensayUser.email,
          createdAt: new Date(existingSensayUser.createdAt || new Date()),
          linkedAccounts: existingSensayUser.linkedAccounts || []
        }
      });
    } else {
      console.log('User not found in Sensay:', email);
      return NextResponse.json({
        found: false,
        message: 'User not found in Sensay'
      });
    }

  } catch (error) {
    console.error('Sync user error:', error);
    return NextResponse.json(
      { error: 'Failed to sync user' },
      { status: 500 }
    );
  }
}