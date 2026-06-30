import React, { useState, useEffect } from 'react';
import './App.css';
import ChatLayoutCentered from './components/ChatLayoutCentered';
import { generateChatResponse } from './services/GeminiService';

const SYSTEM_INSTRUCTION = `You are a calm, intelligent, and unobtrusive assistant. 
Your goal is to help the user organize, clarify, and refine their thoughts or projects. 
Prioritize clarity, brevity, and structure. Avoid unnecessary text, boilerplate greetings, or filler. 
Provide responses in a clean, readable format.`;

function App() {
  // --- Persistent States ---
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('clarity_messages');
    return saved ? JSON.parse(saved) : [];
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('clarity_theme') || 'light';
  });

  // --- UI States ---
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState('');

  // --- Sync Theme Classes & Data-Layout ---
  useEffect(() => {
    // Force layout to centered
    document.documentElement.setAttribute('data-layout', 'centered');
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('clarity_theme', theme);
  }, [theme]);

  // Persist messages changes
  useEffect(() => {
    localStorage.setItem('clarity_messages', JSON.stringify(messages));
  }, [messages]);

  // --- Handlers ---
  const handleToggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your conversation history?')) {
      setMessages([]);
      localStorage.removeItem('clarity_messages');
    }
  };

  const handleSendMessage = async (textToSend) => {
    // Ensure we handle button clicks which pass event objects
    const text = typeof textToSend === 'string' ? textToSend.trim() : inputValue.trim();
    if (!text) return;

    // Add user message
    const userMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      text,
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInputValue('');
    setIsGenerating(true);
    setApiError('');

    try {
      // Execute direct API call (key is rotated internally)
      const generatedText = await generateChatResponse(updatedHistory, SYSTEM_INSTRUCTION);

      // Add model response
      const botMessage = {
        id: `msg-${Date.now()}-model`,
        role: 'model',
        text: generatedText,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      setApiError(err.message || 'Failed to get response');
      
      // Append an error message in history
      const errorMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'model',
        text: `⚠️ Error: ${err.message || 'Something went wrong. Please check your connection.'}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
      {/* Top Header */}
      <header className="app-header">
        <div className="header-container">
          <div className="brand-section">
            <span className="brand-title">Gemini-ChatBot</span>
          </div>

          <div className="header-actions">
            {/* Theme Toggle */}
            <button className="header-btn" onClick={handleToggleTheme} title="Toggle Theme">
              <span className="material-symbols-outlined">
                {theme === 'light' ? 'dark_mode' : 'light_mode'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="main-content">
        {apiError && (
          <div style={{
            backgroundColor: 'rgba(186, 26, 26, 0.1)',
            color: 'var(--error)',
            border: '1px solid var(--error)',
            padding: '10px var(--gutter)',
            width: '100%',
            maxWidth: 'var(--container-max)',
            margin: '12px auto 0',
            borderRadius: 'var(--border-radius)',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxSizing: 'border-box'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>error</span>
            <span style={{ flexGrow: 1 }}>{apiError}</span>
            <button 
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'inherit' }}
              onClick={() => setApiError('')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>close</span>
            </button>
          </div>
        )}

        {/* Dynamic layout rendering (only Centered layout) */}
        <ChatLayoutCentered
          messages={messages}
          inputValue={inputValue}
          setInputValue={setInputValue}
          onSend={handleSendMessage}
          isGenerating={isGenerating}
          onClearHistory={handleClearHistory}
        />
      </main>
    </div>
  );
}

export default App;
