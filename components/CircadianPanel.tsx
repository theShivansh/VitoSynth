
import React from 'react';
import { CircadianImpact } from '../types';
import { Clock, Moon, Sun, Battery, Zap, AlertTriangle } from 'lucide-react';

interface CircadianPanelProps {
  data: CircadianImpact;
}

export const CircadianPanel: React.FC<CircadianPanelProps> = ({ data }) => {
  // Calculate marker positions (rough estimate based on current time for demo visualization)
  const currentHour = new Date().getHours();
  const markerPosition = (currentHour / 24) * 100;

  return (
    <div className="bg-surface rounded-2xl p-6 border border-white/5 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-400" />
            Circadian Optimizer
        </h3>
        <div className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${
            data.timingScore >= 80 ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' :
            data.timingScore >= 50 ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' :
            'border-rose-500/30 text-rose-400 bg-rose-500/10'
        }`}>
            Timing Score: {data.timingScore}/100
        </div>
      </div>

      {/* Visual Timeline */}
      <div className="relative pt-4 pb-2">
          <div className="h-4 bg-gradient-to-r from-indigo-900 via-yellow-500 to-indigo-900 rounded-full w-full opacity-30"></div>
          
          {/* Optimal Window Indicator */}
          <div 
             className="absolute top-4 h-4 bg-emerald-500/40 border border-emerald-500/60 rounded-full"
             style={{ left: '25%', width: '50%' }} // Static visual for now (8am-8pm), ideally parsed from data.optimalWindow
          ></div>

          {/* Current Time Marker */}
          <div 
             className="absolute top-2 w-1 h-8 bg-white border border-black shadow-lg z-10"
             style={{ left: `${markerPosition}%` }}
          >
             <div className="absolute -top-4 -left-3 text-[10px] font-bold bg-white text-black px-1 rounded">NOW</div>
          </div>

          <div className="flex justify-between text-[10px] text-zinc-500 mt-2 font-mono">
              <span>00:00</span>
              <span>12:00</span>
              <span>24:00</span>
          </div>
          
          <div className="text-center mt-1 text-xs text-emerald-400 font-medium">
             Optimal Window: {data.optimalWindow}
          </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
          <div className="bg-indigo-900/20 p-3 rounded-xl border border-indigo-500/20 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-indigo-300 text-xs uppercase font-bold">
                  <Moon className="w-4 h-4" /> Sleep Quality
              </div>
              <div className="text-white font-medium">{data.sleepQualityPrediction}</div>
              <div className="text-[10px] text-zinc-400">Melatonin suppression: {data.melatoninSuppression}%</div>
          </div>

          <div className="bg-orange-900/20 p-3 rounded-xl border border-orange-500/20 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-orange-300 text-xs uppercase font-bold">
                  <Battery className="w-4 h-4" /> Energy Impact
              </div>
              <div className="text-white font-medium truncate" title={data.energyImpact}>{data.energyImpact}</div>
          </div>
      </div>

      {/* Recommendation */}
      <div className="flex gap-3 items-start bg-white/5 p-3 rounded-lg border border-white/5">
          <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-zinc-300">
             <span className="text-white font-bold block text-xs uppercase mb-1">Timing Advice</span>
             {data.recommendation}
          </div>
      </div>

    </div>
  );
};
