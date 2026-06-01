import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrganStress, MicrobiomeData, CognitivePrediction } from '../types';
import { X, Activity, Brain, Zap, AlertTriangle } from 'lucide-react';

interface OrganVisualizerProps {
  stress: OrganStress;
  microbiome?: MicrobiomeData;
  cognitive?: CognitivePrediction;
}

const BacteriaSwarm: React.FC<{ cx: number; cy: number; trend: 'improving' | 'deteriorating' | 'stable' }> = ({ cx, cy, trend }) => {
    const particleCount = 12;
    // Generate random offsets for particles
    const [particles] = useState(() => 
        Array.from({ length: particleCount }).map(() => ({
            angle: Math.random() * 360,
            radius: 15 + Math.random() * 20,
            duration: 2 + Math.random() * 3,
            scale: 0.5 + Math.random() * 0.5
        }))
    );

    const color = trend === 'improving' ? '#00F5E1' : trend === 'deteriorating' ? '#ef4444' : '#9CA3AF';

    return (
        <g className="pointer-events-none">
            {particles.map((p, i) => (
                <motion.circle
                    key={i}
                    r={2 * p.scale}
                    fill={color}
                    initial={{ x: cx, y: cy, opacity: 0 }}
                    animate={{
                        x: [
                            cx + Math.cos(p.angle) * 10,
                            cx + Math.cos(p.angle + 2) * p.radius,
                            cx + Math.cos(p.angle) * 10
                        ],
                        y: [
                            cy + Math.sin(p.angle) * 10,
                            cy + Math.sin(p.angle + 2) * p.radius,
                            cy + Math.sin(p.angle) * 10
                        ],
                        opacity: [0, 0.6, 0]
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.1
                    }}
                />
            ))}
        </g>
    );
};

