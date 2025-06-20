import React, { useState } from 'react';

const SimpleTextTest: React.FC = () => {
  const [text, setText] = useState('');

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🧪 Simple Text Input Test</h2>
      <p>This is a completely isolated textarea with no dependencies. Test typing here:</p>
      
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type here to test if backwards typing still happens..."
        style={{
          width: '100%',
          height: '200px',
          padding: '10px',
          fontSize: '16px',
          fontFamily: 'Arial, sans-serif',
          border: '1px solid #ccc',
          borderRadius: '4px',
          resize: 'vertical'
        }}
      />
      
      <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
        Characters: {text.length} | Words: {text.trim() ? text.trim().split(/\s+/).length : 0}
      </div>
      
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
        <strong>Test Instructions:</strong>
        <br />1. Try typing "hello world" normally
        <br />2. Try typing in the middle of existing text
        <br />3. Try copy/pasting text
        <br />4. Check if any characters appear backwards
      </div>
    </div>
  );
};

export default SimpleTextTest; 