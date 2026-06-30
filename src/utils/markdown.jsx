import React from 'react';

/**
 * A lightweight inline markdown parser that safely translates standard
 * bold notation (**text**) and basic bullet points (- item, * item) 
 * into React elements.
 * 
 * @param {string} text - Raw text containing basic markdown
 * @returns {React.ReactNode} Parsed React elements
 */
export function parseMarkdown(text) {
  if (!text) return '';
  
  const lines = text.split('\n');
  
  return lines.map((line, lineIdx) => {
    let cleanLine = line;
    let isBullet = false;
    
    // Detect bullet points: starting with '* ', '- ', or '• '
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
      cleanLine = line.replace(/^\s*[-*•]\s+/, '');
      isBullet = true;
    }
    
    // Process inline formatting (bold)
    const parts = cleanLine.split(/\*\*([^*]+)\*\*/g);
    const content = parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index}>{part}</strong>;
      }
      return part;
    });
    
    if (isBullet) {
      return (
        <li 
          key={lineIdx} 
          style={{ 
            marginLeft: '1.25rem', 
            listStyleType: 'disc', 
            marginBottom: '4px',
            textAlign: 'left'
          }}
        >
          {content}
        </li>
      );
    }
    
    return (
      <div 
        key={lineIdx} 
        style={{ 
          minHeight: '1.2rem', 
          marginBottom: lineIdx === lines.length - 1 ? 0 : '6px',
          textAlign: 'left'
        }}
      >
        {content}
      </div>
    );
  });
}
