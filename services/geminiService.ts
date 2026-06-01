

import { GoogleGenAI, Type, LiveServerMessage, Modality } from "@google/genai";
import { SimulationResult, Scenario, LifestyleProjection, UserProfile, MacroNutrients, HealthReport, FoodLogEntry, GeneticProfile, MealPlan, Recipe, FastingData, FutureSelfProjection } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to strip markdown code blocks if the model includes them
const cleanJson = (text: string) => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

// Helper function to handle Rate Limits (429) by falling back to a lighter model
const generateWithFallback = async (
    primaryModel: string,
    contents: any,
    config: any = { responseMimeType: "application/json" }
) => {
    const fallbackModel = "gemini-2.5-flash";
    try {
        const response = await ai.models.generateContent({
            model: primaryModel,
            contents,
            config
        });
        return response;
    } catch (error: any) {
        // Check for 429 or "RESOURCE_EXHAUSTED" or generic quota errors
        if (
            error.status === 429 || 
            error.code === 429 || 
            (error.message && error.message.includes("RESOURCE_EXHAUSTED"))
        ) {
            console.warn(`Quota exceeded for ${primaryModel}. Falling back to ${fallbackModel}.`);
            // Retry with fallback model
            const response = await ai.models.generateContent({
                model: fallbackModel,
                contents,
                config
            });
            return response;
        }
        // Re-throw if it's not a rate limit error
        throw error;
    }
};

