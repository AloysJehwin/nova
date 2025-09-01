#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const USER_DB_PATH = path.join(process.cwd(), 'data', 'users.json');

async function clearUserDatabase() {
  try {
    console.log('Clearing user database...');
    
    // Create empty database
    await fs.mkdir(path.dirname(USER_DB_PATH), { recursive: true });
    await fs.writeFile(USER_DB_PATH, JSON.stringify({}, null, 2));
    
    console.log('✅ User database cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing user database:', error);
  }
}

clearUserDatabase();