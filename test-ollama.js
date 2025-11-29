const axios = require('axios');

async function testOllama() {
  try {
    console.log('Testing Ollama connection with Mistral model...');
    
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'mistral',
      prompt: 'Hello! Please respond with a brief greeting.',
      stream: false
    });

    console.log('\n✅ Success! Ollama is working.');
    console.log('\nResponse:', response.data.response);
    console.log('\nYour project is now configured to use Mistral via Ollama!');
  } catch (error) {
    console.error('\n❌ Error connecting to Ollama:');
    if (error.code === 'ECONNREFUSED') {
      console.error('   Ollama is not running. Please start it with: ollama run mistral');
    } else {
      console.error('   ', error.message);
    }
  }
}

testOllama();
