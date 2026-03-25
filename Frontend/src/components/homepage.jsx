import { useState } from 'react';

function Homepage() {
  const [url, setUrl] = useState('');

    const [data, setData] = useState(null);

    const handleScan = async () => {
        const res = await fetch(`http://localhost:5000/scan?url=${url}`);
        const result = await res.json();
        setData(result);
    };

  return (
    <div style={{
      width: '500px',
      margin: '100px auto 0',
      padding: '40px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      backgroundColor: 'white',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#333'
        }}>
          Input field (enter URL)
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            width: '400px',
            padding: '12px',
            fontSize: '16px',
            border: '2px solid #ddd',
            borderRadius: '4px',
            boxSizing: 'border-box'
          }}
          placeholder="https://example.com"
        />
      </div>
      <button
        onClick={handleScan}
        style={{
          width: '400px',
          padding: '12px',
          fontSize: '16px',
          fontWeight: 'bold',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Scan
      </button>

      {data && (
        <pre style={{
            marginTop: '20px',
            textAlign: 'left',
            background: '#f5f5f5',
            padding: '10px',
            maxHeight: '300px',
            overflow: 'auto'
        }}>
            {JSON.stringify(data, null, 2)}
        </pre>
        )}
    </div>
  );
}

export default Homepage;

