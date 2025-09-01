#!/usr/bin/env node

const { default: fetch } = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const ORG_SECRET = process.env.SENSAY_ORG_SECRET;
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION;

async function listSensayUsers() {
  try {
    console.log('📋 Fetching users from Sensay API...\n');

    const response = await fetch(`${API_URL}/v1/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-ORGANIZATION-SECRET': ORG_SECRET,
        'X-API-Version': API_VERSION,
      },
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch users:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    console.log('📊 Response structure:', typeof data, Object.keys(data || {}));

    // Handle different possible response structures
    let users = [];
    if (data.items && Array.isArray(data.items)) {
      users = data.items;
    } else if (data.users && Array.isArray(data.users)) {
      users = data.users;
    } else if (Array.isArray(data)) {
      users = data;
    }

    console.log(`\n👥 Found ${users.length} users in Sensay:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Created: ${user.createdAt || 'N/A'}`);
      console.log(`   Linked Accounts: ${user.linkedAccounts?.length || 0}`);
      console.log('');
    });

    // Also show the raw response for debugging
    console.log('🔍 Raw response data:');
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ Error fetching users:', error.message);
  }
}

listSensayUsers();