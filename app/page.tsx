"use client"

import { useState } from "react";
import axios from "axios";




export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setImageUrl("");
    try {
      const res = await axios.post("/api/fal", { prompt });
      const data = res.data;
      console.log("Fal.ai response:", data); // Debug log
      // Try to find the image URL in the response
      if (res.status === 200 && (data.image_url || data.images?.[0]?.url || data.result?.image_url)) {
        setImageUrl(data.image_url || data.images?.[0]?.url || data.result?.image_url);
      } else {
        setError(data.error || "Failed to generate image");
      }
    } catch (err: any) {
      console.error("Error generating image:", err);
      setError(err.response?.data?.error || "An error occurred");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#111" }}>
      <div style={{ background: "#222", padding: "2rem", borderRadius: "16px", boxShadow: "0 4px 24px #0004", maxWidth: 400, width: "100%" }}>
        <h2 style={{ color: "#fff", textAlign: "center" }}>Text to Image Generator</h2>
        <input
          type="text"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Enter your prompt"
          style={{ width: "100%", padding: "12px", marginBottom: "1rem", borderRadius: "8px", border: "1px solid #444", fontSize: "1rem" }}
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt}
          style={{ width: "100%", padding: "12px", borderRadius: "8px", background: loading ? "#444" : "#0070f3", color: "#fff", fontWeight: 600, fontSize: "1rem", border: "none", cursor: loading ? "not-allowed" : "pointer", marginBottom: "1rem" }}
        >
          {loading ? (
            <span>
              <span className="spinner" style={{ marginRight: 8, display: "inline-block", verticalAlign: "middle" }}>
                <svg width="20" height="20" viewBox="0 0 50 50" style={{ animation: "spin 1s linear infinite" }}>
                  <circle cx="25" cy="25" r="20" fill="none" stroke="#fff" strokeWidth="5" strokeDasharray="31.4 31.4" />
                </svg>
              </span>
              Generating...
            </span>
          ) : "Generate Image"}
        </button>
        {error && <p style={{ color: "#ff4d4f", marginTop: "1rem", textAlign: "center" }}>{error}</p>}
        {imageUrl && (
          <div style={{ marginTop: "2rem", textAlign: "center" }}>
            <h3 style={{ color: "#fff" }}>Result:</h3>
            <img src={imageUrl} alt="Generated" style={{ maxWidth: "100%", borderRadius: 12, boxShadow: "0 2px 12px #0006" }} />
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}