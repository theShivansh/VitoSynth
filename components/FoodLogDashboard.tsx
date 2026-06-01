
import React, { useState, useEffect } from 'react';
import { FoodLogEntry, HealthReport, UserProfile } from '../types';
import { searchFoodDatabase, generateAggregatedReport } from '../services/groqService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, Calendar, CheckCircle, Eye, Flame, PieChart, Plus, RefreshCw, Search, TrendingUp, X } from 'lucide-react';

interface FoodLogDashboardProps {
  logs: FoodLogEntry[];
  onAddLog: (entry: FoodLogEntry) => void;
  profile: UserProfile;
  onViewSimulation: (entry: FoodLogEntry) => void;
}

const MacroBar: React.FC<{ macros: { protein: number; carbs: number; fat: number } }> = ({ macros }) => {
    const total = macros.protein + macros.carbs + macros.fat;
    if (total === 0) return null;
    
    const pPct = (macros.protein / total) * 100;
    const cPct = (macros.carbs / total) * 100;
    // Remainder is fat to ensure 100% width coverage visually
    const fPct = 100 - pPct - cPct;

    return (
        <div className="flex flex-col gap-1.5 mt-2 w-full max-w-[200px]">
            <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-white/5">
                <div style={{ width: `${pPct}%` }} className="bg-purple-500" title={`Protein: ${macros.protein}g`} />
                <div style={{ width: `${cPct}%` }} className="bg-emerald-500" title={`Carbs: ${macros.carbs}g`} />
                <div style={{ width: `${fPct}%` }} className="bg-amber-500" title={`Fat: ${macros.fat}g`} />
            </div>
            <div className="flex justify-between text-[9px] font-mono leading-none opacity-80">
                <span className="text-purple-400">{Math.round(macros.protein)}g P</span>
                <span className="text-emerald-400">{Math.round(macros.carbs)}g C</span>
                <span className="text-amber-400">{Math.round(macros.fat)}g F</span>
            </div>
        </div>
    );
};

