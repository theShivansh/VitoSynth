
export interface UserProfile {
  age: number;
  weight: number; // kg
  height: number; // cm
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
  conditions: string[];
  dietaryRestrictions: string[];
  goals: string[]; // e.g., "Weight Loss", "Muscle Gain"
  targetCalories?: number;
  genetics?: GeneticProfile;
  chronotype?: 'early_bird' | 'night_owl' | 'intermediate';
  sleepWindow?: string; // e.g. "23:00-07:00"
  microbiomeProfile?: MicrobiomeProfile;
  gamification?: GamificationProfile;
  savedRecipes?: Recipe[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or lucide mapping key
  unlocked: boolean;
  unlockedDate?: number;
}

export interface GamificationProfile {
  points: number;
  level: number; // calculated from points usually, or stored
  currentStreak: number;
  badges: Badge[];
}

export interface MicrobiomeProfile {
  provider: 'Viome' | 'ZOE' | 'Thryve';
  connectedDate: number;
  diversityPercentile: number; // 0-100
  enterotype: 'Bacteroides' | 'Prevotella' | 'Ruminococcus';
  baselineInflammation: 'low' | 'moderate' | 'high';
}

export interface MacroNutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  // Detailed breakdown
  saturatedFat?: number; // g
  transFat?: number; // g
  cholesterol?: number; // mg
  sodium?: number; // mg
  sugar?: number; // g
  addedSugar?: number; // g
  // Micronutrients
  vitaminD?: number; // mcg
  calcium?: number; // mg
  iron?: number; // mg
  potassium?: number; // mg
  vitaminA?: number; // mcg
  vitaminC?: number; // mg
}

export interface FoodLogEntry {
  id: string;
  timestamp: number; // unix timestamp
  foodName: string;
  portionSize: string; // e.g., "1 bowl", "200g"
  macros: MacroNutrients;
  simulationResult?: SimulationResult;
}

export interface HealthReport {
  period: 'daily' | 'weekly' | 'monthly';
  totalCalories: number;
  averageMacros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  predictions: {
    weightTrend: string;
    riskIndicators: string[];
  };
  recommendations: string[];
  warnings: string[];
}

export interface OrganStress {
  brain: number; // 0-10
  heart: number;
  liver: number;
  gut: number;
  pancreas: number;
}

export interface TimePoint {
  minute: number;
  glucose: number; // mg/dL
  insulin: number; // uIU/mL
  energy: number; // 0-100
}

export interface BacterialStrain {
  name: string;
  change: 'increase' | 'decrease' | 'stable';
  category: 'beneficial' | 'harmful' | 'neutral';
  mechanism: string;
}

export interface MicrobiomeData {
  diversityScore: number; // 0-100
  prebioticScore: number; // 0-100
  probioticScore: number; // 0-100
  bacterialShifts: BacterialStrain[];
  scfaProduction?: { // Short Chain Fatty Acids
    butyrate: 'increase' | 'decrease' | 'stable';
    acetate: 'increase' | 'decrease' | 'stable';
  };
  inflammation: {
    level: 'low' | 'moderate' | 'high';
    markers: string[]; // e.g., ["High LPS", "Elevated IL-6"]
  };
  overallTrend: 'improving' | 'stable' | 'deteriorating';
}

export interface CognitivePoint {
  hour: number; // 0-8 hours post-meal
  clarityScore: number; // 0-100
  reactionTime: number; // ms baseline shift (e.g., +20ms is slower)
  mood: 'energized' | 'stable' | 'irritable' | 'brain_fog' | 'drowsy';
}

export interface CognitivePrediction {
  timeline: CognitivePoint[];
  brainFogRisk: {
    probability: number; // 0-100
    onset?: string; // e.g. "2 hours"
    trigger: string;
  };
  optimalWindows: {
    deepWork: string; // e.g. "Now - 1hr"
    creative: string; // e.g. "2hr - 4hr"
    meetings: string; // e.g. "Avoid 1hr - 2hr"
  };
  summary: string;
}

export interface CircadianImpact {
  timingScore: number; // 0-100
  melatoninSuppression: number; // 0-100%
  sleepQualityPrediction: string; // e.g., "High", "Moderate", "Disrupted"
  energyImpact: string; // e.g., "Stable energy", "Evening slump"
  optimalWindow: string; // e.g., "08:00 - 18:00"
  recommendation: string;
}

export interface SimulationResult {
  foodName: string;
  macros: MacroNutrients;
  timeline: TimePoint[];
  organStress: OrganStress;
  microbiome: MicrobiomeData;
  cognitive: CognitivePrediction;
  circadian: CircadianImpact;
  analysis: string; // Text summary
  interventions: string[];
}

export enum SimulationStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SIMULATING = 'SIMULATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface Scenario {
  id: string; // 'A' | 'B' | 'C'
  type: string; // 'Current' | 'Alternative' | 'Modified' | 'Sleep Deprived' | 'Post-Workout' etc.
  name: string;
  description: string;
  metrics: {
    metabolicScore: number; // 0-100
    sleepQuality: number; // 0-100
    energyLevel: number; // 0-100
    productivity: number; // -50 to +50
    crashTime: string | null;
  };
}

export interface LifestyleProjection {
  period: string; // '1 Month', '3 Months', '6 Months'
  weightChange: number;
  hba1cChange: number;
  description: string;
}

export interface FutureSelfProjection {
    period: string; // '1 Year', '5 Years', '10 Years'
    weightChange: number;
    biomarkerDrift: string[]; // e.g. "HbA1c +0.5%", "Liver Fat Increased"
    description: string;
}

export interface GeneVariant {
  gene: string; // e.g., "FTO"
  variant: string; // e.g., "AA"
  riskLevel: 'low' | 'moderate' | 'high';
  implication: string;
}

export interface GeneticProfile {
  variants: GeneVariant[];
  obesityRisk: 'low' | 'moderate' | 'high';
  saturatedFatSensitivity: 'low' | 'moderate' | 'high';
  caffeineSensitivity: 'fast' | 'slow';
  macroRecommendations: {
    protein: string;
    carbs: string;
    fat: string;
  };
  summary: string;
}

export interface MealPlanItem {
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  name: string;
  description: string;
  reasoning: string; // e.g. "High protein for FTO gene"
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  ingredients?: string[];
  instructions?: string[];
  cookingTime?: string;
}

export interface DailyPlan {
  day: number;
  meals: MealPlanItem[];
}

export interface MealPlan {
  summary: string;
  days: DailyPlan[];
}

export interface Recipe {
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: string;
  bioHacks: string[]; // specific metabolic optimizations
  predictedMetabolicScore: number; // 0-100
  macros: MacroNutrients;
}

export interface FastingData {
  hoursElapsed: number;
  currentZone: 'Anabolic (Fed)' | 'Catabolic (Early Fast)' | 'Fat Burning' | 'Ketosis' | 'Deep Autophagy';
  autophagyLevel: number; // 0-100
  glycogenDepletion: number; // 0-100%
  ketoneLevelPredicted: number; // mmol/L
  insulinLevelPredicted: number; // uIU/mL
  timeToNextZone: string;
  insights: string;
}
