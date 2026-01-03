import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Type, Target, Ruler } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const EditHabitModal = ({ isOpen, onClose, habit, onSave, isSubHabit = false }) => {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState(0);
  const [unit, setUnit] = useState('');
  const [frequency, setFrequency] = useState(DAYS);

  useEffect(() => {
    if (isOpen) {
      if (habit) {
        setName(habit.name || '');
        setGoal(habit.goal || 0);
        setUnit(habit.unit || '');
        setFrequency(habit.frequency || DAYS);
      } else {
        setName('');
        setGoal(0);
        setUnit('');
        setFrequency(DAYS);
      }
    }
  }, [habit, isOpen]);

  if (!isOpen) return null;

  const toggleDay = (day) => {
    if (frequency.includes(day)) {
      if (frequency.length > 1) setFrequency(frequency.filter(d => d !== day));
    } else {
      setFrequency([...frequency, day]);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSave(habit?.id, { name, goal: Number(goal), unit, frequency });
    onClose();
  };

  const title = habit ? (isSubHabit ? "Edit Sub-Task" : "Edit Habit") : "Create New Habit";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
          <h3 className="font-bold text-slate-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5"><Type size={12} /> Name</label>
            <input value={name} onChange={e => setName(e.target.value)} autoFocus className="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder={isSubHabit ? "e.g. Warmup Sets" : "e.g. Morning Run"} required />
          </div>
          <div className="flex gap-4">
            <div className="flex-1 space-y-1.5 min-w-0">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5"><Target size={12} /> Goal</label>
              <input type="number" value={goal === 0 ? '' : goal} onChange={e => setGoal(e.target.value)} className="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0" />
            </div>
            <div className="flex-1 space-y-1.5 min-w-0">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5"><Ruler size={12} /> Unit</label>
              <input value={unit} onChange={e => setUnit(e.target.value)} className="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. mins" />
            </div>
          </div>
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5"><Calendar size={12} /> Frequency</label>
            <div className="flex justify-between gap-1">
              {DAYS.map(day => (
                <button key={day} type="button" onClick={() => toggleDay(day)} className={`flex-1 h-9 rounded-lg text-[10px] font-bold transition-all transform active:scale-95 border border-transparent ${frequency.includes(day) ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 border-slate-100 dark:border-slate-700'}`}>{day}</button>
              ))}
            </div>
          </div>
          <button type="submit" className="w-full py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-blue-500 transition-all shadow-lg flex items-center justify-center gap-2 mt-2"><Save size={18} /> {habit ? 'Save Changes' : 'Create Habit'}</button>
        </form>
      </div>
    </div>
  );
};

export default EditHabitModal;