export const FoodLogDashboard: React.FC<FoodLogDashboardProps> = ({ logs, onAddLog, profile, onViewSimulation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [report, setReport] = useState<HealthReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Filter State
  const [filterName, setFilterName] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  // Auto-generate report on mount or log change
  useEffect(() => {
    const fetchReport = async () => {
      if (logs.length > 0) {
        setGeneratingReport(true);
        try {
          const r = await generateAggregatedReport(profile, logs);
          setReport(r);
        } catch (e) {
          console.error(e);
        }
        setGeneratingReport(false);
      }
    };
    fetchReport();
  }, [logs, profile]);

  const handleAddFood = async () => {
    if (!searchQuery) return;
    setSearching(true);
    try {
      const result = await searchFoodDatabase(searchQuery);
      const newEntry: FoodLogEntry = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        foodName: result.foodName,
        portionSize: "1 Serving",
        macros: result.macros
      };
      onAddLog(newEntry);
      setSearchQuery('');
    } catch (e) {
      console.error(e);
    }
    setSearching(false);
  };

  const handleReLog = (entry: FoodLogEntry) => {
    const newEntry: FoodLogEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: Date.now()
    };
    onAddLog(newEntry);
  };

  const handleClearFilters = () => {
    setFilterName('');
    setFilterDateStart('');
    setFilterDateEnd('');
  };

  // Group logs by date for chart (simple last 7 days logic)
  const chartData = logs.reduce((acc: any[], log) => {
    const date = new Date(log.timestamp).toLocaleDateString(undefined, { weekday: 'short' });
    const existing = acc.find(item => item.name === date);
    if (existing) {
      existing.calories += log.macros.calories;
    } else {
      acc.push({ name: date, calories: log.macros.calories });
    }
    return acc;
  }, []).slice(-7);

  const totalCaloriesToday = logs
    .filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString())
    .reduce((sum, l) => sum + l.macros.calories, 0);

  // Filter Logic
  const filteredLogs = logs.filter(log => {
    const logDate = new Date(log.timestamp);
    const matchesName = log.foodName.toLowerCase().includes(filterName.toLowerCase());
    
    let matchesDate = true;
    if (filterDateStart) {
        const start = new Date(filterDateStart);
        start.setHours(0,0,0,0);
        if (logDate.getTime() < start.getTime()) matchesDate = false;
    }
    if (filterDateEnd) {
        const end = new Date(filterDateEnd);
        end.setHours(23,59,59,999);
        if (logDate.getTime() > end.getTime()) matchesDate = false;
    }

    return matchesName && matchesDate;
  }).sort((a, b) => b.timestamp - a.timestamp);

  const isFiltered = filterName || filterDateStart || filterDateEnd;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Left Col: Logger & History */}
      <div className="lg:col-span-1 space-y-6 flex flex-col h-full max-h-[calc(100vh-120px)]">
        
        {/* Quick Add */}
        <div className="bg-surface rounded-2xl p-6 border border-white/5 shadow-lg flex-shrink-0">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" /> Log Intake
          </h3>
          <div className="flex gap-2">
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. 2 eggs and toast"
              className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleAddFood()}
            />
            <button 
              onClick={handleAddFood}
              disabled={searching || !searchQuery}
              className="bg-white/10 hover:bg-white/20 p-2 rounded-lg text-white disabled:opacity-50"
            >
              {searching ? '...' : <Search className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Log History with Search */}
        <div className="bg-surface rounded-2xl p-6 border border-white/5 shadow-lg flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-wider">Log History</h3>
            <div className="text-xs text-zinc-500">{filteredLogs.length} entries</div>
          </div>
          
          {/* Filter Controls */}
          <div className="mb-4 space-y-2 flex-shrink-0">
            <div className="relative">
                 <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-500" />
                 <input 
                    type="text" 
                    placeholder="Search meals..." 
                    value={filterName}
                    onChange={e => setFilterName(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                 />
                 {filterName && (
                    <button 
                        onClick={() => setFilterName('')}
                        className="absolute right-2 top-2.5 text-zinc-500 hover:text-white"
                    >
                        <X className="w-4 h-4" />
                    </button>
                 )}
            </div>
            <div className="flex gap-2">
                 <div className="relative flex-1">
                    <div className="absolute left-2 top-2 pointer-events-none">
                        <Calendar className="w-4 h-4 text-zinc-500" />
                    </div>
                    <input 
                        type="date" 
                        value={filterDateStart}
                        onChange={e => setFilterDateStart(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-8 pr-2 py-2 text-xs text-zinc-300 focus:border-primary focus:outline-none"
                    />
                 </div>
                 <div className="relative flex-1">
                     <div className="absolute left-2 top-2 pointer-events-none">
                        <Calendar className="w-4 h-4 text-zinc-500" />
                    </div>
                    <input 
                        type="date" 
                        value={filterDateEnd}
                        onChange={e => setFilterDateEnd(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-8 pr-2 py-2 text-xs text-zinc-300 focus:border-primary focus:outline-none"
                    />
                 </div>
            </div>
             {isFiltered && (
                <button 
                    onClick={handleClearFilters}
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 w-full justify-end"
                >
                    <X className="w-3 h-3" /> Clear Filters
                </button>
             )}
          </div>

          <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
            {filteredLogs.length === 0 && (
                <div className="text-center text-zinc-500 py-10 text-sm flex flex-col items-center gap-2">
                    <Search className="w-8 h-8 opacity-20" />
                    {isFiltered ? 'No meals found for these filters.' : 'No food logged yet.'}
                </div>
            )}
            {filteredLogs.map(log => (
              <div key={log.id} className="flex flex-col bg-white/5 p-3 rounded-lg border border-white/5 group">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                        <div className="font-bold text-sm text-zinc-200">{log.foodName}</div>
                        <div className="text-xs text-zinc-500 mb-1">{new Date(log.timestamp).toLocaleDateString()} • {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        
                        {/* Macro Visualization */}
                        <MacroBar macros={log.macros} />
                    </div>
                    <div className="text-right pl-2">
                        <div className="font-mono text-primary font-bold text-sm">{log.macros.calories}</div>
                        <div className="text-[10px] text-zinc-500">kcal</div>
                    </div>
                </div>
                
                {/* Actions Row */}
                <div className="flex justify-end gap-2 border-t border-white/5 pt-2 mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    {log.simulationResult && (
                        <button 
                            onClick={() => onViewSimulation(log)}
                            className="flex items-center gap-1 text-[10px] bg-primary/20 hover:bg-primary/30 text-primary px-2 py-1 rounded transition-colors"
                            title="View Saved Report"
                        >
                            <Eye className="w-3 h-3" /> Report
                        </button>
                    )}
                    <button 
                        onClick={() => handleReLog(log)}
                        className="flex items-center gap-1 text-[10px] bg-white/5 hover:bg-white/10 text-zinc-300 px-2 py-1 rounded transition-colors"
                        title="Eat Again"
                    >
                        <RefreshCw className="w-3 h-3" /> Eat Again
                    </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Center/Right: Reports & Insights */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Calorie Progress */}
        <div className="bg-surface rounded-2xl p-6 border border-white/5 shadow-lg">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" /> Weekly Trends
            </h3>
            <div className="text-sm text-zinc-400">
                Today: <span className="text-white font-bold">{totalCaloriesToday}</span> / {profile.targetCalories || 2000} kcal
            </div>
          </div>
          
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', color: '#fff' }}
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                />
                <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
                   {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.calories > (profile.targetCalories || 2000) ? '#ef4444' : '#10b981'} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Health Predictions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Predictions Card */}
            <div className="bg-gradient-to-br from-indigo-900/30 to-background border border-indigo-500/20 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <PieChart className="w-4 h-4" /> Health Predictions
                </h3>
                {generatingReport ? (
                    <div className="animate-pulse text-sm text-zinc-500">Analyzing patterns...</div>
                ) : report ? (
                    <div className="space-y-4">
                        <div className="bg-black/30 p-3 rounded-lg">
                            <div className="text-xs text-zinc-400 uppercase mb-1">Projected Weight Trend</div>
                            <div className="text-white font-medium">{report.predictions.weightTrend}</div>
                        </div>
                        <div className="bg-black/30 p-3 rounded-lg">
                            <div className="text-xs text-zinc-400 uppercase mb-1">Risk Indicators</div>
                            <div className="flex flex-wrap gap-2">
                                {report.predictions.riskIndicators.length > 0 ? report.predictions.riskIndicators.map((risk, i) => (
                                    <span key={i} className="text-xs px-2 py-1 bg-rose-500/20 text-rose-400 rounded border border-rose-500/30">{risk}</span>
                                )) : <span className="text-xs text-zinc-500">None detected</span>}
                            </div>
                        </div>
                    </div>
                ) : <div className="text-sm text-zinc-500">Log more meals to see predictions.</div>}
            </div>

            {/* Recommendations & Warnings */}
            <div className="bg-surface border border-white/5 rounded-2xl p-6">
                 <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Flame className="w-4 h-4" /> Smart Insights
                </h3>
                {report ? (
                    <div className="space-y-4 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                        {report.recommendations.map((rec, i) => (
                             <div key={i} className="flex gap-2 items-start text-sm text-zinc-300">
                                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                {rec}
                            </div>
                        ))}
                        {report.warnings.map((warn, i) => (
                             <div key={i} className="flex gap-2 items-start text-sm text-rose-300">
                                <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                                {warn}
                            </div>
                        ))}
                    </div>
                ) : <div className="text-sm text-zinc-500">Awaiting data...</div>}
            </div>

        </div>

      </div>

    </div>
  );
};
