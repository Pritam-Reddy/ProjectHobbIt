import React, { useState, useEffect } from 'react';
import { X, Save, MessageSquare } from 'lucide-react';

const NoteModal = ({ isOpen, onClose, onSave, initialNote, dateStr, habitName }) => {
  const [note, setNote] = useState('');

  useEffect(() => {
    setNote(initialNote || '');
  }, [initialNote, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(note);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
        
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
          <div className="flex flex-col">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <MessageSquare size={16} className="text-purple-500" /> Day Note
            </h3>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wide">
              {dateStr} • {habitName}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full h-32 p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none placeholder:text-slate-400"
            placeholder="Why did you miss this? Or what did you achieve?"
            autoFocus
          />
          <div className="mt-4 flex gap-2">
            <button 
              type="button" 
              onClick={() => { onSave(''); onClose(); }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Clear Note
            </button>
            <button 
              type="submit"
              className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Save size={14} /> Save Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteModal;