import React, { useState, useEffect } from "react";

function App() {
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [navigationLink, setNavigationLink] = useState(null); // Will hold {uri, web} or string
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const [userName, setUserName] = useState(null); // Remember user name

  // Helper: Try to extract name from backend reply if greeting contains it
  // (Optional: you can improve this by backend sending name explicitly)
  useEffect(() => {
    if (!userName && response) {
      // Simple heuristic: extract first word after Hello or equivalent
      const nameMatch = response.match(
        /Hello (\w+)|नमस्ते (\w+)|வணக்கம் (\w+)|నమస్కారం (\w+)|ഹലോ (\w+)|ಹಲೋ (\w+)|السلام علیکم (\w+)|こんにちは (\w+)/i
      );
      if (nameMatch) {
        const extractedName = nameMatch.slice(1).find(Boolean);
        if (extractedName) setUserName(extractedName);
      }
    }
  }, [response, userName]);

  const startListening = () => {
    setIsListening(true);
    setNavigationLink(null); // Clear previous navigation link

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = selectedLanguage;

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setIsListening(false);

      try {
        // Call backend hosted on Render, send name if known
        const res = await fetch(
          "https://voice-assistant-backend-n3at.onrender.com/command",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // To support sessions if backend uses cookies
            body: JSON.stringify({
              command: text,
              language: selectedLanguage,
              name: userName || undefined, // send name if known
            }),
          }
        );

        const data = await res.json();
        console.log("Backend response:", data); // Debug log
        setResponse(data.reply);

        // Voice response
        const synth = window.speechSynthesis;
        const utterThis = new SpeechSynthesisUtterance(data.reply);

        // Set voice language based on selected language
        const voices = synth.getVoices();
        const targetVoice = voices.find((voice) =>
          voice.lang.startsWith(selectedLanguage.split("-")[0])
        );
        if (targetVoice) {
          utterThis.voice = targetVoice;
        }
        utterThis.lang = selectedLanguage;

        synth.speak(utterThis);

        // Handle navigation - support object with uri and web
        if (data.navigate) {
          console.log("Navigation data:", data.navigate);

          // If navigate is an object with uri and web
          if (typeof data.navigate === "object" && data.navigate.uri) {
            setNavigationLink(data.navigate);

            // Ask user for permission to open app URI
            const userConfirmed = window.confirm(
              `Do you want to open the app?`
            );
            if (userConfirmed) {
              // Try to open the URI scheme (mobile app)
              window.location.href = data.navigate.uri;

              // Fallback: after a delay, open web URL if provided
              if (data.navigate.web) {
                setTimeout(() => {
                  window.open(data.navigate.web, "_blank");
                }, 2000);
              }
            }
          } else if (typeof data.navigate === "string") {
            // Old style string URL
            setNavigationLink(data.navigate);

            const userConfirmed = window.confirm(
              `Do you want to open ${data.navigate}?`
            );
            if (userConfirmed) {
              const newWindow = window.open(data.navigate, "_blank");
              if (
                !newWindow ||
                newWindow.closed ||
                typeof newWindow.closed === "undefined"
              ) {
                window.location.href = data.navigate;
              }
            }
          }
        }
      } catch (error) {
        console.error("Error:", error);
        setResponse("Sorry, I couldn't process that request.");
        setIsListening(false);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "black",
        color: "white",
        textAlign: "center",
        paddingTop: "50px",
        padding: "20px",
      }}
    >
      <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>
        🗣️ Web Voice Assistant
      </h1>

      {/* Language Selection */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ marginRight: "10px", fontSize: "16px" }}>
          🌐 Language:
        </label>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          style={{
            padding: "5px 10px",
            fontSize: "14px",
            borderRadius: "6px",
            border: "1px solid #3b82f6",
            background: "#1f2937",
            color: "white",
          }}
        >
          <option value="en-US">🇺🇸 English (US)</option>
          <option value="hi-IN">🇮🇳 Hindi</option>
          <option value="es-ES">🇪🇸 Spanish</option>
          <option value="fr-FR">🇫🇷 French</option>
          <option value="de-DE">🇩🇪 German</option>
          <option value="it-IT">🇮🇹 Italian</option>
          <option value="pt-BR">🇧🇷 Portuguese</option>
          <option value="ru-RU">🇷🇺 Russian</option>
          <option value="ja-JP">🇯🇵 Japanese</option>
          <option value="ko-KR">🇰🇷 Korean</option>
          <option value="zh-CN">🇨🇳 Chinese (Mandarin)</option>
          <option value="ar-SA">🇸🇦 Arabic</option>
          <option value="ta-IN">🇮🇳 Tamil</option>
          <option value="te-IN">🇮🇳 Telugu</option>
          <option value="bn-IN">🇮🇳 Bengali</option>
        </select>
      </div>

      <button
        onClick={startListening}
        disabled={isListening}
        style={{
          background: isListening ? "#6b7280" : "#3b82f6",
          color: "white",
          border: "none",
          padding: "10px 20px",
          fontSize: "18px",
          borderRadius: "12px",
          cursor: isListening ? "not-allowed" : "pointer",
          opacity: isListening ? 0.7 : 1,
          marginBottom: "20px",
        }}
      >
        {isListening ? "Listening..." : "Start Talking"}
      </button>

      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <p style={{ marginTop: "20px", fontSize: "16px" }}>
          You said: <span style={{ color: "#22c55e" }}>{transcript}</span>
        </p>

        <p style={{ fontSize: "16px", marginTop: "10px" }}>
          Bot says: <span style={{ color: "#facc15" }}>{response}</span>
        </p>

        {navigationLink && (
          <div style={{ marginTop: "20px" }}>
            <p style={{ marginBottom: "10px", color: "#60a5fa" }}>
              {typeof navigationLink === "object"
                ? navigationLink.uri.includes("maps")
                  ? "📍 View on Maps:"
                  : navigationLink.uri.includes("youtube")
                  ? "🎵 Play on YouTube:"
                  : "🔗 Open Link:"
                : navigationLink.includes("maps")
                ? "📍 View on Maps:"
                : navigationLink.includes("youtube")
                ? "🎵 Play on YouTube:"
                : "🔗 Open Link:"}
            </p>
            <a
              href={
                typeof navigationLink === "object"
                  ? navigationLink.web
                  : navigationLink
              }
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#3b82f6",
                textDecoration: "underline",
                fontSize: "16px",
                padding: "10px 20px",
                border: "1px solid #3b82f6",
                borderRadius: "8px",
                display: "inline-block",
                marginTop: "10px",
                background: "rgba(59, 130, 246, 0.1)",
              }}
            >
              {typeof navigationLink === "object"
                ? "🔗 Open Link"
                : navigationLink.includes("maps")
                ? "🗺️ Open Maps"
                : navigationLink.includes("youtube")
                ? "▶️ Play Now"
                : "🔗 Open Link"}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
