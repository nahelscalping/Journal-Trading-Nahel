"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  ImagePlus,
  X,
  Loader2,
  Sparkles,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string;
  model?: string;
}

export default function NahelIAPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Vérifie au chargement si la clé Gemini est configurée côté serveur.
  useEffect(() => {
    fetch("/api/neldia")
      .then((r) => r.json())
      .then((data) => {
        setConfigured(data.configured);
        if (!data.configured) setShowSetup(true);
      })
      .catch(() => {});
  }, []);

  // Compresse l'image avant envoi pour éviter les limites de taille de l'API.
  const compressImage = (dataUrl: string, maxWidth = 1024): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = dataUrl;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string);
      setImage(compressed);
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = async () => {
    if (!input.trim() && !image) return;

    const userMsg: Message = {
      role: "user",
      content: input,
      image: image || undefined,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setImage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/neldia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, image }),
      });

      const data = await res.json();

      if (data.error) {
        if (data.setup) setShowSetup(true);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.error },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response, model: data.model },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Erreur de connexion au serveur." },
      ]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100svh-9rem)] md:h-[calc(100vh-4rem)]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-3 md:mb-6"
      >
        <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-accent-green flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(74,222,128,0.35)]">
          <Bot size={18} className="text-background md:hidden" />
          <Bot size={24} className="text-background hidden md:block" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-2xl font-bold">Nahel IA</h1>
          <p className="text-xs md:text-sm text-text-muted hidden sm:block">
            Assistant trading spot crypto — SMC & ICT
          </p>
        </div>

        {/* Badge provider — juste indicatif, pas de choix utilisateur */}
        <div className="flex items-center gap-1.5 rounded-full bg-surface-light border border-border px-2.5 py-1 text-[10px] text-text-muted">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              configured ? "bg-accent-green" : "bg-accent-red"
            }`}
          />
          <span className="hidden sm:inline">Propulsé par</span>
          <span className="font-semibold">Gemini 2.5</span>
        </div>
      </motion.div>

      {/* Guide de setup si la clé manque */}
      <AnimatePresence>
        {showSetup && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="bg-surface rounded-2xl border border-accent-yellow/30 p-5">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle
                  size={20}
                  className="text-accent-yellow shrink-0 mt-0.5"
                />
                <div>
                  <h3 className="font-semibold text-accent-yellow">
                    Clé API Gemini manquante
                  </h3>
                  <p className="text-sm text-text-muted mt-1">
                    Pour activer Nahel IA, configure ta clé Gemini dans les
                    variables d&apos;environnement Vercel.
                  </p>
                </div>
                <button
                  onClick={() => setShowSetup(false)}
                  className="ml-auto text-text-muted hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="bg-surface-light rounded-xl p-4 border border-border">
                <ol className="text-sm text-text-muted space-y-2 list-decimal ml-5">
                  <li>
                    Va sur{" "}
                    <a
                      href="https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Google Cloud Console <ExternalLink size={11} />
                    </a>{" "}
                    et active la <strong>Generative Language API</strong>.
                  </li>
                  <li>
                    Dans{" "}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      APIs et services → Identifiants{" "}
                      <ExternalLink size={11} />
                    </a>
                    , crée une clé API (commence par <code>AIza…</code>).
                  </li>
                  <li>
                    Ajoute <code className="text-xs bg-surface px-1.5 py-0.5 rounded">GEMINI_API_KEY</code>{" "}
                    dans les variables d&apos;environnement de ton projet
                    Vercel (ou dans{" "}
                    <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                      .env.local
                    </code>{" "}
                    en dev), puis redéploie.
                  </li>
                </ol>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zone messages */}
      <div className="flex-1 overflow-y-auto rounded-2xl bg-surface border border-border p-4 mb-4 space-y-4">
        {messages.length === 0 && !showSetup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary-light/20 flex items-center justify-center mb-4">
              <Sparkles size={36} className="text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              Bienvenue sur Nahel IA
            </h2>
            <p className="text-text-muted max-w-md text-sm leading-relaxed">
              Je suis ton assistant trading spécialisé en SMC et ICT. Pose-moi
              des questions sur ta stratégie, envoie-moi un graphique à
              analyser, ou demande-moi des explications sur un concept.
            </p>
            <div className="flex flex-wrap gap-2 mt-6 justify-center">
              {[
                "Explique les Order Blocks",
                "Comment identifier un CHoCH ?",
                "Analyse ce graphique",
                "Gestion du risque en spot",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-4 py-2 rounded-xl bg-surface-light border border-border text-sm text-text-muted hover:text-foreground hover:border-primary/30 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-accent-green flex items-center justify-center shrink-0 shadow-[0_0_14px_rgba(74,222,128,0.3)]">
                  <Bot size={16} className="text-background" />
                </div>
              )}
              <div className={`max-w-[70%]`}>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-background rounded-br-md font-medium"
                      : "bg-surface-light border border-border rounded-bl-md"
                  }`}
                >
                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="Chart"
                      className="rounded-xl mb-2 max-h-48 w-auto"
                    />
                  )}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.model && (
                  <p className="text-[10px] text-text-muted mt-1 ml-1">
                    via {msg.model}
                  </p>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-surface-lighter flex items-center justify-center shrink-0">
                  <User size={16} className="text-text-muted" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-surface-light border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2 text-sm text-text-muted">
              <Loader2 size={16} className="animate-spin text-primary" />
              Nahel IA réfléchit...
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preview image */}
      <AnimatePresence>
        {image && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2"
          >
            <div className="relative inline-block">
              <img
                src={image}
                alt="Preview"
                className="h-20 rounded-xl border border-border"
              />
              <button
                onClick={() => setImage(null)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-accent-red rounded-full flex items-center justify-center"
              >
                <X size={12} className="text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barre de saisie */}
      <div className="flex items-end gap-3">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-3 rounded-xl bg-surface border border-border hover:border-primary/30 text-text-muted hover:text-primary transition-colors"
          title="Envoyer un graphique"
        >
          <ImagePlus size={20} />
        </button>
        <div className="flex-1">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Demande à Nahel IA..."
            rows={1}
            className="w-full px-4 py-3 pr-12 rounded-xl text-sm resize-none"
            style={{ minHeight: "48px", maxHeight: "120px" }}
          />
        </div>
        <button
          onClick={sendMessage}
          disabled={loading || (!input.trim() && !image)}
          className="p-3 rounded-xl bg-primary hover:bg-primary-dark text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
