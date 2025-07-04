import React, { useState, useEffect, useRef } from "react";

function App() {
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [userName, setUserName] = useState(null);
  const recognitionRef = useRef(null);

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
    recognition.lang = "";
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

        const synth = window.speechSynthesis;
        const utterThis = new SpeechSynthesisUtterance(data.reply);
        synth.speak(utterThis);

        // Navigation logic
        if (data.navigate) {
          const confirmed = window.confirm("Do you want to open this?");
          if (confirmed) {
            if (typeof data.navigate === "object" && data.navigate.uri) {
              window.location.href = data.navigate.uri;
              if (data.navigate.web) {
                setTimeout(() => {
                  window.open(data.navigate.web, "_blank");
                }, 2000);
              }
            } else {
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

  // Styles
  const userBubble = {
    background: "linear-gradient(135deg, #00c6ff, #0072ff)",
    color: "#fff",
    alignSelf: "flex-end",
    borderRadius: "18px 18px 4px 18px",
    padding: "10px 18px",
    margin: "6px 0",
    maxWidth: "85%",
    fontSize: "16px",
    wordBreak: "break-word",
    animation: "fadeIn 0.3s ease-in-out",
  };

  const botBubble = {
    background: "linear-gradient(135deg, #ff758c, #ff7eb3)",
    color: "#fff",
    alignSelf: "flex-start",
    borderRadius: "18px 18px 18px 4px",
    padding: "10px 18px",
    margin: "6px 0",
    maxWidth: "85%",
    fontSize: "16px",
    wordBreak: "break-word",
    animation: "fadeIn 0.3s ease-in-out",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#121212",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          margin: "0 auto",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "0 0 100px 0",
        }}
      >
        <div
          style={{
            fontWeight: "bold",
            fontSize: "2rem",
            textAlign: "center",
            margin: "32px 0 12px 0",
            background: "linear-gradient(90deg, #00c6ff, #ff7eb3)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          🎤 Voice Assistant
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            background: "#1e1e1e",
            borderRadius: "16px",
            padding: "16px 12px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
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
                      color: "#00c6ff",
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
            bottom: 30,
            left: "50%",
            transform: "translateX(-50%)",
            background: isListening
              ? "#ff5252"
              : "linear-gradient(135deg, #00c6ff, #0072ff)",
            color: "#fff",
            border: "none",
            padding: "18px",
            fontSize: "28px",
            borderRadius: "50%",
            cursor: isListening ? "not-allowed" : "pointer",
            boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
            outline: "none",
            zIndex: 100,
            transition: "all 0.3s ease",
          }}
          aria-label={isListening ? "Listening" : "Start Talking"}
        >
          {isListening ? "🎙️" : "🎤"}
        </button>
      </div>
    </div>
  );
}

export default App;
