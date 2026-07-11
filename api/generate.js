import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-3.5-flash";

function text(value, max = 80) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export default async function handler(request) {
  try {
    if (request.method !== "POST") {
      return Response.json(
        { error: "Method not allowed" },
        { status: 405, headers: { Allow: "POST" } }
      );
    }

    const { city, familyMembers, elderly, children, pets, budget, language } = await request.json();
    const safeCity = text(city);
    const safeLanguage = text(language);
    const people = Number(familyMembers);
    const safeBudget = Number(budget);

    if (!safeCity || !safeLanguage || !Number.isInteger(people) || people < 1 || people > 50 || !Number.isFinite(safeBudget) || safeBudget < 0) {
      return Response.json(
        { error: "Please provide a city, language, a valid family size, and a valid budget." },
        { status: 400 }
      );
    }
    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        { error: "The server is missing GEMINI_API_KEY. Add it in your Vercel project settings." },
        { status: 500 }
      );
    }

    const profile = {
      city: safeCity,
      family_members: people,
      elderly: elderly === true || elderly === "Yes",
      children: children === true || children === "Yes",
      pets: pets === true || pets === "Yes",
      budget: safeBudget,
      language: safeLanguage
    };

    const prompt = `You are a practical monsoon-disaster preparedness assistant. Create a helpful, calm, location-aware plan for this household profile: ${JSON.stringify(profile)}. Respond ONLY with valid JSON in the requested language (${safeLanguage}), using this exact shape:
{
  "plan": ["3 to 5 prioritized actions"],
  "emergencyChecklist": ["short actionable items"],
  "safetyTips": ["short actionable items"],
  "travelAdvice": ["short actionable items"],
  "groceryMedicine": ["short actionable items"],
  "powerOutage": ["short actionable items"],
  "floodPreparedness": ["short actionable items"]
}
Do not invent official emergency phone numbers. Mention that local alerts and official guidance override this plan. Keep each list to 4-7 concrete, budget-conscious items. Avoid medical or legal claims.`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.35
      }
    });
    const plan = JSON.parse(response.text);
    return Response.json(plan, { status: 200 });
  } catch (error) {
    console.error("Generation error:", error);
    return Response.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
