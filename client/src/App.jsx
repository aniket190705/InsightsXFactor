import React, { useState, useEffect } from "react";
import "./App.css";

const App = () => {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [waitingOnResponse, setWaitingOnResponse] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [errorr, setErrorr] = useState(false);

  const mockTypingAfter = 1500;
  const mockResponseAfter = 3000;
  const mockOpeningMessage =
    "Hi there! I'm your Social Media Analyzer Bot. I can help you analyze trends, hashtags, and audience engagement to improve your social media strategy. Let's get started!";
  const mockResponsePrefix = "Thanks for sending me: ";
  const errorMesssage = "There is an error. Please try again";
  useEffect(() => {
    mockResponse(mockOpeningMessage);
  }, []);

  // async function sendMessage() {
  //   const input = document.getElementById("userMessage").value;

  //   if (!input) {
  //     alert("Please enter a message");
  //     return;
  //   }

  //   try {
  //     const response = await fetch("http://localhost:3000/runFlow", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ message: input }),
  //     });

  //     const result = await response.json();
  //     if (response.ok) {
  //       document.getElementById("response").textContent = result.result;
  //     } else {
  //       document.getElementById("response").textContent =
  //         result.error || "An error occurred";
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     document.getElementById("response").textContent =
  //       "Error connecting to server";
  //   }
  // }

  const sendMessage = async (newMessage) => {
    if (waitingOnResponse || newMessage.trim() === "") return;
    setShowTyping(true);
    const userMessage = { role: "user", body: newMessage };
    setMessages([...messages, userMessage]);
    setNewMessage("");
    setWaitingOnResponse(true);

    try {
      const response = await fetch("http://localhost:3000/runFlow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: newMessage }),
      });

      const result = await response.json();
      if (response.ok) {
        mockResponse(result.result); // Handle success
      } else {
        setErrorr(true); // Update error state
        mockResponse(null, true); // Show error message
      }
    } catch (error) {
      console.error(error);
      setErrorr(true); // Update error state
      mockResponse(null, true); // Show error message
    }
  };

  const mockResponse = (message, isError = false) => {
    setShowTyping(true);

    setTimeout(() => {
      setShowTyping(false);
      const responseMessage = isError
        ? {
            role: "assistant",
            body: errorMesssage,
          }
        : {
            role: "assistant",
            body:
              message ||
              `${mockResponsePrefix} ${
                messages[messages.length - 1]?.body || ""
              }`,
          };
      setMessages((prev) => [...prev, responseMessage]);
      setErrorr(false); // Reset the error state
      setWaitingOnResponse(false);
    }, mockResponseAfter);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="heading">
          <h1>InsightsXFactor</h1>
        </div>
        <div className="github">
          {" "}
          <a href="https://github.com/your-repo-link" className="github-button">
            GitHub Repo <img src="/images/github-mark-white.png" alt="" />
          </a>
        </div>
      </div>

      <div className="messages-wrapper">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${
              message.role === "assistant" ? "assistant" : "user"
            }`}
          >
            {message.body}
          </div>
        ))}
        {showTyping && (
          <div className="message assistant">
            <div className="type-indicator">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </div>
          </div>
        )}
      </div>

      <div className="input-bar">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Your message..."
        />
        <button
          onClick={() => sendMessage(newMessage)}
          disabled={waitingOnResponse}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default App;
