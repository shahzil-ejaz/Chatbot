import React from 'react';
import { parseMarkdown } from '../utils/markdown';

export default function ChatLayoutCentered({ 
  messages, 
  inputValue, 
  setInputValue, 
  onSend, 
  isGenerating, 
  onClearHistory 
}) {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  // Group bot responses with their corresponding preceding user queries
  const botMessages = messages.reduce((acc, current, index) => {
    if (current.role === 'model') {
      const prevMessage = index > 0 ? messages[index - 1] : null;
      const queryText = prevMessage && prevMessage.role === 'user' ? prevMessage.text : '';
      acc.push({
        ...current,
        queryText
      });
    }
    return acc;
  }, []);
  
  // Logic for what is in the active box vs history
  let activeResponse = null;
  let pastReflections = [];

  if (isGenerating) {
    // When generating, the latest bot message is still active but we are loading.
    // The previous bot messages go to past reflections.
    pastReflections = [...botMessages].reverse();
  } else if (botMessages.length > 0) {
    // When not generating and we have bot messages:
    // The last bot message is in the active container.
    // All previous ones are in past reflections.
    activeResponse = botMessages[botMessages.length - 1];
    pastReflections = botMessages.slice(0, -1).reverse();
  }

  // Format timestamp (display hours and minutes)
  const formatTime = (timeInput) => {
    try {
      const date = new Date(timeInput);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Earlier';
    }
  };

  return (
    <div className="layout-centered-canvas fade-in">
      {/* Central Input Box */}
      <div className="centered-input-wrapper">
        <input
          id="centered-chat-input-field"
          className="centered-chat-input"
          type="text"
          placeholder="Refine your thoughts..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isGenerating}
          autoComplete="off"
        />
        <button 
          className="centered-send-btn"
          onClick={() => onSend()}
          disabled={!inputValue.trim() || isGenerating}
          title="Submit"
          style={{ padding: '8px 20px', height: '42px', fontSize: '0.9rem', fontWeight: '600' }}
        >
          Submit
        </button>
      </div>

      {/* Immediate Response Area */}
      <div className={`response-container ${isGenerating ? 'active' : ''}`}>
        {isGenerating ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px 0' }}>
            <div className="typing-dots" style={{ border: 'none', backgroundColor: 'transparent', padding: 0 }}>
              <span className="typing-dot" style={{ width: '8px', height: '8px' }}></span>
              <span className="typing-dot" style={{ width: '8px', height: '8px' }}></span>
              <span className="typing-dot" style={{ width: '8px', height: '8px' }}></span>
            </div>
            <p style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)', opacity: 0.7 }}>
              Cultivating Response
            </p>
          </div>
        ) : activeResponse ? (
          <div className="response-content message-appear">
            {activeResponse.queryText && (
              <div style={{ fontSize: '0.85rem', color: 'var(--primary)', opacity: 0.8, marginBottom: '8px', fontStyle: 'italic', fontWeight: '500' }}>
                Prompt: "{activeResponse.queryText}"
              </div>
            )}
            <div>{parseMarkdown(activeResponse.text)}</div>
          </div>
        ) : (
          <div className="response-placeholder">
            <p>Your conversation starts here.</p>
          </div>
        )}
      </div>

      {/* Past Reflections Section */}
      <div className="reflections-section">
        <div className="reflections-header">
          <span className="reflections-title">Past Reflections</span>
          <div className="reflections-divider"></div>
          {messages.length > 0 && (
            <button 
              className="chip-btn" 
              onClick={onClearHistory}
              style={{ padding: '4px 12px', fontSize: '0.75rem', borderColor: 'var(--error)', color: 'var(--error)', borderRadius: '12px' }}
            >
              Clear History
            </button>
          )}
        </div>

        <div className="reflections-list chat-scroll">
          {pastReflections.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', opacity: 0.4, fontSize: '0.85rem' }}>
              No past reflections yet.
            </div>
          ) : (
            pastReflections.map((ref) => (
              <div key={ref.id} className="reflection-item message-appear" style={{ width: '100%' }}>
                {ref.queryText && (
                  <div className="reflection-query" style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', opacity: 0.7, marginBottom: '4px', fontStyle: 'italic' }}>
                    Prompt: "{ref.queryText}"
                  </div>
                )}
                <div className="reflection-bubble">
                  {parseMarkdown(ref.text)}
                </div>
                <div className="reflection-time">
                  {formatTime(ref.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Decorative Footer */}
      <div className="centered-footer">
        <span className="material-symbols-outlined">eco</span>
        <span className="material-symbols-outlined">filter_vintage</span>
        <span className="material-symbols-outlined">park</span>
      </div>
    </div>
  );
}
