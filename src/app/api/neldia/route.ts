import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// Prompt système : identité + méthodologie SMC/ICT + profil de Nahel.
// C'est ce qui "spécialise" Gemini sur ton trading spot crypto.
const SYSTEM_PROMPT = `Tu es Nahel IA, l'assistant trading de Nodex Trading. Tu es spécialisé dans le trading SPOT de crypto-monnaies avec la méthodologie Smart Money Concepts (SMC) et ICT.

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

// Modèles utilisés, du meilleur au plus rapide.
// - gemini-2.5-pro : raisonnement avancé, meilleure compréhension SMC/ICT,
//   vision très précise. Quota gratuit ~50 req/jour sur AI Studio / GCP.
// - gemini-2.5-flash : fallback quand Pro est rate-limité. Toujours excellent
//   en vision, quota gratuit ~1500 req/jour.
const MODELS = {
  pro: "gemini-2.5-pro",
  flash: "gemini-2.5-flash",
} as const;

/**
 * Appelle Gemini avec un modèle donné. Renvoie le texte généré ou null.
 * Throws si la clé n'est pas configurée ou si Gemini renvoie une erreur
 * autre qu'un rate limit.
 */
async function callGemini(
  model: string,
  message: string,
  image?: string,
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY manquante dans les variables d'environnement");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const genModel = genAI.getGenerativeModel({
    model,
    systemInstruction: SYSTEM_PROMPT,
  });

  // Construction des parts : texte + image optionnelle (data URL base64).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parts: any[] = [
    { text: message || "Analyse ce graphique de trading en détail." },
  ];

  if (image) {
    const base64Data = image.split(",")[1];
    const mimeType = image.match(/data:(.*?);/)?.[1] || "image/png";
    parts.push({ inlineData: { mimeType, data: base64Data } });
  }

  const result = await genModel.generateContent(parts);
  return result.response.text();
}

export async function POST(req: NextRequest) {
  try {
    const { message, image } = await req.json();

    console.log(
      `[Nahel IA] Request: hasImage=${!!image}, messageLength=${message?.length || 0}`,
    );

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Gemini n'est pas configuré. Ajoute ta clé GEMINI_API_KEY dans les variables d'environnement Vercel (ou dans .env.local en dev).",
          setup: true,
        },
        { status: 500 },
      );
    }

    // Stratégie : on essaie d'abord Pro (meilleure qualité), puis Flash en
    // fallback si Pro est rate-limité (429) ou rencontre une erreur transitoire.
    try {
      console.log("[Nahel IA] Trying gemini-2.5-pro...");
      const response = await callGemini(MODELS.pro, message, image);
      if (response) {
        console.log("[Nahel IA] Success with gemini-2.5-pro");
        return NextResponse.json({ response, model: MODELS.pro });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      console.warn(`[Nahel IA] Pro failed (${msg}), falling back to Flash...`);
    }

    try {
      console.log("[Nahel IA] Trying gemini-2.5-flash...");
      const response = await callGemini(MODELS.flash, message, image);
      if (response) {
        console.log("[Nahel IA] Success with gemini-2.5-flash");
        return NextResponse.json({ response, model: MODELS.flash });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      console.error(`[Nahel IA] Flash also failed: ${msg}`);
      return NextResponse.json(
        {
          error: `Gemini n'a pas pu répondre : ${msg}. Réessaie dans quelques secondes.`,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Aucune réponse de Gemini. Réessaie." },
      { status: 500 },
    );
  } catch (error: unknown) {
    console.error("[Nahel IA] API error:", error);
    const msg = error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Endpoint GET : indique si Gemini est configuré (utilisé par la page pour
// afficher un guide de setup si la clé manque).
export async function GET() {
  const configured = !!process.env.GEMINI_API_KEY;
  return NextResponse.json({ configured });
}