export const searchFoodDatabase = async (query: string): Promise<{ foodName: string, macros: MacroNutrients }> => {
  const model = "gemini-2.5-flash"; // Fast model for lookups
  const prompt = `
    Identify the food item from this query: "${query}".
    Estimate standard nutritional values for a typical serving.
    
    Return JSON:
    {
      "foodName": "Standardized Name",
      "macros": {
        "calories": number,
        "protein": number, "carbs": number, "fat": number, "fiber": number,
        "saturatedFat": number, "transFat": number, "cholesterol": number, "sodium": number,
        "sugar": number, "addedSugar": number,
        "vitaminD": number, "calcium": number, "iron": number, "potassium": number
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJson(response.text || "{}"));
  } catch (e) {
    console.error("Food Lookup Error", e);
    throw new Error("Could not find food data");
  }
};

export const generateAggregatedReport = async (
  profile: UserProfile, 
  logs: FoodLogEntry[]
): Promise<HealthReport> => {
  const model = "gemini-3-pro-preview"; // Reasoning model for insights
  
  const logSummary = logs.map(l => `${new Date(l.timestamp).toLocaleDateString()} - ${l.foodName}: ${l.macros.calories}kcal`).join('\n');

  const prompt = `
    Analyze these food logs for a user with this profile:
    ${JSON.stringify(profile)}

    Logs:
    ${logSummary}

    Generate a "Daily/Weekly" report (assume logs provided cover the period).
    
    1. Calculate average macros/calories roughly from data if needed, but focus on insights.
    2. Predict:
       - Weight Trend (e.g., "-0.5kg/week expected") based on TDEE vs Intake.
       - Risk Indicators (e.g., "High Sodium", "Low Protein").
    3. Recommendations: 3 specific habits/foods to add.
    4. Warnings: Specific alerts.

    Return JSON:
    {
      "period": "daily" | "weekly",
      "totalCalories": number (sum of logs),
      "averageMacros": { "protein": number, "carbs": number, "fat": number },
      "predictions": {
        "weightTrend": "string",
        "riskIndicators": ["string"]
      },
      "recommendations": ["string"],
      "warnings": ["string"]
    }
  `;

  try {
    const response = await generateWithFallback(model, prompt);
    return JSON.parse(cleanJson(response.text || "{}"));
  } catch (e) {
    console.error("Report Gen Error", e);
    throw new Error("Could not generate report");
  }
};

export const analyzeAndSimulate = async (
  input: string,
  isImage: boolean,
  userProfile: UserProfile,
  imageData?: string
): Promise<SimulationResult> => {
  
  // 1. Identification & Macro Estimation
  // Use gemini-3-pro-preview for robust image understanding (Nutrition Labels, Barcodes, Food)
  // Use gemini-2.5-flash for text-only inputs for speed.
  const analysisModel = isImage ? "gemini-3-pro-preview" : "gemini-2.5-flash";
  
  const analysisPrompt = `
    Analyze this input (Image or Text). 
    If Image: It might be a plate of food, a Nutrition Facts label, or a product barcode/packaging.
    
    Tasks:
    1. Identify the Food Name.
    2. Determine Comprehensive Nutrition Facts.
       - If Nutrition Label: EXTRACT EXACT NUMBERS from the image text.
       - If Barcode/Package/Food Plate: ESTIMATE standard values based on database knowledge.
       
    REQUIRED DATA FIELDS (Ensure numeric values, use 0 if negligible):
    - Calories
    - Total Fat (g)
    - Saturated Fat (g)
    - Trans Fat (g)
    - Cholesterol (mg)
    - Sodium (mg)
    - Total Carbohydrate (g)
    - Dietary Fiber (g)
    - Total Sugars (g)
    - Added Sugars (g)
    - Protein (g)
    - Vitamin D (mcg)
    - Calcium (mg)
    - Iron (mg)
    - Potassium (mg)

    3. Provide a simple description.

    Return a JSON object with:
    1. foodName (string)
    2. macros: { 
         calories, protein, carbs, fat, fiber,
         saturatedFat, transFat, cholesterol, sodium,
         sugar, addedSugar,
         vitaminD, calcium, iron, potassium
       } (all numbers)
    3. simpleDescription (string, max 20 words)
  `;

  let analysisResponseText = "";

  try {
    let contents: any;
    if (isImage && imageData) {
      contents = {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: imageData } },
            { text: analysisPrompt }
          ]
      };
    } else {
      contents = `${analysisPrompt} \n\n Input: "${input}"`;
    }

    // Step 1: Analyze Input (with fallback for image model)
    const response = await generateWithFallback(analysisModel, contents);
    analysisResponseText = response.text || "{}";

    const basicAnalysis = JSON.parse(cleanJson(analysisResponseText));

    // 2. Deep Metabolic Simulation (Reasoning Model)
    // We use gemini-3-pro-preview for complex biological simulation
    const simulationModel = "gemini-3-pro-preview";
    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    const simulationPrompt = `
      Act as a biological digital twin simulation engine.
      Food Item: ${basicAnalysis.foodName}
      Macros: ${JSON.stringify(basicAnalysis.macros)}
      Context: ${basicAnalysis.simpleDescription}
      
      User Profile:
      - Age: ${userProfile.age}
      - Weight: ${userProfile.weight}kg
      - Height: ${userProfile.height}cm
      - Gender: ${userProfile.gender}
      - Chronotype: ${userProfile.chronotype || 'intermediate'}
      - Sleep Window: ${userProfile.sleepWindow || '23:00-07:00'}
      - Conditions: ${userProfile.conditions.join(', ') || 'None'}
      ${userProfile.genetics ? `- Genetic Profile: ${JSON.stringify(userProfile.genetics)}` : ''}
      ${userProfile.microbiomeProfile ? `- Microbiome Baseline (${userProfile.microbiomeProfile.provider}): Diversity ${userProfile.microbiomeProfile.diversityPercentile}%, Enterotype ${userProfile.microbiomeProfile.enterotype}` : 'Microbiome: Standard Western Baseline'}
      
      Simulation Context:
      - Current Time: ${currentTime}
      
      Tasks:
      1. Simulate metabolic response (Glucose/Insulin/Energy) over 180 min.
      2. Analyze Microbiome Impact (Shifts/Scores).
         - Predict impact on SCFA production (Butyrate, Acetate).
         - Specific strain shifts (e.g. Akkermansia, Bifidobacterium, Lactobacillus).
      3. Predict Cognitive Performance over next 8 hours based on glucose volatility and neurotransmitter precursors.
      4. Analyze Circadian Rhythm Impact based on Chronotype and Current Time vs Meal Composition.
      
      Return a JSON object with this EXACT schema:
      {
        "timeline": [
          // Array of 7 points: 0, 30, 60, 90, 120, 150, 180 minutes
          { "minute": number, "glucose": number (mg/dL), "insulin": number (uIU/mL), "energy": number (0-100) }
        ],
        "organStress": {
          "brain": number (0-10),
          "heart": number (0-10),
          "liver": number (0-10),
          "gut": number (0-10),
          "pancreas": number (0-10)
        },
        "microbiome": {
          "diversityScore": number (0-100),
          "prebioticScore": number (0-100),
          "probioticScore": number (0-100),
          "bacterialShifts": [
            { "name": "string", "change": "increase"|"decrease"|"stable", "category": "beneficial"|"harmful"|"neutral", "mechanism": "string" }
          ],
          "scfaProduction": {
            "butyrate": "increase"|"decrease"|"stable",
            "acetate": "increase"|"decrease"|"stable"
          },
          "inflammation": {
            "level": "low"|"moderate"|"high",
            "markers": ["string"]
          },
          "overallTrend": "improving"|"stable"|"deteriorating"
        },
        "cognitive": {
          "timeline": [
             // 9 points: 0, 1, 2, 3, 4, 5, 6, 7, 8 hours
             { "hour": number, "clarityScore": number (0-100), "reactionTime": number (e.g. 250), "mood": "energized"|"stable"|"irritable"|"brain_fog"|"drowsy" }
          ],
          "brainFogRisk": {
             "probability": number (0-100),
             "onset": "string (e.g. 2 hours)",
             "trigger": "string"
          },
          "optimalWindows": {
             "deepWork": "string (e.g. Now - 1hr)",
             "creative": "string (e.g. 2hr - 4hr)",
             "meetings": "string (e.g. Avoid 1hr - 2hr)"
          },
          "summary": "Short text summary of mental state"
        },
        "circadian": {
            "timingScore": number (0-100),
            "melatoninSuppression": number (0-100, % likelihood or intensity),
            "sleepQualityPrediction": "string (e.g. High, Moderate, Disrupted)",
            "energyImpact": "string (e.g. Stable energy, Evening slump expected)",
            "optimalWindow": "string (e.g. 08:00 - 18:00)",
            "recommendation": "string (specific timing advice)"
        },
        "analysis": "Short clinical summary.",
        "interventions": ["List", "of", "3", "interventions"]
      }
    `;

    // Step 2: Simulate (with fallback)
    const simResponse = await generateWithFallback(simulationModel, simulationPrompt);
    const simData = JSON.parse(cleanJson(simResponse.text || "{}"));

    return {
      foodName: basicAnalysis.foodName,
      macros: basicAnalysis.macros,
      timeline: simData.timeline,
      organStress: simData.organStress,
      microbiome: simData.microbiome,
      cognitive: simData.cognitive,
      circadian: simData.circadian,
      analysis: simData.analysis,
      interventions: simData.interventions
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to run metabolic simulation.");
  }
};

export const getCoachResponse = async (history: string[], userQuery: string, currentContext: any) => {
    // Using flash for chat responsiveness - already low latency model, fallback likely not needed but good practice
    const model = "gemini-2.5-flash";
    const prompt = `
        You are VitoSynth, an AI metabolic health coach.
        Current Simulation Context: ${JSON.stringify(currentContext)}
        
        User asks: "${userQuery}"
        
        Provide a helpful, scientific, yet encouraging response (max 2 sentences).
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt
        });
        return response.text;
    } catch (e) {
        console.error(e);
        return "I'm having trouble connecting right now. Please try again.";
    }
};

