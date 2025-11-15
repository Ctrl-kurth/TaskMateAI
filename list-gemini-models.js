// List available Gemini models
const fs = require('fs');
const path = require('path');

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

async function listModels() {
  console.log('=================================================');
  console.log('📋 LISTING ALL AVAILABLE GEMINI MODELS');
  console.log('=================================================');
  console.log(`API Key: ${GEMINI_API_KEY.substring(0, 20)}...\n`);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error fetching models:');
      console.error(JSON.stringify(errorData, null, 2));
      return;
    }

    const data = await response.json();
    
    if (data.models && data.models.length > 0) {
      console.log(`✅ Found ${data.models.length} available models:\n`);
      
      // Filter models that support generateContent
      const generateModels = data.models.filter(model => 
        model.supportedGenerationMethods?.includes('generateContent')
      );
      
      console.log('Models supporting generateContent:');
      console.log('=================================================');
      generateModels.forEach((model, index) => {
        const modelName = model.name.replace('models/', '');
        console.log(`${index + 1}. ${modelName}`);
        console.log(`   Display Name: ${model.displayName || 'N/A'}`);
        console.log(`   Description: ${model.description || 'N/A'}`);
        console.log('');
      });
      
      console.log('\n=================================================');
      console.log('💡 Use these model names in your code:');
      console.log('=================================================');
      generateModels.forEach(model => {
        const modelName = model.name.replace('models/', '');
        console.log(`  '${modelName}',`);
      });
      
    } else {
      console.log('⚠️ No models found');
    }

  } catch (error) {
    console.error('❌ Exception:', error.message);
  }
}

listModels();
