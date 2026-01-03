import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { format } from 'date-fns';
import { TrendingUp, ArrowRight, BarChart2 } from 'lucide-react';

const Dashboard = ({ habits, allChecks, daysInMonth }) => {
  const [selectedHabitId, setSelectedHabitId] = useState(null);

  // --- 1. PREPARE DATA FOR GRAPH ---
  const getGraphData = () => {
    let totalPossibleGlobal = 0;
    let totalCheckedGlobal = 0;

    const data = daysInMonth.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      let dayChecks = 0;
      let dayPossible = 0;

      const habitsToProcess = selectedHabitId 
        ? habits.filter(h => h.id === selectedHabitId) 
        : habits;

      habitsToProcess.forEach(habit => {
        const habitData = allChecks[habit.id] || { main: [], subs: {} };
        const hasSubHabits = habit.subHabits && habit.subHabits.length > 0;

        if (hasSubHabits) {
          // Complex Habit Logic: Only count sub-habits
          habit.subHabits.forEach(sub => {
            dayPossible++;
            const subChecks = habitData.subs[sub.id] || [];
            if (subChecks.includes(dateStr)) dayChecks++;
          });
        } else {
          // Simple Habit Logic
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
  
  const pieData = [
    { name: 'Done', value: overallRate },
    { name: 'Left', value: 100 - overallRate }
  ];

  // --- 2. TOP HABITS LOGIC ---
  const habitPerformance = habits.map(habit => {
    let score = 0;
    daysInMonth.forEach(day => {
       const d = format(day, 'yyyy-MM-dd');
       const habitData = allChecks[habit.id] || { main: [], subs: {} };
       const hasSubHabits = habit.subHabits && habit.subHabits.length > 0;

       if (hasSubHabits) {
         // NEW LOGIC: If ANY sub-habit is done, count it!
         const anySubDone = habit.subHabits.some(sub => 
           (habitData.subs[sub.id] || []).includes(d)
         );
         if (anySubDone) score++;
       } else {
         if (habitData.main.includes(d)) score++;
       }
    });
    return { ...habit, score };
  }).sort((a, b) => b.score - a.score); 

  const selectedHabitName = habits.find(h => h.id === selectedHabitId)?.name || "Global Consistency";

  return (
    <div className="bg-slate-50 border-b border-slate-200 p-6 animate-in slide-in-from-top-4 duration-500">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* 1. OVERALL PROGRESS */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
           {selectedHabitId && (
            <div className="absolute top-2 right-2 text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded">
              FILTER ACTIVE
            </div>
          )}
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">Completion Rate</h3>
          <div className="relative w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={35}
                  outerRadius={50}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#2563eb" />
                  <Cell fill="#f1f5f9" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-slate-700">
              {overallRate}%
            </div>
          </div>
        </div>

        {/* 2. CONSISTENCY CHART */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={14} />
              {selectedHabitName}
            </h3>
            {selectedHabitId && (
              <button 
                onClick={() => setSelectedHabitId(null)}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 hover:underline"
              >
                CLEAR FILTER
              </button>
            )}
          </div>
          
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <XAxis dataKey="date" tick={{fontSize: 10}} axisLine={false} tickLine={false} interval={2} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                  labelStyle={{color: '#64748b'}}
                />
                <Line 
                  type="monotone" 
                  dataKey="completion" 
                  stroke="#2563eb" 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{ r: 6 }} 
                  animationDuration={500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. TOP HABITS LIST (SCROLLABLE) */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col h-full max-h-[220px]">
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3 shrink-0">Habit Performance</h3>
          
          <div className="space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent flex-1">
            {habitPerformance.map((h, i) => (
              <div 
                key={h.id} 
                className={`
                  flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer group
                  ${selectedHabitId === h.id ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'}
                `}
                onClick={() => setSelectedHabitId(h.id === selectedHabitId ? null : h.id)}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className={`
                    w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold shrink-0
                    ${i === 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-500'}
                  `}>
                    {i + 1}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-slate-700 truncate">{h.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{h.score} days active</span>
                  </div>
                </div>
                
                <button className={`
                  text-slate-300 group-hover:text-blue-500 transition-colors
                  ${selectedHabitId === h.id ? 'text-blue-600' : ''}
                `}>
                  {selectedHabitId === h.id ? <BarChart2 size={16} /> : <ArrowRight size={16} />}
                </button>
              </div>
            ))}
            {habitPerformance.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No data yet</p>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;