import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = "gemini-3.5-flash";

function text(value, max = 80) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export default async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.json({ error: "Method not allowed" }, { status: 405 });
  }

  const { city, familyMembers, elderly, children, pets, budget, language } = req.body || {};
  const safeCity = text(city);
  const safeLanguage = text(language);
  const people = Number(familyMembers);
  const safeBudget = Number(budget);

  if (!safeCity || !safeLanguage || !Number.isInteger(people) || people < 1 || people > 50 || !Number.isFinite(safeBudget) || safeBudget < 0) {
    return res.json({ error: "Please provide a city, language, a valid family size, and a valid budget." }, { status: 400 });
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.json({ error: "The server is missing GEMINI_API_KEY. Add it in your Vercel project settings." }, { status: 500 });
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

  const prompt = `You are a practical monsoon-disaster preparedness assistant. Create a helpful, calm, location-aware plan for this household profile: ${JSON.stringify(profile)}. Respond ONLY with valid JSON in this exact format:
{
  "plan": ["3 to 5 prioritized actions"],
  "emergencyChecklist": ["short actionable items"],
  "safetyTips": ["short actionable items"],
  "travelAdvice": ["short actionable items"],
  "groceryMedicine": ["short actionable items"],
  "powerOutage": ["short actionable items"],
  "floodPreparedness": ["short actionable items"]
}
Do not invent official emergency phone numbers. Mention that local alerts and official guidance override this plan. Keep each list to 4-7 concrete, budget-conscious items. Avoid medical or legal claims. Be practical and empathetic.`;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL });
    
    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.35
      }
    });

    const responseText = response.response.text();
    const plan = JSON.parse(responseText);
    return res.json(plan);
  } catch (error) {
    console.error("Generation error:", error.message);
    return res.json({ error: "We couldn't create your plan just now. Please try again." }, { status: 502 });
  }
};
