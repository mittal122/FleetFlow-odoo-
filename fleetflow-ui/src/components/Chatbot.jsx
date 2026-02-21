import { useState } from "react";
import client from "../api/client";

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { role: "system", content: "Hi! I'm FleetFlow AI. Ask me anything about your fleet." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setMessages([...messages, { role: "user", content: input }]);
    try {
      const res = await client.post("/chatbot/gemini", { messages: [...messages, { role: "user", content: input }] });
      setMessages([...messages, { role: "user", content: input }, { role: "assistant", content: res.data.reply }]);
    } catch {
      setMessages([...messages, { role: "user", content: input }, { role: "assistant", content: "Sorry, I couldn't answer right now." }]);
    }
    setInput("");
    setLoading(false);
  };

  return (
    <div className="chatbot-card" style={{ position: "fixed", bottom: 24, right: 24, width: 340, background: "#fff", borderRadius: 12, boxShadow: "0 2px 16px #0002", zIndex: 1000, padding: 16 }}>
      <h3 style={{ color: "var(--primary)", marginBottom: 8 }}>FleetFlow AI Chatbot</h3>
      <div style={{ maxHeight: 220, overflowY: "auto", marginBottom: 8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 6, textAlign: m.role === "user" ? "right" : "left" }}>
            <span style={{ background: m.role === "user" ? "#e0e7ff" : "#f3f4f6", color: "#4c1d95", padding: "6px 12px", borderRadius: 8, display: "inline-block" }}>{m.content}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about vehicles, trips..."
          style={{ flex: 1 }}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} disabled={loading} style={{ minWidth: 60 }}>
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
