import { GoogleGenAI, Type } from "@google/genai";
import { AppealCategory, UrgencyLevel, SentimentType, TranslatedFields, MultiLanguageTranslation } from "../src/types.js";

// Initialize the Google Gen AI SDK
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not set. Gemini services will use mock analyzer.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

export interface GeminiAnalysisResult {
  category: string;
  urgency: UrgencyLevel;
  sentiment: SentimentType;
  summary: string;
  suggested_department: string;
  isFlaggedInappropriate: boolean;
}

export async function analyzeAppealText(text: string, existingCategories: string[] = []): Promise<GeminiAnalysisResult> {
  const defaultFallback: GeminiAnalysisResult = {
    category: "Boshqa muammolar",
    urgency: "medium",
    sentiment: "neutral",
    summary: text.length > 100 ? text.substring(0, 100) + "..." : text,
    suggested_department: "dept_utilities",
    isFlaggedInappropriate: false
  };

  const client = getAiClient();
  if (!client) {
    return defaultFallback;
  }

  const existingCatsStr = existingCategories.length > 0 
    ? existingCategories.join(", ") 
    : "Suv muammosi, Yo'l muammosi, Elektr ta'minoti, Gaz ta'minoti, Sog'liqni saqlash, Maktab va ta'lim, Uy-joy, Ekologiya";

  const systemInstruction = `You are a professional civic-tech civil servant assistant for the regional governor's office (Hokimiyat) of Shomanay District, Karakalpakstan, Uzbekistan.
Your job is to analyze incoming citizen appeals ("murojaat") written in either Uzbek, Karakalpak, Russian, or English.

You must perform 6 actions:
1. Detect or create a standardized category (main topic) IN UZBEK for the admin panel:
   - You are provided a list of already existing categories: [${existingCatsStr}].
   - If the new appeal's core issue belongs to or matches semantically with one of these existing categories, you MUST return that exact category name. Be smart and do semantic matching (e.g. "suv oqmayapti", "vodoprovod quvuri", "ichimlik suvi" should all map to "Suv muammosi" if it exists in the list).
   - If the core issue is totally new and does not fit any existing category, you must create a new concise category name IN UZBEK (e.g., "Yo'l muammosi", "Suv muammosi", "Elektr ta'minoti", "Gaz ta'minoti", "Sog'liqni saqlash", "Ijtimoiy yordam", "Chiqindi muammosi", "Uy-joy"). Keep it 2-3 words max, capitalized.

2. Determine the urgency/priority level ('low', 'medium', 'high', 'critical'):
   - Critical: Severe threats to life, extreme utility outage affecting entire towns for days (e.g., winter heating failure), active corruption, or danger to child safety.
   - High: Pressing infrastructure or utility breakdowns (e.g., no water for days, major road blocks), high-priority welfare denials.
   - Medium: General complaints (e.g., school repair requests, clinic queue optimization, typical road repairs).
   - Low: Long-term improvement proposals (e.g., parks, tree planting, standard suggestions).

3. Detect the customer sentiment:
   - 'neutral': Objective description of the facts.
   - 'frustrated': Customer expresses sadness, annoyance, or bureaucratic fatigue.
   - 'angry': Customer uses intense language, capitalized text, or expresses severe anger.
   - 'desperate': Customer expresses helplessness, extreme distress, or pleads for survival/basic rights.

4. Generate a concise 1-2 sentence summary of the issue. The summary MUST be in UZBEK so that the Hokim can understand it instantly and clearly, regardless of what language the citizen used to write. Translate and summarize the core complaint, who is affected, and what is requested.

5. Match the issue to the most relevant department ID:
   - 'dept_infrastructure': Landscaping, paving, roads.
   - 'dept_utilities': Gas, electricity, water, power, heating, waste.
   - 'dept_social': Welfare, aid, low-income, disability.
   - 'dept_healthcare': Clinics, hospitals, medicine.
   - 'dept_education': Schools, kindergartens, textbooks.
   - 'dept_environment': Ecology, green shield, forestry.

6. Safety & Inappropriate content check (18+ content, vulgarity, swearing, swearing words, insults):
   - Analyze the text carefully. If the text contains any adult/sensual/sexual/18+ content, swearing words, vulgarity, swearing expressions, insults, hate speech, or abuse ("18+ ga oid, uyatsiz, so'kinish, haqorat, behayo so'zlar yoki gaplar"), set \`isFlaggedInappropriate\` to \`true\`. Otherwise set it to \`false\`.

Return strict JSON matching the requested schema. Do not include markdown formatting or wrapping outside the JSON.`;

  try {
    // Call Gemini 3.5 Flash for rapid, accurate JSON extraction
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: text,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1, // low temperature for precise classification
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: "Must be a standardized category name in Uzbek. Re-use one of the existing categories if it matches semantically, otherwise output a new concise capitalized 1-2 words Uzbek category name representing the core issue.",
            },
            urgency: {
              type: Type.STRING,
              description: "Must be exactly one of: low, medium, high, critical",
            },
            sentiment: {
              type: Type.STRING,
              description: "Must be exactly one of: neutral, frustrated, angry, desperate",
            },
            summary: {
              type: Type.STRING,
              description: "Short 1-2 sentence summary of the appeal in Uzbek language.",
            },
            suggested_department: {
              type: Type.STRING,
              description: "Must be exactly one of: dept_infrastructure, dept_utilities, dept_social, dept_healthcare, dept_education, dept_environment",
            },
            isFlaggedInappropriate: {
              type: Type.BOOLEAN,
              description: "True if the text contains 18+ vulgarity, swearing, swearing words, or insults (uyatsiz, so'kinish, haqorat, behayo gaplar). Otherwise false."
            }
          },
          required: ["category", "urgency", "sentiment", "summary", "suggested_department", "isFlaggedInappropriate"],
        },
      },
    });

    const responseText = response.text?.trim();
    if (!responseText) {
      console.error("Gemini returned an empty response.");
      return defaultFallback;
    }

    // Strip markdown fence blocks if present
    let jsonStr = responseText;
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.substring(7);
    }
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.substring(3);
    }
    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.substring(0, jsonStr.length - 3);
    }
    jsonStr = jsonStr.trim();

    const parsed = JSON.parse(jsonStr);

    const validUrgencies: UrgencyLevel[] = ["low", "medium", "high", "critical"];
    const validSentiments: SentimentType[] = ["neutral", "frustrated", "angry", "desperate"];
    const validDepts = ["dept_infrastructure", "dept_utilities", "dept_social", "dept_healthcare", "dept_education", "dept_environment"];

    const category = parsed.category ? parsed.category.trim() : "Boshqa muammolar";

    const urgency: UrgencyLevel = validUrgencies.includes(parsed.urgency?.toLowerCase())
      ? parsed.urgency.toLowerCase()
      : "medium";

    const sentiment: SentimentType = validSentiments.includes(parsed.sentiment?.toLowerCase())
      ? parsed.sentiment.toLowerCase()
      : "neutral";

    const suggested_department = validDepts.includes(parsed.suggested_department)
      ? parsed.suggested_department
      : "dept_utilities";

    return {
      category,
      urgency,
      sentiment,
      summary: parsed.summary || defaultFallback.summary,
      suggested_department,
      isFlaggedInappropriate: !!parsed.isFlaggedInappropriate
    };
  } catch (error) {
    console.error("Error analyzing appeal text with Gemini:", error);
    // In case of any API error, return the graceful fallback
    return defaultFallback;
  }
}

