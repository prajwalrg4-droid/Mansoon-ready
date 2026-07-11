const MODEL = "gemini-2.5-flash";

function text(value, max = 80) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { city, familyMembers, elderly, children, pets, budget, language } = req.body || {};
  const safeCity = text(city);
  const safeLanguage = text(language);
  const people = Number(familyMembers);
  const safeBudget = Number(budget);

  if (!safeCity || !safeLanguage || !Number.isInteger(people) || people < 1 || people > 50 || !Number.isFinite(safeBudget) || safeBudget < 0) {
    return res.status(400).json({ error: "Please provide a city, language, a valid family size, and a valid budget." });
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "The server is missing GEMINI_API_KEY. Add it in your Vercel project settings." });
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

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.35 }
      })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error?.message || "Gemini could not generate a plan.");
    const generated = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("");
    const plan = JSON.parse(generated);
    return res.status(200).json(plan);
  } catch (error) {
    console.error("Generation error:", error.message);
    return res.status(502).json({ error: "We couldn't create your plan just now. Please try again." });
  }
};

