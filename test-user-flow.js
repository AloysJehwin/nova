// Test script to verify user creation and bot creation flow
const testEmail = 'test-' + Date.now() + '@example.com';
const baseUrl = 'http://localhost:3007';

async function testUserFlow() {
  console.log('Testing user creation and bot creation flow');
  console.log('Test email:', testEmail);
  console.log('-----------------------------------\n');

  try {
    // Step 1: Check/Create user
    console.log('Step 1: Checking/Creating user...');
    const checkResponse = await fetch(`${baseUrl}/api/users/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });

    const checkData = await checkResponse.json();
    console.log('User check response:', checkResponse.status, checkData);
    
    if (!checkResponse.ok) {
      throw new Error('Failed to check/create user');
    }

    const userId = checkData.user.id;
    console.log('User ID:', userId);
    console.log('-----------------------------------\n');

    // Step 2: Ensure user exists in Sensay
    console.log('Step 2: Ensuring user exists in Sensay...');
    const verifyResponse = await fetch(`${baseUrl}/api/users/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId,
        email: testEmail
      })
    });

    const verifyData = await verifyResponse.json();
    console.log('Verify response:', verifyResponse.status, verifyData);
    console.log('-----------------------------------\n');

    // Step 3: Create a bot
    console.log('Step 3: Creating bot...');
    const botData = {
      name: 'Test Bot ' + Date.now(),
      shortDescription: 'A test bot for verification',
      greeting: 'Hello! I am a test bot.',
      type: 'character',
      ownerID: userId,
      slug: 'test-bot-' + Date.now(),
      llm: {
        model: 'gpt-4o',
        systemMessage: 'You are a helpful test assistant.'
      },
      tags: ['test']
    };

    console.log('Bot creation payload:', JSON.stringify(botData, null, 2));

    const botResponse = await fetch(`${baseUrl}/api/replicas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(botData)
    });

    const botResult = await botResponse.json();
    console.log('Bot creation response:', botResponse.status);
    
    if (botResponse.ok) {
      console.log('✅ SUCCESS: Bot created successfully!');
      console.log('Bot ID:', botResult.uuid || botResult.id);
      console.log('Bot Name:', botResult.name);
    } else {
      console.log('❌ FAILED: Bot creation failed');
      console.log('Error:', botResult.error || JSON.stringify(botResult));
      
      if (botResult.error && botResult.error.includes('Owner') && botResult.error.includes('does not exist')) {
        console.log('\n⚠️  The user was created locally but not properly synced with Sensay.');
        console.log('This is the core issue that needs to be fixed.');
      }
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testUserFlow();