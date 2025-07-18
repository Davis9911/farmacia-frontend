"use client";
import { useState, useEffect, useRef } from "react";

// Función para leer parámetros de la URL
function getQueryParams() {
  if (typeof window === "undefined") return {
    color: "#2B7DFA",
    logo: "",
    farmaciaId: "riera"
  };
  const params = new URLSearchParams(window.location.search);
  return {
    color: params.get("color") || "#2B7DFA",
    logo: params.get("logo") || "",
    farmaciaId: params.get("farmacia_id") || "riera"
  };
}

export default function Home() {
  // Lee los parámetros solo una vez al principio
  const { color, logo, farmaciaId } = getQueryParams();

  const [messages, setMessages] = useState([
    { sender: "bot", text: "¡Hola! ¿Qué medicamento o producto necesitas consultar?" }
  ]);
  const [input, setInput] = useState("");

  // REFERENCIA al input para preguntas FAQ
  const inputRef = useRef(null);

  // ====== Escuchar mensajes FAQ desde fuera (postMessage) ======
  useEffect(() => {
    function handleFAQMessage(event) {
      if (event.data && event.data.faq) {
        setInput(event.data.faq); // Rellena el input visualmente
        // Opcional: enviar automáticamente el mensaje FAQ
        setTimeout(() => {
          // Simula "enter" para enviar
          document.getElementById("faq-autosend")?.click();
        }, 100);
      }
    }
    window.addEventListener("message", handleFAQMessage);
    return () => window.removeEventListener("message", handleFAQMessage);
  }, []);

  function parseBotReply(text) {
    // Detecta cualquier enlace (no solo WhatsApp)
    const regex = /(https?:\/\/[^\s]+)/g;
    const seenLinks = new Set();
    const parts = text.split(regex);
    return parts.map((part, i) => {
      if (part && part.startsWith && part.startsWith("https://")) {
        if (seenLinks.has(part)) {
          return null; // Solo mostramos el primer enlace de cada uno
        }
        seenLinks.add(part);
        // Personaliza el botón según el destino
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
        } else if (part.includes("farmaciariera.com") || part.includes("producto")) {
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
              className="bg-gray-500 text-white px-3 py-1 rounded-xl ml-1"
            >
              Abrir enlace
            </a>
          );
        }
      }
      return part;
    });
  }

  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    setMessages(prev => [...prev, { sender: "user", text: input }]);
    const userMessage = input;
    setInput("");

    try {
      const res = await fetch("https://farmacia-backend-psi.vercel.app/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": "CaminogloriaDPM2709_" // <-- TU TOKEN
        },
        body: JSON.stringify({
          message: userMessage,
          farmacia_id: farmaciaId // Llega desde la URL
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
        {/* Barra superior personalizada */}
        <div
          className="text-lg font-bold mb-3 flex items-center"
          style={{ color: color }}
        >
          {logo && (
            <img
              src={logo}
              alt="logo farmacia"
              style={{ width: 36, height: 36, borderRadius: "50%", marginRight: 8 }}
            />
          )}
          💊 Chat Farmacia
        </div>

        <div className="flex-1 overflow-y-auto mb-4" style={{ minHeight: "320px", maxHeight: "320px" }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} mb-2`}
            >
              <div
                className={`px-4 py-2 rounded-2xl text-sm shadow
                  ${msg.sender === "user"
                    ? "text-white rounded-br-none"
                    : "bg-blue-100 text-blue-900 rounded-bl-none"
                  }`}
                style={msg.sender === "user" ? { backgroundColor: color } : {}}
              >
                {msg.sender === "bot" ? parseBotReply(msg.text) : msg.text}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            className="flex-1 border rounded-2xl px-4 py-2 focus:outline-none focus:ring-2"
            style={{ borderColor: color }}
            placeholder="Escribe tu mensaje..."
            value={input}
            ref={inputRef}
            onChange={(e) => setInput(e.target.value)}
            id="input-mensaje"
          />
          {/* Botón oculto solo para autoenviar FAQ */}
          <button
            id="faq-autosend"
            type="submit"
            style={{ display: "none" }}
            tabIndex={-1}
            aria-hidden="true"
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
