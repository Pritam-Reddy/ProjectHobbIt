import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  format, 
  startOfYear, 
  endOfYear, 
  eachDayOfInterval, 
  isSameYear 
} from 'date-fns';
import { TrendingUp, ArrowRight, BarChart2, Calendar, ChevronDown, Flame, CheckCircle2 } from 'lucide-react';
import YearlyHeatmap from './YearlyHeatmap';

const Dashboard = ({ habits, allChecks, daysInMonth, darkMode }) => {
  const [selectedHabitId, setSelectedHabitId] = useState(null);
  
  // HEATMAP YEAR STATE
  const currentYear = new Date().getFullYear();
  const [heatmapYear, setHeatmapYear] = useState(currentYear);
  const years = [currentYear, currentYear - 1, currentYear - 2]; 

  // --- 1. CALCULATE GRAPH DATA (MONTHLY) ---
  const getGraphData = () => {
    let totalPossibleGlobal = 0;
    let totalCheckedGlobal = 0;

    const data = daysInMonth.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayName = format(day, 'EEE');
      let dayChecks = 0;
      let dayPossible = 0;

      const habitsToProcess = selectedHabitId 
        ? habits.filter(h => h.id === selectedHabitId) 
        : habits;

      habitsToProcess.forEach(habit => {
        if (habit.frequency && !habit.frequency.includes(dayName)) return;

        const habitData = allChecks[habit.id] || { main: [], subs: {}, values: {}, subValues: {} };
        const hasSubHabits = habit.subHabits && habit.subHabits.length > 0;
        
        if (habit.goal > 0) {
            dayPossible++;
            const val = habitData.values ? (habitData.values[dateStr] || 0) : 0;
            dayChecks += Math.min(1, val / habit.goal);
        } else if (hasSubHabits) {
          habit.subHabits.forEach(sub => {
            dayPossible++;
            if (sub.goal > 0) {
               const val = habitData.subValues?.[sub.id]?.[dateStr] || 0;
               dayChecks += Math.min(1, val / sub.goal);
            } else {
               if (habitData.subs[sub.id]?.includes(dateStr)) dayChecks++;
            }
          });
        } else {
          dayPossible++;
          if (habitData.main.includes(dateStr)) dayChecks++;
        }
      });

      totalPossibleGlobal += dayPossible;
      totalCheckedGlobal += dayChecks;

      return {
        date: format(day, 'd'),
        fullDate: dateStr,
        completion: dayPossible > 0 ? Math.round((dayChecks / dayPossible) * 100) : 0
      };
    });

    const overallRate = totalPossibleGlobal > 0 ? Math.round((totalCheckedGlobal / totalPossibleGlobal) * 100) : 0;
    return { data, overallRate };
  };

  const { data: dailyData, overallRate } = getGraphData();
  const pieData = [{ name: 'Done', value: overallRate }, { name: 'Left', value: 100 - overallRate }];

  // --- 2. CALCULATE YEARLY HIGHLIGHTS (FILL THE GAP) ---
  const yearlyStats = useMemo(() => {
    const start = startOfYear(new Date(heatmapYear, 0, 1));
    const end = endOfYear(new Date(heatmapYear, 0, 1));
    // Limit end to today if current year
    const today = new Date();
    const effectiveEnd = isSameYear(end, today) && end > today ? today : end;
    
    const days = eachDayOfInterval({ start, end: effectiveEnd });

    let activeDays = 0;
    let maxStreak = 0;
    let currentStreak = 0;

    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayName = format(day, 'EEE');
      let isDayActive = false;

      // Check if ANY habit was done on this day
      for (const habit of habits) {
        if (habit.frequency && !habit.frequency.includes(dayName)) continue;
        
        const habitData = allChecks[habit.id] || { main: [], subs: {}, values: {}, subValues: {} };
        const hasSubHabits = habit.subHabits && habit.subHabits.length > 0;

        if (habit.goal > 0) {
           if ((habitData.values?.[dateStr] || 0) > 0) { isDayActive = true; break; }
        } else if (hasSubHabits) {
           const subActive = habit.subHabits.some(sub => {
             if (sub.goal > 0) return (habitData.subValues?.[sub.id]?.[dateStr] || 0) > 0;
             return habitData.subs[sub.id]?.includes(dateStr);
           });
           if (subActive) { isDayActive = true; break; }
        } else {
           if (habitData.main.includes(dateStr)) { isDayActive = true; break; }
        }
      }

      if (isDayActive) {
        activeDays++;
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    });

    return { activeDays, maxStreak };
  }, [habits, allChecks, heatmapYear]);


  // --- 3. HABIT RANKING ---
  const habitPerformance = habits.map(habit => {
    let score = 0;
    daysInMonth.forEach(day => {
       const d = format(day, 'yyyy-MM-dd');
       if (habit.frequency && !habit.frequency.includes(format(day, 'EEE'))) return;
       const habitData = allChecks[habit.id] || { main: [], subs: {}, values: {}, subValues: {} };
       const hasSubHabits = habit.subHabits && habit.subHabits.length > 0;

       if (habit.goal > 0) {
          const val = habitData.values ? (habitData.values[d] || 0) : 0;
          if (val >= habit.goal) score++;
       } else if (hasSubHabits) {
         const anySubDone = habit.subHabits.some(sub => {
           if (sub.goal > 0) return (habitData.subValues?.[sub.id]?.[d] || 0) > 0;
           return (habitData.subs[sub.id] || []).includes(d);
         });
         if (anySubDone) score++;
       } else {
         if (habitData.main.includes(d)) score++;
       }
    });
    return { ...habit, score };
  }).sort((a, b) => b.score - a.score); 

  const selectedHabitName = habits.find(h => h.id === selectedHabitId)?.name || "Global Consistency";
  
  const tooltipStyle = darkMode 
    ? { borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', backgroundColor: '#1e293b', color: '#fff' }
    : { borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#fff', color: '#1e293b' };

  return (
    <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 animate-in slide-in-from-top-4 duration-500 transition-colors">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* 1. OVERALL PROGRESS */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center relative overflow-hidden transition-colors">
           {selectedHabitId && <div className="absolute top-2 right-2 text-[10px] font-bold bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-1 rounded">FILTER ACTIVE</div>}
           <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Completion Rate</h3>
           <div className="relative w-32 h-32">
             <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} innerRadius={35} outerRadius={50} dataKey="value" stroke="none"><Cell fill="#2563eb" /><Cell fill={darkMode ? '#334155' : '#f1f5f9'} stroke="none" /></Pie></PieChart></ResponsiveContainer>
             <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-slate-700 dark:text-white">{overallRate}%</div>
           </div>
        </div>

        {/* 2. CONSISTENCY CHART */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 col-span-2 transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2"><TrendingUp size={14} /> {selectedHabitName}</h3>
            {selectedHabitId && <button onClick={() => setSelectedHabitId(null)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:underline">CLEAR FILTER</button>}
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%"><LineChart data={dailyData}><XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} interval={2} /><Tooltip contentStyle={tooltipStyle} labelStyle={{color: '#94a3b8'}} /><Line type="monotone" dataKey="completion" stroke="#2563eb" strokeWidth={3} dot={false} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer>
          </div>
        </div>

        {/* 3. HABIT LIST */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full max-h-[220px] transition-colors">
          <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 shrink-0">Habit Performance</h3>
          <div className="space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent flex-1">
            {habitPerformance.map((h, i) => (
              <div key={h.id} className={`flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer group ${selectedHabitId === h.id ? 'bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-200 dark:ring-blue-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`} onClick={() => setSelectedHabitId(h.id === selectedHabitId ? null : h.id)}>
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold shrink-0 ${i === 0 ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>{i + 1}</span>
                  <div className="flex flex-col min-w-0"><span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{h.name}</span><span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{h.score} days active</span></div>
                </div>
                <button className={`text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors ${selectedHabitId === h.id ? 'text-blue-600 dark:text-blue-400' : ''}`}>{selectedHabitId === h.id ? <BarChart2 size={16} /> : <ArrowRight size={16} />}</button>
              </div>
            ))}
            {habitPerformance.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No data yet</p>}
          </div>
        </div>

        {/* 4. HEATMAP SECTION */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 col-span-1 md:col-span-4 transition-colors">
           
           {/* HEADER ROW - NOW WITH STATS FILLING THE GAP */}
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
             
             {/* LEFT: TITLE */}
             <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
               <Calendar size={14} /> Year View
             </h3>

             {/* CENTER: THE GAP FILLER (STATS) */}
             <div className="flex-1 flex items-center gap-2 md:gap-6 px-4">
                {/* Active Days Pill */}
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                   <CheckCircle2 size={14} className="text-green-500" />
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">Active</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none">{yearlyStats.activeDays} Days</span>
                   </div>
                </div>

                {/* Streak Pill */}
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                   <Flame size={14} className="text-orange-500" fill="currentColor" />
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">Max Streak</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none">{yearlyStats.maxStreak} Days</span>
                   </div>
                </div>
             </div>
             
             {/* RIGHT: YEAR DROPDOWN */}
             <div className="relative group shrink-0">
                <button className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700">
                  {heatmapYear} <ChevronDown size={12} />
                </button>
                <div className="absolute right-0 top-full mt-1 w-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden z-50 hidden group-hover:block">
                  {years.map(y => (
                    <button key={y} onClick={() => setHeatmapYear(y)} className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 ${heatmapYear === y ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-600 dark:text-slate-300'}`}>
                      {y}
                    </button>
                  ))}
                </div>
             </div>
           </div>

           <YearlyHeatmap 
             habits={habits} 
             allChecks={allChecks} 
             year={heatmapYear} 
             darkMode={darkMode}
           />
        </div>

      </div>
    </div>
  );
};

export default Dashboard;