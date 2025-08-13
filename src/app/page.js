"use client";
import { useState, useEffect, useRef } from "react";

// Lee parámetros de la URL (color, logo, farmacia_id)
function getQueryParams() {
  if (typeof window === "undefined") {
    return { color: "#2B7DFA", logo: "", farmaciaId: "riera" };
  }
  const params = new URLSearchParams(window.location.search);
  return {
    color: params.get("color") || "#2B7DFA",
    logo: params.get("logo") || "",
    farmaciaId: params.get("farmacia_id") || "riera",
  };
}

const FAQ_QUESTIONS = [
  "¿Cuál es el horario?",
  "¿Dónde está la Farmacia?",
  "¿Cómo puedo hacer un encargo?",
];

export default function Home() {
  const { color, logo, farmaciaId } = getQueryParams();

  const [messages, setMessages] = useState([
    { sender: "bot", text: "¡Hola! ¿Qué medicamento o producto necesitas consultar?" },
  ]);
  const [input, setInput] = useState("");
  const [showFAQ, setShowFAQ] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef(null);

  // Convierte texto del bot en texto + botones de enlaces
  function parseBotReply(text) {
    const regex = /(https?:\/\/[^\s]+)/g;
    const seen = new Set();
    const parts = text.split(regex);

    return parts.map((part, i) => {
      if (part && typeof part === "string" && part.startsWith("http")) {
        if (seen.has(part)) return null;
        seen.add(part);

        if (part.includes("wa.me/")) {
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
        } else if (part.includes("farmacia") || part.includes("producto")) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-3 py-1 rounded-xl ml-1"
            >
              Ver producto
            </a>
          );
        } else {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-600 text-white px-3 py-1 rounded-xl ml-1"
            >
              Abrir enlace
            </a>
          );
        }
      }
      return part;
    });
  }

  // Envía mensaje (desde formulario o FAQ)
  const sendMessage = async (e, valueOverride) => {
    if (e) e.preventDefault();

    const messageToSend =
      typeof valueOverride === "string" ? valueOverride : input;
    if (!messageToSend.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: messageToSend }]);
    setInput("");
    setShowFAQ(false);

    // Historial completo para el backend
    const history = [
      ...messages.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      })),
      { role: "user", content: messageToSend },
    ];

    setIsTyping(true); // ⬅️ muestra “está escribiendo...”
    try {
      // 👉 Llamamos a un endpoint de backend que YA mete la API key en el servidor
      const res = await fetch("/api/chat-frontend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          farmacia_id: farmaciaId,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: data.reply || "El bot no respondió. Intenta de nuevo." },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error conectando con la farmacia. Intenta más tarde." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  function handleInputChange(e) {
    setInput(e.target.value);
    if (e.target.value.length > 0 && showFAQ) setShowFAQ(false);
  }

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-full sm:max-w-md flex flex-col p-2 sm:p-4">
        {/* Barra superior */}
        <div className="text-lg font-bold mb-3 flex items-center" style={{ color }}>
          {logo && (
            <img
              src={logo}
              alt="logo farmacia"
              style={{ width: 36, height: 36, borderRadius: "50%", marginRight: 8 }}
            />
          )}
          💊 Chat Farmacia
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto mb-4" style={{ minHeight: "320px", maxHeight: "320px" }}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} mb-2`}>
              <div
                className={`px-4 py-2 text-sm shadow
                  ${msg.sender === "user"
                    ? "text-white rounded-br-3xl rounded-tl-3xl rounded-tr-3xl rounded-bl-[36px]"
                    : "bg-blue-100 text-blue-900 rounded-bl-3xl rounded-tr-3xl rounded-tl-3xl rounded-br-[36px]"
                  }`}
                style={msg.sender === "user" ? { backgroundColor: color, maxWidth: "80%" } : { maxWidth: "80%" }}
              >
                {msg.sender === "bot" ? parseBotReply(msg.text) : msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Está escribiendo... */}
        {isTyping && (
          <div className="flex items-center mb-2">
            <div className="animate-pulse text-gray-500 italic text-sm">
              La farmacia está escribiendo...
            </div>
          </div>
        )}

        {/* FAQ inicial */}
        {showFAQ && (
          <div className="flex flex-wrap gap-2 mb-2 justify-center">
            {FAQ_QUESTIONS.map((faq, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(null, faq)}
                className="bg-[#B854A6] text-white rounded-xl px-3 py-2 text-sm font-semibold shadow hover:opacity-90"
                style={{ border: "none" }}
              >
                {faq}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            className="flex-1 border rounded-2xl px-4 py-2 focus:outline-none focus:ring-2"
            style={{ borderColor: color }}
            placeholder="Escribe tu mensaje..."
            value={input}
            ref={inputRef}
            onChange={handleInputChange}
            id="input-mensaje"
            autoComplete="off"
          />
          <button
            type="submit"
            className="text-white px-4 py-2 rounded-2xl font-bold hover:opacity-90 transition"
            style={{ backgroundColor: color }}
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