export const generateScenarios = async (foodName: string): Promise<Scenario[]> => {
  const model = "gemini-3-pro-preview";
  const prompt = `
    Analyze the meal: "${foodName}".
    Generate 3 scenarios:
    A: The Current Meal.
    B: A Healthy Alternative (completely different but satisfying option).
    C: A Modified Version (the current meal tweaked, e.g., bunless, sauce on side).

    For each, predict:
    - metabolicScore (0-100, higher is better)
    - sleepQuality (0-100)
    - energyLevel (0-100, next day)
    - productivity (integer -50 to +50, percent change)
    - crashTime (string like "2:30 PM" or null if none)

    Return JSON array of objects with keys: id ("A","B","C"), type ("Current","Alternative","Modified"), name (short title), description (1 sentence), metrics (object with above fields).
  `;

  const response = await generateWithFallback(model, prompt);
  return JSON.parse(cleanJson(response.text || "[]"));
};

export const generateStressScenarios = async (foodName: string, userProfile: UserProfile): Promise<Scenario[]> => {
    const model = "gemini-3-pro-preview";
    const prompt = `
      Act as a Metabolic Stress Simulator.
      Food: "${foodName}".
      User Profile: ${JSON.stringify(userProfile)}.
      
      Simulate the biological impact of THIS SAME MEAL under 3 different physiological contexts:
      A: Baseline (Normal rested state).
      B: Sleep Deprived (High Cortisol, insulin resistance).
      C: Post-Workout (High Insulin Sensitivity, glycogen depleted).
      
      For each context, predict how the body handles the food differently.
      
      Return JSON array of 3 objects with keys:
      - id ("A", "B", "C")
      - type ("Baseline", "Sleep Deprived", "Post-Workout")
      - name (Descriptive title like "After 4h Sleep")
      - description (Explain mechanism, e.g. "Elevated cortisol impairs glucose uptake...")
      - metrics: {
          metabolicScore (0-100),
          sleepQuality (0-100),
          energyLevel (0-100),
          productivity (int -50 to +50),
          crashTime (string or null)
      }
    `;
  
    const response = await generateWithFallback(model, prompt);
    return JSON.parse(cleanJson(response.text || "[]"));
};

export const generateLifestyleProjection = async (habit: string): Promise<LifestyleProjection[]> => {
  const model = "gemini-3-pro-preview";
  const prompt = `
    Habit: "${habit}".
    User: Healthy adult, 70kg, HbA1c 5.4%.
    
    Project the biological impact of adopting this habit over 1, 3, and 6 months.
    
    Return JSON array of 3 objects (one for each period):
    - period (string: "1 Month", "3 Months", "6 Months")
    - weightChange (number, kg change, negative for loss)
    - hba1cChange (number, % change, e.g., -0.2)
    - description (short outcome summary)
  `;

  const response = await generateWithFallback(model, prompt);
  return JSON.parse(cleanJson(response.text || "[]"));
};

export const generateFutureSelfProjection = async (mealName: string): Promise<FutureSelfProjection[]> => {
    const model = "gemini-3-pro-preview";
    const prompt = `
        Meal: "${mealName}".
        Project the cumulative biological impact of eating this specific meal 3 times a week for:
        - 1 Year
        - 5 Years
        - 10 Years
        
        Assume current sedentary lifestyle if no context provided.
        Predict changes in weight, metabolic biomarkers, and general aging.

        Return JSON array of 3 objects:
        {
            "period": "1 Year" | "5 Years" | "10 Years",
            "weightChange": number (kg, cumulative, e.g. +3.5),
            "biomarkerDrift": ["string", "string"], // e.g. ["HbA1c +0.1%", "Liver Fat Increased"]
            "description": "Short summary of the long-term effect."
        }
    `;
    const response = await generateWithFallback(model, prompt);
    return JSON.parse(cleanJson(response.text || "[]"));
};

