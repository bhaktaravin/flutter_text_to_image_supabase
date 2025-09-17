"use client"

import { useState, useEffect } from "react";
import axios from "axios";

export default function Page() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [guestCount, setGuestCount] = useState<number | undefined>(undefined);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<{ email: string } | null | undefined>(undefined);
  const [history, setHistory] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const count = parseInt(localStorage.getItem("guestCount") || "0", 10);
    setGuestCount(count);
    if (count >= 5) setShowAuth(true);
    // Check for user session
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setShowAuth(false);
    } else {
      setUser(null);
    }
    setHydrated(true);
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setImageUrl("");
    try {
      const res = await axios.post("/api/fal", { prompt });
      const data = res.data;
      console.log("Fal.ai response:", data); // Debug log
      if (res.status === 200 && (data.image_url || data.images?.[0]?.url || data.result?.image_url)) {
        const generatedUrl = data.image_url || data.images?.[0]?.url || data.result?.image_url;
        setImageUrl(generatedUrl);

        // Upload image to Firebase Storage
        try {
          const filename = `generated-${Date.now()}.png`;
          await fetch("/api/images/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl: generatedUrl, filename }),
          });
        } catch (uploadErr) {
          console.error("Error uploading image to Firebase:", uploadErr);
        }

        if (!user) {
          // Guest logic
          const newCount = (guestCount ?? 0) + 1;
          setGuestCount(newCount);
          localStorage.setItem("guestCount", newCount.toString());
          if (newCount >= 5) setShowAuth(true);
        } else {
          // Save prompt for logged-in user
          await axios.post("/api/prompts/save", { prompt, email: user.email });
          fetchHistory(user.email);
        }
      } else {
        setError(data.error || "Failed to generate image");
      }
    } catch (err: any) {
      console.error("Error generating image:", err);
      setError(err.response?.data?.error || "An error occurred");
    }
    setLoading(false);
  };

  // Fetch prompt history for logged-in user
  const fetchHistory = async (email: string) => {
    try {
      const res = await axios.post("/api/prompts/history", { email });
      setHistory(res.data.history || []);
    } catch (err) {
      setHistory([]);
    }
  };

  // Simple AuthForm (login/register toggle)
  function AuthForm() {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [backendError, setBackendError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [agreed, setAgreed] = useState(false);

    // Password strength meter
    function getPasswordStrength(pw: string) {
      let score = 0;
      if (pw.length >= 8) score++;
      if (/[A-Z]/.test(pw)) score++;
      if (/[0-9]/.test(pw)) score++;
      if (/[^A-Za-z0-9]/.test(pw)) score++;
      return score;
    }
    const passwordStrength = getPasswordStrength(password);

    // Social login (Supabase supports Google/GitHub)
    const handleSocialLogin = async (provider: "google" | "github") => {
      window.location.href = `/api/auth/oauth?provider=${provider}`;
    };

    const validate = () => {
      if (!email.match(/^\S+@\S+\.\S+$/)) return "Invalid email address.";
      if (mode === "register") {
        if (!name.trim()) return "Name is required.";
        if (password.length < 8) return "Password must be at least 8 characters.";
        if (password !== confirmPassword) return "Passwords do not match.";
        if (!agreed) return "You must agree to the terms.";
      }
      return "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setBackendError("");
      setSuccess("");
      const validationError = validate();
      if (validationError) {
        setError(validationError);
        return;
      }
      setLoading(true);
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      try {
        const body = mode === "login"
          ? { email, password }
          : { email, password, name };
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (res.ok) {
          setSuccess(mode === "login" ? "Logged in!" : "Registered! Check your email for confirmation.");
          // Save user session and hide auth form
          localStorage.setItem("user", JSON.stringify({ email, name }));
          setUser({ email });
          setShowAuth(false);
          fetchHistory(email);
          // Redirect after registration
          if (mode === "register") {
            setTimeout(() => {
              setMode("login");
              setSuccess("");
            }, 2000);
          }
        } else {
          setBackendError(data.error ? `Backend error: ${data.error}` : "Unknown backend error");
        }
      } catch (err) {
        setBackendError("Network error");
      }
      setLoading(false);
    };

    return (
      <div style={{ maxWidth: 400, margin: "2rem auto", padding: "2rem", background: "#222", borderRadius: 12 }}>
        <h2 style={{ color: "#fff" }}>{mode === "login" ? "Login" : "Register"}</h2>
        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Name"
              required
              style={{ width: "100%", padding: "10px", marginBottom: "1rem", borderRadius: 8, border: "1px solid #444" }}
            />
          )}
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
            style={{ width: "100%", padding: "10px", marginBottom: "1rem", borderRadius: 8, border: "1px solid #444" }}
          />
          <div style={{ position: "relative", marginBottom: "1rem" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              required
              style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #444" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{ position: "absolute", right: 10, top: 10, background: "none", border: "none", color: "#0070f3", cursor: "pointer" }}
            >{showPassword ? "Hide" : "Show"}</button>
          </div>
          {mode === "register" && (
            <>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                required
                style={{ width: "100%", padding: "10px", marginBottom: "1rem", borderRadius: 8, border: "1px solid #444" }}
              />
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ color: passwordStrength < 2 ? "#ff4d4f" : passwordStrength < 4 ? "#ffa500" : "#4caf50", fontWeight: 600 }}>
                  Password strength: {passwordStrength === 0 ? "Too short" : passwordStrength === 1 ? "Weak" : passwordStrength === 2 ? "Medium" : passwordStrength === 3 ? "Strong" : "Excellent"}
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", marginBottom: "1rem", color: "#fff" }}>
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginRight: 8 }} />
                I agree to the <a href="#" style={{ color: "#0070f3", textDecoration: "underline", marginLeft: 4 }}>Terms</a> & <a href="#" style={{ color: "#0070f3", textDecoration: "underline", marginLeft: 4 }}>Privacy</a>
              </label>
            </>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "10px", borderRadius: 8, background: loading ? "#444" : "#0070f3", color: "#fff", fontWeight: 600, border: "none", marginBottom: "1rem", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Processing..." : mode === "login" ? "Login" : "Register"}
          </button>
        </form>
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "1rem" }}>
          <button type="button" onClick={() => handleSocialLogin("google")}
            style={{ background: "#fff", color: "#222", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, cursor: "pointer" }}>
            Sign in with Google
          </button>
          <button type="button" onClick={() => handleSocialLogin("github")}
            style={{ background: "#222", color: "#fff", border: "1px solid #444", borderRadius: 8, padding: "8px 16px", fontWeight: 600, cursor: "pointer" }}>
            Sign in with GitHub
          </button>
        </div>
        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          style={{
            marginTop: "1rem",
            background: "none",
            color: "#0070f3",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
            fontWeight: 600,
            fontSize: "1rem",
            padding: 0,
            transition: "color 0.2s"
          }}
          onMouseOver={e => (e.currentTarget.style.color = "#0051a8")}
          onMouseOut={e => (e.currentTarget.style.color = "#0070f3")}
        >
          {mode === "login" ? "Need an account? Register" : "Already have an account? Login"}
        </button>
  {error && <p style={{ color: "#ff4d4f", marginTop: "1rem" }}>{error}</p>}
  {backendError && <p style={{ color: "#ff4d4f", marginTop: "1rem" }}>{backendError}</p>}
  {success && <p style={{ color: "#4caf50", marginTop: "1rem" }}>{success}</p>}
      </div>
    );
  }

  if (!hydrated || guestCount === undefined || user === undefined) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#111" }}>
        <span style={{ color: '#fff' }}>Loading...</span>
      </div>
    );
  }

  return (
    <>
      {showAuth && !user ? (
        <AuthForm />
      ) : (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#111" }}>
          <div style={{ background: "#222", padding: "2rem", borderRadius: "16px", boxShadow: "0 4px 24px #0004", maxWidth: 400, width: "100%", marginBottom: "2rem" }}>
            <h2 style={{ color: "#fff", textAlign: "center" }}>Text to Image Generator</h2>
            {user && (
              <div style={{ marginBottom: "1rem", textAlign: "center" }}>
                <span style={{ color: "#4caf50" }}>Logged in as {user.email}</span>
                <button
                  onClick={() => {
                    localStorage.removeItem("user");
                    setUser(null);
                    setShowAuth(true);
                    setHistory([]);
                  }}
                  style={{ marginLeft: "1rem", background: "#ff4d4f", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}
                >Logout</button>
              </div>
            )}
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
            {!user && (
              <p style={{ color: "#fff", marginTop: "1rem", textAlign: "center" }}>
                Guest uses left: {5 - guestCount}
              </p>
            )}
            {error && <p style={{ color: "#ff4d4f", marginTop: "1rem", textAlign: "center" }}>{error}</p>}
            {imageUrl && (
              <div style={{ marginTop: "2rem", textAlign: "center" }}>
                <h3 style={{ color: "#fff" }}>Result:</h3>
                <img src={imageUrl} alt="Generated" style={{ maxWidth: "100%", borderRadius: 12, boxShadow: "0 2px 12px #0006" }} />
              </div>
            )}
          </div>
          {user && (
            <div style={{ background: "#222", padding: "1.5rem", borderRadius: "16px", boxShadow: "0 2px 12px #0003", maxWidth: 400, width: "100%" }}>
              <h3 style={{ color: "#fff", marginBottom: "1rem" }}>Your Prompt History</h3>
              {history.length === 0 ? (
                <p style={{ color: "#aaa" }}>No prompts yet.</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {history.map((item: any, idx: number) => (
                    <li key={idx} style={{ color: "#fff", marginBottom: "0.5rem", background: "#333", borderRadius: 8, padding: "8px" }}>
                      {item.prompt}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <style>{`
            @keyframes spin { 100% { transform: rotate(360deg); } }
          `}</style>
        </div>
      )}
    </>
  );
}