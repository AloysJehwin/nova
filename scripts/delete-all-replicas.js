#!/usr/bin/env node

// Hardcode the values for the script
const API_URL = 'https://api.sensay.io';
const ORG_SECRET = '5a83cca62bef2eb677c2c8a8445e9d2eebebd83fb8dd57aecfd244c5fff04029';
const API_VERSION = '2025-03-25';

async function deleteAllReplicas() {
  console.log('🔍 Fetching all replicas...');
  
  try {
    // First, get all replicas
    const listResponse = await fetch(`${API_URL}/v1/replicas?page_size=100`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-ORGANIZATION-SECRET': ORG_SECRET,
        'X-API-Version': API_VERSION,
      },
    });

    if (!listResponse.ok) {
      throw new Error(`Failed to list replicas: ${listResponse.status}`);
    }

    const data = await listResponse.json();
    const replicas = data.items || [];
    
    console.log(`Found ${replicas.length} replicas`);
    
    if (replicas.length === 0) {
      console.log('✅ No replicas to delete');
      return;
    }

    // Delete each replica
    for (const replica of replicas) {
      console.log(`\n🗑️  Deleting replica: ${replica.name} (${replica.uuid})`);
      
      try {
        const deleteResponse = await fetch(`${API_URL}/v1/replicas/${replica.uuid}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-ORGANIZATION-SECRET': ORG_SECRET,
            'X-API-Version': API_VERSION,
          },
        });

        if (deleteResponse.ok) {
          console.log(`   ✅ Deleted successfully`);
        } else if (deleteResponse.status === 404) {
          console.log(`   ⚠️  Already deleted or not found`);
        } else {
          const errorData = await deleteResponse.text();
          console.log(`   ❌ Failed to delete: ${deleteResponse.status} - ${errorData}`);
        }
      } catch (error) {
        console.log(`   ❌ Error deleting replica: ${error.message}`);
      }
    }

    console.log('\n✨ Deletion process completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
deleteAllReplicas();