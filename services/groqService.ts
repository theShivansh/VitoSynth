import Groq from "groq-sdk";
import {
  SimulationResult,
  Scenario,
  LifestyleProjection,
  UserProfile,
  MacroNutrients,
  HealthReport,
  FoodLogEntry,
  GeneticProfile,
  MealPlan,
  Recipe,
  FastingData,
  FutureSelfProjection,
} from "../types";

// ─── Client Setup ──────────────────────────────────────────────────────────────
// IMPORTANT: Groq SDK throws if apiKey is empty/falsy at init time.
// We use a placeholder so the module loads safely even when key is missing.
// If VITE_GROQ_API_KEY is not set in Vercel, API calls return 401 (caught by try/catch).
// Set VITE_GROQ_API_KEY in: Vercel Dashboard → Project → Settings → Environment Variables
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY || 'set-VITE_GROQ_API_KEY-in-vercel',
  dangerouslyAllowBrowser: true, // Required for client-side usage
});

// Model constants
const VISION_MODEL = "qwen/qwen3.6-27b";    // Multimodal: images + text (vision-capable) 
const TEXT_MODEL   = "openai/gpt-oss-120b"; // All text reasoning 
const FAST_MODEL   = "openai/gpt-oss-120b"; // Rate-limit fallback (text-only) 

// ─── Helpers ───────────────────────────────────────────────────────────────────
const cleanJson = (text: string): string => {
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
};

/**
 * CRITICAL: Groq's response_format:{type:"json_object"} forces the LLM to
 * wrap top-level arrays in an object (e.g. {"scenarios":[...]} or {"data":[...]}).
 * This helper extracts the first array found in the parsed JSON,
 * regardless of what key the LLM chose to wrap it with.
 */
const extractArray = <T = any>(raw: unknown): T[] => {
  if (Array.isArray(raw)) return raw as T[];
  if (raw !== null && typeof raw === 'object') {
    for (const val of Object.values(raw as Record<string, unknown>)) {
      if (Array.isArray(val)) return val as T[];
    }
  }
  return [];
};

/** Calls Groq with automatic fallback on rate limits (429 / RESOURCE_EXHAUSTED) */
const callGroq = async (
  model: string,
  messages: Groq.Chat.ChatCompletionMessageParam[],
  retryWithFast = true
): Promise<string> => {
  try {
    const res = await groq.chat.completions.create({
      model,
      messages,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });
    return res.choices[0]?.message?.content || "{}";
  } catch (err: any) {
    const isRateLimit =
      err?.status === 429 ||
      err?.error?.code === "rate_limit_exceeded" ||
      String(err?.message).includes("rate_limit");

    if (isRateLimit && retryWithFast) {
      console.warn(`Rate limit on ${model}, falling back to ${FAST_MODEL}`);
      const fallback = await groq.chat.completions.create({
        model: FAST_MODEL,
        messages,
        temperature: 0.3,
        response_format: { type: "json_object" },
      });
      return fallback.choices[0]?.message?.content || "{}";
    }
    throw err;
  }
};

