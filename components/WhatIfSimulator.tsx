import React, { useState } from 'react';
import { generateScenarios, generateLifestyleProjection, generateStressScenarios, generateFutureSelfProjection } from '../services/groqService';
import { Scenario, LifestyleProjection, FutureSelfProjection } from '../types';
import { ArrowRight, BarChart2, Calendar, Check, ChevronRight, FlaskConical, TrendingUp, X, Activity, UserPlus, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, Cell } from 'recharts';
import { INITIAL_USER_PROFILE } from '../App';

interface WhatIfSimulatorProps {
  currentMealName?: string;
}

const ScenarioCard: React.FC<{ scenario: Scenario }> = ({ scenario }) => {
  // Determine style based on type
  let borderColor = 'border-white/5';
  let bgColor = 'bg-white/5';
  let textColor = 'text-zinc-400';
  let gradient = '';

  if (scenario.type === 'Current' || scenario.type === 'Baseline') {
      borderColor = 'border-primary/30';
      bgColor = 'bg-primary/5';
      textColor = 'text-primary';
      gradient = 'bg-gradient-to-br from-primary/10 to-transparent';
  } else if (scenario.type === 'Alternative' || scenario.type === 'Post-Workout') {
      borderColor = 'border-secondary/30';
      bgColor = 'bg-secondary/5';
      textColor = 'text-secondary';
      gradient = 'bg-gradient-to-br from-secondary/10 to-transparent';
  } else if (scenario.type === 'Sleep Deprived') {
      borderColor = 'border-rose-500/30';
      bgColor = 'bg-rose-500/5';
      textColor = 'text-rose-400';
      gradient = 'bg-gradient-to-br from-rose-500/10 to-transparent';
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
      className={`glass-panel p-5 rounded-2xl border ${borderColor} flex flex-col gap-3 relative overflow-hidden transition-all`}
    >
      <div className={`absolute inset-0 ${gradient} opacity-50`} />
      
      <div className="flex justify-between items-start z-10">
          <div>
              <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${borderColor} ${textColor} bg-black/20`}>
                  {scenario.type}
              </span>
              <h3 className="font-bold text-lg mt-3 leading-tight text-white">{scenario.name}</h3>
          </div>
          <div className={`text-3xl font-black ${textColor} tracking-tighter`}>
              {scenario.metrics.metabolicScore}
          </div>
      </div>
      
      <p className="text-xs text-zinc-400 min-h-[40px] z-10 font-light leading-relaxed">{scenario.description}</p>
      
      <div className="grid grid-cols-2 gap-2 mt-2 z-10">
          <div className="bg-black/30 p-2 rounded-xl backdrop-blur-sm">
              <div className="text-[9px] text-zinc-500 uppercase tracking-wide">Energy</div>
              <div className="text-sm font-mono font-bold text-white">{scenario.metrics.energyLevel}/100</div>
          </div>
          <div className="bg-black/30 p-2 rounded-xl backdrop-blur-sm">
              <div className="text-[9px] text-zinc-500 uppercase tracking-wide">Productivity</div>
              <div className={`text-sm font-mono font-bold ${scenario.metrics.productivity > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {scenario.metrics.productivity > 0 ? '+' : ''}{scenario.metrics.productivity}%
              </div>
          </div>
      </div>

      {scenario.metrics.crashTime && (
          <div className="flex items-center gap-2 text-xs text-rose-400 font-bold bg-rose-500/10 p-2 rounded-lg border border-rose-500/20 z-10">
              <TrendingUp className="w-3 h-3 rotate-180" /> Crash Risk: {scenario.metrics.crashTime}
          </div>
      )}
    </motion.div>
  );
};

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ currentMealName }) => {
  const [activeTab, setActiveTab] = useState<'meal' | 'lifestyle' | 'stress' | 'future'>('meal');
  const [loading, setLoading] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[] | null>(null);
  const [stressScenarios, setStressScenarios] = useState<Scenario[] | null>(null);
  const [lifestyleResults, setLifestyleResults] = useState<LifestyleProjection[] | null>(null);
  const [futureSelfResults, setFutureSelfResults] = useState<FutureSelfProjection[] | null>(null);
  const [habitInput, setHabitInput] = useState('');

  const handleRunScenarios = async () => {
    if (!currentMealName) return;
    setLoading(true);
    try {
      const data = await generateScenarios(currentMealName);
      setScenarios(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleRunStressTest = async () => {
    if (!currentMealName) return;
    setLoading(true);
    try {
        const mockProfile = INITIAL_USER_PROFILE; 
        const data = await generateStressScenarios(currentMealName, mockProfile);
        setStressScenarios(data);
    } catch (e) {
        console.error(e);
    }
    setLoading(false);
  };

  const handleRunFutureSelf = async () => {
      if (!currentMealName) return;
      setLoading(true);
      try {
          const data = await generateFutureSelfProjection(currentMealName);
          setFutureSelfResults(data);
      } catch (e) {
          console.error(e);
      }
      setLoading(false);
  };

  const handleRunLifestyle = async () => {
    if (!habitInput) return;
    setLoading(true);
    try {
      const data = await generateLifestyleProjection(habitInput);
      setLifestyleResults(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="glass-panel border border-white/5 rounded-3xl p-6 h-full flex flex-col shadow-2xl">
      {/* Header Tabs */}
      <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4 overflow-x-auto custom-scrollbar">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 flex-shrink-0 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <FlaskConical className="w-5 h-5" />
        </div>
        <div className="flex gap-1 bg-black/30 p-1.5 rounded-xl whitespace-nowrap backdrop-blur-md">
            <button 
                onClick={() => setActiveTab('meal')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'meal' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-white'}`}
            >
                Comparison
            </button>
            <button 
                onClick={() => setActiveTab('stress')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'stress' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-white'}`}
            >
                Stress Test
            </button>
            <button 
                onClick={() => setActiveTab('future')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'future' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-white'}`}
            >
                Future Self
            </button>
            <button 
                onClick={() => setActiveTab('lifestyle')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'lifestyle' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-white'}`}
            >
                Lifestyle
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-[400px] custom-scrollbar pr-2">
        {activeTab === 'meal' && (
            <div className="space-y-6">
                {!scenarios ? (
                    <div className="text-center py-10 space-y-6">
                         <div className="inline-block p-6 rounded-full bg-white/5 mb-2 border border-white/5">
                             <BarChart2 className="w-10 h-10 text-zinc-500" />
                         </div>
                         <h3 className="text-xl font-bold text-white">Compare Alternatives</h3>
                         <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                            Analyze "{currentMealName || 'your meal'}" against healthy and modified alternatives to see predicted metabolic outcomes.
                         </p>
                         <button 
                            onClick={handleRunScenarios}
                            disabled={!currentMealName || loading}
                            className="glass-button bg-primary/80 hover:bg-primary text-black px-8 py-3 rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto shadow-[0_0_20px_rgba(0,245,225,0.3)]"
                         >
                            {loading ? 'Simulating...' : 'Run Analysis'}
                         </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {scenarios.map(s => <ScenarioCard key={s.id} scenario={s} />)}
                        <button 
                           onClick={() => setScenarios(null)} 
                           className="md:col-span-3 text-xs text-zinc-500 hover:text-white mt-4 underline text-center"
                        >
                           Reset Analysis
                        </button>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'stress' && (
            <div className="space-y-6">
                {!stressScenarios ? (
                    <div className="text-center py-10 space-y-6">
                         <div className="inline-block p-6 rounded-full bg-rose-500/5 mb-2 border border-rose-500/10">
                             <Activity className="w-10 h-10 text-rose-500/50" />
                         </div>
                         <h3 className="text-xl font-bold text-white">Physiological Stress Test</h3>
                         <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                            Simulate how this exact meal impacts your body differently when you are Sleep Deprived or Post-Workout compared to Baseline.
                         </p>
                         <button 
                            onClick={handleRunStressTest}
                            disabled={!currentMealName || loading}
                            className="glass-button bg-rose-500 hover:bg-rose-400 text-white px-8 py-3 rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                         >
                            {loading ? 'Running Sim...' : 'Run Stress Test'}
                         </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {stressScenarios.map(s => <ScenarioCard key={s.id} scenario={s} />)}
                        <button 
                           onClick={() => setStressScenarios(null)} 
                           className="md:col-span-3 text-xs text-zinc-500 hover:text-white mt-4 underline text-center"
                        >
                           Reset Analysis
                        </button>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'future' && (
             <div className="space-y-6">
                {!futureSelfResults ? (
                     <div className="text-center py-10 space-y-6">
                        <div className="inline-block p-6 rounded-full bg-indigo-500/5 mb-2 border border-indigo-500/10">
                            <UserPlus className="w-10 h-10 text-indigo-400/50" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Future Self Projection</h3>
                        <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                           See the cumulative impact of eating this meal (3x/week) over the next 1, 5, and 10 years.
                        </p>
                        <button 
                            onClick={handleRunFutureSelf}
                            disabled={!currentMealName || loading}
                            className="glass-button bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-full font-bold disabled:opacity-50 flex items-center gap-2 mx-auto shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                        >
                            {loading ? 'Projecting...' : 'View Future Impact'}
                        </button>
                   </div>
                ) : (
                    <div className="space-y-6">
                         <h3 className="font-mono text-xs text-zinc-500 uppercase tracking-[0.2em] text-center">
                            Long-Term Trajectory: {currentMealName}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {futureSelfResults.map((res, i) => (
                                <div key={i} className="glass-panel p-6 rounded-2xl relative flex flex-col gap-3 group hover:border-indigo-500/30 transition-colors">
                                     <div className="absolute top-4 right-4 text-indigo-500/10 group-hover:text-indigo-500/20 transition-colors">
                                         <Clock className="w-16 h-16" />
                                     </div>
                                     <div className="text-xs text-indigo-400 font-bold uppercase tracking-widest">{res.period}</div>
                                     
                                     <div className="text-4xl font-black text-white mt-2 tracking-tighter">
                                        {res.weightChange > 0 ? '+' : ''}{res.weightChange}kg
                                     </div>
                                     
                                     <div className="space-y-1 my-2 relative z-10">
                                         {res.biomarkerDrift.map((drift, k) => (
                                             <div key={k} className="text-[10px] font-mono px-2 py-1 rounded bg-black/40 text-zinc-300 border border-white/5 inline-block mr-1">
                                                 {drift}
                                             </div>
                                         ))}
                                     </div>

                                     <p className="text-xs text-zinc-500 leading-relaxed font-light border-t border-white/5 pt-3">
                                         "{res.description}"
                                     </p>
                                </div>
                            ))}
                        </div>
                        
                        <button 
                           onClick={() => setFutureSelfResults(null)} 
                           className="w-full text-xs text-zinc-500 hover:text-white mt-2 underline text-center"
                        >
                           Run New Projection
                        </button>
                    </div>
                )}
             </div>
        )}

        {activeTab === 'lifestyle' && (
            <div className="space-y-6">
                {!lifestyleResults ? (
                     <div className="text-center py-10 space-y-6">
                        <div className="inline-block p-6 rounded-full bg-white/5 mb-2 border border-white/5">
                            <Calendar className="w-10 h-10 text-zinc-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Project Future Impact</h3>
                        <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                           Enter a habit (e.g. "Walk 15 mins after dinner daily") to simulate its biological impact over 6 months.
                        </p>
                        <div className="flex max-w-md mx-auto gap-3">
                            <input 
                                value={habitInput}
                                onChange={(e) => setHabitInput(e.target.value)}
                                placeholder="Enter a habit..."
                                className="flex-1 glass-input rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:ring-1 focus:ring-primary outline-none"
                            />
                            <button 
                                onClick={handleRunLifestyle}
                                disabled={!habitInput || loading}
                                className="glass-button bg-primary text-black px-5 py-3 rounded-xl font-bold disabled:opacity-50 shadow-[0_0_15px_rgba(0,245,225,0.2)]"
                            >
                                {loading ? '...' : <ArrowRight className="w-5 h-5" />}
                            </button>
                        </div>
                   </div>
                ) : (
                    <div className="space-y-6">
                        <h3 className="font-mono text-xs text-zinc-500 uppercase tracking-[0.2em] text-center">Projection: {habitInput}</h3>
                        
                        <div className="grid grid-cols-3 gap-4">
                            {lifestyleResults.map((res, i) => (
                                <div key={i} className="glass-panel p-4 rounded-2xl relative overflow-hidden text-center">
                                     <div className="text-xs text-zinc-500 mb-2 font-bold uppercase">{res.period}</div>
                                     <div className="text-2xl font-black text-white mb-2 tracking-tight">
                                        {res.weightChange > 0 ? '+' : ''}{res.weightChange}kg
                                     </div>
                                     <div className={`text-[10px] font-bold px-2 py-1 rounded-full inline-block ${res.hba1cChange <= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                        HbA1c {res.hba1cChange > 0 ? '+' : ''}{res.hba1cChange}%
                                     </div>
                                </div>
                            ))}
                        </div>

                        <div className="h-48 glass-panel rounded-2xl p-5">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={lifestyleResults}>
                                    <XAxis dataKey="period" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'rgba(20, 20, 24, 0.8)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px' }}
                                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                    />
                                    <ReferenceLine y={0} stroke="#52525b" />
                                    <Bar dataKey="weightChange" name="Weight Change (kg)" radius={[6, 6, 0, 0]}>
                                        {lifestyleResults.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.weightChange > 0 ? '#FF2E63' : '#00F5E1'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                         <button 
                           onClick={() => setLifestyleResults(null)} 
                           className="w-full text-xs text-zinc-500 hover:text-white mt-4 underline text-center"
                        >
                           Run New Projection
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};