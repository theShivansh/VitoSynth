
import React from 'react';
import { FastingData } from '../types';
import { Activity, Battery, Flame, RefreshCcw, Timer, Zap } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface FastingTrackerProps {
  data: FastingData | null;
  loading: boolean;
  onRefresh: () => void;
}

export const FastingTracker: React.FC<FastingTrackerProps> = ({ data, loading, onRefresh }) => {
  if (loading) {
      return (
          <div className="bg-surface rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center h-full min-h-[400px]">
               <RefreshCcw className="w-10 h-10 text-primary animate-spin mb-4" />
               <p className="text-zinc-400">Analyzing biological state...</p>
          </div>
      );
  }

  if (!data) {
      return (
          <div className="bg-surface rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center h-full min-h-[400px]">
               <Timer className="w-16 h-16 text-zinc-600 mb-4" />
               <p className="text-zinc-400">Log a meal to start tracking fasting status.</p>
          </div>
      );
  }

  // Circular progress data
  // Max scale usually 24 hours for visual, but can loop
  const hours = data.hoursElapsed;
  const progress = Math.min(100, (hours / 24) * 100);
  const chartData = [
      { name: 'Elapsed', value: progress, color: '#8b5cf6' },
      { name: 'Remaining', value: 100 - progress, color: '#27272a' }
  ];

  return (
    <div className="bg-surface rounded-2xl p-6 border border-white/5 h-full relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Timer className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Metabolic Timer</h3>
                    <p className="text-xs text-zinc-400">Last Meal: {hours.toFixed(1)} hours ago</p>
                </div>
            </div>
            <button 
                onClick={onRefresh} 
                className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
                title="Recalculate Status"
            >
                <RefreshCcw className="w-4 h-4" />
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            {/* Center: Circular Timer */}
            <div className="relative h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={100}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={5}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="text-4xl font-black text-white tabular-nums">
                        {Math.floor(hours)}<span className="text-lg font-normal text-zinc-500">h</span> {Math.round((hours % 1) * 60)}<span className="text-lg font-normal text-zinc-500">m</span>
                    </div>
                    <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        data.currentZone.includes('Fed') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        data.currentZone.includes('Ketosis') ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    }`}>
                        {data.currentZone}
                    </div>
                </div>
            </div>

            {/* Right: Metrics */}
            <div className="space-y-4">
                
                {/* Autophagy Meter */}
                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                    <div className="flex justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm font-bold text-zinc-200">
                            <RefreshCcw className="w-4 h-4 text-purple-400" /> Autophagy Activity
                        </div>
                        <span className="text-sm font-mono text-purple-400">{data.autophagyLevel}%</span>
                    </div>
                    <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-600 transition-all duration-1000"
                            style={{ width: `${data.autophagyLevel}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-2">
                        Cellular cleaning & repair {data.autophagyLevel > 50 ? 'active' : 'inactive'}.
                    </p>
                </div>

                {/* Glycogen/Fat Burn */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 mb-1">
                            <Battery className="w-3 h-3" /> Glycogen
                        </div>
                        <div className="text-lg font-bold text-white">{100 - data.glycogenDepletion}%</div>
                        <div className="text-[10px] text-zinc-500">Fuel Reserves</div>
                    </div>
                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 mb-1">
                            <Flame className="w-3 h-3 text-orange-400" /> Ketones
                        </div>
                        <div className="text-lg font-bold text-white">{data.ketoneLevelPredicted}</div>
                        <div className="text-[10px] text-zinc-500">mmol/L (Est)</div>
                    </div>
                </div>
                
                {/* Next Zone */}
                <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                    <Zap className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <div className="text-xs uppercase font-bold text-zinc-400">Next Stage</div>
                        <div className="text-sm text-white font-medium">{data.timeToNextZone}</div>
                    </div>
                </div>

            </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-white/5 text-sm text-zinc-300 italic flex items-start gap-2">
            <Activity className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
            "{data.insights}"
        </div>

    </div>
  );
};
