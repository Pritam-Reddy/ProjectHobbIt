import React from 'react';
import { Check, ChevronDown, ChevronRight, Plus, Trash2, Pencil, Flame } from 'lucide-react';
import { format, subDays } from 'date-fns';
import confetti from 'canvas-confetti';
import SubHabitRow from './SubHabitRow';

const HabitRow = ({ habit, days, onAddSubHabit, onDelete, checks, onToggleGlobal, onDeleteSubHabit, expanded, onToggleExpand, onEdit, sidebarWidth, onUpdateValue, onEditSubHabit, onUpdateSubValue }) => {
  
  const isScheduled = (date) => {
    if (!habit.frequency) return true;
    const dayName = format(date, 'EEE');
    return habit.frequency.includes(dayName);
  };

  const hasSubHabits = habit.subHabits && habit.subHabits.length > 0;
  const isQuantitative = habit.goal > 0;

  // --- PROGRESS CALCULATION ---
  const getDailyProgress = (dateStr) => {
    // 1. Quantitative Main Habit
    if (isQuantitative) {
       const val = checks.values ? (checks.values[dateStr] || 0) : 0;
       return Math.min(100, Math.round((val / habit.goal) * 100));
    }
    
    // 2. Simple Main Habit (Binary)
    if (!hasSubHabits) return checks.main.includes(dateStr) ? 100 : 0;
    
    // 3. Aggregate Sub-Habits (Mixed Binary & Quantitative)
    let totalSubCompletion = 0;
    
    habit.subHabits.forEach(sub => {
      // Is this sub-habit quantitative?
      if (sub.goal > 0) {
        const val = checks.subValues?.[sub.id]?.[dateStr] || 0;
        totalSubCompletion += Math.min(1, val / sub.goal);
      } else {
        // Binary Sub-habit
        const isDone = checks.subs[sub.id]?.includes(dateStr);
        if (isDone) totalSubCompletion += 1;
      }
    });
    
    // Average out the progress
    return Math.round((totalSubCompletion / habit.subHabits.length) * 100);
  };

  // --- ROW PROGRESS BAR ---
  let totalPossiblePoints = 0;
  let totalEarnedPoints = 0;

  days.forEach(day => {
    if (!isScheduled(day)) return;
    const d = format(day, 'yyyy-MM-dd');
    totalPossiblePoints++;
    const progress = getDailyProgress(d);
    if (progress === 100) totalEarnedPoints++;
  });
  
  const rowProgress = totalPossiblePoints > 0 ? Math.round((totalEarnedPoints / totalPossiblePoints) * 100) : 0;


  // --- STREAK CALCULATION ---
  const calculateStreak = () => {
    let streak = 0;
    let currentDay = new Date();
    
    const todayStr = format(currentDay, 'yyyy-MM-dd');
    const todayProgress = getDailyProgress(todayStr);
    
    if (todayProgress === 0) currentDay = subDays(currentDay, 1);

    for (let i = 0; i < 365; i++) {
      if (!isScheduled(currentDay)) {
        currentDay = subDays(currentDay, 1);
        continue;
      }
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

  // --- CLICK HANDLER (THE FIX IS HERE) ---
  const handleMainClick = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    if (isQuantitative) {
      // Main Habit is Quantitative -> Ask for number
      const currentVal = checks.values ? (checks.values[dateStr] || 0) : 0;
      const input = prompt(`Enter value for today (Goal: ${habit.goal} ${habit.unit}):`, currentVal);
      if (input !== null) {
        onUpdateValue(habit.id, dateStr, input);
        if (Number(input) >= habit.goal) {
          confetti({ particleCount: 40, spread: 70, origin: { y: 0.7 }, colors: ['#2563eb', '#60a5fa', '#ffffff'], disableForReducedMotion: true });
        }
      }
    } else {
      // Main Habit is Binary OR Container for Sub-Habits
      const progress = getDailyProgress(dateStr);
      const isTurningOn = progress < 100; // If not 100% done, we turn EVERYTHING on.

      if (isTurningOn) {
        confetti({ particleCount: 40, spread: 70, origin: { y: 0.7 }, colors: ['#2563eb', '#60a5fa', '#ffffff'], disableForReducedMotion: true });
      }

      if (!hasSubHabits) {
        onToggleGlobal(habit.id, 'main', dateStr);
      } else {
        // Toggle ALL Sub-Habits
        habit.subHabits.forEach(sub => {
          // CASE 1: Quantitative Sub-Habit (e.g. 100 Crunches)
          if (sub.goal > 0) {
            if (isTurningOn) {
               // Auto-fill to MAX GOAL
               onUpdateSubValue(habit.id, sub.id, dateStr, sub.goal);
            } else {
               // Reset to 0
               onUpdateSubValue(habit.id, sub.id, dateStr, 0);
            }
          } 
          // CASE 2: Binary Sub-Habit
          else {
            const subIsChecked = checks.subs[sub.id]?.includes(dateStr);
            if (isTurningOn) { 
              if (!subIsChecked) onToggleGlobal(habit.id, 'sub', dateStr, sub.id); 
            } else { 
              if (subIsChecked) onToggleGlobal(habit.id, 'sub', dateStr, sub.id); 
            }
          }
        });
      }
    }
  };

  return (
    <>
      <div className="flex border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors bg-white dark:bg-slate-900 group/row">
        
        <div 
          className="flex shrink-0 sticky left-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-30 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors"
          style={{ width: `${sidebarWidth}px` }}
        >
          <div className="flex-1 px-2 md:px-4 py-3 md:py-4 flex items-center gap-1 md:gap-3 overflow-hidden">
            <button onClick={onToggleExpand} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 shrink-0">
              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-bold text-slate-700 dark:text-slate-200 text-sm md:text-base truncate select-none cursor-pointer hover:underline" onClick={onEdit}>
                {habit.name}
              </span>
              {habit.goal > 0 && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">
                  Goal: {habit.goal} {habit.unit}
                </span>
              )}
            </div>

            {currentStreak > 0 && (
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800 rounded-full text-[10px] font-bold text-orange-600 dark:text-orange-400 shrink-0 mr-1 animate-in zoom-in duration-300">
                <Flame size={10} fill="currentColor" /> {currentStreak}
              </div>
            )}
            
            <div className="ml-auto flex gap-0.5 md:gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                <button onClick={onEdit} className="p-1 md:p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded" title="Edit Habit"><Pencil size={14} /></button>
                <button onClick={() => { if(!expanded) onToggleExpand(); onAddSubHabit(habit.id); }} className="p-1 md:p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded" title="Add Sub-task"><Plus size={14} /></button>
                <button onClick={onDelete} className="p-1 md:p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded" title="Delete Habit"><Trash2 size={14} /></button>
            </div>
          </div>

          <div className="w-12 md:w-24 px-1 md:px-4 py-4 border-l border-slate-50 dark:border-slate-800 flex items-center justify-center shrink-0">
            <div className="hidden md:block w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden relative">
              <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${rowProgress}%` }}></div>
            </div>
            <span className="md:ml-2 text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 md:w-6 text-right">{rowProgress}%</span>
          </div>
        </div>

        <div className="flex">
          {days.map((day) => {
             const isDayScheduled = isScheduled(day);
             const dateStr = format(day, 'yyyy-MM-dd');
             const progress = getDailyProgress(dateStr);
             const isComplete = progress === 100;
             const isPartial = progress > 0 && progress < 100;
             const val = isQuantitative && checks.values ? checks.values[dateStr] : null;

             return (
              <div key={day.toString()} className="min-w-[50px] md:min-w-[80px] border-r border-slate-100 dark:border-slate-800 flex items-center justify-center p-1 md:p-2 bg-white dark:bg-slate-900">
                {isDayScheduled ? (
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
                        <span className="absolute text-[8px] md:text-[10px] font-bold text-blue-700 dark:text-blue-400">
                          {isQuantitative ? val : progress}
                        </span>
                      </div>
                    )}
                  </button>
                ) : (
                  <div className="w-8 h-8 md:w-12 md:h-10 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {expanded && habit.subHabits && habit.subHabits.map(sub => (
        <SubHabitRow 
          key={sub.id} 
          name={sub.name} 
          subHabit={sub}
          days={days}
          completedDates={checks.subs[sub.id] || []}
          
          // PASSING DATA DOWN
          subValues={checks.subValues?.[sub.id] || {}}
          onUpdateSubValue={(date, val) => onUpdateSubValue(habit.id, sub.id, date, val)}
          
          onToggle={(date) => onToggleGlobal(habit.id, 'sub', format(date, 'yyyy-MM-dd'), sub.id)}
          onDelete={() => onDeleteSubHabit(habit.id, sub.id)}
          onEdit={() => onEditSubHabit(sub)}
          sidebarWidth={sidebarWidth}
          isParentScheduled={(date) => isScheduled(date)}
        />
      ))}
    </>
  );
};

export default HabitRow;