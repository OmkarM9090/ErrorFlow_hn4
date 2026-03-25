import { useState } from 'react';

function Homepage() {
  const [url, setUrl] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScan = async () => {
    if (!url) return;
    
    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await fetch(`http://localhost:5000/scan?url=${encodeURIComponent(url)}`);
      const result = await res.json();
      
      if (result.success !== false) {
        setData(result);
      } else {
        setError(result.error || 'Scraping failed');
      }
    } catch (err) {
      setError('Server error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: '800px',
      margin: '50px auto',
      padding: '30px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: 'white',
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '100%'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>Website Scanner</h1>
      
      <div style={{ marginBottom: '25px' }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#333'
        }}>
          Enter URL
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '600px',
            padding: '12px 16px',
            fontSize: '16px',
            border: '2px solid #ddd',
            borderRadius: '6px',
            boxSizing: 'border-box'
          }}
          placeholder="https://example.com"
        />
      </div>

      <button
        onClick={handleScan}
        disabled={loading || !url}
        style={{
          padding: '14px 28px',
          fontSize: '16px',
          fontWeight: 'bold',
          backgroundColor: loading ? '#6c757d' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          width: '200px'
        }}
      >
        {loading ? 'Scanning...' : 'Scan'}
      </button>

      {error && (
        <div style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          textAlign: 'left'
        }}>
          Error: {error}
        </div>
      )}

      {data && data.success !== false && (
        <div style={{ marginTop: '30px', textAlign: 'left' }}>
          <h2 style={{ color: '#28a745', marginBottom: '20px' }}>✅ Scan Results</h2>
          
          <div style={{ display: 'grid', gap: '15px', marginBottom: '20px' }}>
            <div><strong>Final URL:</strong> {data.finalUrl}</div>
            <div><strong>Title:</strong> {data.title}</div>
            <div><strong>Description:</strong> {data.metaDescription || 'N/A'}</div>
            <div><strong>Language:</strong> {data.lang}</div>
            <div><strong>Headings ({data.headings?.length || 0}):</strong> {data.headings?.slice(0, 5).join(', ') || 'None'}...</div>
            <div><strong>Images ({data.images?.length || 0}):</strong> {data.images?.slice(0, 3).map(img => img.src).join(', ') || 'None'}...</div>
            <div><strong>Internal Links ({data.internalLinks?.length || 0}):</strong> {data.internalLinks?.slice(0, 5).join(', ') || 'None'}...</div>
          </div>

          <details style={{ marginTop: '10px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>View Full Data (JSON)</summary>
            <pre style={{
              background: '#f8f9fa',
              padding: '15px',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
              marginTop: '10px',
              maxHeight: '300px'
            }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

export default Homepage;
