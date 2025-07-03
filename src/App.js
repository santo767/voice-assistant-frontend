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

      // Send to backend
      const res = await fetch(
        "https://voice-assistant-backend-n3at.onrender.com/command",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command: text }),
        }
      );

      const data = await res.json();
      const reply = data.reply;
      setResponse(reply);

      // Voice output
      const synth = window.speechSynthesis;
      const utterThis = new SpeechSynthesisUtterance(reply);
      synth.speak(utterThis);

      // Auto open Google or YouTube
      if (reply.toLowerCase().includes("searching google for")) {
        const query = text.replace(/search|google/i, "").trim();
        window.open(
          `https://www.google.com/search?q=${encodeURIComponent(query)}`,
          "_blank"
        );
      }

      if (
        reply.toLowerCase().includes("playing") &&
        reply.toLowerCase().includes("youtube")
      ) {
        const query = text.replace("play", "").trim();
        window.open(
          `https://www.youtube.com/results?search_query=${encodeURIComponent(
            query
          )}`,
          "_blank"
        );
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
