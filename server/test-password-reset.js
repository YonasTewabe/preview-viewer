import axios from 'axios';

// Test configuration
const BASE_URL = 'http://localhost:4000/api';
const TEST_EMAIL = 'test@example.com';

// Test functions
async function testForgotPassword() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/forgot-password`, {
      email: TEST_EMAIL
    });
    
    return true;
  } catch (error) {
    console.error('❌ Forgot password test failed');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

async function testResetPassword() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/reset-password`, {
      email: TEST_EMAIL,
      token: 'invalid_token_for_testing',
      password: 'NewPassword123',
      passwordConfirmation: 'NewPassword123'
    });
    
    return true;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      return true;
    } else {
      console.error('❌ Reset password test failed unexpectedly');
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      } else {
        console.error('Error:', error.message);
      }
      return false;
    }
  }
}

async function testRateLimiting() {
  const promises = [];
  for (let i = 0; i < 6; i++) {
    promises.push(
      axios.post(`${BASE_URL}/auth/forgot-password`, {
        email: `test${i}@example.com`
      }).catch(error => error.response)
    );
  }
  
  try {
    const responses = await Promise.all(promises);
    const rateLimited = responses.some(response => response && response.status === 429);
    
    if (rateLimited) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('❌ Rate limiting test failed with error:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  const results = [];
  
  results.push(await testForgotPassword());
  
  results.push(await testResetPassword());
  
  results.push(await testRateLimiting());
  
  const passed = results.filter(Boolean).length;
  const total = results.length;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests };
