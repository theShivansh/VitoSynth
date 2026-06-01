import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area } from 'recharts';
import { TimePoint } from '../types';

interface MetabolicChartsProps {
  data: TimePoint[];
}

export const MetabolicCharts: React.FC<MetabolicChartsProps> = ({ data }) => {
  
  // Process data to derive Pancreatic Load
  const processedData = useMemo(() => {
    return data.map((d, i) => {
        const prev = data[i-1] || d;
        const glucoseRate = d.glucose - prev.glucose;
        // Heuristic for "Load": 
        // 1. Base load from insulin secretion (the work being done)
        // 2. Dynamic load from rapid glucose spikes (the shock)
        // Normalized roughly for visualization
        let load = (d.insulin) + (glucoseRate > 0 ? glucoseRate * 2 : 0);
        return { ...d, pancreaticLoad: Math.max(0, load) };
    });
  }, [data]);

  return (
    <div className="grid grid-cols-1 gap-6">
      
      {/* Glucose Chart */}
      <div className="glass-panel p-5 rounded-3xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-primary font-bold tracking-tight flex items-center gap-2 text-sm uppercase">
            <span className="w-2 h-2 rounded-full bg-primary animate-[pulse_3s_infinite]"></span>
            GLUCOSE
          </h3>
          <span className="text-[10px] text-zinc-500 font-mono tracking-widest">3 HR FORECAST</span>
        </div>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={processedData}>
              <defs>
                 <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#00F5E1" />
                    <stop offset="100%" stopColor="#00A8B5" />
                 </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="minute" stroke="#52525b" fontSize={10} tickFormatter={(val) => `${val}m`} axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#52525b" fontSize={10} domain={[60, 'auto']} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(20, 20, 24, 0.8)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: '#00F5E1', fontWeight: 600, fontSize: '12px' }}
                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
              />
              <ReferenceLine 
                y={140} 
                label={{ position: 'right', value: 'Spike Risk', fill: '#FF2E63', fontSize: 10, fontWeight: 'bold', dy: -10 }} 
                stroke="#FF2E63" 
                strokeDasharray="4 2" 
                strokeWidth={2}
                strokeOpacity={0.8} 
              />
              <Line type="monotone" dataKey="glucose" stroke="url(#lineGradient)" strokeWidth={3} dot={{ fill: '#050505', stroke: '#00F5E1', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#00F5E1', stroke: 'rgba(0, 245, 225, 0.4)', strokeWidth: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insulin & Metabolic State */}
      <div className="glass-panel p-5 rounded-3xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-4 relative z-10">
          <h3 className="text-secondary font-bold tracking-tight flex items-center gap-2 text-sm uppercase">
            <span className="w-2 h-2 rounded-full bg-secondary animate-[pulse_3s_infinite]"></span>
            METABOLIC STATE
          </h3>
          <div className="flex gap-3 text-[9px] font-mono tracking-wider opacity-70">
             <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-rose-500 rounded-full shadow-[0_0_5px_#f43f5e]"></div> STORAGE</span>
             <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_5px_#34d399]"></div> BURN</span>
          </div>
        </div>
        <div className="h-[220px] relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={processedData}>
              <defs>
                <linearGradient id="insulinGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A78BFA" stopOpacity={0.6}/> 
                  <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.1}/> 
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="minute" stroke="#52525b" fontSize={10} tickFormatter={(val) => `${val}m`} axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(20, 20, 24, 0.8)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: '#A78BFA', fontWeight: 600, fontSize: '12px' }}
                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
              />
              <ReferenceLine 
                y={15} 
                stroke="rgba(255,255,255,0.3)" 
                strokeDasharray="3 3" 
                label={{ value: "Fat Storage Threshold", fill: "rgba(255,255,255,0.4)", fontSize: 9, position: 'insideTopRight' }} 
              />
              <Area type="monotone" dataKey="insulin" stroke="#A78BFA" strokeWidth={3} fill="url(#insulinGradient)" activeDot={{ r: 6, fill: '#A78BFA', stroke: 'rgba(167, 139, 250, 0.4)', strokeWidth: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Energy Level Chart */}
      <div className="glass-panel p-5 rounded-3xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-yellow-400 font-bold tracking-tight flex items-center gap-2 text-sm uppercase">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-[pulse_3s_infinite]"></span>
            ENERGY LEVELS
          </h3>
          <span className="text-[10px] text-zinc-500 font-mono tracking-widest">PREDICTED</span>
        </div>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={processedData}>
               <defs>
                <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#facc15" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#facc15" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="minute" stroke="#52525b" fontSize={10} tickFormatter={(val) => `${val}m`} axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#52525b" fontSize={10} domain={[0, 100]} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip 
                 contentStyle={{ backgroundColor: 'rgba(20, 20, 24, 0.8)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                 itemStyle={{ color: '#facc15', fontWeight: 600, fontSize: '12px' }}
                 cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
              />
              <Area type="monotone" dataKey="energy" stroke="#facc15" fill="url(#energyGradient)" strokeWidth={3} activeDot={{ r: 6, fill: '#facc15', stroke: 'rgba(250, 204, 21, 0.4)', strokeWidth: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pancreatic Load Chart (Derived Stress) - Converted to AreaChart */}
      <div className="glass-panel p-5 rounded-3xl">
         <div className="flex justify-between items-center mb-4">
          <h3 className="text-orange-500 font-bold tracking-tight flex items-center gap-2 text-sm uppercase">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-[pulse_3s_infinite]"></span>
            PANCREATIC LOAD
          </h3>
          <span className="text-[10px] text-zinc-500 font-mono tracking-widest">STRESS INDEX</span>
        </div>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={processedData}>
              <defs>
                 <linearGradient id="stressGradientFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.1} />
                 </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="minute" stroke="#52525b" fontSize={10} tickFormatter={(val) => `${val}m`} axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip 
                 contentStyle={{ backgroundColor: 'rgba(20, 20, 24, 0.8)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                 itemStyle={{ color: '#f97316', fontWeight: 600, fontSize: '12px' }}
                 cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
              />
              <Area type="monotone" dataKey="pancreaticLoad" stroke="#f97316" fill="url(#stressGradientFill)" strokeWidth={3} activeDot={{ r: 6, fill: '#f97316', stroke: 'rgba(249, 115, 22, 0.4)', strokeWidth: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};