import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const ORG_SECRET = process.env.SENSAY_ORG_SECRET;
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION;

import { promises as fs } from 'fs';
import path from 'path';

// File-based storage for user data
const USER_DB_PATH = path.join(process.cwd(), 'data', 'users.json');

// Initialize user database
async function ensureUserDatabase() {
  try {
    const dataDir = path.dirname(USER_DB_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    
    try {
      await fs.access(USER_DB_PATH);
    } catch {
      await fs.writeFile(USER_DB_PATH, JSON.stringify({}));
    }
  } catch (error) {
    console.error('Error initializing user database:', error);
  }
}

async function getUserDatabase(): Promise<Record<string, { id: string; email: string; createdAt: string }>> {
  try {
    await ensureUserDatabase();
    const data = await fs.readFile(USER_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading user database:', error);
    return {};
  }
}

async function saveUserDatabase(users: Record<string, { id: string; email: string; createdAt: string }>) {
  try {
    await ensureUserDatabase();
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
    
    // Check if user exists in our local database
    const userDatabase = await getUserDatabase();
    const existingUser = Object.values(userDatabase).find(
      user => user.email === email
    );
    
    if (existingUser) {
      console.log('Found existing local user:', existingUser.id, existingUser.email);
      return NextResponse.json({
        exists: true,
        user: {
          ...existingUser,
          createdAt: new Date(existingUser.createdAt)
        },
        verified: true
      });
    }
    
    // Create new user in Sensay API with retry logic
    // Generate a consistent ID based on email (same email = same ID always)
    const emailHash = email.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
    // Use a hash of the email for consistent ID generation - NO timestamp
    const crypto = require('crypto');
    const emailHex = crypto.createHash('md5').update(email.toLowerCase()).digest('hex').substring(0, 12);
    const tempUserId = `${emailHash}_${emailHex}`;
    
    console.log('🔑 Generated consistent user ID for', email, ':', tempUserId);
    console.log('Creating new user in Sensay with ID:', tempUserId);
    
    let finalUser = null;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts && !finalUser) {
      attempts++;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const sensayResponse = await fetch(`${API_URL}/v1/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-ORGANIZATION-SECRET': ORG_SECRET!,
            'X-API-Version': API_VERSION!,
          },
          body: JSON.stringify({
            id: tempUserId,
            email: email,
          }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        const sensayData = await sensayResponse.json();
        console.log('Sensay user creation response:', sensayResponse.status, sensayData);
        
        if (sensayResponse.ok || sensayResponse.status === 201) {
          // Success - use the ID we sent
          const actualUserId = tempUserId;
          console.log('User created successfully in Sensay with ID:', actualUserId);
          
          finalUser = {
            id: actualUserId,
            email: email,
            createdAt: new Date()
          };
          
          // Save to file-based storage
          const updatedDatabase = await getUserDatabase();
          updatedDatabase[actualUserId] = {
            id: actualUserId,
            email: email,
            createdAt: new Date().toISOString()
          };
          await saveUserDatabase(updatedDatabase);
          
        } else if (sensayResponse.status === 409) {
          // User already exists - try to get the existing user
          console.log('User already exists in Sensay, fetching existing user...');
          
          // Try to find user by email using search or list API
          try {
            const getUserResponse = await fetch(`${API_URL}/v1/users`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'X-ORGANIZATION-SECRET': ORG_SECRET!,
                'X-API-Version': API_VERSION!,
              },
            });
            
            if (getUserResponse.ok) {
              const usersData = await getUserResponse.json();
              console.log('Users data structure:', usersData);
              
              // Handle different possible response structures
              let users = usersData;
              if (usersData.items) {
                users = usersData.items;
              } else if (usersData.users) {
                users = usersData.users;
              } else if (Array.isArray(usersData)) {
                users = usersData;
              }
              
              const existingSensayUser = Array.isArray(users) ? 
                users.find((u: any) => u.email === email) : null;
              
              if (existingSensayUser) {
                console.log('Found existing user in Sensay:', existingSensayUser.id);
                finalUser = {
                  id: existingSensayUser.id,
                  email: email,
                  createdAt: new Date(existingSensayUser.createdAt || new Date())
                };
                
                // Save to file-based storage
                const updatedDatabase = await getUserDatabase();
                updatedDatabase[existingSensayUser.id] = {
                  id: existingSensayUser.id,
                  email: email,
                  createdAt: (existingSensayUser.createdAt || new Date().toISOString())
                };
                await saveUserDatabase(updatedDatabase);
              } else {
                console.log('Could not find existing user in users list, creating with temp ID');
              }
            }
          } catch (searchError) {
            console.error('Error searching for existing user:', searchError);
          }
          
          // If we couldn't find the user, use the temp ID
          if (!finalUser) {
            console.log('Could not find existing user, using temp ID');
            finalUser = {
              id: tempUserId,
              email: email,
              createdAt: new Date()
            };
            
            // Save to file-based storage
            const updatedDatabase = await getUserDatabase();
            updatedDatabase[tempUserId] = {
              id: tempUserId,
              email: email,
              createdAt: new Date().toISOString()
            };
            await saveUserDatabase(updatedDatabase);
          }
        } else {
          console.error('Sensay user creation failed with status:', sensayResponse.status, sensayData);
          if (attempts < maxAttempts) {
            console.log(`Retrying... (attempt ${attempts}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      } catch (error) {
        console.error(`Error creating user in Sensay (attempt ${attempts}):`, error);
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    if (!finalUser) {
      // All attempts failed, create user locally
      console.error('All Sensay attempts failed, creating user locally');
      finalUser = {
        id: tempUserId,
        email: email,
        createdAt: new Date()
      };
      
      // Save to file-based storage
      const updatedDatabase = await getUserDatabase();
      updatedDatabase[tempUserId] = {
        id: tempUserId,
        email: email,
        createdAt: new Date().toISOString()
      };
      await saveUserDatabase(updatedDatabase);
    }
    
    return NextResponse.json({
      exists: false,
      user: finalUser
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check/create user' },
      { status: 500 }
    );
  }
}