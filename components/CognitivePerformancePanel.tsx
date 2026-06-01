
import React from 'react';
import { CognitivePrediction } from '../types';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Brain, Briefcase, Clock, Lightbulb, Zap } from 'lucide-react';

interface CognitivePerformancePanelProps {
  data: CognitivePrediction;
}

export const CognitivePerformancePanel: React.FC<CognitivePerformancePanelProps> = ({ data }) => {
  return (
    <div className="bg-surface rounded-2xl p-6 border border-white/5 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            Mental Performance Forecast
        </h3>
        <div className="text-xs text-zinc-500 font-mono">NEXT 8 HOURS</div>
      </div>

      {/* Clarity Chart */}
      <div className="bg-black/20 rounded-xl p-4 border border-white/5">
        <div className="text-xs text-zinc-400 uppercase mb-2 ml-2">Cognitive Clarity Trajectory</div>
        <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeline}>
                    <defs>
                        <linearGradient id="clarityGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="hour" stroke="#71717a" fontSize={10} tickFormatter={(val) => `+${val}h`} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', color: '#fff' }}
                        formatter={(value: any) => [`${value}/100`, 'Clarity']}
                        labelFormatter={(label) => `Hour ${label}`}
                    />
                    <Area type="monotone" dataKey="clarityScore" stroke="#818cf8" fillOpacity={1} fill="url(#clarityGradient)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Brain Fog Alert */}
      {data.brainFogRisk.probability > 30 && (
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              data.brainFogRisk.probability > 60 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-yellow-500/10 border-yellow-500/30'
          }`}>
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
                   data.brainFogRisk.probability > 60 ? 'text-rose-400' : 'text-yellow-400'
              }`} />
              <div>
                  <div className={`text-sm font-bold ${
                       data.brainFogRisk.probability > 60 ? 'text-rose-400' : 'text-yellow-400'
                  }`}>
                      Brain Fog Risk: {data.brainFogRisk.probability}%
                  </div>
                  <div className="text-xs text-zinc-300 mt-1">
                      Expected onset: {data.brainFogRisk.onset}. Trigger: {data.brainFogRisk.trigger}.
                  </div>
              </div>
          </div>
      )}

      {/* Optimal Windows */}
      <div className="space-y-3">
          <h4 className="text-xs font-mono text-zinc-500 uppercase">Optimal Task Timing</h4>
          
          <div className="grid grid-cols-1 gap-2">
              <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex items-center gap-3">
                  <div className="bg-emerald-500/20 p-2 rounded text-emerald-400">
                      <Zap className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                      <div className="text-xs text-zinc-400 uppercase">Deep Work</div>
                      <div className="text-sm font-bold text-white">{data.optimalWindows.deepWork}</div>
                  </div>
              </div>

              <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex items-center gap-3">
                  <div className="bg-purple-500/20 p-2 rounded text-purple-400">
                      <Lightbulb className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                      <div className="text-xs text-zinc-400 uppercase">Creative Flow</div>
                      <div className="text-sm font-bold text-white">{data.optimalWindows.creative}</div>
                  </div>
              </div>
              
              <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex items-center gap-3">
                  <div className="bg-blue-500/20 p-2 rounded text-blue-400">
                      <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                      <div className="text-xs text-zinc-400 uppercase">Meetings</div>
                      <div className="text-sm font-bold text-white">{data.optimalWindows.meetings}</div>
                  </div>
              </div>
          </div>
      </div>

    </div>
  );
};
