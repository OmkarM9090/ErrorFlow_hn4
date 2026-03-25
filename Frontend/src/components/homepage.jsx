import { useState } from "react";

function Homepage() {
  const [url, setUrl] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    if (!url.trim()) {
      alert("Please enter a URL");
      return;
    }

    setLoading(true);
    setData(null);

    try {
      const res = await fetch(`http://localhost:3000/api/audit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url,
          maxDepth: 2,
          maxPages: 20,
          screenshots: true,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Scan error:", error);
      setData({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: "500px",
        margin: "100px auto 0",
        padding: "40px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        backgroundColor: "white",
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
      }}
    >
      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontSize: "18px",
            fontWeight: "bold",
            color: "#333",
          }}
        >
          Input field (enter URL)
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            width: "400px",
            padding: "12px",
            fontSize: "16px",
            border: "2px solid #ddd",
            borderRadius: "4px",
            boxSizing: "border-box",
          }}
          placeholder="https://example.com"
        />
      </div>
      <button
        onClick={handleScan}
        disabled={loading}
        style={{
          width: "400px",
          padding: "12px",
          fontSize: "16px",
          fontWeight: "bold",
          backgroundColor: loading ? "#cccccc" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Scanning..." : "Scan"}
      </button>

      {data && (
        <pre
          style={{
            marginTop: "20px",
            textAlign: "left",
            background: "#f5f5f5",
            padding: "10px",
            maxHeight: "300px",
            overflow: "auto",
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default Homepage;
