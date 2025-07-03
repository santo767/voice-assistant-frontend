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
        const reply = data.reply;
        setResponse(reply);

        // Speak reply
        const synth = window.speechSynthesis;
        const utterThis = new SpeechSynthesisUtterance(reply);
        synth.speak(utterThis);

        // Navigate if needed
        if (reply.includes("Opening Google for")) {
          const query = text.replace(
            /^(search|who is|what is|how is|how does|what do you mean by)\s+/i,
            ""
          );
          window.open(
            `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            "_blank"
          );
        } else if (reply.includes("Playing") && reply.includes("on YouTube")) {
          const query = text.replace(/^play\s+/i, "");
          window.open(
            `https://www.youtube.com/results?search_query=${encodeURIComponent(
              query
            )}`,
            "_blank"
          );
        }
      } catch (error) {
        console.error("Error:", error);
        setResponse("⚠️ Failed to connect to backend.");
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
