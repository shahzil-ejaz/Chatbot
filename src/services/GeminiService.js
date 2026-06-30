const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Load API Keys from environment variable (comma-separated list), stripping any wrapper quotes
const keysString = (import.meta.env.VITE_GEMINI_API_KEY || '').replace(/^["']|["']$/g, '');
const EMBEDDED_API_KEYS = keysString ? keysString.split(',').map(k => k.trim()) : [];

let currentKeyIndex = 0;

export async function generateChatResponse(history, systemInstruction) {
  if (EMBEDDED_API_KEYS.length === 0) {
    throw new Error('No Gemini API keys found. Please set VITE_GEMINI_API_KEY in your .env file or Vercel dashboard.');
  }

  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const payload = {
    contents,
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const maxRetries = EMBEDDED_API_KEYS.length;
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const apiKey = EMBEDDED_API_KEYS[currentKeyIndex];
    console.log(`Attempting API call using Key Index ${currentKeyIndex}`);

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.error?.message || `Status ${response.status}`;
        console.warn(`Key Index ${currentKeyIndex} failed: ${errorMsg}. Rotating to next key.`);
        lastError = new Error(errorMsg);
        
        // Rotate key and try again
        currentKeyIndex = (currentKeyIndex + 1) % EMBEDDED_API_KEYS.length;
        continue;
      }

      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!generatedText) {
        throw new Error('Received empty parts in response candidate.');
      }

      return generatedText;

    } catch (error) {
      console.error(`Error during fetch with Key Index ${currentKeyIndex}:`, error);
      lastError = error;
      currentKeyIndex = (currentKeyIndex + 1) % EMBEDDED_API_KEYS.length;
    }
  }

  throw new Error(`All embedded keys failed. Last error: ${lastError?.message || 'Unknown network error'}`);
}
