
import React, { useState } from 'react';
import { MicrobiomeData, UserProfile } from '../types';
import { ArrowDown, ArrowUp, Check, Database, Droplets, Minus, ShieldAlert, Sparkles, TestTube, CheckCircle } from 'lucide-react';

interface MicrobiomePanelProps {
  data: MicrobiomeData;
  userProfile?: UserProfile;
  onConnect?: (provider: 'Viome' | 'ZOE' | 'Thryve') => void;
}

export const MicrobiomePanel: React.FC<MicrobiomePanelProps> = ({ data, userProfile, onConnect }) => {
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = (provider: 'Viome' | 'ZOE' | 'Thryve') => {
    setConnecting(provider);
    setTimeout(() => {
        if (onConnect) onConnect(provider);
        setConnecting(null);
    }, 1500);
  };

  const connectedProvider = userProfile?.microbiomeProfile?.provider;

  return (
    <div className="bg-surface rounded-2xl p-6 border border-white/5 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Microbiome Predictor
        </h3>
        <div className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${
            data.overallTrend === 'improving' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' :
            data.overallTrend === 'deteriorating' ? 'border-rose-500/30 text-rose-400 bg-rose-500/10' :
            'border-zinc-500/30 text-zinc-400 bg-zinc-500/10'
        }`}>
            {data.overallTrend}
        </div>
      </div>

      {connectedProvider && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 p-2 rounded-lg flex items-center gap-2 text-xs text-indigo-300">
              <CheckCircle className="w-4 h-4 text-indigo-400" />
              Using baseline data from {connectedProvider} (Diversity: {userProfile.microbiomeProfile?.diversityPercentile}%)
          </div>
      )}

      {/* Scores Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/5 p-2 rounded-lg text-center border border-white/5">
            <div className="text-[10px] text-zinc-500 uppercase">Diversity</div>
            <div className="text-xl font-black text-white">{data.diversityScore}</div>
        </div>
        <div className="bg-white/5 p-2 rounded-lg text-center border border-white/5">
            <div className="text-[10px] text-zinc-500 uppercase">Prebiotic</div>
            <div className="text-xl font-black text-emerald-400">{data.prebioticScore}</div>
        </div>
        <div className="bg-white/5 p-2 rounded-lg text-center border border-white/5">
            <div className="text-[10px] text-zinc-500 uppercase">Probiotic</div>
            <div className="text-xl font-black text-blue-400">{data.probioticScore}</div>
        </div>
      </div>

      {/* Bacterial Shifts */}
      <div>
        <h4 className="text-xs font-mono text-muted uppercase mb-3">Strain Level Impact</h4>
        <div className="space-y-2">
            {data.bacterialShifts.map((strain, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm bg-black/20 p-2 rounded border border-white/5">
                    <div className="flex flex-col">
                        <span className="font-medium text-zinc-200">{strain.name}</span>
                        <span className="text-[10px] text-zinc-500">{strain.mechanism}</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                             strain.category === 'beneficial' ? 'bg-emerald-500/20 text-emerald-400' :
                             strain.category === 'harmful' ? 'bg-rose-500/20 text-rose-400' : 'bg-zinc-500/20 text-zinc-400'
                         }`}>
                             {strain.category}
                         </span>
                         {strain.change === 'increase' ? <ArrowUp className="w-4 h-4 text-zinc-400" /> : 
                          strain.change === 'decrease' ? <ArrowDown className="w-4 h-4 text-zinc-400" /> : 
                          <Minus className="w-4 h-4 text-zinc-400" />}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* SCFA Production (New) */}
      {data.scfaProduction && (
        <div className="grid grid-cols-2 gap-3">
             <div className="bg-white/5 p-2 rounded border border-white/5">
                 <div className="text-[10px] text-zinc-500 uppercase mb-1">Butyrate</div>
                 <div className={`text-sm font-bold flex items-center gap-2 ${
                     data.scfaProduction.butyrate === 'increase' ? 'text-emerald-400' : 
                     data.scfaProduction.butyrate === 'decrease' ? 'text-rose-400' : 'text-zinc-400'
                 }`}>
                     {data.scfaProduction.butyrate === 'increase' ? <ArrowUp className="w-4 h-4" /> : 
                      data.scfaProduction.butyrate === 'decrease' ? <ArrowDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                     {data.scfaProduction.butyrate.toUpperCase()}
                 </div>
             </div>
             <div className="bg-white/5 p-2 rounded border border-white/5">
                 <div className="text-[10px] text-zinc-500 uppercase mb-1">Acetate</div>
                 <div className={`text-sm font-bold flex items-center gap-2 ${
                     data.scfaProduction.acetate === 'increase' ? 'text-emerald-400' : 
                     data.scfaProduction.acetate === 'decrease' ? 'text-rose-400' : 'text-zinc-400'
                 }`}>
                     {data.scfaProduction.acetate === 'increase' ? <ArrowUp className="w-4 h-4" /> : 
                      data.scfaProduction.acetate === 'decrease' ? <ArrowDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                     {data.scfaProduction.acetate.toUpperCase()}
                 </div>
             </div>
        </div>
      )}

      {/* Inflammation Markers */}
      <div className={`border p-3 rounded-xl flex items-start gap-3 ${
          data.inflammation.level === 'high' ? 'bg-rose-500/10 border-rose-500/20' : 
          data.inflammation.level === 'moderate' ? 'bg-orange-500/10 border-orange-500/20' : 
          'bg-emerald-500/5 border-emerald-500/10'
      }`}>
          <ShieldAlert className={`w-4 h-4 mt-1 ${
               data.inflammation.level === 'high' ? 'text-rose-400' : 
               data.inflammation.level === 'moderate' ? 'text-orange-400' : 
               'text-emerald-400'
          }`} />
          <div className="flex-1">
              <div className={`text-xs font-bold uppercase mb-1 ${
                    data.inflammation.level === 'high' ? 'text-rose-300' : 
                    data.inflammation.level === 'moderate' ? 'text-orange-300' : 
                    'text-emerald-300'
              }`}>Inflammation: {data.inflammation.level}</div>
              <div className="flex gap-2 flex-wrap">
                {data.inflammation.markers.length > 0 ? data.inflammation.markers.map((marker, i) => (
                    <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-black/20 text-zinc-300">
                        {marker}
                    </span>
                )) : <span className="text-[10px] text-zinc-500">No elevated markers predicted</span>}
              </div>
          </div>
      </div>

      {/* Integrations */}
      {!connectedProvider && (
          <div className="pt-2 border-t border-white/5">
            <h4 className="text-[10px] font-mono text-zinc-500 uppercase mb-3">Sync Baseline Data</h4>
            <div className="flex gap-2">
                <button 
                    onClick={() => handleConnect('Viome')}
                    disabled={!!connecting}
                    className="flex-1 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-400 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                    {connecting === 'Viome' ? <Sparkles className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
                    {connecting === 'Viome' ? 'Syncing...' : 'Viome'}
                </button>
                <button 
                    onClick={() => handleConnect('ZOE')}
                    disabled={!!connecting}
                    className="flex-1 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-400 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                    {connecting === 'ZOE' ? <Sparkles className="w-3 h-3 animate-spin" /> : <Droplets className="w-3 h-3" />}
                    {connecting === 'ZOE' ? 'Syncing...' : 'ZOE'}
                </button>
                <button 
                    onClick={() => handleConnect('Thryve')}
                    disabled={!!connecting}
                    className="flex-1 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-400 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                    {connecting === 'Thryve' ? <Sparkles className="w-3 h-3 animate-spin" /> : <TestTube className="w-3 h-3" />}
                    {connecting === 'Thryve' ? 'Syncing...' : 'Thryve'}
                </button>
            </div>
          </div>
      )}

    </div>
  );
};
