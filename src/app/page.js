"use client";
import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "¡Hola! ¿Qué medicamento o producto necesitas consultar?" }
  ]);
  const [input, setInput] = useState("");
  // Poner aquí el tipo de farmacia según el deploy (carrito o simple)
  const farmaciaTipo = "carrito"; // Cambia a "simple" si la farmacia es sin carrito

  // Detecta y convierte enlaces WhatsApp en botón (sin repetir)
  function parseBotReply(text) {
    const regex = /(https:\/\/wa\.me\/\d+)/g;
    const seenLinks = new Set();
    const parts = text.split(regex);
    return parts.map((part, i) => {
      if (part.startsWith("https://wa.me/")) {
        if (seenLinks.has(part)) {
          return null; // Ya se mostró este enlace, no lo repetimos
        }
        seenLinks.add(part);
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 text-white px-3 py-1 rounded-xl ml-1"
          >
            Consultar por WhatsApp
          </a>
        );
      }
      return part;
    });
  }

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages(prev => [...prev, { sender: "user", text: input }]);
    const userMessage = input;
    setInput("");

    try {
      const res = await fetch("https://farmacia-backend-psi.vercel.app/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          farmacia_tipo: farmaciaTipo
        }),
      });
      const data = await res.json();
      setMessages(prev => [
        ...prev,
        { sender: "bot", text: data.reply || "El bot no respondió. Intenta de nuevo." }
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { sender: "bot", text: "Error conectando con la farmacia. Intenta más tarde." }
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col p-4">
        <div className="text-lg font-bold text-blue-700 mb-3">💊 Farmacia Chat Demo</div>
        <div className="flex-1 overflow-y-auto mb-4" style={{ minHeight: "320px", maxHeight: "320px" }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} mb-2`}
            >
              <div
                className={`px-4 py-2 rounded-2xl text-sm shadow
                  ${msg.sender === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-blue-100 text-blue-900 rounded-bl-none"
                  }`}
              >
                {msg.sender === "bot" ? parseBotReply(msg.text) : msg.text}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            className="flex-1 border rounded-2xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Escribe tu mensaje..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-2xl font-bold hover:bg-blue-700 transition"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
