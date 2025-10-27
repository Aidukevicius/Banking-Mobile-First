
#!/usr/bin/env node

const BASE_URL = 'http://0.0.0.0:5000';
let authToken = null;
const testUsername = `testuser_${Date.now()}`;
const testPassword = 'Test123!';

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (authToken && !options.skipAuth) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  
  return { status: response.status, ok: response.ok, data };
}

async function runTests() {
  console.log('🧪 Starting API Tests...\n');
  
  // Test 1: Register
  console.log('📝 Test 1: Register new user');
  const registerResult = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username: testUsername, password: testPassword }),
    skipAuth: true,
  });
  
  if (registerResult.ok && registerResult.data.token) {
    authToken = registerResult.data.token;
    console.log('✅ Registration successful');
  } else {
    console.log('❌ Registration failed:', registerResult.data);
    return;
  }
  
  // Test 2: Get user info
  console.log('\n👤 Test 2: Get current user');
  const meResult = await request('/api/auth/me');
  console.log(meResult.ok ? '✅ User info retrieved' : '❌ Failed to get user info');
  
  // Test 3: Create category
  console.log('\n📁 Test 3: Create category');
  const categoryResult = await request('/api/categories', {
    method: 'POST',
    body: JSON.stringify({ 
      name: 'Test Food',
      icon: '🍔',
      color: '#FF5733'
    }),
  });
  console.log(categoryResult.ok ? '✅ Category created' : '❌ Category creation failed');
  const categoryId = categoryResult.data?.id;
  
  // Test 4: Get categories
  console.log('\n📋 Test 4: Get categories');
  const categoriesResult = await request('/api/categories');
  console.log(categoriesResult.ok ? `✅ Categories retrieved (${categoriesResult.data?.length || 0} found)` : '❌ Failed to get categories');
  
  // Test 5: Create transaction
  console.log('\n💰 Test 5: Create transaction');
  const transactionResult = await request('/api/transactions', {
    method: 'POST',
    body: JSON.stringify({
      date: new Date().toISOString(),
      provider: 'Test Store',
      description: 'Test purchase',
      amount: '25.50',
      categoryId: categoryId,
      monthYear: new Date().toISOString().substring(0, 7),
    }),
  });
  console.log(transactionResult.ok ? '✅ Transaction created' : '❌ Transaction creation failed');
  
  // Test 6: Get transactions
  console.log('\n📊 Test 6: Get transactions');
  const transactionsResult = await request('/api/transactions');
  console.log(transactionsResult.ok ? `✅ Transactions retrieved (${transactionsResult.data?.length || 0} found)` : '❌ Failed to get transactions');
  
  // Test 7: Get portfolio
  console.log('\n💼 Test 7: Get portfolio');
  const portfolioResult = await request('/api/portfolio');
  console.log(portfolioResult.ok ? '✅ Portfolio retrieved' : '❌ Failed to get portfolio');
  
  // Test 8: Update savings
  console.log('\n💵 Test 8: Update savings');
  const savingsResult = await request('/api/portfolio/savings', {
    method: 'PUT',
    body: JSON.stringify({ value: '1000.00' }),
  });
  console.log(savingsResult.ok ? '✅ Savings updated' : '❌ Savings update failed');
  
  // Test 9: Update investments
  console.log('\n📈 Test 9: Update investments');
  const investmentsResult = await request('/api/portfolio/investments', {
    method: 'PUT',
    body: JSON.stringify({ value: '2000.00' }),
  });
  console.log(investmentsResult.ok ? '✅ Investments updated' : '❌ Investments update failed');
  
  // Test 10: Get settings
  console.log('\n⚙️ Test 10: Get settings');
  const settingsResult = await request('/api/settings');
  console.log(settingsResult.ok ? '✅ Settings retrieved' : '❌ Failed to get settings');
  
  // Test 11: Update settings
  console.log('\n🔧 Test 11: Update settings');
  const updateSettingsResult = await request('/api/settings', {
    method: 'PUT',
    body: JSON.stringify({ currency: 'EUR' }),
  });
  console.log(updateSettingsResult.ok ? '✅ Settings updated' : '❌ Settings update failed');
  
  console.log('\n✨ Tests completed!\n');
}

runTests().catch(err => {
  console.error('\n❌ Test suite failed:', err.message);
  process.exit(1);
});
