import React, { useRef, useEffect, useMemo } from 'react';
import { 
  eachDayOfInterval, 
  startOfYear, 
  endOfYear, 
  format, 
  getDay, 
  isAfter,
  getYear,
  setYear,
  startOfMonth
} from 'date-fns';

const YearlyHeatmap = ({ habits, allChecks, year, darkMode }) => {
  const scrollRef = useRef(null);
  const today = new Date();

  // 1. GENERATE DATA
  const { weeks, totalContributions, months } = useMemo(() => {
    // Determine date range for the selected year
    const targetDate = setYear(new Date(), year);
    const start = startOfYear(targetDate);
    const end = endOfYear(targetDate);
    const days = eachDayOfInterval({ start, end });

    let total = 0;
    const tempWeeks = [];
    let currentWeek = Array(7).fill(null); // Sun-Sat
    const monthLabels = [];

    // Helper: Calculate intensity (0-1)
    const calculateIntensity = (dateStr, dayDate) => {
      // Future dates in current year are "inactive"
      if (year === getYear(today) && isAfter(dayDate, today)) return -1;
      // Future years are entirely inactive
      if (year > getYear(today)) return -1;

      let possible = 0;
      let achieved = 0;

      habits.forEach(habit => {
        // Skip if frequency doesn't match
        if (habit.frequency && !habit.frequency.includes(format(dayDate, 'EEE'))) return;

        const habitData = allChecks[habit.id] || { main: [], subs: {}, values: {}, subValues: {} };
        const hasSubHabits = habit.subHabits && habit.subHabits.length > 0;

        if (habit.goal > 0) {
          possible++;
          const val = habitData.values?.[dateStr] || 0;
          achieved += Math.min(1, val / habit.goal);
        } else if (hasSubHabits) {
          habit.subHabits.forEach(sub => {
            possible++;
            if (sub.goal > 0) {
              const val = habitData.subValues?.[sub.id]?.[dateStr] || 0;
              achieved += Math.min(1, val / sub.goal);
            } else {
              if (habitData.subs[sub.id]?.includes(dateStr)) achieved++;
            }
          });
        } else {
          possible++;
          if (habitData.main.includes(dateStr)) achieved++;
        }
      });

      if (achieved > 0) total++;
      
      // Safety check: avoid NaN
      return possible > 0 ? (achieved / possible) : 0;
    };

    // Process Days into Weeks
    days.forEach((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayIndex = getDay(day);
      
      // Track Month starts for labels
      if (day.getDate() <= 7 && dayIndex === 0) {
         monthLabels.push({ name: format(day, 'MMM'), index: tempWeeks.length });
      } else if (day.getDate() === 1 && dayIndex !== 0) {
         // If month starts mid-week, label the next full week
         monthLabels.push({ name: format(day, 'MMM'), index: tempWeeks.length + 1 });
      }

      const intensity = calculateIntensity(dateStr, day);
      
      currentWeek[dayIndex] = { date: day, dateStr, intensity };

      if (dayIndex === 6) {
        tempWeeks.push(currentWeek);
        currentWeek = Array(7).fill(null);
      }
    });

    if (currentWeek.some(d => d !== null)) tempWeeks.push(currentWeek);

    return { weeks: tempWeeks, totalContributions: total, months: monthLabels };
  }, [habits, allChecks, year]);


  // 2. AUTO-SCROLL (Only if viewing current year)
  useEffect(() => {
    if (scrollRef.current && year === getYear(today)) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    } else if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [year, weeks]);


  // 3. COLOR SCALE (Improved for Light/Dark modes)
  const getColor = (intensity) => {
    if (intensity === -1) return 'bg-transparent'; // Future
    
    // Light Mode: Darker grays for empty. Dark Mode: Transparent grays.
    if (intensity === 0) return 'bg-slate-200 dark:bg-slate-800/50'; 
    
    // Blue scale
    if (intensity <= 0.25) return 'bg-blue-300 dark:bg-blue-900/60';
    if (intensity <= 0.50) return 'bg-blue-400 dark:bg-blue-700';
    if (intensity <= 0.75) return 'bg-blue-500 dark:bg-blue-600';
    return 'bg-blue-700 dark:bg-blue-500';
  };

  return (
    <div className="w-full space-y-2">
      
      {/* HEADER INFO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end px-1 gap-2 sm:gap-0 mb-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {totalContributions} contributions in {year}
          </h4>
          <p className="text-[10px] text-slate-500 dark:text-slate-500 font-medium">
            {format(startOfYear(new Date(year, 0, 1)), 'MMM d')} – {format(endOfYear(new Date(year, 0, 1)), 'MMM d, yyyy')}
          </p>
        </div>
        
        {/* LEGEND */}
        <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-[2px] bg-slate-200 dark:bg-slate-800/50" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-blue-300 dark:bg-blue-900/60" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-blue-500 dark:bg-blue-600" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-blue-700 dark:bg-blue-500" />
          <span>More</span>
        </div>
      </div>

      {/* SCROLL CONTAINER */}
      <div 
        ref={scrollRef}
        className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent"
      >
        <div className="flex flex-col min-w-max">
          
          {/* MONTH LABELS */}
          <div className="flex h-4 mb-1 relative text-[9px] font-bold text-slate-400 dark:text-slate-500 pl-8">
             {months.map((m, i) => (
                // Approximate width of a week column is ~14px (10px box + 4px gap)
                // We use absolute or relative positioning. Simple flex spacing is safer for scrolling.
                // Here we render empty spacers based on week index diffs.
                <div 
                  key={m.name} 
                  style={{ 
                    position: 'absolute', 
                    left: `${m.index * 14}px` // 10px width + 4px gap = 14px per column
                  }}
                >
                  {m.name}
                </div>
             ))}
          </div>

          <div className="flex gap-1">
            {/* DAY LABELS (Mon/Wed/Fri) */}
            <div className="grid grid-rows-7 gap-1 text-[9px] font-bold text-slate-400 dark:text-slate-600 pr-2 pt-[1px] leading-3 h-[90px]">
              <span></span>
              <span>Mon</span>
              <span></span>
              <span>Wed</span>
              <span></span>
              <span>Fri</span>
              <span></span>
            </div>

            {/* THE GRID */}
            <div className="flex gap-1 h-[90px]">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="grid grid-rows-7 gap-1">
                  {week.map((day, dayIdx) => {
                    if (!day) return <div key={dayIdx} className="w-2.5 h-2.5" />; // Empty slot
                    
                    const score = Math.round((day.intensity || 0) * 100);

                    return (
                      <div 
                        key={day.dateStr}
                        className={`
                          w-2.5 h-2.5 rounded-[2px] transition-colors duration-200 relative group cursor-pointer
                          ${getColor(day.intensity)}
                        `}
                      >
                        {/* TOOLTIP: Fixed z-index and positioning */}
                        {day.intensity !== -1 && (
                          <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 bg-slate-800 text-white text-[10px] rounded-md shadow-xl whitespace-nowrap z-[9999] border border-slate-700 pointer-events-none">
                            <div className="font-bold text-xs">{score}% Done</div>
                            <div className="text-slate-400 text-[9px]">{format(day.date, 'MMM do, yyyy')}</div>
                            {/* Arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YearlyHeatmap;