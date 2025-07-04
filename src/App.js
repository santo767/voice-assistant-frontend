import React, { useState } from "react";

function App() {
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [navigationLink, setNavigationLink] = useState(null);

  const startListening = () => {
    setIsListening(true);
    setNavigationLink(null); // Clear previous navigation link

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setIsListening(false);

      try {
        // Call backend hosted on Render
        const res = await fetch(
          "https://voice-assistant-backend-n3at.onrender.com/command",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ command: text }),
          }
        );

        const data = await res.json();
        console.log("Backend response:", data); // Debug log
        setResponse(data.reply);

        // Voice response
        const synth = window.speechSynthesis;
        const utterThis = new SpeechSynthesisUtterance(data.reply);
        synth.speak(utterThis);

        // Handle navigation - Multiple approaches
        if (data.navigate) {
          console.log("Navigation URL:", data.navigate); // Debug log
          setNavigationLink(data.navigate);

          // Option 1: Ask user for permission
          const userConfirmed = window.confirm(
            `Do you want to open ${data.navigate}?`
          );
          if (userConfirmed) {
            // Try to open in new tab first
            const newWindow = window.open(data.navigate, "_blank");
            if (
              !newWindow ||
              newWindow.closed ||
              typeof newWindow.closed == "undefined"
            ) {
              // Popup blocked, fallback to same tab
              window.location.href = data.navigate;
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
              Click to continue:
            </p>
            <a
              href={navigationLink}
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
              }}
            >
              Open Link
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