export const analyzeGeneticData = async (rawInput: string): Promise<GeneticProfile> => {
  const model = "gemini-3-pro-preview";
  const prompt = `
    Act as a Pharmacogenomics Nutritionist.
    Analyze the following genetic data input (this could be raw 23andMe SNP data, a text summary of variants, or a natural language description):
    
    INPUT: "${rawInput}"

    Task:
    1. Identify key nutritional genes like FTO (obesity), APOE (saturated fat), CYP1A2 (caffeine), TCF7L2 (carbs/diabetes), MTHFR (folate/methylation), LCT (lactose).
    2. Infer risk levels based on the variants present. If data is vague (e.g. "I have the obesity gene"), assume the risk variant.
    3. Generate specific macro recommendations.

    Return a JSON object with this exact schema:
    {
      "variants": [
        { "gene": "FTO", "variant": "string (e.g. rs9939609 A allele)", "riskLevel": "high"|"moderate"|"low", "implication": "string (e.g. Increased appetite)" }
      ],
      "obesityRisk": "high"|"moderate"|"low",
      "saturatedFatSensitivity": "high"|"moderate"|"low",
      "caffeineSensitivity": "fast"|"slow",
      "macroRecommendations": {
        "protein": "string (e.g. High 30%)",
        "carbs": "string (e.g. Low GI <40%)",
        "fat": "string (e.g. Moderate 30%)"
      },
      "summary": "Short paragraph explaining the genetic profile and dietary strategy."
    }
  `;

  try {
     const response = await generateWithFallback(model, prompt);
     return JSON.parse(cleanJson(response.text || "{}"));
  } catch(e) {
      console.error("Genetic Analysis Error", e);
      throw new Error("Failed to analyze genetic data");
  }
};

export const generateMealPlan = async (userProfile: UserProfile): Promise<MealPlan> => {
  const model = "gemini-3-pro-preview";
  const prompt = `
    Act as a Precision Nutrition AI.
    Generate a 3-Day Meal Plan perfectly balanced for this user.
    
    User Profile:
    - Age/Weight/Gender: ${userProfile.age} / ${userProfile.weight}kg / ${userProfile.gender}
    - Conditions: ${userProfile.conditions.join(', ') || 'None'}
    - Goals: ${userProfile.goals.join(', ')}
    - Restrictions: ${userProfile.dietaryRestrictions.join(', ') || 'None'}
    ${userProfile.genetics ? `- Genetic Factors: ${JSON.stringify(userProfile.genetics)} (e.g. FTO obesity risk, APOE4 fat sensitivity)` : ''}
    ${userProfile.microbiomeProfile ? `- Microbiome: ${JSON.stringify(userProfile.microbiomeProfile)}` : ''}

    Task:
    1. Create a 3-day plan (Breakfast, Lunch, Dinner, Snack).
    2. Ensure each meal aligns with their genetics (e.g. low sat fat for APOE4) and microbiome (e.g. specific fibers).
    3. Include a "reasoning" field for WHY this meal fits their specific biology.
    4. Provide ingredients list (strings) and brief cooking instructions (strings) for each meal.
    5. Include estimated cooking time (e.g. "20 min").

    Return a JSON object with exact schema:
    {
      "summary": "Overview of the strategy (e.g. 'High protein, low-GI plan to manage FTO risk and pre-diabetes')",
      "days": [
        {
          "day": 1,
          "meals": [
            {
               "type": "Breakfast"|"Lunch"|"Dinner"|"Snack",
               "name": "string",
               "description": "string",
               "reasoning": "string",
               "macros": { "calories": number, "protein": number, "carbs": number, "fat": number },
               "ingredients": ["string"],
               "instructions": ["string"],
               "cookingTime": "string"
            }
          ]
        },
        // ... Day 2, Day 3
      ]
    }
  `;

  try {
    const response = await generateWithFallback(model, prompt);
    return JSON.parse(cleanJson(response.text || "{}"));
  } catch (e) {
    console.error("Meal Plan Error", e);
    throw new Error("Failed to generate meal plan");
  }
};

