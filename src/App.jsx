import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronLeft, ChevronRight, LogIn, LayoutDashboard, X, MinusCircle, User, GripVertical, Moon, Sun } from 'lucide-react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, subMonths, isToday } from 'date-fns';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase"; 

import HabitRow from './components/HabitRow';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import EditHabitModal from './components/EditHabitModal';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  
  // --- MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null); 
  const [editingParentId, setEditingParentId] = useState(null); 

  const [user, setUser] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false); 

  // --- DARK MODE ---
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // --- RESIZABLE SIDEBAR ---
  const [sidebarWidth, setSidebarWidth] = useState(window.innerWidth < 768 ? 180 : 360);
  const isResizing = useRef(false);

  const startResizing = (e) => {
    isResizing.current = true;
    const startX = e.clientX || e.touches[0].clientX;
    const startWidth = sidebarWidth;

    const onMove = (moveEvent) => {
      if (!isResizing.current) return;
      const clientX = moveEvent.clientX || (moveEvent.touches && moveEvent.touches[0].clientX);
      const newWidth = startWidth + (clientX - startX);
      if (newWidth > 140 && newWidth < window.innerWidth * 0.8) {
        setSidebarWidth(newWidth);
      }
    };

    const onUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove);
    document.addEventListener('touchend', onUp);
  };

  // --- DATA ---
  const DEFAULT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const DEFAULT_HABITS = [
    { id: 1, name: "Habit 1", subHabits: [], expanded: true, goal: 0, unit: "", frequency: DEFAULT_DAYS },
    { id: 2, name: "Habit 2", subHabits: [], expanded: true, goal: 0, unit: "", frequency: DEFAULT_DAYS },
    { id: 3, name: "Habit 3", subHabits: [], expanded: true, goal: 0, unit: "", frequency: DEFAULT_DAYS }
  ];
  const DEFAULT_CHECKS = {};

  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem('habits');
    return saved ? JSON.parse(saved) : DEFAULT_HABITS;
  });

  const [allChecks, setAllChecks] = useState(() => {
    const saved = localStorage.getItem('allChecks');
    return saved ? JSON.parse(saved) : DEFAULT_CHECKS;
  });

  // --- AUTH & SYNC ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setIsDataLoaded(false);
      setUser(currentUser);

      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setHabits(data.habits || DEFAULT_HABITS);
            setAllChecks(data.allChecks || DEFAULT_CHECKS);
          } else {
            setDoc(userDocRef, { habits: DEFAULT_HABITS, allChecks: DEFAULT_CHECKS });
            setHabits(DEFAULT_HABITS);
            setAllChecks(DEFAULT_CHECKS);
          }
          setIsDataLoaded(true);
        });
        return () => unsubDoc();
      } else {
        setHabits(DEFAULT_HABITS);
        setAllChecks(DEFAULT_CHECKS);
        localStorage.removeItem('habits');
        localStorage.removeItem('allChecks');
        setIsDataLoaded(true);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isDataLoaded) return;
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      setDoc(userDocRef, { habits, allChecks }, { merge: true });
    } else {
      localStorage.setItem('habits', JSON.stringify(habits));
      localStorage.setItem('allChecks', JSON.stringify(allChecks));
    }
  }, [habits, allChecks, user, isDataLoaded]);

  const firstDay = startOfMonth(currentDate);
  const lastDay = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: firstDay, end: lastDay });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem('habits');
      localStorage.removeItem('allChecks');
      await signOut(auth);
      window.location.reload();
    }
  };

  // --- MODAL HANDLERS ---
  const openCreateModal = () => {
    setEditingHabit(null);
    setEditingParentId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (habit) => {
    setEditingHabit(habit);
    setEditingParentId(null);
    setIsModalOpen(true);
  };

  const openEditSubModal = (parentId, subHabit) => {
    setEditingParentId(parentId);
    setEditingHabit(subHabit);
    setIsModalOpen(true);
  };

  // --- SAVE LOGIC ---
  const handleSaveHabitData = (id, data) => {
    if (editingParentId) {
      setHabits(habits.map(h => {
        if (h.id === editingParentId) {
          return {
            ...h,
            subHabits: h.subHabits.map(sub => sub.id === id ? { ...sub, ...data } : sub)
          };
        }
        return h;
      }));
    } else if (id) {
      setHabits(habits.map(h => h.id === id ? { ...h, ...data } : h));
    } else {
      const newHabit = {
        id: Date.now(),
        subHabits: [],
        expanded: true,
        ...data
      };
      setHabits([...habits, newHabit]);
    }
  };

  const deleteHabit = (habitId) => {
    if (window.confirm("Delete this habit?")) {
      setHabits(habits.filter(h => h.id !== habitId));
    }
  };

  const deleteSubHabit = (habitId, subHabitId) => {
    if (window.confirm("Delete this sub-habit?")) {
      setHabits(habits.map(h => {
        if (h.id === habitId) {
          return { ...h, subHabits: h.subHabits.filter(sub => sub.id !== subHabitId) };
        }
        return h;
      }));
    }
  };

  const addSubHabit = (parentId) => {
    const name = prompt("Enter sub-habit name:");
    if (!name) return;
    const parent = habits.find(h => h.id === parentId);
    
    const newSub = { 
      id: Date.now(), 
      name, 
      goal: 0, 
      unit: '', 
      frequency: parent.frequency || DEFAULT_DAYS 
    };

    setHabits(habits.map(h => h.id === parentId ? 
      { ...h, subHabits: [...h.subHabits, newSub], expanded: true } : h
    ));
    
    if (parent.subHabits.length === 0) {
      const existingHistory = allChecks[parentId]?.main || [];
      if (existingHistory.length > 0) {
        setAllChecks(prev => {
          const habitData = prev[parentId] || { main: [], subs: {}, values: {}, subValues: {} };
          return {
            ...prev,
            [parentId]: { ...habitData, subs: { ...habitData.subs, [newSub.id]: existingHistory } }
          };
        });
      }
    }
  };

  const toggleHabitExpansion = (habitId) => {
    setHabits(habits.map(h => h.id === habitId ? { ...h, expanded: !h.expanded } : h));
  };

  const collapseAll = () => {
    setHabits(habits.map(h => ({ ...h, expanded: false })));
  };

  const toggleCheckGlobal = (habitId, type, dateStr, subId = null) => {
    setAllChecks(prev => {
      // Ensure structure exists
      const habitData = prev[habitId] || { main: [], subs: {}, values: {}, subValues: {} };
      const newHabitData = { ...habitData, subs: { ...habitData.subs } };

      if (type === 'main') {
        const isChecked = newHabitData.main.includes(dateStr);
        if (isChecked) newHabitData.main = newHabitData.main.filter(d => d !== dateStr);
        else newHabitData.main = [...newHabitData.main, dateStr];
      } else if (type === 'sub') {
        const currentSubChecks = newHabitData.subs[subId] || [];
        const isChecked = currentSubChecks.includes(dateStr);
        if (isChecked) newHabitData.subs[subId] = currentSubChecks.filter(d => d !== dateStr);
        else newHabitData.subs[subId] = [...currentSubChecks, dateStr];
      }
      return { ...prev, [habitId]: newHabitData };
    });
  };

  // Update MAIN Habit Goal
  const updateHabitValue = (habitId, dateStr, value) => {
    setAllChecks(prev => {
      const habitData = prev[habitId] || { main: [], subs: {}, values: {}, subValues: {} };
      const currentValues = habitData.values || {};
      const newValues = { ...currentValues, [dateStr]: Number(value) };
      return { 
        ...prev, 
        [habitId]: { ...habitData, values: newValues } 
      };
    });
  };

  // NEW: Update SUB Habit Goal
  const updateSubHabitValue = (habitId, subId, dateStr, value) => {
    setAllChecks(prev => {
      const habitData = prev[habitId] || { main: [], subs: {}, values: {}, subValues: {} };
      const currentSubValues = habitData.subValues || {};
      const specificSubValues = currentSubValues[subId] || {};
      
      const newSpecificSubValues = { ...specificSubValues, [dateStr]: Number(value) };
      
      return {
        ...prev,
        [habitId]: {
          ...habitData,
          subValues: {
            ...currentSubValues,
            [subId]: newSpecificSubValues
          }
        }
      };
    });
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* MENU BAR */}
      <div className="border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 py-4 flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-900 z-50 shadow-sm gap-4 transition-colors">
        <div className="flex items-center gap-6 w-full md:w-auto justify-between">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
            Project<span className="text-blue-600 dark:text-blue-400">HobbIt</span>
          </h1>
          
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg p-1 border border-slate-100 dark:border-slate-700">
            <button onClick={prevMonth} className="p-2 hover:bg-white dark:hover:bg-slate-700 hover:shadow rounded-md text-slate-500 dark:text-slate-400"><ChevronLeft size={16} /></button>
            <span className="w-28 md:w-32 text-center text-sm font-semibold text-slate-700 dark:text-slate-200 select-none">{format(currentDate, 'MMMM yyyy')}</span>
            <button onClick={nextMonth} className="p-2 hover:bg-white dark:hover:bg-slate-700 hover:shadow rounded-md text-slate-500 dark:text-slate-400"><ChevronRight size={16} /></button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-500 dark:text-yellow-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button 
            onClick={() => setShowDashboard(!showDashboard)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all whitespace-nowrap
              ${showDashboard ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}
            `}
          >
            {showDashboard ? <X size={18} /> : <LayoutDashboard size={18} />}
            <span className="hidden md:inline">{showDashboard ? 'Close Stats' : 'Stats'}</span>
          </button>

          <button 
            onClick={openCreateModal}
            className="flex-1 md:flex-none bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white px-5 py-2.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} strokeWidth={3} /> <span className="text-sm">Add Habit</span>
          </button>
          
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden md:block"></div>
          
          {user ? (
            <div className="flex items-center gap-3 shrink-0">
               {user.photoURL ? (
                 <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600" title={user.displayName} />
               ) : (
                 <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400" title={user.displayName}><User size={18} /></div>
               )}
               <button onClick={handleLogout} className="text-xs font-bold text-slate-500 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-1.5 rounded-full transition-colors">Log Out</button>
            </div>
          ) : (
            <button onClick={() => setIsAuthOpen(true)} className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 shrink-0">
              <LogIn size={18} /> <span className="hidden md:inline">Login</span>
            </button>
          )}
        </div>
      </div>

      {showDashboard && <Dashboard habits={habits} allChecks={allChecks} daysInMonth={daysInMonth} darkMode={darkMode} />}

      <div className="flex-1 overflow-hidden relative flex flex-col bg-white dark:bg-slate-900">
        <div className="flex-1 overflow-auto">
          <div className="inline-block min-w-full align-top">
            
            <div className="flex border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900 z-40 transition-colors">
              <div 
                className="flex shrink-0 sticky left-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 z-50 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none relative group transition-colors"
                style={{ width: `${sidebarWidth}px` }}
              >
                <div className="flex-1 p-2 md:p-5 font-bold text-slate-400 dark:text-slate-500 text-[10px] md:text-xs uppercase tracking-wider flex items-end pb-2 md:pb-4 gap-2 overflow-hidden">
                  <span>Habit Name</span>
                  <button onClick={collapseAll} className="mb-0.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Close All Sub-tasks">
                    <MinusCircle size={14} />
                  </button>
                </div>
                
                <div className="w-12 md:w-24 p-2 md:p-5 font-bold text-slate-400 dark:text-slate-500 text-[10px] md:text-xs uppercase tracking-wider flex items-end pb-2 md:pb-4 text-center border-l border-slate-50 dark:border-slate-800 shrink-0">
                  <span className="hidden md:inline">Progress</span>
                  <span className="md:hidden">%</span>
                </div>

                <div 
                  className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-blue-400 active:bg-blue-600 z-[60] transition-colors"
                  onMouseDown={startResizing}
                  onTouchStart={startResizing}
                >
                   <div className="absolute top-1/2 -translate-y-1/2 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical size={12} className="text-slate-400" />
                   </div>
                </div>
              </div>

              <div className="flex">
                {daysInMonth.map((day) => (
                  <div key={day.toString()} className={`min-w-[50px] md:min-w-[80px] flex flex-col items-center justify-center border-r border-slate-100 dark:border-slate-800 py-2 md:py-4 ${isToday(day) ? 'bg-blue-50/40 dark:bg-blue-900/20' : 'bg-white dark:bg-slate-900'}`}>
                    <span className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">{format(day, 'EEE')}</span>
                    <div className={`w-7 h-7 md:w-10 md:h-10 flex items-center justify-center rounded-full text-sm md:text-lg font-bold transition-all ${isToday(day) ? 'bg-blue-600 text-white shadow-md scale-110' : 'text-slate-600 dark:text-slate-400'}`}>{format(day, 'd')}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pb-20">
              {habits.map(habit => (
                <HabitRow 
                  key={habit.id} 
                  habit={habit} 
                  days={daysInMonth} 
                  onAddSubHabit={addSubHabit}
                  onDelete={() => deleteHabit(habit.id)}
                  onDeleteSubHabit={deleteSubHabit}
                  
                  onEdit={() => openEditModal(habit)} 
                  onEditSubHabit={(sub) => openEditSubModal(habit.id, sub)}

                  checks={allChecks[habit.id] || { main: [], subs: {}, values: {}, subValues: {} }}
                  onToggleGlobal={toggleCheckGlobal}
                  onUpdateValue={updateHabitValue}
                  onUpdateSubValue={updateSubHabitValue} // PASS NEW FUNCTION
                  
                  expanded={habit.expanded}
                  onToggleExpand={() => toggleHabitExpansion(habit.id)}
                  sidebarWidth={sidebarWidth}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      
      <EditHabitModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        habit={editingHabit}
        onSave={handleSaveHabitData}
        isSubHabit={!!editingParentId}
      />
    </div>
  )
}

export default App;