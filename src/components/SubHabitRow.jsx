import React from 'react';
import { Check, Trash2, Pencil } from 'lucide-react';
import { format } from 'date-fns';

const SubHabitRow = ({ name, subHabit, days, completedDates, onToggle, onDelete, onEdit, sidebarWidth, isParentScheduled, subValues, onUpdateSubValue }) => {
  
  const isQuantitative = subHabit.goal > 0;

  const isChecked = (date) => completedDates.includes(format(date, 'yyyy-MM-dd'));

  // Helpers
  const isScheduled = (date) => {
    if (isParentScheduled && !isParentScheduled(date)) return false;
    if (subHabit.frequency) {
      return subHabit.frequency.includes(format(date, 'EEE'));
    }
    return true;
  };

  const handleClick = (day) => {
    const dateStr = format(day, 'yyyy-MM-dd');

    if (isQuantitative) {
      // 1. QUANTITATIVE LOGIC
      const currentVal = subValues ? (subValues[dateStr] || 0) : 0;
      const input = prompt(`Enter value for ${name} (Goal: ${subHabit.goal} ${subHabit.unit}):`, currentVal);
      
      if (input !== null) {
        onUpdateSubValue(dateStr, input); // Calls the App.jsx function
      }

    } else {
      // 2. BINARY LOGIC
      onToggle(day);
    }
  };

  return (
    <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors group/sub">
      
      {/* STICKY COLUMN */}
      <div 
        className="px-2 md:px-4 py-2 md:py-3 pl-8 md:pl-12 flex items-center gap-2 shrink-0 sticky left-0 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-20 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors"
        style={{ width: `${sidebarWidth}px` }}
      >
        <span className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium truncate select-none flex-1 cursor-pointer hover:underline" onClick={onEdit}>
          └ {name}
        </span>
        
        {isQuantitative && (
           <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold mr-2">
             Goal: {subHabit.goal} {subHabit.unit}
           </span>
        )}

        <div className="flex gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
           <button onClick={onEdit} className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded" title="Edit Sub-habit">
            <Pencil size={12} className="md:w-3.5 md:h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded" title="Delete Sub-habit">
            <Trash2 size={12} className="md:w-3.5 md:h-3.5" />
          </button>
        </div>
      </div>

      {/* CHECKBOXES */}
      <div className="flex">
        {days.map((day) => {
          const isVisible = isScheduled(day);
          const dateStr = format(day, 'yyyy-MM-dd');
          
          // Data for Quantitative
          const val = isQuantitative && subValues ? (subValues[dateStr] || 0) : 0;
          const progress = isQuantitative ? Math.min(100, Math.round((val / subHabit.goal) * 100)) : 0;
          const isDone = isQuantitative ? progress === 100 : isChecked(day);

          return (
            <div key={day.toString()} className="min-w-[50px] md:min-w-[80px] border-r border-slate-100/50 dark:border-slate-800/50 flex items-center justify-center p-1 md:p-2">
              {isVisible ? (
                <button
                  onClick={() => handleClick(day)}
                  className={`
                    w-6 h-6 md:w-10 md:h-8 rounded md:rounded-md flex items-center justify-center transition-all duration-200
                    ${isDone 
                      ? 'bg-blue-400 text-white shadow-sm' 
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500'
                    }
                  `}
                >
                  {isQuantitative ? (
                    // SHOW PROGRESS RING OR NUMBER
                    progress === 0 ? (
                      <span className="text-[8px] text-slate-300">-</span>
                    ) : progress === 100 ? (
                      <Check size={14} className="md:w-[18px] md:h-[18px]" strokeWidth={3} />
                    ) : (
                      <span className="text-[8px] md:text-[10px] font-bold text-blue-600 dark:text-blue-300">{progress}%</span>
                    )
                  ) : (
                    // BINARY CHECK
                    isDone && <Check size={14} className="md:w-[18px] md:h-[18px]" strokeWidth={3} />
                  )}
                </button>
              ) : (
                <div className="w-6 h-6 md:w-10 md:h-8 rounded md:rounded-md bg-transparent"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubHabitRow;