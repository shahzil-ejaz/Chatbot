import React from 'react';
import { parseMarkdown } from '../utils/markdown';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  
  // Format timestamp (display hours and minutes)
  const formatTime = (timeInput) => {
    try {
      const date = new Date(timeInput);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className={`message-bubble-wrapper ${isUser ? 'user' : 'model'} message-appear`}>
      <div className="message-bubble">
        {isUser ? message.text : parseMarkdown(message.text)}
      </div>
      <span className="message-meta">
        {formatTime(message.timestamp)}
      </span>
    </div>
  );
}
