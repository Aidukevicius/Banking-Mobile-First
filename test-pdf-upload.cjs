const fs = require('fs');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:5000';
let authToken = null;
let userId = null;
const createdCategories = [];

async function request(method, path, body = null, isFormData = false) {
  const http = require('http');
  
  return new Promise((resolve, reject) => {
    let bodyData = null;
    const headers = {};
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    if (body && !isFormData) {
      bodyData = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(bodyData);
    } else if (isFormData) {
      bodyData = body;
      Object.assign(headers, body.getHeaders());
    }

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    
    if (bodyData) {
      if (isFormData) {
        bodyData.pipe(req);
      } else {
        req.write(bodyData);
        req.end();
      }
    } else {
      req.end();
    }
  });
}

async function testPdfUploadFlow() {
  console.log('\n🧪 Testing PDF Upload & Auto-Categorization Flow\n');
  console.log('=' .repeat(60));

  // Step 1: Register/Login
  console.log('\n📝 Step 1: Authenticating...');
  const username = `testuser_${Date.now()}`;
  const password = 'testpass123';
  
  let authResponse = await request('POST', '/api/auth/register', { username, password });
  
  if (authResponse.error) {
    console.log('   Registration failed, trying login instead...');
    authResponse = await request('POST', '/api/auth/login', { username: 'testuser', password: 'test123' });
  }
  
  if (authResponse.user && authResponse.token) {
    userId = authResponse.user.id;
    authToken = authResponse.token;
    console.log('   ✅ Authenticated as:', authResponse.user.username);
    console.log('   🔑 Token received');
  } else {
    console.log('   ❌ Authentication failed:', authResponse);
    return;
  }

  // Step 2: Create categories for our test transactions
  console.log('\n📂 Step 2: Creating categories...');
  const categoriesToCreate = [
    { name: 'Coffee & Dining', color: '#FF6B6B', type: 'expense' },
    { name: 'Shopping', color: '#4ECDC4', type: 'expense' },
    { name: 'Income', color: '#95E1D3', type: 'income' },
    { name: 'Entertainment', color: '#F38181', type: 'expense' },
    { name: 'Transportation', color: '#AA96DA', type: 'expense' }
  ];

  for (const category of categoriesToCreate) {
    const result = await request('POST', '/api/categories', category);
    if (result.id) {
      createdCategories.push(result);
      console.log(`   ✅ Created: ${category.name}`);
    }
  }

  // Step 3: Upload PDF (First time - should have 0 auto-categorized)
  console.log('\n📄 Step 3: Uploading PDF (first time)...');
  
  const form = new FormData();
  form.append('pdf', fs.createReadStream('/tmp/test_bank_statement.pdf'));
  
  const uploadResult1 = await request('POST', '/api/transactions/upload-pdf', form, true);
  
  if (uploadResult1.error) {
    console.log('   ❌ Upload failed:', uploadResult1.error);
    return;
  }
  
  console.log(`   ✅ Uploaded: ${uploadResult1.total} transactions`);
  console.log(`   📊 Auto-categorized: ${uploadResult1.categorized}/${uploadResult1.total}`);
  console.log(`   ⚠️  Uncategorized: ${uploadResult1.uncategorized}/${uploadResult1.total}`);
  
  if (uploadResult1.categorized > 0) {
    console.log('   ⚠️  WARNING: Expected 0 auto-categorized on first upload!');
  }

  // Step 4: Manually categorize transactions
  console.log('\n🏷️  Step 4: Manually categorizing transactions...');
  
  const categoryMap = {
    'STARBUCKS': createdCategories[0].id, // Coffee & Dining
    'AMAZON': createdCategories[1].id, // Shopping
    'PAYCHECK': createdCategories[2].id, // Income
    'NETFLIX': createdCategories[3].id, // Entertainment
    'SHELL': createdCategories[4].id, // Transportation
  };

  for (const transaction of uploadResult1.transactions) {
    const provider = transaction.provider.toUpperCase();
    let categoryId = null;
    
    for (const [key, value] of Object.entries(categoryMap)) {
      if (provider.includes(key)) {
        categoryId = value;
        break;
      }
    }
    
    if (categoryId) {
      await request('PUT', `/api/transactions/${transaction.id}`, { categoryId });
      console.log(`   ✅ Categorized: ${transaction.provider} → ${Object.keys(categoryMap).find(k => categoryMap[k] === categoryId)}`);
    }
  }

  // Delete all transactions to test re-upload
  console.log('\n🗑️  Step 5: Deleting transactions to prepare for re-upload...');
  for (const transaction of uploadResult1.transactions) {
    await request('DELETE', `/api/transactions/${transaction.id}`);
  }
  console.log('   ✅ All transactions deleted');

  // Step 6: Upload same PDF again (should auto-categorize based on learning)
  console.log('\n📄 Step 6: Re-uploading same PDF...');
  
  const form2 = new FormData();
  form2.append('pdf', fs.createReadStream('/tmp/test_bank_statement.pdf'));
  
  const uploadResult2 = await request('POST', '/api/transactions/upload-pdf', form2, true);
  
  if (uploadResult2.error) {
    console.log('   ❌ Upload failed:', uploadResult2.error);
    return;
  }
  
  console.log(`   ✅ Uploaded: ${uploadResult2.total} transactions`);
  console.log(`   📊 Auto-categorized: ${uploadResult2.categorized}/${uploadResult2.total}`);
  console.log(`   ⚠️  Uncategorized: ${uploadResult2.uncategorized}/${uploadResult2.total}`);

  // Verify auto-categorization worked
  console.log('\n🎯 Results:');
  console.log('=' .repeat(60));
  
  if (uploadResult2.categorized === uploadResult1.total) {
    console.log('✅ SUCCESS! All transactions were auto-categorized!');
    console.log(`   - First upload: ${uploadResult1.categorized}/${uploadResult1.total} auto-categorized`);
    console.log(`   - Second upload: ${uploadResult2.categorized}/${uploadResult2.total} auto-categorized`);
    console.log('   - Learning system is working correctly! 🎉');
  } else {
    console.log('❌ FAILED: Not all transactions were auto-categorized');
    console.log(`   - Expected: ${uploadResult1.total}`);
    console.log(`   - Got: ${uploadResult2.categorized}`);
  }
  
  console.log('\n' + '='.repeat(60));
}

// Run the test
testPdfUploadFlow().catch(error => {
  console.error('\n❌ Test failed with error:', error);
  process.exit(1);
});
