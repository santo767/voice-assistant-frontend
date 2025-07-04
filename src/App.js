import React, { useState, useEffect, useRef } from "react";

function App() {
  const [messages, setMessages] = useState([]); // Chat history
  const [isListening, setIsListening] = useState(false);
  const [userName, setUserName] = useState(null);
  const recognitionRef = useRef(null);

  // Extract name from greetings in bot messages
  useEffect(() => {
    if (!userName && messages.length) {
      const lastBotMsg = messages[messages.length - 1];
      if (lastBotMsg && lastBotMsg.role === "bot") {
        const nameMatch = lastBotMsg.text.match(/Hello (\w+)!/i);
        if (nameMatch) setUserName(nameMatch[1]);
      }
    }
  }, [messages, userName]);

  const startListening = () => {
    setIsListening(true);

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = ""; // Auto-detect language
    recognitionRef.current = recognition;

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setMessages((msgs) => [...msgs, { role: "user", text }]);
      setIsListening(false);

      try {
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
        setMessages((msgs) => [
          ...msgs,
          { role: "bot", text: data.reply, navigate: data.navigate },
        ]);

        // Voice reply
        const synth = window.speechSynthesis;
        const utterThis = new SpeechSynthesisUtterance(data.reply);
        synth.speak(utterThis);

        // Handle navigation
        if (data.navigate) {
          if (typeof data.navigate === "object" && data.navigate.uri) {
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
        setMessages((msgs) => [
          ...msgs,
          { role: "bot", text: "Sorry, I couldn't process that request." },
        ]);
        setIsListening(false);
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // Styles for chat bubbles
  const userBubble = {
    background: "linear-gradient(90deg, #4285f4 0%, #34a853 100%)",
    color: "white",
    alignSelf: "flex-end",
    borderRadius: "20px 20px 4px 20px",
    padding: "10px 18px",
    margin: "8px 0",
    maxWidth: "70%",
    fontSize: "16px",
    wordBreak: "break-word",
  };
  const botBubble = {
    background: "linear-gradient(90deg, #fbbc05 0%, #ea4335 100%)",
    color: "white",
    alignSelf: "flex-start",
    borderRadius: "20px 20px 20px 4px",
    padding: "10px 18px",
    margin: "8px 0",
    maxWidth: "70%",
    fontSize: "16px",
    wordBreak: "break-word",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e8eaf6 0%, #fffde7 100%)",
        color: "#222",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          margin: "0 auto",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "0 0 80px 0",
        }}
      >
        <div
          style={{
            fontWeight: "bold",
            fontSize: "2rem",
            textAlign: "center",
            margin: "32px 0 12px 0",
            color: "#4285f4",
            letterSpacing: "1px",
          }}
        >
          <span role="img" aria-label="mic">
            🎤
          </span>{" "}
          Voice Assistant
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            background: "rgba(255,255,255,0.85)",
            borderRadius: "16px",
            boxShadow: "0 2px 16px rgba(66,133,244,0.08)",
            padding: "24px 12px 12px 12px",
            minHeight: "350px",
          }}
        >
          {messages.map((msg, idx) => (
            <div key={idx} style={msg.role === "user" ? userBubble : botBubble}>
              {msg.text}
              {msg.navigate && (
                <div style={{ marginTop: 8 }}>
                  <a
                    href={
                      typeof msg.navigate === "object"
                        ? msg.navigate.web
                        : msg.navigate
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#4285f4",
                      textDecoration: "underline",
                      fontWeight: "bold",
                    }}
                  >
                    {typeof msg.navigate === "object"
                      ? "🔗 Open Link"
                      : msg.navigate.includes("maps")
                      ? "🗺️ Open Maps"
                      : msg.navigate.includes("youtube")
                      ? "▶️ Play Now"
                      : "🔗 Open Link"}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={startListening}
          disabled={isListening}
          style={{
            position: "fixed",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            background: isListening
              ? "rgba(234,67,53,0.8)"
              : "linear-gradient(90deg, #4285f4 0%, #34a853 100%)",
            color: "white",
            border: "none",
            padding: "20px",
            fontSize: "32px",
            borderRadius: "50%",
            cursor: isListening ? "not-allowed" : "pointer",
            boxShadow: "0 4px 24px rgba(66,133,244,0.18)",
            outline: "none",
            zIndex: 100,
            transition: "background 0.3s",
          }}
          aria-label={isListening ? "Listening" : "Start Talking"}
        >
          <span role="img" aria-label="microphone">
            {isListening ? "🎙️" : "🎤"}
          </span>
        </button>
      </div>
    </div>
  );
}

export default App;
