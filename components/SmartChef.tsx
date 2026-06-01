
import React, { useState, useRef } from 'react';
import { UserProfile, Recipe } from '../types';
import { generateSmartRecipe } from '../services/groqService';
import { Camera, ChefHat, Clock, Flame, Image as ImageIcon, Play, RefreshCw, Zap, BookOpen, X, BookHeart, Check } from 'lucide-react';

interface SmartChefProps {
  userProfile: UserProfile;
  onSimulateRecipe: (recipeName: string) => void;
  onSaveRecipe: (recipe: Recipe) => void;
  savedRecipes: Recipe[];
}

export const SmartChef: React.FC<SmartChefProps> = ({ userProfile, onSimulateRecipe, onSaveRecipe, savedRecipes }) => {
  const [inputIngredients, setInputIngredients] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setImage(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleGenerate = async () => {
      if (!inputIngredients && !image) return;
      setLoading(true);
      try {
          // Pass base64 image without prefix if exists
          const imageData = image ? image.split(',')[1] : undefined;
          const result = await generateSmartRecipe(inputIngredients, userProfile, imageData);
          setRecipe(result);
          setJustSaved(false); // Reset saved status for new recipe
      } catch (e) {
          console.error(e);
      }
      setLoading(false);
  };

  const handleSave = () => {
      if (recipe) {
          onSaveRecipe(recipe);
          setJustSaved(true);
      }
  };

  const isRecipeSaved = recipe && savedRecipes.some(r => r.name === recipe.name);

  return (
    <div className="bg-surface rounded-2xl p-6 border border-white/5 shadow-xl min-h-[600px] animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <ChefHat className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Bio-Active Smart Chef</h2>
                    <p className="text-zinc-400 text-sm">Turn ingredients into a metabolically optimized meal.</p>
                </div>
            </div>
            
            <button 
                onClick={() => setShowSaved(!showSaved)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    showSaved 
                    ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20' 
                    : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                }`}
            >
                <BookHeart className="w-4 h-4" />
                <span className="font-medium">My Cookbook ({savedRecipes.length})</span>
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-0">
            
            {/* Input Section */}
            <div className="space-y-4">
                <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">What's in your fridge?</label>
                        <textarea 
                            value={inputIngredients}
                            onChange={(e) => setInputIngredients(e.target.value)}
                            placeholder="e.g. Chicken breast, broccoli, avocado, lemon..."
                            className="w-full h-32 bg-surface border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 focus:outline-none resize-none"
                        />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileChange} 
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className={`flex-1 py-3 rounded-lg border border-dashed flex items-center justify-center gap-2 transition-all ${
                                image ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-white/10 hover:border-white/20 text-zinc-400 hover:text-white'
                            }`}
                        >
                            {image ? <ImageIcon className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                            {image ? 'Image Added' : 'Scan Fridge/Pantry'}
                        </button>
                    </div>

                    {image && (
                        <div className="h-32 w-full rounded-lg bg-black overflow-hidden relative group">
                            <img src={image} alt="Ingredients" className="w-full h-full object-cover opacity-70" />
                            <button 
                                onClick={() => setImage(null)}
                                className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white hover:bg-rose-500"
                            >
                                <Zap className="w-4 h-4 rotate-45" />
                            </button>
                        </div>
                    )}

                    <button 
                        onClick={handleGenerate}
                        disabled={loading || (!inputIngredients && !image)}
                        className="w-full bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-lg font-bold shadow-lg shadow-orange-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                    >
                        {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ChefHat className="w-5 h-5" />}
                        {loading ? 'Inventing Recipe...' : 'Generate Optimized Recipe'}
                    </button>
                </div>
                
                {/* Features List */}
                <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                        <div className="p-2 rounded bg-indigo-500/20 text-indigo-400"><Zap className="w-4 h-4" /></div>
                        <div className="text-xs text-zinc-300">
                            <strong>Metabolic Hacking:</strong> Finds ingredient combinations to lower glucose spikes.
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                         <div className="p-2 rounded bg-emerald-500/20 text-emerald-400"><Clock className="w-4 h-4" /></div>
                        <div className="text-xs text-zinc-300">
                            <strong>Personalized:</strong> Adjusts for your genetics (e.g. APOE4) and allergies.
                        </div>
                    </div>
                </div>
            </div>

            {/* Output Section */}
            <div className="bg-gradient-to-br from-surface to-black/40 border border-white/10 rounded-xl p-6 relative min-h-[400px]">
                {!recipe ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 opacity-40">
                        <ChefHat className="w-20 h-20 text-zinc-600 mb-4" />
                        <h3 className="text-xl font-bold text-white">Chef is Waiting</h3>
                        <p className="text-zinc-400">Provide ingredients to start cooking.</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-2xl font-bold text-white leading-tight">{recipe.name}</h3>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded text-xs font-bold border border-emerald-500/30">
                                        Score: {recipe.predictedMetabolicScore}/100
                                    </div>
                                </div>
                            </div>
                            <p className="text-zinc-400 text-sm italic">{recipe.description}</p>
                        </div>

                        <div className="flex gap-4 text-xs font-mono text-zinc-500 border-y border-white/10 py-3">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {recipe.cookingTime}</span>
                            <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {recipe.macros.calories} kcal</span>
                            <span className="text-orange-400 font-bold">Bio-Hacked</span>
                        </div>

                        {/* Bio Hacks */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-mono text-orange-400 uppercase tracking-widest">Metabolic Optimizations</h4>
                            <ul className="space-y-1">
                                {recipe.bioHacks.map((hack, i) => (
                                    <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                                        <Zap className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                                        {hack}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-xs font-mono text-zinc-500 uppercase mb-2">Ingredients</h4>
                                <ul className="text-sm text-zinc-300 space-y-1 list-disc pl-4">
                                    {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                                </ul>
                            </div>
                            <div>
                                 <h4 className="text-xs font-mono text-zinc-500 uppercase mb-2">Instructions</h4>
                                 <ol className="text-sm text-zinc-300 space-y-2 list-decimal pl-4">
                                     {recipe.instructions.map((step, i) => <li key={i}>{step}</li>)}
                                 </ol>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button 
                                onClick={() => onSimulateRecipe(recipe.name)}
                                className="flex-1 py-3 bg-white/5 hover:bg-emerald-500 hover:text-black border border-white/10 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                            >
                                <Play className="w-4 h-4 fill-current" /> Simulate
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={justSaved || isRecipeSaved}
                                className={`flex-1 py-3 border border-white/10 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                                    justSaved || isRecipeSaved 
                                    ? 'bg-orange-500/20 text-orange-400 cursor-default' 
                                    : 'bg-white/5 hover:bg-orange-500 hover:text-white text-zinc-300'
                                }`}
                            >
                                {justSaved || isRecipeSaved ? <Check className="w-4 h-4" /> : <BookHeart className="w-4 h-4" />}
                                {justSaved || isRecipeSaved ? 'Saved' : 'Save Recipe'}
                            </button>
                        </div>

                    </div>
                )}
            </div>

        </div>

        {/* Saved Recipes Sidebar (Overlay) */}
        {showSaved && (
            <div className="absolute inset-y-0 right-0 w-80 bg-[#121216] border-l border-white/10 shadow-2xl z-20 animate-in slide-in-from-right duration-300 flex flex-col">
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-surface">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-orange-500" />
                        Saved Recipes
                    </h3>
                    <button onClick={() => setShowSaved(false)} className="text-zinc-500 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {savedRecipes.length === 0 ? (
                        <div className="text-center text-zinc-500 py-10 text-sm">
                            No recipes saved yet.
                        </div>
                    ) : (
                        savedRecipes.map((r, i) => (
                            <div 
                                key={i} 
                                onClick={() => {
                                    setRecipe(r);
                                    setShowSaved(false);
                                    setJustSaved(false); // Reset just saved state when loading old recipe
                                }}
                                className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg p-3 cursor-pointer transition-colors group"
                            >
                                <div className="font-bold text-sm text-zinc-200 mb-1 group-hover:text-orange-400 transition-colors">{r.name}</div>
                                <div className="flex justify-between items-center text-[10px] text-zinc-500">
                                    <span>{r.cookingTime}</span>
                                    <span className="font-mono text-emerald-400">{r.predictedMetabolicScore}/100</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}
    </div>
  );
};