/** Groq vision call — Llama-4 Maverick handles image_url content blocks */
const callGroqVision = async (
  systemPrompt: string,
  userText: string,
  base64Image: string, // raw base64, no data: prefix
  mimeType = "image/jpeg"
): Promise<string> => {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${base64Image}`,
          },
        },
        { type: "text", text: userText },
      ],
    },
  ];

  try {
    const res = await groq.chat.completions.create({
      model: VISION_MODEL,
      messages,
      temperature: 0.2,
      response_format: { type: "json_object" },
    });
    return res.choices[0]?.message?.content || "{}";
  } catch (err: any) {
    console.error("Vision call failed:", err);
    throw new Error("Image analysis failed. Please try with text input.");
  }
};

// ─── Food Database Search ───────────────────────────────────────────────────────
export const searchFoodDatabase = async (
  query: string
): Promise<{ foodName: string; macros: MacroNutrients }> => {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "You are a nutrition database. Return ONLY valid JSON with food data.",
    },
    {
      role: "user",
      content: `Identify the food item from this query: "${query}".
Estimate standard nutritional values for a typical single serving.

Return JSON exactly:
{
  "foodName": "Standardized Name",
  "macros": {
    "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number,
    "saturatedFat": number, "transFat": number, "cholesterol": number, "sodium": number,
    "sugar": number, "addedSugar": number,
    "vitaminD": number, "calcium": number, "iron": number, "potassium": number
  }
}`,
    },
  ];

  try {
    const text = await callGroq(TEXT_MODEL, messages);
    return JSON.parse(cleanJson(text));
  } catch (e) {
    console.error("Food Lookup Error", e);
    throw new Error("Could not find food data");
  }
};

// ─── Aggregated Health Report ───────────────────────────────────────────────────
export const generateAggregatedReport = async (
  profile: UserProfile,
  logs: FoodLogEntry[]
): Promise<HealthReport> => {
  const logSummary = logs
    .map(
      (l) =>
        `${new Date(l.timestamp).toLocaleDateString()} - ${l.foodName}: ${l.macros.calories}kcal`
    )
    .join("\n");

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "You are a clinical nutritionist AI. Analyze food logs and return health insights as JSON.",
    },
    {
      role: "user",
      content: `Analyze these food logs for user profile: ${JSON.stringify(profile)}

Logs:
${logSummary}

Return JSON:
{
  "period": "daily",
  "totalCalories": number,
  "averageMacros": { "protein": number, "carbs": number, "fat": number },
  "predictions": {
    "weightTrend": "string",
    "riskIndicators": ["string"]
  },
  "recommendations": ["string"],
  "warnings": ["string"]
}`,
    },
  ];

  try {
    const text = await callGroq(TEXT_MODEL, messages);
    return JSON.parse(cleanJson(text));
  } catch (e) {
    console.error("Report Gen Error", e);
    throw new Error("Could not generate report");
  }
};

// ─── CORE: Two-Phase Metabolic Simulation ──────────────────────────────────────
export const analyzeAndSimulate = async (
  input: string,
  isImage: boolean,
  userProfile: UserProfile,
  imageData?: string
): Promise<SimulationResult> => {

  // ── Phase 1: Food Identification & Macro Extraction ──
  const analysisSystemPrompt = `You are a nutrition analysis AI. Extract food name and detailed macronutrients from the input. Return ONLY valid JSON.`;

  const analysisUserPrompt = `Analyze this input and identify the food item.

REQUIRED OUTPUT FIELDS (all numeric, use 0 if negligible):
calories, protein (g), carbs (g), fat (g), fiber (g),
saturatedFat (g), transFat (g), cholesterol (mg), sodium (mg),
sugar (g), addedSugar (g), vitaminD (mcg), calcium (mg), iron (mg), potassium (mg)

Return JSON:
{
  "foodName": "string",
  "simpleDescription": "string (max 20 words)",
  "macros": {
    "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number,
    "saturatedFat": number, "transFat": number, "cholesterol": number, "sodium": number,
    "sugar": number, "addedSugar": number,
    "vitaminD": number, "calcium": number, "iron": number, "potassium": number
  }
}

Input: "${input}"`;

  let basicAnalysis: any;

  try {
    let phase1Text: string;
    if (isImage && imageData) {
      // Multimodal: Llama-4 Maverick with image
      phase1Text = await callGroqVision(
        analysisSystemPrompt,
        analysisUserPrompt,
        imageData
      );
    } else {
      const messages: Groq.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: analysisSystemPrompt },
        { role: "user", content: analysisUserPrompt },
      ];
      phase1Text = await callGroq(TEXT_MODEL, messages);
    }
    basicAnalysis = JSON.parse(cleanJson(phase1Text));
  } catch (e) {
    console.error("Phase 1 failed:", e);
    throw new Error("Food identification failed. Please try again.");
  }

  // ── Phase 2: Deep Metabolic Simulation ──
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });

  const simulationMessages: Groq.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are a biological digital twin simulation engine specializing in metabolic physiology. 
You generate precise, scientifically grounded physiological predictions as structured JSON.
Return ONLY valid JSON matching the exact schema provided. All numbers must be realistic physiological values.`,
    },
    {
      role: "user",
      content: `Simulate the complete metabolic response for:

Food: ${basicAnalysis.foodName}
Macros: ${JSON.stringify(basicAnalysis.macros)}
Description: ${basicAnalysis.simpleDescription || ""}

User Biology:
- Age: ${userProfile.age} | Weight: ${userProfile.weight}kg | Height: ${userProfile.height}cm | Gender: ${userProfile.gender}
- Activity: ${userProfile.activityLevel}
- Chronotype: ${userProfile.chronotype || "intermediate"} | Sleep: ${userProfile.sleepWindow || "23:00-07:00"}
- Conditions: ${userProfile.conditions.join(", ") || "None"}
${userProfile.genetics ? `- Genetics: ${JSON.stringify(userProfile.genetics)}` : ""}
${userProfile.microbiomeProfile ? `- Microbiome (${userProfile.microbiomeProfile.provider}): Diversity ${userProfile.microbiomeProfile.diversityPercentile}th percentile, Enterotype: ${userProfile.microbiomeProfile.enterotype}` : "- Microbiome: Standard Western baseline"}

Current Time: ${currentTime}

Simulate:
1. Glucose/Insulin/Energy kinetics over 180 minutes (7 time points)
2. 5-organ stress levels (0-10 scale)
3. Microbiome impact with strain-level shifts, SCFA production, and inflammation
4. 8-hour cognitive performance timeline
5. Circadian rhythm impact based on chronotype and meal timing

Return this EXACT JSON schema (no extra fields, no markdown):
{
  "timeline": [
    {"minute": 0, "glucose": number, "insulin": number, "energy": number},
    {"minute": 30, "glucose": number, "insulin": number, "energy": number},
    {"minute": 60, "glucose": number, "insulin": number, "energy": number},
    {"minute": 90, "glucose": number, "insulin": number, "energy": number},
    {"minute": 120, "glucose": number, "insulin": number, "energy": number},
    {"minute": 150, "glucose": number, "insulin": number, "energy": number},
    {"minute": 180, "glucose": number, "insulin": number, "energy": number}
  ],
  "organStress": {
    "brain": number,
    "heart": number,
    "liver": number,
    "gut": number,
    "pancreas": number
  },
  "microbiome": {
    "diversityScore": number,
    "prebioticScore": number,
    "probioticScore": number,
    "bacterialShifts": [
      {"name": "string", "change": "increase", "category": "beneficial", "mechanism": "string"}
    ],
    "scfaProduction": {"butyrate": "increase", "acetate": "stable"},
    "inflammation": {"level": "low", "markers": ["string"]},
    "overallTrend": "stable"
  },
  "cognitive": {
    "timeline": [
      {"hour": 0, "clarityScore": number, "reactionTime": number, "mood": "energized"},
      {"hour": 1, "clarityScore": number, "reactionTime": number, "mood": "stable"},
      {"hour": 2, "clarityScore": number, "reactionTime": number, "mood": "stable"},
      {"hour": 3, "clarityScore": number, "reactionTime": number, "mood": "stable"},
      {"hour": 4, "clarityScore": number, "reactionTime": number, "mood": "stable"},
      {"hour": 5, "clarityScore": number, "reactionTime": number, "mood": "stable"},
      {"hour": 6, "clarityScore": number, "reactionTime": number, "mood": "stable"},
      {"hour": 7, "clarityScore": number, "reactionTime": number, "mood": "stable"},
      {"hour": 8, "clarityScore": number, "reactionTime": number, "mood": "stable"}
    ],
    "brainFogRisk": {"probability": number, "onset": "string", "trigger": "string"},
    "optimalWindows": {"deepWork": "string", "creative": "string", "meetings": "string"},
    "summary": "string"
  },
  "circadian": {
    "timingScore": number,
    "melatoninSuppression": number,
    "sleepQualityPrediction": "string",
    "energyImpact": "string",
    "optimalWindow": "string",
    "recommendation": "string"
  },
  "analysis": "string",
  "interventions": ["string", "string", "string"]
}`,
    },
  ];

  try {
    const simText = await callGroq(TEXT_MODEL, simulationMessages);
    const simData = JSON.parse(cleanJson(simText));

    return {
      foodName: basicAnalysis.foodName,
      macros: basicAnalysis.macros,
      timeline: simData.timeline,
      organStress: simData.organStress,
      microbiome: simData.microbiome,
      cognitive: simData.cognitive,
      circadian: simData.circadian,
      analysis: simData.analysis,
      interventions: simData.interventions,
    };
  } catch (error) {
    console.error("Phase 2 Simulation Error:", error);
    throw new Error("Metabolic simulation failed. Please try again.");
  }
};

