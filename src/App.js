import React, { useState } from "react";

function App() {
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");

  const startListening = () => {
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);

      try {
        const res = await fetch(
          "https://voice-assistant-backend-n3at.onrender.com/command",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ command: text }),
          }
        );

        const data = await res.json();
        setResponse(data.reply);

        // Speak the reply
        const synth = window.speechSynthesis;
        const utterThis = new SpeechSynthesisUtterance(data.reply);
        synth.speak(utterThis);

        // ✅ Open YouTube or Google if URL present
        const urlPattern = /(https?:\/\/[^\s]+)/g;
        const urls = data.reply.match(urlPattern);
        if (urls && urls.length > 0) {
          window.open(urls[0], "_blank"); // open link in new tab
        }
      } catch (error) {
        console.error("Error:", error);
        setResponse("⚠️ Error: Could not reach backend.");
      }
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
      }}
    >
      <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>
        🗣️ Web Voice Assistant
      </h1>
      <button
        onClick={startListening}
        style={{
          background: "#3b82f6",
          color: "white",
          border: "none",
          padding: "10px 20px",
          fontSize: "18px",
          borderRadius: "12px",
          cursor: "pointer",
        }}
      >
        Start Talking
      </button>
      <p style={{ marginTop: "20px" }}>
        You said: <span style={{ color: "#22c55e" }}>{transcript}</span>
      </p>
      <p>
        Bot says: <span style={{ color: "#facc15" }}>{response}</span>
      </p>
    </div>
  );
}

export default App;
