
import React, { useState, useRef } from 'react';
import { UserProfile, GeneticProfile } from '../types';
import { Save, UserCircle, Upload, Dna, RefreshCw, Clock, Moon, FileText } from 'lucide-react';
import { analyzeGeneticData } from '../services/groqService';
import { GeneticInsightsPanel } from './GeneticInsightsPanel';

interface HealthProfileManagerProps {
  profile: UserProfile;
  onUpdate: (newProfile: UserProfile) => void;
}

export const HealthProfileManager: React.FC<HealthProfileManagerProps> = ({ profile, onUpdate }) => {
  const [dnaInput, setDnaInput] = useState('');
  const [analyzingDna, setAnalyzingDna] = useState(false);
  const [dnaError, setDnaError] = useState<string | null>(null);
  const dnaFileRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof UserProfile, value: any) => {
    onUpdate({ ...profile, [field]: value });
  };

  const handleArrayChange = (field: 'conditions' | 'dietaryRestrictions' | 'goals', value: string) => {
    const array = value.split(',').map(s => s.trim());
    onUpdate({ ...profile, [field]: array });
  };

  const handleAnalyzeDna = async () => {
    if (!dnaInput) return;
    setAnalyzingDna(true);
    setDnaError(null);
    try {
        const geneticProfile = await analyzeGeneticData(dnaInput);
        onUpdate({ ...profile, genetics: geneticProfile });
    } catch (e) {
        setDnaError("Could not analyze DNA data. Please ensure format is readable.");
    }
    setAnalyzingDna(false);
  };

  const handleDnaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        // Truncate to ~200KB for UI performance, usually enough for key SNPs if header is stripped or relevant parts included
        // Gemini has large context, but React textarea can lag with massive strings.
        setDnaInput(text.slice(0, 200000)); 
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="bg-surface rounded-2xl p-6 border border-white/5 shadow-xl max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 mb-10">
      <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
          <UserCircle className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Health Profile</h2>
          <p className="text-zinc-500 text-sm">Update your biometrics to improve simulation accuracy</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Biometrics */}
        <div className="space-y-4">
          <h3 className="text-sm font-mono text-primary uppercase tracking-wider">Biometrics</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Age</label>
              <input 
                type="number" 
                value={profile.age} 
                onChange={e => handleChange('age', Number(e.target.value))}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Gender</label>
              <select 
                value={profile.gender}
                onChange={e => handleChange('gender', e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Weight (kg)</label>
              <input 
                type="number" 
                value={profile.weight} 
                onChange={e => handleChange('weight', Number(e.target.value))}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Height (cm)</label>
              <input 
                type="number" 
                value={profile.height} 
                onChange={e => handleChange('height', Number(e.target.value))}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none"
              />
            </div>
          </div>

           <div>
              <label className="block text-xs text-zinc-400 mb-1">Activity Level</label>
              <select 
                value={profile.activityLevel}
                onChange={e => handleChange('activityLevel', e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none"
              >
                <option value="sedentary">Sedentary (Office job)</option>
                <option value="light">Lightly Active (1-2 days/week)</option>
                <option value="moderate">Moderately Active (3-5 days/week)</option>
                <option value="active">Active (6-7 days/week)</option>
                <option value="athlete">Athlete (2x per day)</option>
              </select>
            </div>
        </div>

        {/* Medical & Goals */}
        <div className="space-y-4">
          <h3 className="text-sm font-mono text-emerald-400 uppercase tracking-wider">Medical & Goals</h3>
          
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Conditions (comma separated)</label>
            <input 
              type="text" 
              value={profile.conditions.join(', ')}
              onChange={e => handleArrayChange('conditions', e.target.value)}
              placeholder="e.g. Pre-diabetes, Hypertension"
              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Dietary Restrictions</label>
            <input 
              type="text" 
              value={profile.dietaryRestrictions.join(', ')}
              onChange={e => handleArrayChange('dietaryRestrictions', e.target.value)}
              placeholder="e.g. Gluten-free, Vegan"
              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Health Goals</label>
            <textarea 
              value={profile.goals.join(', ')}
              onChange={e => handleArrayChange('goals', e.target.value)}
              placeholder="e.g. Lose 5kg, Improve energy, Lower A1C"
              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-emerald-400 focus:outline-none h-24 resize-none"
            />
          </div>
          
           <div>
              <label className="block text-xs text-zinc-400 mb-1">Target Calories</label>
              <input 
                type="number" 
                value={profile.targetCalories || 2000} 
                onChange={e => handleChange('targetCalories', Number(e.target.value))}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>
        </div>

        {/* Circadian Settings (New) */}
        <div className="space-y-4 md:col-span-2 border-t border-white/10 pt-4">
             <h3 className="text-sm font-mono text-orange-400 uppercase tracking-wider flex items-center gap-2">
                 <Clock className="w-4 h-4" /> Circadian Profile
             </h3>
             <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs text-zinc-400 mb-1">Chronotype</label>
                    <select 
                        value={profile.chronotype || 'intermediate'}
                        onChange={e => handleChange('chronotype', e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-orange-400 focus:outline-none"
                    >
                        <option value="early_bird">Early Bird (Lark)</option>
                        <option value="night_owl">Night Owl</option>
                        <option value="intermediate">Intermediate</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs text-zinc-400 mb-1">Typical Sleep Window</label>
                    <div className="relative">
                        <Moon className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                        <input 
                            type="text" 
                            value={profile.sleepWindow || '23:00-07:00'}
                            onChange={e => handleChange('sleepWindow', e.target.value)}
                            placeholder="e.g. 23:00-07:00"
                            className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white focus:border-orange-400 focus:outline-none"
                        />
                    </div>
                 </div>
             </div>
        </div>
      </div>
      
      {/* DNA Integration Section */}
      <div className="mt-8 border-t border-white/10 pt-6">
        <h3 className="text-sm font-mono text-indigo-400 uppercase tracking-wider flex items-center gap-2 mb-4">
            <Dna className="w-4 h-4" /> Genetic Integration (Pharmacogenomics)
        </h3>
        
        {!profile.genetics ? (
            <div className="bg-indigo-500/5 rounded-xl p-4 border border-indigo-500/20">
                <p className="text-sm text-zinc-300 mb-3">
                    Upload or paste raw 23andMe/AncestryDNA data or a summary of your key variants to personalize your metabolic model.
                </p>
                
                <div className="flex gap-2 mb-3">
                    <button
                        onClick={() => dnaFileRef.current?.click()}
                        className="bg-white/5 hover:bg-white/10 text-zinc-300 px-3 py-2 rounded-lg text-xs font-medium border border-white/10 flex items-center gap-2 transition-colors"
                    >
                        <Upload className="w-3 h-3" /> Upload Raw Data File (.txt)
                    </button>
                    <input 
                        type="file"
                        ref={dnaFileRef}
                        className="hidden"
                        accept=".txt,.csv"
                        onChange={handleDnaFileChange}
                    />
                </div>

                <textarea 
                    value={dnaInput}
                    onChange={(e) => setDnaInput(e.target.value)}
                    placeholder="e.g. rs9939609 AA, rs7412 CC... OR 'I have the FTO obesity gene and I am a slow caffeine metabolizer'"
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:outline-none h-32 text-xs font-mono resize-none mb-3"
                />
                <button 
                    onClick={handleAnalyzeDna}
                    disabled={analyzingDna || !dnaInput}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
                >
                    {analyzingDna ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    {analyzingDna ? 'Analyzing Genome...' : 'Analyze DNA Data'}
                </button>
                {dnaError && <p className="text-rose-400 text-xs mt-2">{dnaError}</p>}
            </div>
        ) : (
             <GeneticInsightsPanel data={profile.genetics} />
        )}

         {profile.genetics && (
            <button 
                onClick={() => onUpdate({ ...profile, genetics: undefined })}
                className="text-xs text-zinc-500 hover:text-white mt-4 underline"
            >
                Reset Genetic Data
            </button>
         )}

      </div>
    </div>
  );
};
