import React from 'react';
import { Check, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const SubHabitRow = ({ name, days, completedDates, onToggle, onDelete, sidebarWidth }) => {
  
  const isChecked = (date) => completedDates.includes(format(date, 'yyyy-MM-dd'));

  return (
    <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors group/sub">
      
      {/* RESIZABLE STICKY COLUMN */}
      <div 
        className="px-2 md:px-4 py-2 md:py-3 pl-8 md:pl-12 flex items-center gap-2 shrink-0 sticky left-0 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-20 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors"
        style={{ width: `${sidebarWidth}px` }}
      >
        <span className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium truncate select-none flex-1">
          └ {name}
        </span>

        <button 
          onClick={onDelete}
          className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded opacity-0 group-hover/sub:opacity-100 transition-opacity"
          title="Delete Sub-habit"
        >
          <Trash2 size={12} className="md:w-3.5 md:h-3.5" />
        </button>
      </div>

      {/* CHECKBOXES */}
      <div className="flex">
        {days.map((day) => (
          <div key={day.toString()} className="min-w-[50px] md:min-w-[80px] border-r border-slate-100/50 dark:border-slate-800/50 flex items-center justify-center p-1 md:p-2">
            <button
              onClick={() => onToggle(day)}
              className={`
                w-6 h-6 md:w-10 md:h-8 rounded md:rounded-md flex items-center justify-center transition-all duration-200
                ${isChecked(day) 
                  ? 'bg-blue-400 text-white shadow-sm' 
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500'
                }
              `}
            >
              {isChecked(day) && <Check size={14} className="md:w-[18px] md:h-[18px]" strokeWidth={3} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubHabitRow;