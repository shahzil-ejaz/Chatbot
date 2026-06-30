/**
 * OpenRouter API Service for client-side execution with key rotation.
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Load OpenRouter keys and model configuration from environment variables
const keysString = (import.meta.env.VITE_OPENROUTER_API_KEY || '').replace(/^["']|["']$/g, '');
const EMBEDDED_API_KEYS = keysString ? keysString.split(',').map(k => k.trim()) : [];

const modelName = import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemini-2.5-flash:free';

let currentKeyIndex = 0;

/**
 * Generates a chat completion response from OpenRouter.
 * Automatically rotates keys if a request fails due to rate limits or key errors.
 * 
 * @param {Array<{role: string, text: string}>} history - Local chat history
 * @param {string} systemInstruction - System rules to guide model behavior
 * @returns {Promise<string>} The generated text response
 */
export async function generateChatResponse(history, systemInstruction) {
  if (EMBEDDED_API_KEYS.length === 0) {
    throw new Error('No OpenRouter API keys found. Please set VITE_OPENROUTER_API_KEY in your .env file or Vercel dashboard.');
  }

  // Format messages into standard OpenAI chat format
  const messages = [];
  if (systemInstruction) {
    messages.push({
      role: 'system',
      content: systemInstruction
    });
  }

  history.forEach(msg => {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.text
    });
  });

  const payload = {
    model: modelName,
    messages
  };

  const maxRetries = EMBEDDED_API_KEYS.length;
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const apiKey = EMBEDDED_API_KEYS[currentKeyIndex];
    console.log(`Attempting OpenRouter API call using Key Index ${currentKeyIndex} with model ${modelName}`);

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin, // Site URL for OpenRouter analytics
          'X-Title': 'Gemini-ChatBot'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.error?.message || `Status ${response.status}`;
        console.warn(`Key Index ${currentKeyIndex} failed: ${errorMsg}. Rotating to next key.`);
        lastError = new Error(errorMsg);
        
        currentKeyIndex = (currentKeyIndex + 1) % EMBEDDED_API_KEYS.length;
        continue;
      }

      const generatedText = data?.choices?.[0]?.message?.content;
      if (!generatedText) {
        throw new Error('Received empty content in response choices.');
      }

      return generatedText;

    } catch (error) {
      console.error(`Error during OpenRouter fetch with Key Index ${currentKeyIndex}:`, error);
      lastError = error;
      currentKeyIndex = (currentKeyIndex + 1) % EMBEDDED_API_KEYS.length;
    }
  }

  throw new Error(`All embedded OpenRouter keys failed. Last error: ${lastError?.message || 'Unknown network error'}`);
}
