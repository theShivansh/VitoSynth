
import React from 'react';
import { GeneticProfile } from '../types';
import { Activity, AlertTriangle, Coffee, Dna, Utensils } from 'lucide-react';

interface GeneticInsightsPanelProps {
  data: GeneticProfile;
}

export const GeneticInsightsPanel: React.FC<GeneticInsightsPanelProps> = ({ data }) => {
  return (
    <div className="bg-surface rounded-xl p-6 border border-white/5 space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-2">
      
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
          <Dna className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Pharmacogenomic Blueprint</h3>
          <p className="text-xs text-zinc-400">Personalized nutrition based on your DNA</p>
        </div>
      </div>

      <div className="bg-white/5 p-4 rounded-lg text-sm text-zinc-300 italic border border-white/10">
        "{data.summary}"
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Risk Indicators */}
        <div className="space-y-3">
            <h4 className="text-xs font-mono text-zinc-500 uppercase">Key Sensitivities</h4>
            
            <div className="bg-black/20 p-3 rounded-lg flex justify-between items-center border border-white/5">
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-medium">Obesity Risk</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded uppercase font-bold ${
                    data.obesityRisk === 'high' ? 'bg-rose-500/20 text-rose-400' : 
                    data.obesityRisk === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                    {data.obesityRisk}
                </span>
            </div>

            <div className="bg-black/20 p-3 rounded-lg flex justify-between items-center border border-white/5">
                <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-medium">Sat. Fat Sensitivity</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded uppercase font-bold ${
                    data.saturatedFatSensitivity === 'high' ? 'bg-rose-500/20 text-rose-400' : 
                    data.saturatedFatSensitivity === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                    {data.saturatedFatSensitivity}
                </span>
            </div>

            <div className="bg-black/20 p-3 rounded-lg flex justify-between items-center border border-white/5">
                <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-medium">Caffeine Metab.</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded uppercase font-bold ${
                    data.caffeineSensitivity === 'slow' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                    {data.caffeineSensitivity}
                </span>
            </div>
        </div>

        {/* Macro Plan */}
        <div className="space-y-3">
             <h4 className="text-xs font-mono text-zinc-500 uppercase">Optimized Macros</h4>
             <div className="grid grid-cols-3 gap-2">
                 <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg text-center">
                     <div className="text-xs text-primary mb-1">Protein</div>
                     <div className="font-bold text-white text-sm">{data.macroRecommendations.protein}</div>
                 </div>
                 <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-center">
                     <div className="text-xs text-emerald-400 mb-1">Carbs</div>
                     <div className="font-bold text-white text-sm">{data.macroRecommendations.carbs}</div>
                 </div>
                 <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg text-center">
                     <div className="text-xs text-yellow-400 mb-1">Fats</div>
                     <div className="font-bold text-white text-sm">{data.macroRecommendations.fat}</div>
                 </div>
             </div>
        </div>
      </div>

      {/* Gene Detail Cards */}
      <div>
         <h4 className="text-xs font-mono text-zinc-500 uppercase mb-3">Identified Variants</h4>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.variants.map((v, i) => (
                <div key={i} className="border border-white/10 bg-white/5 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-indigo-400">{v.gene}</span>
                        <span className="text-xs bg-black/40 px-2 py-0.5 rounded text-zinc-400">{v.variant}</span>
                    </div>
                    <div className="text-xs text-zinc-300 leading-tight">{v.implication}</div>
                </div>
            ))}
         </div>
      </div>

    </div>
  );
};
