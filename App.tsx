import React, { useState, useRef, useEffect } from 'react';
import { SimulationResult, SimulationStatus, TimePoint, UserProfile, FoodLogEntry, Recipe, FastingData } from './types';
import { analyzeAndSimulate, getCoachResponse, startLiveSession, stopLiveSession, calculateFastingStatus } from './services/groqService';
import { OrganVisualizer } from './components/OrganVisualizer';
import { MetabolicCharts } from './components/MetabolicCharts';
import { NutritionLabel } from './components/NutritionLabel';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { MicrobiomePanel } from './components/MicrobiomePanel';
import { HealthProfileManager } from './components/HealthProfileManager';
import { FoodLogDashboard } from './components/FoodLogDashboard';
import { CognitivePerformancePanel } from './components/CognitivePerformancePanel';
import { CircadianPanel } from './components/CircadianPanel';
import { MealPlanner } from './components/MealPlanner';
import { GamificationPanel } from './components/GamificationPanel';
import { SmartChef } from './components/SmartChef';
import { FastingTracker } from './components/FastingTracker';
import { Activity, Brain, Camera, ChevronRight, MessageSquare, Mic, Play, RefreshCw, Send, Zap, X, FlaskConical, LayoutDashboard, ScanBarcode, User, Utensils, UserCircle, Check, Headphones, BookOpen, ChefHat, Timer, Droplet } from 'lucide-react';

const INITIAL_STRESS = { brain: 2, heart: 2, liver: 2, gut: 2, pancreas: 2 };
const INITIAL_TIMELINE: TimePoint[] = Array.from({ length: 7 }, (_, i) => ({ minute: i * 30, glucose: 85, insulin: 5, energy: 80 }));

export const INITIAL_USER_PROFILE: UserProfile = {
  age: 45,
  weight: 85, // kg
  height: 178, // cm
  gender: 'male',
  activityLevel: 'moderate',
  conditions: ['Pre-diabetes', 'Hypertension'],
  dietaryRestrictions: [],
  goals: ['Reduce HbA1c', 'Lose 5kg'],
  targetCalories: 2200,
  chronotype: 'intermediate',
  sleepWindow: '23:00-07:00',
  gamification: {
      points: 1250,
      level: 2,
      currentStreak: 4,
      badges: [
          { id: '1', name: 'First Log', description: 'Logged your first meal', icon: 'star', unlocked: true },
          { id: '2', name: 'Stable Glucose', description: 'Kept glucose spike under 140mg/dL', icon: 'shield', unlocked: true },
          { id: '3', name: 'Fiber Warrior', description: 'Ate >30g fiber in a day', icon: 'zap', unlocked: false },
          { id: '4', name: '7-Day Streak', description: 'Logged food for 7 days straight', icon: 'award', unlocked: false }
      ]
  },
  savedRecipes: []
};

