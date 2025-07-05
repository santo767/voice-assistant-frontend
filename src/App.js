import React, { useState, useEffect, useRef } from "react";
import botAvatar from "./bot.png";
import "./App.css";

export default function VoiceAssistant() {
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [userName, setUserName] = useState(null);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!userName && messages.length) {
      const lastBotMsg = messages[messages.length - 1];
      if (lastBotMsg?.role === "bot") {
        const nameMatch = lastBotMsg.text.match(/Hello (\w+)!/i);
        if (nameMatch) setUserName(nameMatch[1]);
      }
    }
  }, [messages, userName]);

  const sendCommand = async (text) => {
    setMessages((prev) => [...prev, { role: "user", text }]);
    setIsTyping(true);
    try {
      const res = await fetch(
        "https://voice-assistant-backend-n3at.onrender.com/command",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ command: text, name: userName || undefined }),
        }
      );
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "bot", text: data.reply, navigate: data.navigate },
      ]);
      setIsTyping(false);

      const utterance = new SpeechSynthesisUtterance(data.reply);
      window.speechSynthesis.speak(utterance);

      if (data.navigate) {
        const confirmNav = window.confirm("Open the suggested link?");
        if (confirmNav) {
          const url =
            typeof data.navigate === "object"
              ? data.navigate.uri || data.navigate.web
              : data.navigate;
          window.open(url, "_blank");
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Sorry, I couldn't process that request." },
      ]);
      setIsTyping(false);
    }
  };

  const startListening = () => {
    setIsListening(true);
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-IN";
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setIsListening(false);
      sendCommand(text);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      sendCommand(inputText.trim());
      setInputText("");
    }
  };

  return (
    <div className="app-container">
      <h1 className="header">🎤 Voice Assistant</h1>
      <div className="chat-container">
        <div className="messages-container">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={msg.role === "user" ? "message user" : "message bot"}
            >
              {msg.role === "bot" && (
                <img src={botAvatar} alt="Bot" className="bot-avatar" />
              )}
              <div>
                {msg.text}
                {msg.navigate && (
                  <div className="navigate-link">
                    <a
                      href={
                        typeof msg.navigate === "object"
                          ? msg.navigate.web
                          : msg.navigate
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      🔗 Open
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && <div className="typing">Assistant is typing...</div>}
        </div>

        <form onSubmit={handleSubmit} className="input-form">
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="input-box"
          />
          <button type="submit" className="send-button">
            Send
          </button>
        </form>

        <button
          onClick={startListening}
          disabled={isListening}
          className={`voice-button ${isListening ? "listening" : ""}`}
        >
          {isListening ? "🎙️ Listening..." : "🎤 Speak"}
        </button>
      </div>
    </div>
  );
}