// ─── AI Health Coach (Text) ─────────────────────────────────────────────────────
export const getCoachResponse = async (
  _history: string[],
  userQuery: string,
  currentContext: any
): Promise<string> => {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are VitoSynth, a concise AI metabolic health coach.
Current simulation context: ${JSON.stringify(currentContext)}
Respond in 1-2 sentences maximum. Be encouraging and scientifically accurate.`,
    },
    { role: "user", content: userQuery },
  ];

  try {
    const res = await groq.chat.completions.create({
      model: FAST_MODEL,
      messages,
      temperature: 0.5,
      max_tokens: 200,
    });
    return res.choices[0]?.message?.content || "I'm here to help! Ask me anything about your health.";
  } catch (e: any) {
    console.error('[Coach]', e);
    const msg = String(e?.message ?? e?.status ?? '');
    // 401 = API key not set in Vercel environment variables
    if (e?.status === 401 || msg.includes('401') || msg.includes('API key') || msg.includes('Invalid API')) {
      return "⚠️ The Groq API key is not configured. Go to Vercel → Project Settings → Environment Variables and add VITE_GROQ_API_KEY, then redeploy.";
    }
    return "I'm having trouble connecting right now. Please try again in a moment.";
  }
};

// ─── What-If Scenario Comparison ───────────────────────────────────────────────
export const generateScenarios = async (foodName: string): Promise<Scenario[]> => {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: "You are a metabolic scenario analyzer. Return ONLY valid JSON.",
    },
    {
      role: "user",
      content: `Analyze the meal: "${foodName}".
Generate 3 scenarios:
A: The Current Meal
B: A Healthy Alternative (completely different but equally satisfying)
C: A Modified Version (same meal, healthier tweaks e.g. bunless, sauce on side)

For each predict: metabolicScore (0-100), sleepQuality (0-100), energyLevel (0-100), productivity (-50 to +50), crashTime (string or null)

Return JSON array:
[
  {"id": "A", "type": "Current", "name": "string", "description": "string", "metrics": {"metabolicScore": number, "sleepQuality": number, "energyLevel": number, "productivity": number, "crashTime": "string or null"}},
  {"id": "B", "type": "Alternative", "name": "string", "description": "string", "metrics": {"metabolicScore": number, "sleepQuality": number, "energyLevel": number, "productivity": number, "crashTime": null}},
  {"id": "C", "type": "Modified", "name": "string", "description": "string", "metrics": {"metabolicScore": number, "sleepQuality": number, "energyLevel": number, "productivity": number, "crashTime": "string or null"}}
]`,
    },
  ];

  const text = await callGroq(TEXT_MODEL, messages);
  // extractArray unwraps {scenarios:[...]} that response_format:json_object forces
  return extractArray(JSON.parse(cleanJson(text)));
};

// ─── Physiological Stress Test ──────────────────────────────────────────────────
export const generateStressScenarios = async (
  foodName: string,
  userProfile: UserProfile
): Promise<Scenario[]> => {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "You are a Metabolic Stress Simulator. Simulate how different physiological states affect food metabolism. Return ONLY valid JSON.",
    },
    {
      role: "user",
      content: `Food: "${foodName}". User: ${JSON.stringify(userProfile)}.

Simulate this SAME meal under 3 physiological contexts:
A: Baseline (Normal rested state)
B: Sleep Deprived (4h sleep — high cortisol, elevated insulin resistance)
C: Post-Workout (glycogen depleted, high insulin sensitivity)

Return JSON array of 3 objects:
[
  {"id": "A", "type": "Baseline", "name": "Normal State", "description": "string", "metrics": {"metabolicScore": number, "sleepQuality": number, "energyLevel": number, "productivity": number, "crashTime": null}},
  {"id": "B", "type": "Sleep Deprived", "name": "After 4h Sleep", "description": "string (explain cortisol/insulin resistance)", "metrics": {"metabolicScore": number, "sleepQuality": number, "energyLevel": number, "productivity": number, "crashTime": "string"}},
  {"id": "C", "type": "Post-Workout", "name": "Post Exercise", "description": "string (explain glycogen/insulin sensitivity)", "metrics": {"metabolicScore": number, "sleepQuality": number, "energyLevel": number, "productivity": number, "crashTime": null}}
]`,
    },
  ];

  const text = await callGroq(TEXT_MODEL, messages);
  return extractArray<Scenario>(JSON.parse(cleanJson(text)));
};

// ─── Lifestyle Habit Projector ──────────────────────────────────────────────────
export const generateLifestyleProjection = async (
  habit: string
): Promise<LifestyleProjection[]> => {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: "You are a metabolic health projection AI. Return ONLY valid JSON.",
    },
    {
      role: "user",
      content: `Habit: "${habit}". User: healthy adult, 70kg, HbA1c 5.4%.

Project biological impact of adopting this habit over 1, 3, and 6 months.

Return JSON array:
[
  {"period": "1 Month", "weightChange": number, "hba1cChange": number, "description": "string"},
  {"period": "3 Months", "weightChange": number, "hba1cChange": number, "description": "string"},
  {"period": "6 Months", "weightChange": number, "hba1cChange": number, "description": "string"}
]`,
    },
  ];

  const text = await callGroq(TEXT_MODEL, messages);
  return extractArray<LifestyleProjection>(JSON.parse(cleanJson(text)));
};

// ─── Future Self Projection (10-Year) ──────────────────────────────────────────
export const generateFutureSelfProjection = async (
  mealName: string
): Promise<FutureSelfProjection[]> => {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "You are a long-term metabolic biomarker projection system. Return ONLY valid JSON. biomarkerDrift MUST be a JSON array of strings.",
    },
    {
      role: "user",
      content: `Meal: "${mealName}".
Project the cumulative biological impact of eating this meal 3 times/week for 1, 5, and 10 years.
Assume sedentary baseline lifestyle.

Return a JSON ARRAY (not an object) with exactly 3 elements:
[
  {"period": "1 Year", "weightChange": number, "biomarkerDrift": ["string", "string"], "description": "string"},
  {"period": "5 Years", "weightChange": number, "biomarkerDrift": ["string", "string"], "description": "string"},
  {"period": "10 Years", "weightChange": number, "biomarkerDrift": ["string", "string"], "description": "string"}
]
biomarkerDrift must be an array of short strings like ["HbA1c +0.5%", "Liver fat increased"].`,
    },
  ];

  const text = await callGroq(TEXT_MODEL, messages);
  const raw = JSON.parse(cleanJson(text));
  // extractArray handles both direct arrays and object-wrapped arrays
  const arr = extractArray<any>(raw);

  return arr.map((item: any) => ({
    period: String(item?.period ?? ''),
    weightChange: Number(item?.weightChange ?? 0),
    // Normalize biomarkerDrift — LLM sometimes returns a string instead of array
    biomarkerDrift: Array.isArray(item?.biomarkerDrift)
      ? item.biomarkerDrift.map(String)
      : typeof item?.biomarkerDrift === 'string'
        ? item.biomarkerDrift.split(/[,;|]/).map((s: string) => s.trim()).filter(Boolean)
        : [],
    description: String(item?.description ?? ''),
  }));
};

// ─── Genetic Analysis ───────────────────────────────────────────────────────────
export const analyzeGeneticData = async (
  rawInput: string
): Promise<GeneticProfile> => {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "You are a Pharmacogenomics Nutritionist AI. Analyze genetic data and return personalized nutrition recommendations as JSON.",
    },
    {
      role: "user",
      content: `Analyze this genetic data: "${rawInput}"

Identify nutritional genes: FTO (obesity), APOE (saturated fat), CYP1A2 (caffeine), TCF7L2 (carbs/diabetes), MTHFR (folate), LCT (lactose).

Return JSON:
{
  "variants": [{"gene": "string", "variant": "string", "riskLevel": "high", "implication": "string"}],
  "obesityRisk": "high",
  "saturatedFatSensitivity": "high",
  "caffeineSensitivity": "fast",
  "macroRecommendations": {"protein": "string", "carbs": "string", "fat": "string"},
  "summary": "string"
}`,
    },
  ];

  try {
    const text = await callGroq(TEXT_MODEL, messages);
    return JSON.parse(cleanJson(text));
  } catch (e) {
    console.error("Genetic Analysis Error", e);
    throw new Error("Failed to analyze genetic data");
  }
};

// ─── 3-Day Meal Planner ─────────────────────────────────────────────────────────
export const generateMealPlan = async (
  userProfile: UserProfile
): Promise<MealPlan> => {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "You are a Precision Nutrition AI. Generate evidence-based personalized meal plans. Return ONLY valid JSON.",
    },
    {
      role: "user",
      content: `Generate a 3-Day Meal Plan for this user:
Age/Weight/Gender: ${userProfile.age} / ${userProfile.weight}kg / ${userProfile.gender}
Conditions: ${userProfile.conditions.join(", ") || "None"}
Goals: ${userProfile.goals.join(", ")}
Restrictions: ${userProfile.dietaryRestrictions.join(", ") || "None"}
${userProfile.genetics ? `Genetics: ${JSON.stringify(userProfile.genetics)}` : ""}
${userProfile.microbiomeProfile ? `Microbiome: ${JSON.stringify(userProfile.microbiomeProfile)}` : ""}

Create Breakfast, Lunch, Dinner, Snack for each day.
Include a "reasoning" field explaining why each meal fits this user's biology.

Return JSON:
{
  "summary": "string",
  "days": [
    {
      "day": 1,
      "meals": [
        {
          "type": "Breakfast",
          "name": "string",
          "description": "string",
          "reasoning": "string",
          "macros": {"calories": number, "protein": number, "carbs": number, "fat": number},
          "ingredients": ["string"],
          "instructions": ["string"],
          "cookingTime": "string"
        }
      ]
    }
  ]
}`,
    },
  ];

  try {
    const text = await callGroq(TEXT_MODEL, messages);
    return JSON.parse(cleanJson(text));
  } catch (e) {
    console.error("Meal Plan Error", e);
    throw new Error("Failed to generate meal plan");
  }
};

// ─── Bio-Active Smart Chef ──────────────────────────────────────────────────────
export const generateSmartRecipe = async (
  ingredients: string,
  userProfile: UserProfile,
  imageData?: string
): Promise<Recipe> => {
  const systemPrompt = `You are a Molecular Gastronomist and Metabolic Expert.
Create metabolically optimized recipes using culinary chemistry.
Return ONLY valid JSON.`;

  const userPrompt = `Available Ingredients: "${ingredients}"
User Profile: ${JSON.stringify(userProfile)}

Create a recipe that minimizes glucose spikes and inflammation.
Use culinary chemistry:
- Add acid (vinegar/lemon) to lower GI via starch gelatinization inhibition
- Cook then cool potatoes/rice to increase resistant starch
- Pair fat+fiber to slow gastric emptying
- Low saturated fat for APOE4 carriers

Return JSON:
{
  "name": "string",
  "description": "string",
  "ingredients": ["string"],
  "instructions": ["string"],
  "cookingTime": "string",
  "bioHacks": ["string"],
  "predictedMetabolicScore": number,
  "macros": {"calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number}
}`;

  try {
    let text: string;
    if (imageData) {
      text = await callGroqVision(systemPrompt, userPrompt, imageData);
    } else {
      const messages: Groq.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];
      text = await callGroq(TEXT_MODEL, messages);
    }
    return JSON.parse(cleanJson(text));
  } catch (e) {
    console.error("Smart Chef Error", e);
    throw new Error("Failed to generate recipe");
  }
};

// ─── Fasting State Calculator ───────────────────────────────────────────────────
export const calculateFastingStatus = async (
  lastMealTimestamp: number,
  lastMealMacros: MacroNutrients,
  userProfile: UserProfile
): Promise<FastingData> => {
  const hoursElapsed =
    (Date.now() - lastMealTimestamp) / (1000 * 60 * 60);

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "You are a physiological fasting state calculator. Return ONLY valid JSON.",
    },
    {
      role: "user",
      content: `User Profile: ${JSON.stringify(userProfile)}
Last Meal: ${hoursElapsed.toFixed(1)} hours ago.
Meal Macros: ${JSON.stringify(lastMealMacros)}.

Determine the current physiological fasting state.

Fasting stages:
- 0-4h:   Anabolic (Fed)         — Insulin dominant
- 4-12h:  Catabolic (Early Fast) — Glycogen depletion begins
- 12-18h: Fat Burning            — Gluconeogenesis, early ketones
- 18-24h: Ketosis                — Beta-oxidation dominant
- 24h+:   Deep Autophagy         — mTOR suppression, mitophagy

Adjust for meal composition (high carb meal delays ketosis 2-4h).
Adjust for activity level (active users burn glycogen faster).

Return JSON:
{
  "hoursElapsed": number,
  "currentZone": "Anabolic (Fed)",
  "autophagyLevel": number,
  "glycogenDepletion": number,
  "ketoneLevelPredicted": number,
  "insulinLevelPredicted": number,
  "timeToNextZone": "string",
  "insights": "string"
}`,
    },
  ];

  try {
    const text = await callGroq(TEXT_MODEL, messages);
    return JSON.parse(cleanJson(text));
  } catch (e) {
    console.error("Fasting Calc Error", e);
    // Graceful fallback using raw time calculation
    return {
      hoursElapsed,
      currentZone:
        hoursElapsed < 4 ? "Anabolic (Fed)" : "Catabolic (Early Fast)",
      autophagyLevel: 0,
      glycogenDepletion: 10,
      ketoneLevelPredicted: 0.1,
      insulinLevelPredicted: 5.5,
      timeToNextZone: "Calculating...",
      insights: "Could not calculate specific biomarkers.",
    };
  }
};

// ─── Live Session Stubs (Groq has no native audio streaming API) ────────────────
// These stubs maintain API compatibility with App.tsx without errors.
export const startLiveSession = async (
  _userProfile: UserProfile,
  _simulationResult: SimulationResult | null,
  _onVolumeChange: (vol: number) => void,
  onStatusChange: (status: string) => void
): Promise<void> => {
  onStatusChange("Voice coaching not available with current AI provider. Use the text chat instead.");
};

export const stopLiveSession = (): void => {
  // No-op
};