export async function translateAppealContent(
  description: string,
  aiSummary: string,
  category: string,
  publicResponse?: string
): Promise<MultiLanguageTranslation> {
  const defaultFallback: MultiLanguageTranslation = {
    uz: { description, aiSummary, category, publicResponse },
    kaa: { description, aiSummary, category, publicResponse },
    ru: { description, aiSummary, category, publicResponse },
    en: { description, aiSummary, category, publicResponse }
  };

  const client = getAiClient();
  if (!client) {
    return defaultFallback;
  }

  const systemInstruction = `You are a professional multilingual translator specialized in public sector services, specifically for the local government (Hokimiyat) of Shomanay District in Karakalpakstan, Uzbekistan.
Your task is to translate and grammatically correct the provided appeal content into four languages:
1. Uzbek (uz)
2. Karakalpak (kaa)
3. Russian (ru)
4. English (en)

The content consists of:
- description: The citizen's statement (which might have grammatical errors or colloquial phrasing in its original language). Correct any spelling or grammatical errors, make it flow naturally, but preserve the exact meaning, tone, and details (names, phone numbers, specific locations).
- aiSummary: A concise 1-2 sentence summary of the appeal.
- category: The topic/category of the appeal.
- publicResponse: (Optional) The administrator's response to the citizen. If provided, translate and correct it elegantly. If not provided or empty, return an empty string for publicResponse.

You must return a strict JSON object that contains the translated fields for all 4 languages. Ensure the translations are highly professional, natural, and free of grammatical errors.

JSON Schema:
{
  "uz": {
    "description": "...",
    "aiSummary": "...",
    "category": "...",
    "publicResponse": "..."
  },
  "kaa": {
    "description": "...",
    "aiSummary": "...",
    "category": "...",
    "publicResponse": "..."
  },
  "ru": {
    "description": "...",
    "aiSummary": "...",
    "category": "...",
    "publicResponse": "..."
  },
  "en": {
    "description": "...",
    "aiSummary": "...",
    "category": "...",
    "publicResponse": "..."
  }
}

Do not include any markdown formatting or extra text outside of the JSON block.`;

  const inputPayload = {
    description,
    aiSummary,
    category,
    publicResponse: publicResponse || ""
  };

  try {
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: JSON.stringify(inputPayload),
      config: {
        systemInstruction,
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text?.trim();
    if (!responseText) {
      return defaultFallback;
    }

    let jsonStr = responseText;
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.substring(7);
    }
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.substring(3);
    }
    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.substring(0, jsonStr.length - 3);
    }
    jsonStr = jsonStr.trim();

    const parsed = JSON.parse(jsonStr) as MultiLanguageTranslation;
    return parsed;
  } catch (error) {
    console.error("Error in translateAppealContent:", error);
    return defaultFallback;
  }
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export async function answerChatQuestion(userMessage: string, history: ChatMessage[] = []): Promise<string> {
  const client = getAiClient();
  if (!client) {
    return "Tizimda sun'iy intellekt xizmati hozircha faollashtirilmagan yoki API kalit topilmadi.";
  }

  const systemInstruction = `You are the official AI Assistant for the Smart Murojaat portal of Shomanay District Hokimiyat (regional government) in Karakalpakstan, Uzbekistan.
Your absolute duty is to assist citizens and municipal administrators (Hokimiyat workers) with questions strictly regarding:
1. How to submit citizen appeals ('murojaat'), how the dynamic AI classification works, and how to track them.
2. Appeal states/statuses in the system: 'New' (Yangi), 'Under Review' (Ko'rib chiqilmoqda), 'In Progress' (Jarayonda), 'Postponed' (Keyinga qoldirilgan / Keyinga qoldirish), 'Problem Solved' (Muammo hal qilindi), 'Rejected' (Rad etildi), and 'Unresolvable' (Muammo hal qilinib bo'linmaydi).
3. The responsibilities of municipal departments: Infrastructure (dept_infrastructure), Utilities (dept_utilities), Social Services (dept_social), Healthcare (dept_healthcare), Education (dept_education), and Environment (dept_environment).
4. Local neighborhood (Mahalla) issues, local infrastructure complaints (potholes, streetlights, gas pressure, electrical outages, drinking water shortage, public trash) and how citizens can report them.
5. Common civil service, governor duties, or portal operations in Shomanay district.

CRITICAL INSTRUCTION:
If the user's message is NOT related to the Smart Murojaat portal, municipal appeals, local infrastructure/utilities, public services, or governor/Hokimiyat duties in Shomanay, you MUST politely but firmly refuse to answer. For example, if they ask for programming code, math help, cooking recipes, general jokes, pop culture, global news, write writing poetry, general historical trivia of other countries, or poems, write: "Kechirasiz, men faqat Smart Murojaat portali, kommunal va infratuzilma muammolari yoki tuman hokimligi faoliyatiga doir savollarga javob bera olaman." (or the equivalent in the language of the prompt: Russian, Karakalpak, English). Keep it short and polite. Do not answer their question under any circumstances if it is outside of these boundaries.`;

  try {
    const contents: any[] = [];
    for (const msg of history) {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }]
      });
    }
    contents.push({
      role: "user",
      parts: [{ text: userMessage }]
    });

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3,
      }
    });

    return response.text || "Kechirasiz, javob olishda xatolik yuz berdi.";
  } catch (error) {
    console.error("Error in answerChatQuestion:", error);
    return "Tizimda xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko'ring.";
  }
}

