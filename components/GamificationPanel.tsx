
import React from 'react';
import { GamificationProfile, Badge } from '../types';
import { Award, Crown, Flame, Lock, Shield, Star, Trophy, Zap } from 'lucide-react';

interface GamificationPanelProps {
  profile: GamificationProfile;
}

const ProgressBar: React.FC<{ value: number; max: number }> = ({ value, max }) => {
  const percentage = Math.min(100, (value / max) * 100);
  return (
    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
      <div 
        className="h-full bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(245,158,11,0.5)]"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export const GamificationPanel: React.FC<GamificationPanelProps> = ({ profile }) => {
  const pointsToNextLevel = (profile.level + 1) * 1000;
  const pointsInCurrentLevel = profile.points % 1000;

  return (
    <div className="bg-surface rounded-2xl p-6 border border-white/5 shadow-xl relative overflow-hidden group">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-500/10 transition-colors" />

        <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-400" />
                    Metabolic Mastery
                </h3>
                <p className="text-xs text-zinc-400 font-mono">LEVEL {profile.level} BIO-HACKER</p>
            </div>
            <div className="text-right">
                 <div className="text-2xl font-black text-amber-400 tabular-nums">{profile.points.toLocaleString()}</div>
                 <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Bio-Points</div>
            </div>
        </div>

        {/* Progress */}
        <div className="mb-6 relative z-10">
            <div className="flex justify-between text-xs mb-2 font-medium">
                <span className="text-zinc-400">{pointsInCurrentLevel} / 1000 XP</span>
                <span className="text-amber-400">Next Level: {profile.level + 1}</span>
            </div>
            <ProgressBar value={pointsInCurrentLevel} max={1000} />
        </div>

        {/* Streak */}
        <div className="bg-black/20 rounded-xl p-3 border border-white/5 flex items-center gap-3 mb-6 relative z-10">
             <div className="bg-orange-500/20 p-2 rounded-lg text-orange-500">
                 <Flame className={`w-5 h-5 ${profile.currentStreak > 0 ? 'animate-pulse' : ''}`} />
             </div>
             <div>
                 <div className="text-sm font-bold text-white">{profile.currentStreak} Day Streak</div>
                 <div className="text-xs text-zinc-400">Keep logging to multiply points!</div>
             </div>
        </div>

        {/* Badges Grid */}
        <div>
            <h4 className="text-xs font-mono text-zinc-500 uppercase mb-3 relative z-10">Recent Badges</h4>
            <div className="grid grid-cols-4 gap-2 relative z-10">
                {profile.badges.map((badge) => (
                    <div 
                        key={badge.id} 
                        className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 p-1 text-center transition-all ${
                            badge.unlocked 
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                            : 'bg-white/5 border-white/5 text-zinc-600 grayscale opacity-50'
                        }`}
                        title={badge.description}
                    >
                        {badge.unlocked ? (
                            <div className="text-xl">{badge.icon === 'star' ? '⭐' : badge.icon === 'shield' ? '🛡️' : badge.icon === 'zap' ? '⚡' : '🏅'}</div>
                        ) : (
                            <Lock className="w-4 h-4" />
                        )}
                        <span className="text-[9px] font-bold leading-none line-clamp-2">{badge.name}</span>
                    </div>
                ))}
            </div>
        </div>

    </div>
  );
};
