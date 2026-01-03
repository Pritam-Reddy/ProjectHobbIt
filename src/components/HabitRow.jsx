import React, { useState, useEffect } from 'react';
import { Check, ChevronDown, ChevronRight, Plus, Trash2, Pencil, X, Flame } from 'lucide-react';
import { format, subDays } from 'date-fns';
import confetti from 'canvas-confetti';
import SubHabitRow from './SubHabitRow';

const HabitRow = ({ habit, days, onAddSubHabit, onDelete, checks, onToggleGlobal, onDeleteSubHabit, expanded, onToggleExpand, onRename, sidebarWidth, onUpdateValue }) => {
  
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(habit.name);

  useEffect(() => {
    setTempName(habit.name);
  }, [habit.name]);

  const handleSaveRename = () => {
    if (tempName.trim()) {
      onRename(habit.id, tempName);
      setIsEditing(false);
    }
  };

  const handleCancelRename = () => {
    setTempName(habit.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSaveRename();
    if (e.key === 'Escape') handleCancelRename();
  };

  // --- ROW PROGRESS ---
  const totalDays = days.length;
  let totalPossiblePoints = 0;
  let totalEarnedPoints = 0;
  const hasSubHabits = habit.subHabits && habit.subHabits.length > 0;
  const isQuantitative = habit.goal > 0;

  days.forEach(day => {
    const d = format(day, 'yyyy-MM-dd');
    if (isQuantitative) {
      // Logic for Quantitative: Earn 1 point if goal is met, or partial? 
      // Let's do simple: Point if goal met.
      totalPossiblePoints++;
      const val = checks.values ? (checks.values[d] || 0) : 0;
      if (val >= habit.goal) totalEarnedPoints++;
    } 
    else if (hasSubHabits) {
      habit.subHabits.forEach(sub => {
        totalPossiblePoints++;
        const subDates = checks.subs[sub.id] || [];
        if (subDates.includes(d)) totalEarnedPoints++;
      });
    } else {
      totalPossiblePoints++;
      if (checks.main.includes(d)) totalEarnedPoints++;
    }
  });

  const rowProgress = totalPossiblePoints > 0 ? Math.round((totalEarnedPoints / totalPossiblePoints) * 100) : 0;

  const getDailyProgress = (dateStr) => {
    if (isQuantitative) {
       const val = checks.values ? (checks.values[dateStr] || 0) : 0;
       return Math.min(100, Math.round((val / habit.goal) * 100));
    }
    if (!hasSubHabits) return checks.main.includes(dateStr) ? 100 : 0;
    
    let completedCount = 0;
    habit.subHabits.forEach(sub => {
      const subDates = checks.subs[sub.id] || [];
      if (subDates.includes(dateStr)) completedCount++;
    });
    return Math.round((completedCount / habit.subHabits.length) * 100);
  };

  // --- STREAK CALCULATION (LENIENT MODE) ---
  const calculateStreak = () => {
    let streak = 0;
    let currentDay = new Date();
    
    const todayStr = format(currentDay, 'yyyy-MM-dd');
    const todayProgress = getDailyProgress(todayStr);
    
    if (todayProgress === 0) { 
       currentDay = subDays(currentDay, 1);
    }

    while (true) {
      const dStr = format(currentDay, 'yyyy-MM-dd');
      const progress = getDailyProgress(dStr);
      
      if (progress > 0) { 
        streak++;
        currentDay = subDays(currentDay, 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const currentStreak = calculateStreak();

  const handleMainClick = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    if (isQuantitative) {
      // 1. Quantitative Logic
      const currentVal = checks.values ? (checks.values[dateStr] || 0) : 0;
      const input = prompt(`Enter value for today (Goal: ${habit.goal} ${habit.unit}):`, currentVal);
      if (input !== null) {
        onUpdateValue(habit.id, dateStr, input);
        // Confetti if they hit the goal
        if (Number(input) >= habit.goal) {
          confetti({ particleCount: 40, spread: 70, origin: { y: 0.7 }, colors: ['#2563eb', '#60a5fa', '#ffffff'], disableForReducedMotion: true });
        }
      }
    } else {
      // 2. Binary/Sub-habit Logic
      const progress = getDailyProgress(dateStr);
      const isTurningOn = progress < 100;

      if (isTurningOn) {
        confetti({ particleCount: 40, spread: 70, origin: { y: 0.7 }, colors: ['#2563eb', '#60a5fa', '#ffffff'], disableForReducedMotion: true });
      }

      if (!hasSubHabits) {
        onToggleGlobal(habit.id, 'main', dateStr);
      } else {
        habit.subHabits.forEach(sub => {
          const subIsChecked = checks.subs[sub.id]?.includes(dateStr);
          if (isTurningOn) { if (!subIsChecked) onToggleGlobal(habit.id, 'sub', dateStr, sub.id); } 
          else { if (subIsChecked) onToggleGlobal(habit.id, 'sub', dateStr, sub.id); }
        });
      }
    }
  };

  return (
    <>
      <div className="flex border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors bg-white dark:bg-slate-900 group/row">
        
        {/* STICKY SECTION */}
        <div 
          className="flex shrink-0 sticky left-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-30 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors"
          style={{ width: `${sidebarWidth}px` }}
        >
          
          <div className="flex-1 px-2 md:px-4 py-3 md:py-4 flex items-center gap-1 md:gap-3 overflow-hidden">
            <button onClick={onToggleExpand} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 shrink-0">
              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            {isEditing ? (
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <input 
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="flex-1 min-w-0 text-sm border border-blue-300 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <button onClick={handleSaveRename} className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded shrink-0"><Check size={14}/></button>
                <button onClick={handleCancelRename} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded shrink-0"><X size={14}/></button>
              </div>
            ) : (
              <>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-bold text-slate-700 dark:text-slate-200 text-sm md:text-base truncate select-none" onDoubleClick={() => setIsEditing(true)}>
                    {habit.name}
                  </span>
                  {habit.goal > 0 && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">
                      Goal: {habit.goal} {habit.unit}
                    </span>
                  )}
                </div>

                {/* STREAK BADGE */}
                {currentStreak > 0 && (
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800 rounded-full text-[10px] font-bold text-orange-600 dark:text-orange-400 shrink-0 mr-1 animate-in zoom-in duration-300">
                    <Flame size={10} fill="currentColor" /> {currentStreak}
                  </div>
                )}
                
                <div className="ml-auto flex gap-0.5 md:gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                   <button onClick={() => setIsEditing(true)} className="p-1 md:p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded" title="Rename"><Pencil size={14} /></button>
                   <button onClick={() => { if(!expanded) onToggleExpand(); onAddSubHabit(habit.id); }} className="p-1 md:p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded" title="Add Sub-task"><Plus size={14} /></button>
                   <button onClick={onDelete} className="p-1 md:p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded" title="Delete Habit"><Trash2 size={14} /></button>
                </div>
              </>
            )}
          </div>

          <div className="w-12 md:w-24 px-1 md:px-4 py-4 border-l border-slate-50 dark:border-slate-800 flex items-center justify-center shrink-0">
            <div className="hidden md:block w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden relative">
              <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${rowProgress}%` }}></div>
            </div>
            <span className="md:ml-2 text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 md:w-6 text-right">{rowProgress}%</span>
          </div>
        </div>

        {/* CHECKBOXES */}
        <div className="flex">
          {days.map((day) => {
             const dateStr = format(day, 'yyyy-MM-dd');
             const progress = getDailyProgress(dateStr);
             const isComplete = progress === 100;
             const isPartial = progress > 0 && progress < 100;
             const val = isQuantitative && checks.values ? checks.values[dateStr] : null;

             return (
              <div key={day.toString()} className="min-w-[50px] md:min-w-[80px] border-r border-slate-100 dark:border-slate-800 flex items-center justify-center p-1 md:p-2">
                <button
                  onClick={() => handleMainClick(day)}
                  className={`
                    w-8 h-8 md:w-12 md:h-10 rounded-md md:rounded-lg flex items-center justify-center transition-all duration-300 relative overflow-hidden
                    ${isComplete 
                      ? 'bg-blue-600 text-white shadow-sm scale-100' 
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700'
                    }
                  `}
                >
                  {isComplete && <Check size={18} className="md:w-6 md:h-6" strokeWidth={3} />}
                  
                  {isPartial && (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <svg className="w-6 h-6 md:w-8 md:h-8 transform -rotate-90" viewBox="0 0 36 36">
                        <path className="text-blue-200 dark:text-slate-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                        <path className="text-blue-500 transition-all duration-500 ease-out" strokeDasharray={`${progress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                      </svg>
                      {/* Show number if it's a quantitative habit, otherwise % */}
                      <span className="absolute text-[8px] md:text-[10px] font-bold text-blue-700 dark:text-blue-400">
                        {isQuantitative ? val : progress}
                      </span>
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {expanded && habit.subHabits && habit.subHabits.map(sub => (
        <SubHabitRow 
          key={sub.id} 
          name={sub.name} 
          days={days}
          completedDates={checks.subs[sub.id] || []}
          onToggle={(date) => onToggleGlobal(habit.id, 'sub', format(date, 'yyyy-MM-dd'), sub.id)}
          onDelete={() => onDeleteSubHabit(habit.id, sub.id)}
          sidebarWidth={sidebarWidth}
        />
      ))}
    </>
  );
};

export default HabitRow;