const App: React.FC = () => {
  const [status, setStatus] = useState<SimulationStatus>(SimulationStatus.IDLE);
  const [activeView, setActiveView] = useState<'dashboard' | 'foodlog' | 'profile' | 'planner' | 'chef' | 'fasting'>('dashboard');
  
  const [inputText, setInputText] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: "Hello! I'm VitoSynth, your Digital Twin health coach. Scan a meal to see its impact." }
  ]);
  const [userQuery, setUserQuery] = useState('');
  const [viewMode, setViewMode] = useState<'simulation' | 'whatif'>('simulation');
  
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [foodLogs, setFoodLogs] = useState<FoodLogEntry[]>([]);
  
  // Fasting State
  const [fastingData, setFastingData] = useState<FastingData | null>(null);
  const [fastingLoading, setFastingLoading] = useState(false);

  // Live Session State
  const [isLive, setIsLive] = useState(false);
  const [liveStatus, setLiveStatus] = useState("Disconnected");
  const [liveVolume, setLiveVolume] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up live session on unmount
  useEffect(() => {
      return () => {
          stopLiveSession();
      };
  }, []);

  const fetchFastingData = async () => {
      if (foodLogs.length === 0) {
          // If no logs, assume default 12 hours ago
          setFastingData({
              hoursElapsed: 12.0,
              currentZone: 'Catabolic (Early Fast)',
              autophagyLevel: 10,
              glycogenDepletion: 40,
              ketoneLevelPredicted: 0.3,
              insulinLevelPredicted: 5.5,
              timeToNextZone: "Approx 2-4 hours to Fat Burning",
              insights: "No recent meals logged. Assuming overnight fast baseline."
          });
          return;
      }

      setFastingLoading(true);
      // Sort logs descending
      const sorted = [...foodLogs].sort((a,b) => b.timestamp - a.timestamp);
      const lastMeal = sorted[0];
      
      try {
          const data = await calculateFastingStatus(lastMeal.timestamp, lastMeal.macros, userProfile);
          setFastingData(data);
      } catch (e) {
          console.error(e);
      }
      setFastingLoading(false);
  };

  // Fetch fasting data when view changes to fasting, or when foodLogs change while in fasting view
  useEffect(() => {
      if (activeView === 'fasting') {
          fetchFastingData();
      }
  }, [activeView, foodLogs]);


  // Mock function to "trigger" file upload click
  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setStatus(SimulationStatus.ANALYZING);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const resultStr = reader.result as string;
        setUploadedImage(resultStr);
        const base64String = resultStr.split(',')[1];
        try {
          const simResult = await analyzeAndSimulate("Analyze image", true, userProfile, base64String);
          setResult(simResult);
          setStatus(SimulationStatus.COMPLETE);
        } catch (error) {
          setStatus(SimulationStatus.ERROR);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTextSubmit = async () => {
    if (!inputText) return;
    setStatus(SimulationStatus.SIMULATING);
    setUploadedImage(null); // Clear image if text search is used
    try {
      const simResult = await analyzeAndSimulate(inputText, false, userProfile);
      setResult(simResult);
      setStatus(SimulationStatus.COMPLETE);
    } catch (error) {
        console.error(error);
      setStatus(SimulationStatus.ERROR);
    }
  };

  const handleClearImage = () => {
    setUploadedImage(null);
    setResult(null);
    setStatus(SimulationStatus.IDLE);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery) return;
    
    const newHistory = [...chatMessages, { role: 'user' as const, text: userQuery }];
    setChatMessages(newHistory);
    setUserQuery('');
    
    try {
        const context = result ? { food: result.foodName, stress: result.organStress } : "No food scanned yet.";
        const aiResponse = await getCoachResponse(newHistory.map(m => m.text), userQuery, context);
        setChatMessages([...newHistory, { role: 'ai' as const, text: aiResponse || "I'm thinking..." }]);
    } catch(e) {
        setChatMessages([...newHistory, { role: 'ai' as const, text: "Sorry, I lost connection." }]);
    }
  };

  const toggleLiveSession = async () => {
      if (isLive) {
          stopLiveSession();
          setIsLive(false);
          setLiveStatus("Disconnected");
      } else {
          setIsLive(true);
          await startLiveSession(
              userProfile, 
              result, 
              (vol) => setLiveVolume(vol),
              (status) => setLiveStatus(status)
          );
      }
  };

  const handleAddLog = (entry: FoodLogEntry) => {
    setFoodLogs(prev => [...prev, entry]);
    
    // GAMIFICATION LOGIC
    if (userProfile.gamification) {
        let pointsEarned = 50; // Base points for logging
        let message = "Log Bonus: +50 Bio-Points!";

        // Bonus for stable glucose (if simulation result exists)
        if (entry.simulationResult) {
            const maxGlucose = Math.max(...entry.simulationResult.timeline.map(t => t.glucose));
            if (maxGlucose < 140) {
                pointsEarned += 100;
                message = "Stable Glucose Bonus! +150 Bio-Points!";
            }
        }
        
        const newPoints = userProfile.gamification.points + pointsEarned;
        const newLevel = Math.floor(newPoints / 1000) + 1;
        
        // Update profile
        setUserProfile(prev => ({
            ...prev,
            gamification: {
                ...prev.gamification!,
                points: newPoints,
                level: newLevel,
                // Simple streak logic (could be more complex date check)
                currentStreak: prev.gamification!.currentStreak // Keep simple for now
            }
        }));

        setChatMessages(prev => [...prev, { role: 'ai', text: message }]);
    }
  };

  const handleLogMeal = () => {
    if (!result) return;
    
    const newEntry: FoodLogEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      foodName: result.foodName,
      portionSize: "1 Serving", 
      macros: result.macros,
      simulationResult: result // Save the simulation report
    };
    
    handleAddLog(newEntry);
    setActiveView('foodlog');
    
    // Clear simulation state for dashboard
    setResult(null);
    setInputText('');
    setUploadedImage(null);
    setStatus(SimulationStatus.IDLE);
    // Message added in handleAddLog
  };

  const handleDiscard = () => {
    setResult(null);
    setInputText('');
    setUploadedImage(null);
    setStatus(SimulationStatus.IDLE);
  };

  const handleViewSimulation = (entry: FoodLogEntry) => {
    if (entry.simulationResult) {
      setResult(entry.simulationResult);
      setActiveView('dashboard');
      setViewMode('simulation');
      setStatus(SimulationStatus.COMPLETE);
      setInputText(entry.foodName); // Restore context
    }
  };

  const handleSimulateRecipe = async (recipeName: string) => {
      setActiveView('dashboard');
      setInputText(recipeName);
      // Trigger simulation automatically
      setStatus(SimulationStatus.SIMULATING);
      try {
          const simResult = await analyzeAndSimulate(recipeName, false, userProfile);
          setResult(simResult);
          setStatus(SimulationStatus.COMPLETE);
      } catch (error) {
          setStatus(SimulationStatus.ERROR);
      }
  };

  const handleSaveRecipe = (recipe: Recipe) => {
    setUserProfile(prev => {
        const currentSaved = prev.savedRecipes || [];
        // Prevent duplicates based on name
        if (currentSaved.some(r => r.name === recipe.name)) return prev;
        
        return {
            ...prev,
            savedRecipes: [...currentSaved, recipe]
        };
    });
  };

  const handleMicrobiomeConnect = (provider: 'Viome' | 'ZOE' | 'Thryve') => {
      // Simulate fetching data
      const mockProfile = {
          provider,
          connectedDate: Date.now(),
          diversityPercentile: 78,
          enterotype: 'Bacteroides' as const,
          baselineInflammation: 'low' as const
      };
      setUserProfile(prev => ({...prev, microbiomeProfile: mockProfile}));
  };

  const getPeakInsulin = (res: SimulationResult) => {
      if (!res?.timeline) return 0;
      return Math.max(...res.timeline.map(t => t.insulin));
  };

  return (
    <div className="min-h-screen text-zinc-100 flex flex-col font-sans selection:bg-primary/30 selection:text-white">
      
      {/* Navbar */}
      <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <div className="glass-panel rounded-full px-2 py-2 flex items-center gap-4 pointer-events-auto shadow-2xl shadow-black/50">
          <div className="flex items-center gap-3 pl-4 pr-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primaryDark flex items-center justify-center shadow-lg shadow-primary/20">
              <Activity className="w-4 h-4 text-black" />
            </div>
            <h1 className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 hidden md:block">
              VitoSynth <span className="text-primary font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 ml-1">v3.0</span>
            </h1>
          </div>
          
          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-black/20 rounded-full p-1 border border-white/5 hidden md:flex">
            <button 
              onClick={() => setActiveView('dashboard')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${activeView === 'dashboard' ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              <Brain className="w-4 h-4" /> Simulator
            </button>
             <button 
               onClick={() => setActiveView('fasting')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${activeView === 'fasting' ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              <Timer className="w-4 h-4" /> Fasting
            </button>
            <button 
               onClick={() => setActiveView('foodlog')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${activeView === 'foodlog' ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              <Utensils className="w-4 h-4" /> Log
            </button>
            <button 
               onClick={() => setActiveView('planner')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${activeView === 'planner' ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              <BookOpen className="w-4 h-4" /> Plan
            </button>
            <button 
               onClick={() => setActiveView('chef')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${activeView === 'chef' ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              <ChefHat className="w-4 h-4" /> Chef
            </button>
            <button 
               onClick={() => setActiveView('profile')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${activeView === 'profile' ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              <UserCircle className="w-4 h-4" /> Profile
            </button>
          </nav>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pt-28 pb-12 px-6 max-w-[1600px] mx-auto w-full">
        
        {activeView === 'profile' && (
           <HealthProfileManager profile={userProfile} onUpdate={setUserProfile} />
        )}

        {activeView === 'foodlog' && (
           <FoodLogDashboard 
              logs={foodLogs} 
              onAddLog={handleAddLog} 
              profile={userProfile} 
              onViewSimulation={handleViewSimulation}
           />
        )}

        {activeView === 'fasting' && (
           <div className="max-w-4xl mx-auto h-[600px]">
               <FastingTracker 
                  data={fastingData} 
                  loading={fastingLoading} 
                  onRefresh={fetchFastingData}
               />
           </div>
        )}

        {activeView === 'planner' && (
            <div className="max-w-4xl mx-auto">
                <MealPlanner 
                    userProfile={userProfile} 
                    onLogMeal={handleAddLog} 
                    onSimulateMeal={handleSimulateRecipe}
                />
            </div>
        )}

        {activeView === 'chef' && (
            <div className="max-w-5xl mx-auto">
                <SmartChef 
                    userProfile={userProfile} 
                    onSimulateRecipe={handleSimulateRecipe} 
                    onSaveRecipe={handleSaveRecipe}
                    savedRecipes={userProfile.savedRecipes || []}
                />
            </div>
        )}

        {activeView === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Digital Twin (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* User Profile Summary - Replaced/Enhanced with Gamification Panel if available */}
              {userProfile.gamification ? (
                   <GamificationPanel profile={userProfile.gamification} />
              ) : (
                <section className="glass-panel rounded-3xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                            <User className="w-6 h-6 text-zinc-400" />
                        </div>
                        <div>
                            <div className="text-base font-bold text-white tracking-tight">Subject A-74</div>
                            <div className="text-xs text-zinc-500 font-mono mt-0.5">
                                {userProfile.age}yo | {userProfile.weight}kg | {userProfile.conditions[0]}
                            </div>
                        </div>
                    </div>
                    <button 
                    onClick={() => setActiveView('profile')}
                    className="glass-button text-[10px] font-bold text-primary px-3 py-1.5 rounded-full"
                    >
                        EDIT PROFILE
                    </button>
                </section>
              )}

              <section className="glass-panel rounded-3xl p-6 relative overflow-hidden group">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full pointer-events-none" />
                
                <div className="flex justify-between items-center mb-6 relative z-10">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    Digital Twin
                  </h2>
                  {status === SimulationStatus.ANALYZING || status === SimulationStatus.SIMULATING ? (
                    <div className="flex items-center gap-2 text-xs text-primary animate-pulse font-mono bg-primary/10 px-2 py-1 rounded-lg border border-primary/20">
                      <RefreshCw className="w-3 h-3 animate-spin" /> PROCESSING
                    </div>
                  ) : null}
                </div>
                
                <OrganVisualizer 
                    stress={result?.organStress || INITIAL_STRESS} 
                    microbiome={result?.microbiome}
                    cognitive={result?.cognitive}
                />
                
                {/* Organ Stress Clinical Analysis Summary */}
                {result && (
                  <div className="mt-6 p-5 rounded-2xl bg-black/20 border border-white/5 backdrop-blur-sm">
                    <h4 className="text-xs font-mono text-muted uppercase mb-2 tracking-wider">Clinical Analysis</h4>
                    <p className="text-sm leading-relaxed text-zinc-300 font-light">{result.analysis}</p>
                  </div>
                )}
              </section>

              {/* Peak Insulin & Interventions */}
              {result && (
                <div className="space-y-4">
                    {/* Peak Insulin Metric Card */}
                    <section className="glass-panel rounded-3xl p-5 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                                <Droplet className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Peak Insulin</h3>
                                <p className="text-xs text-zinc-500">Predicted Plasma Max</p>
                            </div>
                         </div>
                         <div className="text-right">
                             <div className={`text-3xl font-black tabular-nums tracking-tighter ${
                                 getPeakInsulin(result) > 60 ? 'text-rose-400 text-glow' : 
                                 getPeakInsulin(result) > 30 ? 'text-yellow-400 text-glow' : 'text-emerald-400 text-glow'
                             }`}>
                                 {getPeakInsulin(result)}
                             </div>
                             <div className="text-[10px] text-zinc-500 font-mono">µIU/mL</div>
                         </div>
                    </section>

                    <section className="glass-panel rounded-3xl p-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-400" /> Suggested Interventions
                        </h3>
                        <ul className="space-y-3">
                            {result.interventions.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-sm p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">{idx + 1}</span>
                                    <span className="leading-snug text-zinc-300">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>
              )}
            </div>

            {/* Center Column: Data & Input (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Input Area */}
              <section className="glass-panel rounded-3xl p-1 shadow-2xl">
                <div className="bg-black/20 rounded-[22px] p-5 flex flex-col gap-4">
                    
                    <textarea 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={uploadedImage ? "Add context to your image..." : "Describe a meal, or upload a photo of food, nutrition labels, or barcodes..."}
                        className="w-full bg-transparent border-none focus:ring-0 text-lg resize-none placeholder:text-zinc-600 h-24 font-light"
                    />

                    <div className="flex items-center justify-between border-t border-white/10 pt-4">
                        <div className="flex gap-2">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            <button 
                                onClick={handleImageUpload}
                                className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 text-sm font-medium glass-button ${uploadedImage ? 'bg-primary/20 text-primary border-primary/30' : 'text-zinc-400 hover:text-white'}`}
                            >
                                {uploadedImage ? <Camera className="w-4 h-4" /> : <ScanBarcode className="w-4 h-4" />}
                                {uploadedImage ? 'Change Image' : 'Scan'}
                            </button>
                        </div>
                        {/* Always show Simulate button, enable if image or text exists */}
                        <button 
                            onClick={handleTextSubmit}
                            disabled={(!inputText && !uploadedImage) || status === SimulationStatus.SIMULATING || status === SimulationStatus.ANALYZING}
                            className="px-6 py-2 rounded-full bg-primary hover:bg-primaryDark text-black font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(0,245,225,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none hover:scale-105 active:scale-95"
                        >
                            {status === SimulationStatus.SIMULATING || status === SimulationStatus.ANALYZING ? 'Processing...' : (
                                <>Simulate <Play className="w-4 h-4 fill-current" /></>
                            )}
                        </button>
                    </div>
                </div>
              </section>

              {/* Mode Switcher */}
              <div className="flex justify-center">
                <div className="glass-panel rounded-full p-1.5 flex gap-1">
                    <button 
                        onClick={() => setViewMode('simulation')}
                        className={`px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'simulation' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                    >
                      <LayoutDashboard className="w-4 h-4" /> Live Simulation
                    </button>
                    <button 
                        onClick={() => setViewMode('whatif')}
                        className={`px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'whatif' ? 'bg-primary text-black shadow-[0_0_15px_rgba(0,245,225,0.3)]' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                    >
                      <FlaskConical className="w-4 h-4" /> What-If Lab
                    </button>
                </div>
              </div>

              {/* Charts or What-If Lab */}
              <section className="flex-1 flex flex-col gap-6 relative">
                {viewMode === 'simulation' ? (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <MetabolicCharts data={result?.timeline || INITIAL_TIMELINE} />
                    </div>
                ) : (
                    <div className="animate-in fade-in zoom-in-95 duration-500 h-full">
                        <WhatIfSimulator currentMealName={result?.foodName} />
                    </div>
                )}
              </section>

              {/* Decision Actions */}
              {result && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <button 
                        onClick={handleLogMeal}
                        className="glass-panel glass-panel-hover p-4 rounded-2xl flex items-center justify-center gap-4 transition-all group border-emerald-500/30 hover:border-emerald-500/60"
                    >
                        <div className="p-3 bg-emerald-500 rounded-full text-black group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                          <Check className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-bold text-white">LOG MEAL</div>
                          <div className="text-[10px] text-zinc-400">Add to History</div>
                        </div>
                    </button>

                    <button 
                        onClick={handleDiscard}
                        className="glass-panel glass-panel-hover p-4 rounded-2xl flex items-center justify-center gap-4 transition-all group border-rose-500/30 hover:border-rose-500/60"
                    >
                        <div className="p-3 bg-rose-500 rounded-full text-white group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(244,63,94,0.4)]">
                          <X className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-bold text-white">DISCARD</div>
                          <div className="text-[10px] text-zinc-400">Clear Simulation</div>
                        </div>
                    </button>
                </div>
              )}
            </div>

            {/* Right Column: Details & Coach (3 cols) */}
            <div className="lg:col-span-3 flex flex-col gap-6">
                
                {/* Nutrition Label */}
                {result ? (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <NutritionLabel macros={result.macros} />
                    </section>
                ) : (
                    <div className="h-64 rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-muted gap-4 bg-white/[0.01]">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
                            <Activity className="w-8 h-8 text-white/20" />
                        </div>
                        <p className="text-sm">No meal data analyzed</p>
                    </div>
                )}

                {/* Uploaded Image Display (Moved Here) */}
                {uploadedImage && (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 glass-panel rounded-3xl p-1 shadow-2xl">
                        <div className="relative w-full h-48 bg-black/50 rounded-[20px] overflow-hidden group">
                            <img src={uploadedImage} alt="Scanned Food" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80 pointer-events-none" />
                            <button 
                                onClick={handleClearImage}
                                className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-rose-500/80 rounded-full text-white transition-all backdrop-blur-md border border-white/10 z-10"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-4 left-4 flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                <Camera className="w-3 h-3 text-primary" />
                                <span className="text-[10px] font-bold font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">ORIGINAL CAPTURE</span>
                                </div>
                                {result && <p className="text-white font-bold text-lg drop-shadow-md tracking-tight">{result.foodName}</p>}
                            </div>
                        </div>
                    </section>
                )}
                
                {/* Circadian Panel */}
                {result?.circadian && (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                        <CircadianPanel data={result.circadian} />
                    </section>
                )}

                {/* Mental Performance Panel */}
                {result?.cognitive && (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                         <CognitivePerformancePanel data={result.cognitive} />
                    </section>
                )}

                {/* Microbiome Panel */}
                {result?.microbiome && (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                        <MicrobiomePanel 
                            data={result.microbiome} 
                            userProfile={userProfile}
                            onConnect={handleMicrobiomeConnect}
                        />
                    </section>
                )}

                {/* AI Coach Chat & Live Voice */}
                <div className={`fixed bottom-6 right-6 w-96 glass-panel rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-500 cubic-bezier(0.23, 1, 0.32, 1) ${chatOpen ? 'h-[600px]' : 'h-16 hover:translate-y-[-4px]'} z-50`}>
                    <div 
                        className="h-16 flex items-center justify-between px-6 cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => setChatOpen(!chatOpen)}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 'bg-primary shadow-[0_0_10px_#00F5E1]'} animate-pulse`} />
                            <span className="font-bold text-sm tracking-tight text-white">VitoSynth Coach {isLive ? '(LIVE)' : ''}</span>
                        </div>
                        {chatOpen ? <ChevronRight className="w-5 h-5 rotate-90 text-zinc-400" /> : <MessageSquare className="w-5 h-5 text-zinc-400" />}
                    </div>

                    {chatOpen && (
                        <>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20 relative">
                                {isLive ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl z-10 animate-in fade-in duration-500">
                                        <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center mb-6 relative">
                                            {/* Visualizer Rings */}
                                            <div className="absolute inset-0 rounded-full border border-primary/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                                            <div className="absolute inset-2 rounded-full border border-primary/20 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] delay-300" />
                                            <div 
                                                className="w-full h-full rounded-full bg-primary/20 absolute transition-all duration-75 ease-out blur-xl"
                                                style={{ transform: `scale(${1 + liveVolume * 0.08})` }} 
                                            />
                                            <Headphones className="w-12 h-12 text-primary z-10" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Listening...</h3>
                                        <p className="text-sm text-zinc-400 font-mono mb-8 bg-black/40 px-3 py-1 rounded-full">{liveStatus}</p>
                                        <button 
                                            onClick={toggleLiveSession}
                                            className="px-8 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-full font-bold flex items-center gap-2 transition-colors shadow-lg shadow-rose-500/30"
                                        >
                                            <X className="w-5 h-5" /> End Session
                                        </button>
                                    </div>
                                ) : (
                                    chatMessages.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
                                            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary text-black font-medium rounded-br-sm shadow-[0_0_15px_rgba(0,245,225,0.2)]' : 'bg-white/10 text-zinc-100 rounded-bl-sm border border-white/5'}`}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            
                            {!isLive && (
                                <form onSubmit={handleChatSubmit} className="p-4 border-t border-white/10 bg-black/40 flex gap-2">
                                    <input 
                                        value={userQuery}
                                        onChange={e => setUserQuery(e.target.value)}
                                        placeholder="Ask AI..."
                                        className="flex-1 glass-input rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500"
                                    />
                                    <button type="submit" className="p-3 rounded-xl bg-primary hover:bg-primaryDark text-black transition-all hover:scale-105 shadow-[0_0_10px_rgba(0,245,225,0.2)]">
                                        <Send className="w-4 h-4" />
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={toggleLiveSession}
                                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-primary transition-all hover:scale-105 border border-white/5"
                                        title="Start Voice Session"
                                    >
                                        <Mic className="w-4 h-4" />
                                    </button>
                                </form>
                            )}
                        </>
                    )}
                </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;