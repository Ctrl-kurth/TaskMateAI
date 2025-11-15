// Test script to check which Gemini models have available quota
const fs = require('fs');
const path = require('path');

// Read API key from .env.local file
function getApiKey() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GEMINI_API_KEY=(.+)/);
    if (match && match[1]) {
      return match[1].trim();
    }
  } catch (error) {
    console.error('Error reading .env.local:', error.message);
  }
  return null;
}

const GEMINI_API_KEY = getApiKey();

if (!GEMINI_API_KEY) {
  console.error('❌ Could not find GEMINI_API_KEY in .env.local file');
  process.exit(1);
}

const GEMINI_MODELS = [
  'gemini-2.5-flash',           // Latest stable (June 2025) - Fast and versatile
  'gemini-2.5-pro',              // Latest stable Pro - Most capable
  'gemini-2.0-flash',            // Stable 2.0 Flash
  'gemini-flash-latest',         // Always points to latest Flash
  'gemini-pro-latest',           // Always points to latest Pro
  'gemini-2.0-flash-lite',       // Lighter/faster version
];

const testPrompt = {
  contents: [
    {
      parts: [
        { text: 'Return only this JSON array: ["Test successful"]' }
      ]
    }
  ],
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 100,
  }
};

async function testModel(model) {
  try {
    console.log(`\n🔍 Testing ${model}...`);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPrompt),
      }
    );

    if (response.status === 429) {
      console.log(`❌ ${model}: QUOTA EXCEEDED`);
      const data = await response.json();
      if (data.error?.details) {
        const retryInfo = data.error.details.find(d => d['@type']?.includes('RetryInfo'));
        if (retryInfo?.retryDelay) {
          console.log(`   ⏳ Retry after: ${retryInfo.retryDelay}`);
        }
      }
      return { model, available: false, status: 'quota_exceeded' };
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.log(`❌ ${model}: ERROR - ${response.status} ${response.statusText}`);
      console.log(`   Details: ${JSON.stringify(errorData.error?.message || errorData)}`);
      return { model, available: false, status: 'error', error: response.statusText };
    }

    const data = await response.json();
    if (data.candidates && data.candidates[0]?.content) {
      console.log(`✅ ${model}: AVAILABLE AND WORKING!`);
      return { model, available: true, status: 'working' };
    } else {
      console.log(`⚠️  ${model}: Response received but no content`);
      return { model, available: false, status: 'no_content' };
    }

  } catch (error) {
    console.log(`❌ ${model}: EXCEPTION - ${error.message}`);
    return { model, available: false, status: 'exception', error: error.message };
  }
}

async function testAllModels() {
  console.log('=================================================');
  console.log('🧪 TESTING ALL GEMINI MODELS FOR QUOTA');
  console.log('=================================================');
  console.log(`API Key: ${GEMINI_API_KEY.substring(0, 20)}...`);
  console.log(`Testing ${GEMINI_MODELS.length} models...\n`);

  const results = [];
  
  for (const model of GEMINI_MODELS) {
    const result = await testModel(model);
    results.push(result);
    // Small delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n=================================================');
  console.log('📊 SUMMARY');
  console.log('=================================================');
  
  const available = results.filter(r => r.available);
  const unavailable = results.filter(r => !r.available);
  
  if (available.length > 0) {
    console.log(`\n✅ AVAILABLE MODELS (${available.length}):`);
    available.forEach(r => console.log(`   - ${r.model}`));
  }
  
  if (unavailable.length > 0) {
    console.log(`\n❌ UNAVAILABLE MODELS (${unavailable.length}):`);
    unavailable.forEach(r => {
      console.log(`   - ${r.model} (${r.status})`);
    });
  }

  console.log('\n=================================================');
  
  if (available.length > 0) {
    console.log('✨ Good news! You have working models available.');
    console.log('Your AI breakdown feature should work now.');
  } else {
    console.log('⚠️  All models are currently rate-limited.');
    console.log('Options:');
    console.log('  1. Wait a few minutes for quota to reset');
    console.log('  2. Get a new API key from https://aistudio.google.com/apikey');
    console.log('  3. The app will use intelligent fallback breakdowns');
  }
  
  console.log('=================================================\n');
}

// Run the test
testAllModels().catch(console.error);