const OrganNode: React.FC<{ 
  x: number; 
  y: number; 
  color: string; 
  label: string; 
  value: number;
  iconPath: string;
  isGut?: boolean;
  gutTrend?: 'improving' | 'deteriorating' | 'stable';
  labelDirection?: 'left' | 'right';
  onClick: () => void;
  isActive: boolean;
}> = ({ x, y, color, label, value, iconPath, isGut, gutTrend, labelDirection = 'right', onClick, isActive }) => {
  
  const labelXOffset = labelDirection === 'right' ? 36 : -116;

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      onClick={onClick}
      className="cursor-pointer group"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Connection Line with Gradient */}
      <motion.line 
        x1={150} y1={200} // Center of torso roughly
        x2={x} y2={y} 
        stroke={`url(#lineGradient-${label})`}
        strokeWidth="1" 
        strokeOpacity="0.4"
        className="pointer-events-none"
      />
      
      <defs>
        <linearGradient id={`lineGradient-${label}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
            <stop offset="100%" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* Visual Effects for Gut (Pulse + Bacteria) */}
      {isGut && gutTrend && <BacteriaSwarm cx={x} cy={y} trend={gutTrend} />}

      {/* Outer Glow Ring */}
      <motion.circle
        cx={x}
        cy={y}
        r="32"
        fill="transparent"
        stroke={color}
        strokeWidth="1"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
            opacity: isActive ? [0.4, 0.8, 0.4] : [0, 0.3, 0],
            scale: isActive ? 1.2 : [0.8, 1.2, 0.8],
            strokeWidth: isActive ? 2 : 1
        }}
        transition={{ 
            duration: isActive ? 1.5 : 3, 
            repeat: Infinity,
            ease: "easeInOut" 
        }}
      />

      {/* Node Circle (Glass Orb) */}
      <motion.circle
        cx={x}
        cy={y}
        r="24"
        fill={isActive ? `${color}30` : "rgba(0,0,0,0.6)"}
        stroke={color}
        strokeWidth="2"
        style={{ filter: `drop-shadow(0 0 10px ${color}60)` }}
        animate={{ 
            r: [24, 25, 24],
            strokeOpacity: [0.8, 1, 0.8],
        }}
        transition={{ 
            duration: 2, 
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut" 
        }}
      />
      
      {/* Inner Fill pulse */}
      <motion.circle 
         cx={x} cy={y} r="20" fill={color} fillOpacity="0.1" 
         animate={{ opacity: [0.1, 0.3, 0.1] }}
         transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Icon */}
       <g transform={`translate(${x-12}, ${y-12}) scale(1)`} dangerouslySetInnerHTML={{__html: iconPath}} fill={isActive ? '#fff' : color} style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))' }} />

      {/* Label Badge (Glass) */}
      <foreignObject x={x + labelXOffset} y={y - 14} width="80" height="40" className="pointer-events-none">
        <div className={`rounded-lg backdrop-blur-md border p-1.5 flex flex-col items-start shadow-lg transition-colors ${isActive ? 'bg-white/10 border-white/30' : 'bg-black/40 border-white/10'}`}>
             <div className="text-[9px] font-bold text-white tracking-wider leading-none mb-0.5">{label.toUpperCase()}</div>
             <div className="text-[8px] font-mono leading-none" style={{ color: isActive ? '#fff' : color }}>STRESS: {value}/10</div>
        </div>
      </foreignObject>
    </motion.g>
  );
};

const DetailPopover: React.FC<{ 
    organ: string; 
    x: number; 
    y: number; 
    onClose: () => void; 
    data: any;
    stressLevel: number;
    color: string;
}> = ({ organ, x, y, onClose, data, stressLevel, color }) => {
    const isLeft = x > 150;
    const leftPos = isLeft ? `calc(50% - 150px + ${x}px - 220px)` : `calc(50% - 150px + ${x}px + 40px)`;
    const topPos = `${y - 60}px`;

    const renderOrganContent = () => {
        if (organ === 'gut' && data.microbiome) {
            return (
                <>
                    <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                            <span className="text-zinc-400">Diversity</span>
                            <span className="text-white">{data.microbiome.diversityScore}/100</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-400">Trend</span>
                            <span className={`uppercase font-bold text-[10px] ${data.microbiome.overallTrend === 'improving' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {data.microbiome.overallTrend}
                            </span>
                        </div>
                    </div>
                    {data.microbiome.bacterialShifts?.[0] && (
                        <div className="bg-white/5 p-2 rounded border border-white/5 mt-2">
                            <div className="text-[9px] text-zinc-500 uppercase mb-1">Key Shift</div>
                            <div className="text-xs text-zinc-200 leading-tight">
                                {data.microbiome.bacterialShifts[0].name} ({data.microbiome.bacterialShifts[0].change})
                            </div>
                        </div>
                    )}
                </>
            );
        }
        
        if (organ === 'brain' && data.cognitive) {
            return (
                <>
                    <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                            <span className="text-zinc-400">Clarity</span>
                            <span className="text-indigo-400">{data.cognitive.timeline?.[0]?.clarityScore || 80}/100</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-400">Brain Fog Risk</span>
                            <span className={`font-bold ${data.cognitive.brainFogRisk?.probability > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {data.cognitive.brainFogRisk?.probability}%
                            </span>
                        </div>
                    </div>
                    <div className="mt-2 text-[10px] text-zinc-300 italic border-t border-white/5 pt-2">
                        "{data.cognitive.summary?.slice(0, 50)}..."
                    </div>
                </>
            );
        }

        if (organ === 'heart') {
            return (
                <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                        <span className="text-zinc-400">HRV Impact</span>
                        <span className={stressLevel > 5 ? 'text-rose-400' : 'text-emerald-400'}>
                            {stressLevel > 5 ? 'Reduced' : 'Optimal'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-400">Circulation</span>
                        <span className="text-white">{stressLevel > 7 ? 'Strained' : 'Stable'}</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded border border-white/5 mt-2 text-[10px] text-zinc-300">
                        {stressLevel > 5 ? 'Elevated cardiac load detected.' : 'Resting state maintained.'}
                    </div>
                </div>
            );
        }

        if (organ === 'liver') {
            return (
                <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                        <span className="text-zinc-400">Glycogen</span>
                        <span className="text-white">{stressLevel > 7 ? 'Saturated' : 'Filling'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-400">Filtration</span>
                        <span className={stressLevel > 5 ? 'text-yellow-400' : 'text-emerald-400'}>
                            {stressLevel > 5 ? 'High Load' : 'Normal'}
                        </span>
                    </div>
                    <div className="bg-white/5 p-2 rounded border border-white/5 mt-2 text-[10px] text-zinc-300">
                        {stressLevel > 6 ? 'Fat accumulation risk increased.' : 'Metabolic processing efficient.'}
                    </div>
                </div>
            );
        }

        if (organ === 'pancreas') {
            return (
                <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                        <span className="text-zinc-400">Insulin</span>
                        <span className={stressLevel > 6 ? 'text-rose-400' : 'text-emerald-400'}>
                            {stressLevel > 6 ? 'High Surge' : 'Moderate'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-400">Beta Cells</span>
                        <span className="text-white">{stressLevel > 8 ? 'Stressed' : 'Active'}</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded border border-white/5 mt-2 text-[10px] text-zinc-300">
                        {stressLevel > 7 ? 'High demand on insulin production.' : 'Glucose regulation within limits.'}
                    </div>
                </div>
            );
        }

        return (
            <div className="text-xs text-zinc-300 leading-relaxed">
                {stressLevel < 4 ? "Functioning within optimal parameters. No significant metabolic strain detected." : 
                 stressLevel < 7 ? "Moderate load detected. Hormonal response active but stable." : 
                 "High physiological stress. System working hard to maintain homeostasis."}
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute z-20 w-52 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-4 text-left"
            style={{ left: leftPos, top: topPos }}
        >
            <div className="flex justify-between items-start mb-2 border-b border-white/10 pb-2">
                <h4 className="font-bold text-white capitalize flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    {organ}
                </h4>
                <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-zinc-400 hover:text-white">
                    <X className="w-3 h-3" />
                </button>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Stress Load</span>
                    <span className="font-mono font-bold" style={{ color }}>{stressLevel}/10</span>
                </div>
                {renderOrganContent()}
            </div>
        </motion.div>
    );
};

export const OrganVisualizer: React.FC<OrganVisualizerProps> = ({ stress, microbiome, cognitive }) => {
  const [activeOrgan, setActiveOrgan] = useState<string | null>(null);
  
  const getColor = (val: number) => {
    if (val <= 3) return "#00F5E1"; // Low (0-3): Cyan
    if (val <= 6) return "#facc15"; // Moderate (4-6): Yellow
    return "#ef4444"; // High (7-10): Deep Red
  };

  const getGutColor = () => {
    if (!microbiome) return getColor(stress.gut);
    if (microbiome.overallTrend === 'deteriorating') return '#ef4444';
    if (microbiome.overallTrend === 'improving') return '#00F5E1';
    return getColor(stress.gut);
  };

  // Simplified SVG paths for icons
  const icons = {
    brain: `<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v1.8c0 .2.2.4.4.4.8 0 1.6.3 2.1.9l.9 1.9c.3.5.8.9 1.4.9h1.7A2.5 2.5 0 0 1 21 12v3a2.5 2.5 0 0 1-2.5 2.5h-1.3c-.5 0-1.1.2-1.5.6l-1.4 1.4c-.4.4-1 .6-1.5.6H9a2 2 0 0 1-2-2v-1.1c0-.5-.2-1.1-.6-1.5l-1-1C5.1 14.1 5 13.5 5 13v-1c0-.9.5-1.7 1.2-2.2l.1-.1c.5-.3.8-.9.8-1.5V6A2 2 0 0 1 9.1 4h.4Z" opacity="0.9"/>`,
    heart: `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" opacity="0.9"/>`,
    liver: `<path d="M20.2 12.3c.7.9 1.8 1.7 1.8 2.7 0 3.3-2.7 6-6 6H6c-.6 0-1-.4-1-1 0-4.1 2.2-7.8 5.6-9.7l.9-.4c2.8-1.3 6.1-.7 8.2 1.4.2.3.4.7.5 1Z" opacity="0.9"/>`,
    gut: `<path d="M16 14h.01M12 16h.01M8 12h.01M20.6 12a9 9 0 1 0-5.7 8.5M8 8a4 4 0 1 1 5.3 6.7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`, 
    pancreas: `<path d="M18.8 6.4a2 2 0 0 0-2.3-.3l-2.6 1.3a2 2 0 0 1-2.4-.4l-2.7-2.7A2 2 0 0 0 6 4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9.6l3.9-2a2 2 0 0 0 1-1.2Z" opacity="0.9"/>`
  };

  const getPopoverData = (organ: string) => {
      return { microbiome, cognitive };
  };

  const getNodeProps = (key: keyof OrganStress) => ({
      value: stress[key],
      color: key === 'gut' ? getGutColor() : getColor(stress[key]),
      isActive: activeOrgan === key,
      onClick: () => setActiveOrgan(activeOrgan === key ? null : key)
  });

  return (
    <div className="relative w-full h-[500px] flex items-center justify-center bg-black/10 rounded-2xl overflow-hidden border border-white/5" onClick={() => setActiveOrgan(null)}>
      {/* Background Grid - Cybernetic style */}
      <div className="absolute inset-0 opacity-20" 
           style={{ 
               backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', 
               backgroundSize: '50px 50px',
               maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)' 
            }} 
      />
      
      {/* Central Glow */}
      <div className="absolute inset-0 bg-primary/5 blur-[80px] rounded-full transform scale-75 pointer-events-none" />

      {/* Popovers */}
      <AnimatePresence>
          {activeOrgan === 'brain' && (
              <DetailPopover organ="brain" x={150} y={55} stressLevel={stress.brain} color={getColor(stress.brain)} data={getPopoverData('brain')} onClose={() => setActiveOrgan(null)} />
          )}
          {activeOrgan === 'heart' && (
              <DetailPopover organ="heart" x={165} y={130} stressLevel={stress.heart} color={getColor(stress.heart)} data={getPopoverData('heart')} onClose={() => setActiveOrgan(null)} />
          )}
          {activeOrgan === 'liver' && (
              <DetailPopover organ="liver" x={120} y={175} stressLevel={stress.liver} color={getColor(stress.liver)} data={getPopoverData('liver')} onClose={() => setActiveOrgan(null)} />
          )}
          {activeOrgan === 'pancreas' && (
              <DetailPopover organ="pancreas" x={180} y={195} stressLevel={stress.pancreas} color={getColor(stress.pancreas)} data={getPopoverData('pancreas')} onClose={() => setActiveOrgan(null)} />
          )}
          {activeOrgan === 'gut' && (
              <DetailPopover organ="gut" x={150} y={250} stressLevel={stress.gut} color={getGutColor()} data={getPopoverData('gut')} onClose={() => setActiveOrgan(null)} />
          )}
      </AnimatePresence>

      <svg width="300" height="500" viewBox="0 0 300 500" className="relative z-10" onClick={(e) => e.stopPropagation()}>
        <defs>
          <linearGradient id="bodyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
          </linearGradient>
          <filter id="glow">
             <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
             <feMerge>
                 <feMergeNode in="coloredBlur"/>
                 <feMergeNode in="SourceGraphic"/>
             </feMerge>
          </filter>
        </defs>

        {/* Silhouette - Abstract & High Tech */}
        <path 
          d="M150 20 C130 20 115 35 115 55 C115 65 120 75 125 80 L110 90 L100 130 L90 250 L100 400 L115 480 L135 480 L130 400 L140 280 L160 280 L170 400 L165 480 L185 480 L200 400 L210 250 L200 130 L190 90 L175 80 C180 75 185 65 185 55 C185 35 170 20 150 20 Z" 
          fill="url(#bodyGradient)" 
          stroke="#8b5cf6" 
          strokeWidth="1.5"
          strokeOpacity="0.3"
          strokeDasharray="4 4"
          className="pointer-events-none"
        />

        {/* Organs */}
        <OrganNode x={150} y={55} label="Brain" iconPath={icons.brain} {...getNodeProps('brain')} />
        <OrganNode x={165} y={130} label="Heart" iconPath={icons.heart} {...getNodeProps('heart')} />
        
        {/* Adjusted Liver and Pancreas coordinates to prevent overlap */}
        <OrganNode x={120} y={175} label="Liver" iconPath={icons.liver} labelDirection="left" {...getNodeProps('liver')} />
        <OrganNode x={180} y={195} label="Pancreas" iconPath={icons.pancreas} labelDirection="right" {...getNodeProps('pancreas')} />
        
        <OrganNode 
          x={150} y={250} 
          label="Gut" 
          iconPath={icons.gut} 
          isGut={true}
          gutTrend={microbiome?.overallTrend}
          {...getNodeProps('gut')}
        />

      </svg>
      
      <div className="absolute top-4 left-4 text-[10px] font-mono text-primary/60 bg-primary/5 px-2 py-1 rounded border border-primary/10">
        BIO-SIMULATION ENGINE: <span className="text-primary animate-pulse">ONLINE</span>
      </div>
    </div>
  );
};