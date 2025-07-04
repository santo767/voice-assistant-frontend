import React, { useState, useEffect } from "react";

function App() {
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [navigationLink, setNavigationLink] = useState(null);
  const [userName, setUserName] = useState(null);

  // Try to extract name from greeting
  useEffect(() => {
    if (!userName && response) {
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
    setNavigationLink(null);

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = ""; // Let browser auto-detect language

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setIsListening(false);

      try {
        // Only send transcript and name (if known)
        const res = await fetch(
          "https://voice-assistant-backend-n3at.onrender.com/command",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              command: text,
              name: userName || undefined,
            }),
          }
        );

        const data = await res.json();
        setResponse(data.reply);

        // Voice response (let browser auto-select language)
        const synth = window.speechSynthesis;
        const utterThis = new SpeechSynthesisUtterance(data.reply);
        synth.speak(utterThis);

        // Handle navigation - support object with uri and web
        if (data.navigate) {
          if (typeof data.navigate === "object" && data.navigate.uri) {
            setNavigationLink(data.navigate);
            const userConfirmed = window.confirm(
              `Do you want to open the app?`
            );
            if (userConfirmed) {
              window.location.href = data.navigate.uri;
              if (data.navigate.web) {
                setTimeout(() => {
                  window.open(data.navigate.web, "_blank");
                }, 2000);
              }
            }
          } else if (typeof data.navigate === "string") {
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
        setResponse("Sorry, I couldn't process that request.");
        setIsListening(false);
      }
    };

    recognition.onerror = (event) => {
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