export const generateSmartRecipe = async (
    ingredients: string, 
    userProfile: UserProfile, 
    imageData?: string
): Promise<Recipe> => {
  const model = "gemini-3-pro-preview";
  
  const prompt = `
    Act as a Molecular Gastronomist and Metabolic Expert.
    
    Context:
    - Available Ingredients (Text or Image): "${ingredients}"
    - User Profile: ${JSON.stringify(userProfile)}
    
    Task:
    1. Analyze ingredients.
    2. CREATE a recipe that minimizes glucose spikes and inflammation for THIS specific user.
       - Use culinary chemistry (e.g. "Add vinegar to lower GI", "Cook then cool potatoes to increase resistant starch").
       - Balance for their genes (e.g. Low saturated fat for APOE4).
    
    Return JSON:
    {
      "name": "Creative Recipe Name",
      "description": "Appetizing description.",
      "ingredients": ["List of amounts and items"],
      "instructions": ["Step 1...", "Step 2..."],
      "cookingTime": "e.g. 20 mins",
      "bioHacks": ["Specific biological optimizations included in this recipe"],
      "predictedMetabolicScore": number (0-100),
      "macros": { "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number }
    }
  `;

  let contents: any;
  if (imageData) {
      contents = {
          parts: [
              { inlineData: { mimeType: "image/jpeg", data: imageData } },
              { text: prompt }
          ]
      };
  } else {
      contents = prompt;
  }

  try {
      const response = await generateWithFallback(model, contents);
      return JSON.parse(cleanJson(response.text || "{}"));
  } catch (e) {
      console.error("Smart Chef Error", e);
      throw new Error("Failed to generate recipe");
  }
};

export const calculateFastingStatus = async (
    lastMealTimestamp: number,
    lastMealMacros: MacroNutrients,
    userProfile: UserProfile
): Promise<FastingData> => {
    const model = "gemini-3-pro-preview";
    const hoursElapsed = (Date.now() - lastMealTimestamp) / (1000 * 60 * 60);
    
    const prompt = `
        User Profile: ${JSON.stringify(userProfile)}
        Last Meal: ${hoursElapsed.toFixed(1)} hours ago. 
        Meal Macros: ${JSON.stringify(lastMealMacros)}.

        Determine the user's current physiological fasting state.
        
        Stages logic (approximate):
        - 0-4h: Anabolic (Fed)
        - 4-12h: Catabolic (Early Fast)
        - 12-18h: Fat Burning (Ketosis begins)
        - 18-24h: Deep Ketosis / Early Autophagy
        - 24h+: Deep Autophagy

        Adjust for meal composition (e.g., massive carb meal delays ketosis).
        Adjust for activity level (active users burn glycogen faster).

        Return JSON:
        {
            "hoursElapsed": number,
            "currentZone": "Anabolic (Fed)" | "Catabolic (Early Fast)" | "Fat Burning" | "Ketosis" | "Deep Autophagy",
            "autophagyLevel": number (0-100),
            "glycogenDepletion": number (0-100, percentage used up),
            "ketoneLevelPredicted": number (mmol/L estimate),
            "insulinLevelPredicted": number (uIU/mL estimate),
            "timeToNextZone": "string (e.g. '2 hours to Ketosis')",
            "insights": "string (short bio-summary)"
        }
    `;

    try {
        const response = await generateWithFallback(model, prompt);
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) {
        console.error("Fasting Calc Error", e);
        // Fallback default
        return {
            hoursElapsed,
            currentZone: hoursElapsed < 4 ? 'Anabolic (Fed)' : 'Catabolic (Early Fast)',
            autophagyLevel: 0,
            glycogenDepletion: 10,
            ketoneLevelPredicted: 0.1,
            insulinLevelPredicted: 5.5,
            timeToNextZone: "Calculating...",
            insights: "Could not calculate specific biomarkers."
        };
    }
};


// --------------------------------------------------------------------------------
// LIVE API AUDIO HELPERS
// --------------------------------------------------------------------------------

