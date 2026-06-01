

import React, { useState, useEffect } from 'react';
import { UserProfile, MealPlan, FoodLogEntry, MealPlanItem } from '../types';
import { generateMealPlan } from '../services/groqService';
import { BookOpen, Calendar, ChefHat, Sparkles, RefreshCw, Zap, Plus, Check, Trash2, Clock, ChevronDown, ChevronUp, Play } from 'lucide-react';

interface MealPlannerProps {
  userProfile: UserProfile;
  onLogMeal: (entry: FoodLogEntry) => void;
  onSimulateMeal: (mealName: string) => void;
}

const STORAGE_KEY = 'vitosynth_meal_plan';

export const MealPlanner: React.FC<MealPlannerProps> = ({ userProfile, onLogMeal, onSimulateMeal }) => {
  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(() => {
      // Initialize from localStorage if available
      try {
          const saved = localStorage.getItem(STORAGE_KEY);
          return saved ? JSON.parse(saved) : null;
      } catch (e) {
          console.error("Failed to load meal plan from storage", e);
          return null;
      }
  });
  const [activeDay, setActiveDay] = useState(0);
  const [loggedMeals, setLoggedMeals] = useState<Set<string>>(new Set());
  const [expandedRecipes, setExpandedRecipes] = useState<Set<string>>(new Set());

  const handleGenerate = async () => {
    setLoading(true);
    setLoggedMeals(new Set()); // Reset logged state on new plan
    setExpandedRecipes(new Set());
    try {
      const plan = await generateMealPlan(userProfile);
      setMealPlan(plan);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plan)); // Save to storage
      setActiveDay(0);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleClear = () => {
      setMealPlan(null);
      localStorage.removeItem(STORAGE_KEY);
      setLoggedMeals(new Set());
      setExpandedRecipes(new Set());
      setActiveDay(0);
  };

  const handleLogClick = (meal: MealPlanItem, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    // Create a unique key for the button state in this session
    const mealKey = `${activeDay}-${index}-${meal.name}`;
    
    const entry: FoodLogEntry = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        foodName: meal.name,
        portionSize: "1 Serving (AI Plan)",
        macros: {
            ...meal.macros,
            fiber: 0, // Default as planner doesn't generate deep micro/fiber yet
        }
    };

    onLogMeal(entry);
    
    setLoggedMeals(prev => {
        const newSet = new Set(prev);
        newSet.add(mealKey);
        return newSet;
    });
  };

  const toggleRecipe = (mealKey: string) => {
      setExpandedRecipes(prev => {
          const newSet = new Set(prev);
          if (newSet.has(mealKey)) {
              newSet.delete(mealKey);
          } else {
              newSet.add(mealKey);
          }
          return newSet;
      });
  };

  return (
    <div className="bg-surface rounded-2xl p-6 border border-white/5 shadow-xl min-h-[600px] animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Proactive Meal Planner</h2>
                <p className="text-zinc-400 text-sm">AI-generated nutrition balanced for your genetics & microbiome</p>
            </div>
        </div>
        
        {mealPlan && (
            <div className="flex gap-2">
                <button 
                    onClick={handleClear}
                    disabled={loading}
                    className="bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 text-zinc-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-white/10"
                    title="Clear saved plan"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
                <button 
                    onClick={handleGenerate}
                    disabled={loading}
                    className="bg-white/5 hover:bg-white/10 text-zinc-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-white/10"
                >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Regenerate
                </button>
            </div>
        )}
      </div>

      {!mealPlan && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
              <div className="p-6 rounded-full bg-teal-500/10 mb-4 border border-teal-500/20">
                  <Calendar className="w-16 h-16 text-teal-500/50" />
              </div>
              <div className="max-w-md space-y-2">
                  <h3 className="text-xl font-bold text-white">No Meal Plan Active</h3>
                  <p className="text-zinc-500">
                      Generate a 3-day meal plan that proactively optimizes your metabolic health. 
                      The AI considers your {userProfile.genetics ? 'genetic profile, ' : ''} 
                      {userProfile.microbiomeProfile ? 'microbiome data, ' : ''} 
                      and health goals.
                  </p>
              </div>
              <button 
                  onClick={handleGenerate}
                  className="px-8 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold shadow-lg shadow-teal-500/25 flex items-center gap-2 transition-all hover:scale-105"
              >
                  <Sparkles className="w-5 h-5" />
                  Generate 3-Day Plan
              </button>
          </div>
      )}

      {loading && (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full border-4 border-teal-500/20"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-teal-500 animate-spin"></div>
              </div>
              <div className="text-center">
                  <h3 className="text-lg font-bold text-teal-400">Designing Your Protocol</h3>
                  <p className="text-zinc-500 text-sm">Analyzing genetic variants and metabolic needs...</p>
              </div>
          </div>
      )}

      {mealPlan && !loading && (
          <div className="space-y-6">
              
              {/* Summary Card */}
              <div className="bg-gradient-to-r from-teal-900/30 to-background border border-teal-500/20 p-5 rounded-xl flex gap-4 items-start">
                  <Sparkles className="w-6 h-6 text-teal-400 flex-shrink-0 mt-1" />
                  <div>
                      <h4 className="text-sm font-bold text-teal-400 uppercase tracking-widest mb-1">Strategic Overview</h4>
                      <p className="text-zinc-200 leading-relaxed text-sm">{mealPlan.summary}</p>
                  </div>
              </div>

              {/* Day Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/5">
                  {mealPlan.days.map((day, idx) => (
                      <button
                          key={idx}
                          onClick={() => setActiveDay(idx)}
                          className={`px-6 py-3 rounded-t-xl font-bold text-sm transition-all relative ${
                              activeDay === idx 
                              ? 'text-white bg-white/5 border-t border-x border-white/10' 
                              : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                          }`}
                      >
                          Day {day.day}
                          {activeDay === idx && (
                              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-500"></div>
                          )}
                      </button>
                  ))}
              </div>

              {/* Meals Grid */}
              <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {mealPlan.days[activeDay].meals.map((meal, i) => {
                      const mealKey = `${activeDay}-${i}-${meal.name}`;
                      const isLogged = loggedMeals.has(mealKey);
                      const isExpanded = expandedRecipes.has(mealKey);

                      return (
                      <div 
                          key={i} 
                          onClick={() => toggleRecipe(mealKey)}
                          className="bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:border-teal-500/30 transition-all cursor-pointer group"
                      >
                          <div className="p-4 flex flex-col gap-4">
                              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                                  {/* Meal Time/Type */}
                                  <div className="flex-shrink-0 w-full md:w-32">
                                      <span className="text-xs font-mono text-zinc-500 uppercase block mb-1">{meal.type}</span>
                                      <div className="font-bold text-white text-lg leading-tight">{meal.name}</div>
                                      {meal.cookingTime && (
                                          <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-1">
                                              <Clock className="w-3 h-3" /> {meal.cookingTime}
                                          </div>
                                      )}
                                  </div>

                                  {/* Description & Reasoning */}
                                  <div className="flex-1 space-y-2">
                                      <p className="text-sm text-zinc-300">{meal.description}</p>
                                      <div className="flex items-start gap-2 bg-black/20 p-2 rounded text-xs text-teal-300/80">
                                          <Zap className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                          {meal.reasoning}
                                      </div>
                                  </div>

                                  {/* Macros */}
                                  <div className="flex-shrink-0 flex gap-4 text-center bg-black/20 p-3 rounded-lg border border-white/5">
                                      <div>
                                          <div className="text-[10px] text-zinc-500 uppercase">Cals</div>
                                          <div className="font-mono font-bold text-white">{meal.macros.calories}</div>
                                      </div>
                                      <div>
                                          <div className="text-[10px] text-zinc-500 uppercase">Pro</div>
                                          <div className="font-mono font-bold text-purple-400">{meal.macros.protein}g</div>
                                      </div>
                                      <div>
                                          <div className="text-[10px] text-zinc-500 uppercase">Carb</div>
                                          <div className="font-mono font-bold text-emerald-400">{meal.macros.carbs}g</div>
                                      </div>
                                      <div>
                                          <div className="text-[10px] text-zinc-500 uppercase">Fat</div>
                                          <div className="font-mono font-bold text-amber-400">{meal.macros.fat}g</div>
                                      </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex-shrink-0 flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSimulateMeal(meal.name);
                                        }}
                                        className="p-3 rounded-full bg-white/10 hover:bg-primary hover:text-white text-zinc-400 transition-all flex items-center justify-center group-hover:bg-white/20"
                                        title="Simulate this meal"
                                    >
                                        <Play className="w-5 h-5 fill-current" />
                                    </button>

                                    <button
                                        onClick={(e) => handleLogClick(meal, i, e)}
                                        disabled={isLogged}
                                        className={`p-3 rounded-full transition-all flex items-center justify-center ${
                                            isLogged 
                                            ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
                                            : 'bg-white/10 hover:bg-emerald-500 hover:text-black text-zinc-400 group-hover:bg-white/20'
                                        }`}
                                        title={isLogged ? "Meal Logged" : "Log this meal"}
                                    >
                                        {isLogged ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                    </button>
                                  </div>
                              </div>
                              
                              {/* Recipe Details (Expandable) */}
                              {isExpanded && (
                                  <div className="mt-2 pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                                      {meal.ingredients && meal.ingredients.length > 0 && (
                                          <div>
                                              <h4 className="text-xs font-mono text-zinc-500 uppercase mb-2">Ingredients</h4>
                                              <ul className="text-sm text-zinc-300 space-y-1 list-disc pl-4">
                                                  {meal.ingredients.map((ing, k) => <li key={k}>{ing}</li>)}
                                              </ul>
                                          </div>
                                      )}
                                      {meal.instructions && meal.instructions.length > 0 && (
                                          <div>
                                               <h4 className="text-xs font-mono text-zinc-500 uppercase mb-2">Instructions</h4>
                                               <ol className="text-sm text-zinc-300 space-y-2 list-decimal pl-4">
                                                   {meal.instructions.map((step, k) => <li key={k}>{step}</li>)}
                                               </ol>
                                          </div>
                                      )}
                                  </div>
                              )}
                              
                              <div className="flex justify-center -mb-2 opacity-50">
                                   {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-600" /> : <ChevronDown className="w-4 h-4 text-zinc-600" />}
                              </div>

                          </div>
                      </div>
                  )})}
              </div>

          </div>
      )}
    </div>
  );
};