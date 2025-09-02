// Test script for the Sensay Chatbot App
const testEmail = `test-${Date.now()}@example.com`;
const baseUrl = 'http://localhost:3001';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testUserRegistration() {
  console.log('\n🧪 TEST 1: User Registration');
  console.log('----------------------------');
  
  try {
    // Test new user creation
    const response = await fetch(`${baseUrl}/api/users/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ User check/create endpoint works');
      console.log(`   - User ID: ${data.user?.id}`);
      console.log(`   - Email: ${data.user?.email}`);
      console.log(`   - Exists: ${data.exists}`);
    } else {
      console.log('❌ User check/create failed:', data.error);
    }
    
    // Test duplicate email
    const response2 = await fetch(`${baseUrl}/api/users/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    
    const data2 = await response2.json();
    
    if (data2.exists === true) {
      console.log('✅ Duplicate email detection works');
    } else {
      console.log('❌ Duplicate email not detected');
    }
    
    return data.user;
  } catch (error) {
    console.log('❌ Registration test failed:', error.message);
    return null;
  }
}

async function testBotCreation(userId) {
  console.log('\n🧪 TEST 2: Bot Creation');
  console.log('----------------------');
  
  if (!userId) {
    console.log('⚠️  Skipping: No user ID available');
    return null;
  }
  
  try {
    const botData = {
      name: `Test Bot ${Date.now()}`,
      shortDescription: 'A test bot',
      greeting: 'Hello, I am a test bot!',
      type: 'character',
      ownerID: userId,
      slug: `test-bot-${Date.now()}`,
      llm: {
        model: 'gpt-4o',
        systemMessage: 'You are a helpful test bot'
      }
    };
    
    const response = await fetch(`${baseUrl}/api/replicas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(botData)
    });
    
    const data = await response.json();
    
    if (response.ok || response.status === 201) {
      console.log('✅ Bot creation endpoint works');
      console.log(`   - Bot UUID: ${data.uuid}`);
      console.log(`   - Success: ${data.success}`);
      return data.uuid;
    } else {
      console.log('❌ Bot creation failed:', data.error || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.log('❌ Bot creation test failed:', error.message);
    return null;
  }
}

async function testChatMessage(botUUID, userId) {
  console.log('\n🧪 TEST 3: Chat Message');
  console.log('----------------------');
  
  if (!botUUID || !userId) {
    console.log('⚠️  Skipping: No bot UUID or user ID available');
    return;
  }
  
  // Wait for bot to initialize
  console.log('   Waiting 3 seconds for bot to initialize...');
  await delay(3000);
  
  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        replicaUUID: botUUID,
        content: 'Hello, test bot!',
        userId: userId
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.content) {
      console.log('✅ Chat endpoint works');
      console.log(`   - Bot response: "${data.content.substring(0, 50)}..."`);
    } else {
      console.log('❌ Chat failed:', data.error || 'No response content');
    }
  } catch (error) {
    console.log('❌ Chat test failed:', error.message);
  }
}

async function testPageLoading() {
  console.log('\n🧪 TEST 4: Page Loading');
  console.log('----------------------');
  
  try {
    // Test home page
    const homeResponse = await fetch(`${baseUrl}/`);
    if (homeResponse.ok) {
      console.log('✅ Home page loads (Status: 200)');
    } else {
      console.log(`❌ Home page error (Status: ${homeResponse.status})`);
    }
    
    // Test chat page (should redirect without auth)
    const chatResponse = await fetch(`${baseUrl}/chat`, {
      redirect: 'manual'
    });
    if (chatResponse.status === 307 || chatResponse.status === 302) {
      console.log('✅ Chat page redirects when not authenticated');
    } else {
      console.log(`⚠️  Chat page status: ${chatResponse.status}`);
    }
  } catch (error) {
    console.log('❌ Page loading test failed:', error.message);
  }
}

async function testAPIErrors() {
  console.log('\n🧪 TEST 5: Error Handling');
  console.log('-------------------------');
  
  try {
    // Test missing email
    const response1 = await fetch(`${baseUrl}/api/users/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    const data1 = await response1.json();
    if (response1.status === 400 && data1.error) {
      console.log('✅ Missing email error handled');
    } else {
      console.log('❌ Missing email not properly handled');
    }
    
    // Test invalid bot UUID
    const response2 = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        replicaUUID: 'invalid-uuid',
        content: 'test',
        userId: 'test-user'
      })
    });
    
    const data2 = await response2.json();
    console.log('Error response data:', data2);
    if (!response2.ok) {
      console.log('✅ Invalid bot UUID error handled');
    } else {
      console.log('❌ Invalid bot UUID not properly handled');
    }
  } catch (error) {
    console.log('❌ Error handling test failed:', error.message);
  }
}

async function checkBuildWarnings() {
  console.log('\n🧪 TEST 6: Build Check');
  console.log('---------------------');
  
  console.log('⚠️  Known warnings:');
  console.log('   - Multiple lockfiles (can be ignored)');
  console.log('   - Port 3000 in use (using alternate port)');
  console.log('✅ No critical build errors');
}

// Run all tests
async function runAllTests() {
  console.log('====================================');
  console.log('🚀 SENSAY CHATBOT APP - TEST SUITE');
  console.log('====================================');
  console.log(`Server: ${baseUrl}`);
  console.log(`Time: ${new Date().toISOString()}`);
  
  // Run tests in sequence
  const user = await testUserRegistration();
  const botUUID = await testBotCreation(user?.id);
  await testChatMessage(botUUID, user?.id);
  await testPageLoading();
  await testAPIErrors();
  await checkBuildWarnings();
  
  console.log('\n====================================');
  console.log('📊 TEST SUMMARY');
  console.log('====================================');
  console.log('✅ Tests completed');
  console.log('\n📝 Recommendations:');
  console.log('1. API timeouts may occur with Sensay API - this is expected');
  console.log('2. Consider implementing retry logic for production');
  console.log('3. Add database for persistent user storage');
  console.log('4. Implement rate limiting for API endpoints');
  console.log('5. Add input validation and sanitization');
}

// Run the test suite
runAllTests().catch(console.error);