let liveAudioContext: AudioContext | null = null;
let liveInputSource: MediaStreamAudioSourceNode | null = null;
let liveProcessor: ScriptProcessorNode | null = null;
let liveOutputContext: AudioContext | null = null;
let currentLiveSession: any = null;
let liveNextStartTime = 0;

function createBlob(data: Float32Array): { data: string, mimeType: string } {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = Math.max(-1, Math.min(1, data[i])) * 32768;
    }
    
    // Manual Base64 Encode
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    
    return {
        data: btoa(binary),
        mimeType: 'audio/pcm;rate=16000',
    };
}

function decodeAudio(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number = 24000,
    numChannels: number = 1
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

export const stopLiveSession = () => {
    if (liveInputSource) liveInputSource.disconnect();
    if (liveProcessor) liveProcessor.disconnect();
    if (liveAudioContext) liveAudioContext.close();
    if (liveOutputContext) liveOutputContext.close();
    
    // Close session logic (if accessible, usually by breaking the loop or disconnect)
    currentLiveSession = null;
    liveAudioContext = null;
    liveOutputContext = null;
    liveNextStartTime = 0;
};

export const startLiveSession = async (
    userProfile: UserProfile,
    simulationResult: SimulationResult | null,
    onVolumeChange: (vol: number) => void,
    onStatusChange: (status: string) => void
) => {
    try {
        stopLiveSession(); // Ensure clean state

        onStatusChange("Connecting...");

        liveAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        liveOutputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const outputNode = liveOutputContext.createGain();
        outputNode.connect(liveOutputContext.destination);

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        liveInputSource = liveAudioContext.createMediaStreamSource(stream);
        liveProcessor = liveAudioContext.createScriptProcessor(4096, 1, 1);

        const systemInstruction = `
            You are VitoSynth, an advanced AI metabolic health coach.
            User Profile: ${JSON.stringify(userProfile)}
            Current Context: ${simulationResult ? `User just scanned: ${simulationResult.foodName}. Glucose spike: ${Math.max(...simulationResult.timeline.map(t=>t.glucose))} mg/dL.` : 'No food scanned recently.'}

            Interact with the user via voice. 
            Keep answers concise (under 30 seconds), encouraging, and scientifically accurate.
            Focus on metabolic insights, circadian rhythm, and actionable health tips.
        `;

        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                systemInstruction: systemInstruction,
            },
            callbacks: {
                onopen: () => {
                    onStatusChange("Connected");
                    
                    liveProcessor!.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        
                        // Volume calculation for visualizer
                        let sum = 0;
                        for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                        const volume = Math.sqrt(sum / inputData.length);
                        onVolumeChange(volume * 100);

                        const pcmBlob = createBlob(inputData);
                        sessionPromise.then(session => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };

                    liveInputSource!.connect(liveProcessor!);
                    liveProcessor!.connect(liveAudioContext!.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audioData) {
                         // Simple visualizer bump for output
                         onVolumeChange(50 + Math.random() * 30);
                         
                         if (!liveOutputContext) return;
                         
                         liveNextStartTime = Math.max(liveNextStartTime, liveOutputContext.currentTime);
                         const audioBuffer = await decodeAudioData(
                             decodeAudio(audioData),
                             liveOutputContext,
                             24000, 
                             1
                         );
                         
                         const source = liveOutputContext.createBufferSource();
                         source.buffer = audioBuffer;
                         source.connect(outputNode);
                         source.start(liveNextStartTime);
                         liveNextStartTime += audioBuffer.duration;
                    }
                },
                onclose: () => {
                    onStatusChange("Disconnected");
                },
                onerror: (e) => {
                    console.error("Live API Error", e);
                    onStatusChange("Error");
                }
            }
        });
        
        currentLiveSession = sessionPromise;

    } catch (error) {
        console.error("Failed to start live session", error);
        onStatusChange("Error Starting");
    }
};