import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Tu es Nahel IA, l'assistant trading de Nahel Trading. Tu es spécialisé dans le trading SPOT de crypto-monnaies avec la méthodologie Smart Money Concepts (SMC) et ICT.

Profil du trader : Nahel trade en spot sur Binance, principalement des altcoins (TAOUSDT, etc.) avec un capital d'environ 2300$. Il rentre à 100% de son capital sur chaque trade. Il cherche 2-3% par trade. Son processus : analyse Daily → H4 → H1 → 15min pour l'entrée. Il entre sur des BISI, Order Blocks, Breaker Blocks, sous les 0.5 de Fibonacci.

Tes compétences :
- Analyse technique avancée (SMC, ICT, Elliott Wave, Price Action)
- Identification des zones de liquidité, order blocks (OB), fair value gaps (FVG), breaker blocks, BISI/SIBI
- Analyse des structures de marché (BOS, CHoCH, MSS)
- Niveaux de Fibonacci et zones OTE (0.62 - 0.79)
- Gestion du risque et money management en spot trading
- Analyse des sessions (Asian, London, New York, Kill Zones)
- Analyse de graphiques crypto quand on t'envoie des images

Quand on t'envoie un graphique :
1. Identifie la structure du marché (haussière/baissière/range)
2. Repère les derniers BOS/CHoCH
3. Identifie les Order Blocks, FVG, zones de liquidité
4. Donne ton biais directionnel
5. Indique les zones d'entrée potentielles avec SL et TP
6. Évalue la probabilité de succès (haute/moyenne/faible)

Règles :
- Réponds toujours en français
- Sois précis, donne des niveaux de prix quand possible
- Rappelle l'importance du risk management
- Tu analyses et éduques, tu ne donnes PAS de conseils financiers`;

// ========== PROVIDER 1: Google Gemini ==========
async function callGemini(message: string, image?: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "ta_cle_api_ici") return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parts: any[] = [
    { text: SYSTEM_PROMPT + "\n\nMessage de l'utilisateur : " + message },
  ];

  if (image) {
    const base64Data = image.split(",")[1];
    const mimeType = image.match(/data:(.*?);/)?.[1] || "image/png";
    parts.push({ inlineData: { mimeType, data: base64Data } });
  }

  const result = await model.generateContent(parts);
  return result.response.text();
}

// ========== PROVIDER 2: Groq ==========
async function callGroq(message: string, image?: string) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "ta_cle_groq_ici") return null;

  const groq = new Groq({ apiKey });

  // If there's an image, use the vision model
  if (image) {
    // Groq vision needs the image as a data URL in image_url
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: message || "Analyse ce graphique de trading en détail." },
            {
              type: "image_url",
              image_url: { url: image },
            },
          ],
        },
      ],
      model: "llama-3.2-11b-vision-preview",
      temperature: 0.7,
      max_tokens: 2048,
    });

    return completion.choices[0]?.message?.content || null;
  }

  // Text-only: use the fast versatile model
  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: message },
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_tokens: 2048,
  });

  return completion.choices[0]?.message?.content || null;
}

// ========== PROVIDER 3: Ollama (local) ==========
async function callOllama(message: string, image?: string) {
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  const ollamaModel = process.env.OLLAMA_MODEL || "gemma3";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = {
    model: ollamaModel,
    prompt: SYSTEM_PROMPT + "\n\nMessage de l'utilisateur : " + message,
    stream: false,
  };

  // Ollama supports images for multimodal models
  if (image) {
    const base64Data = image.split(",")[1];
    if (base64Data) {
      body.images = [base64Data];
    }
  }

  const res = await fetch(`${ollamaUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("Ollama non disponible");
  const data = await res.json();
  return data.response;
}

export async function POST(req: NextRequest) {
  try {
    const { message, image, provider } = await req.json();

    console.log(`[Nahel IA] Request: provider=${provider || "auto"}, hasImage=${!!image}, messageLength=${message?.length || 0}`);

    // Direct provider request
    if (provider === "gemini") {
      const response = await callGemini(message, image);
      if (response) return NextResponse.json({ response, provider: "gemini" });
      return NextResponse.json({ error: "Gemini non configuré. Ajoutez GEMINI_API_KEY dans .env.local" }, { status: 500 });
    }
    if (provider === "groq") {
      try {
        const response = await callGroq(message, image);
        if (response) return NextResponse.json({ response, provider: "groq" });
      } catch (err) {
        console.error("[Groq error]", err);
        return NextResponse.json({ error: `Erreur Groq: ${err instanceof Error ? err.message : "Erreur inconnue"}` }, { status: 500 });
      }
    }
    if (provider === "ollama") {
      try {
        const response = await callOllama(message, image);
        return NextResponse.json({ response, provider: "ollama" });
      } catch (err) {
        return NextResponse.json({ error: `Ollama non disponible: ${err instanceof Error ? err.message : ""}` }, { status: 500 });
      }
    }

    // Auto mode: try providers in order
    // For images: Gemini first (best vision), then Groq, then Ollama
    // For text: Groq first (fastest), then Gemini, then Ollama
    const providers = image
      ? [
          { name: "gemini", fn: () => callGemini(message, image) },
          { name: "groq", fn: () => callGroq(message, image) },
          { name: "ollama", fn: () => callOllama(message, image) },
        ]
      : [
          { name: "groq", fn: () => callGroq(message) },
          { name: "gemini", fn: () => callGemini(message) },
          { name: "ollama", fn: () => callOllama(message) },
        ];

    const errors: string[] = [];
    for (const p of providers) {
      try {
        console.log(`[Nahel IA] Trying ${p.name}...`);
        const response = await p.fn();
        if (response) {
          console.log(`[Nahel IA] Success with ${p.name}`);
          return NextResponse.json({ response, provider: p.name });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur";
        console.error(`[Nahel IA] ${p.name} failed:`, msg);
        errors.push(`${p.name}: ${msg}`);
      }
    }

    return NextResponse.json({
      error: "Aucune IA disponible.\n\n" +
        (errors.length > 0 ? "Erreurs:\n" + errors.join("\n") + "\n\n" : "") +
        "Configurez au moins une clé API dans les variables d'environnement Vercel:\n" +
        "- GROQ_API_KEY (gratuit sur groq.com)\n" +
        "- GEMINI_API_KEY (gratuit sur aistudio.google.com)",
      setup: true,
    }, { status: 500 });
  } catch (error: unknown) {
    console.error("[Nahel IA] API error:", error);
    const msg = error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET endpoint to check which providers are configured
export async function GET() {
  const providers = {
    gemini: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "ta_cle_api_ici"),
    groq: !!(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== "ta_cle_groq_ici"),
    ollama: false,
  };

  // Check if Ollama is running
  try {
    const res = await fetch((process.env.OLLAMA_URL || "http://localhost:11434") + "/api/tags", {
      signal: AbortSignal.timeout(2000),
    });
    providers.ollama = res.ok;
  } catch {
    // Ollama not available
  }

  return NextResponse.json({ providers, anyAvailable: Object.values(providers).some(Boolean) });
}
