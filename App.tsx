
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Expense, RecurringExpense, RecurringFrequency, CategoryItem } from './types';
import { DEFAULT_CATEGORIES } from './constants';
import { formatCurrency } from './utils';
import Dashboard from './components/Dashboard';
import ExpenseList from './components/ExpenseList';
import ExpenseForm from './components/ExpenseForm';
import RecurringManager from './components/RecurringManager';
import CategoryManager from './components/CategoryManager';
import Settings from './components/Settings';
import Onboarding from './components/Onboarding';
import { Logo } from './components/Logo';

const App: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('spendwise-expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(() => {
    const saved = localStorage.getItem('spendwise-recurring');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [customCategories, setCustomCategories] = useState<CategoryItem[]>(() => {
    const saved = localStorage.getItem('spendwise-custom-categories');
    return saved ? JSON.parse(saved) : [];
  });

  const [monthlyBudget, setMonthlyBudget] = useState<number>(() => {
    const saved = localStorage.getItem('spendwise-budget');
    return saved ? parseFloat(saved) : 50000;
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('spendwise-theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingRecurring, setEditingRecurring] = useState<RecurringExpense | null>(null);
  
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('spendwise-onboarded');
  });

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  // Combine defaults with custom categories
  const allCategories = useMemo(() => {
    return [...DEFAULT_CATEGORIES, ...customCategories];
  }, [customCategories]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('spendwise-expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('spendwise-recurring', JSON.stringify(recurringExpenses));
  }, [recurringExpenses]);
  
  useEffect(() => {
    localStorage.setItem('spendwise-custom-categories', JSON.stringify(customCategories));
  }, [customCategories]);

  useEffect(() => {
    localStorage.setItem('spendwise-budget', monthlyBudget.toString());
  }, [monthlyBudget]);

  // Theme management
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('spendwise-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('spendwise-theme', 'light');
    }
  }, [isDarkMode]);

  // Recurring processing logic
  const processRecurring = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let updatedRecurring = [...recurringExpenses];
    let newExpensesToAdd: Expense[] = [];
    let modified = false;

    updatedRecurring = updatedRecurring.map(rule => {
      if (!rule.isActive) return rule;

      let nextDate = new Date(rule.nextOccurrenceDate);
      nextDate.setHours(0, 0, 0, 0);
      
      const instancesToAdd: Expense[] = [];
      const currentRule = { ...rule };

      while (nextDate <= today) {
        modified = true;
        const newInstance: Expense = {
          id: Math.random().toString(36).substr(2, 9),
          amount: currentRule.amount,
          description: `${currentRule.description} (Recurring)`,
          category: currentRule.category,
          date: nextDate.toISOString().split('T')[0],
          bankName: currentRule.bankName,
          recurringId: currentRule.id
        };
        instancesToAdd.push(newInstance);

        if (currentRule.frequency === RecurringFrequency.DAILY) {
          nextDate.setDate(nextDate.getDate() + 1);
        } else if (currentRule.frequency === RecurringFrequency.WEEKLY) {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (currentRule.frequency === RecurringFrequency.MONTHLY) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (currentRule.frequency === RecurringFrequency.YEARLY) {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        }
      }

      if (instancesToAdd.length > 0) {
        newExpensesToAdd = [...newExpensesToAdd, ...instancesToAdd];
        currentRule.nextOccurrenceDate = nextDate.toISOString().split('T')[0];
        return currentRule;
      }
      return rule;
    });

    if (modified) {
      setExpenses(prev => [...newExpensesToAdd, ...prev]);
      setRecurringExpenses(updatedRecurring);
    }
  }, [recurringExpenses]);

  useEffect(() => {
    processRecurring();
  }, [processRecurring]);

  const handleSaveExpense = (newExpenseData: Omit<Expense, 'id'>, recurringInfo?: { frequency: RecurringFrequency }) => {
    if (editingExpense) {
      setExpenses(prev => prev.map(e => 
        e.id === editingExpense.id ? { ...newExpenseData, id: e.id, recurringId: e.recurringId } : e
      ));
      setEditingExpense(null);
    } else if (editingRecurring) {
      if (recurringInfo) {
        // Update existing recurring rule
        setRecurringExpenses(prev => prev.map(r => r.id === editingRecurring.id ? {
            ...r,
            amount: newExpenseData.amount,
            description: newExpenseData.description,
            category: newExpenseData.category,
            bankName: newExpenseData.bankName,
            frequency: recurringInfo.frequency,
            nextOccurrenceDate: newExpenseData.date, // User updated the date, treating it as next due
        } : r));
      } else {
        // User unchecked recurring, convert to one-time expense and remove rule
        const id = Math.random().toString(36).substr(2, 9);
        setExpenses(prev => [{ ...newExpenseData, id }, ...prev]);
        setRecurringExpenses(prev => prev.filter(r => r.id !== editingRecurring.id));
      }
      setEditingRecurring(null);
    } else {
      const id = Math.random().toString(36).substr(2, 9);
      const expense: Expense = { ...newExpenseData, id };
      setExpenses(prev => [expense, ...prev]);

      if (recurringInfo) {
        const nextDate = new Date(newExpenseData.date);
        if (recurringInfo.frequency === RecurringFrequency.DAILY) nextDate.setDate(nextDate.getDate() + 1);
        else if (recurringInfo.frequency === RecurringFrequency.WEEKLY) nextDate.setDate(nextDate.getDate() + 7);
        else if (recurringInfo.frequency === RecurringFrequency.MONTHLY) nextDate.setMonth(nextDate.getMonth() + 1);
        else if (recurringInfo.frequency === RecurringFrequency.YEARLY) nextDate.setFullYear(nextDate.getFullYear() + 1);

        const recurringRule: RecurringExpense = {
          id: Math.random().toString(36).substr(2, 9),
          amount: newExpenseData.amount,
          description: newExpenseData.description,
          category: newExpenseData.category,
          bankName: newExpenseData.bankName,
          frequency: recurringInfo.frequency,
          startDate: newExpenseData.date,
          nextOccurrenceDate: nextDate.toISOString().split('T')[0],
          isActive: true
        };
        setRecurringExpenses(prev => [...prev, recurringRule]);
      }
    }
    setShowForm(false);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleEditRecurring = (rule: RecurringExpense) => {
    setEditingRecurring(rule);
    setShowForm(true);
  };

  const deleteRecurring = (id: string) => {
    setRecurringExpenses(prev => prev.filter(r => r.id !== id));
  };

  const toggleRecurring = (id: string) => {
    setRecurringExpenses(prev => prev.map(r => 
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
  };

  // Category Management Handlers
  const addCustomCategory = (name: string, color: string) => {
    // Prevent duplicates
    if (allCategories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      alert('Category already exists!');
      return;
    }
    const newCat: CategoryItem = {
      id: `custom_${Date.now()}`,
      name,
      color,
      isCustom: true
    };
    setCustomCategories(prev => [...prev, newCat]);
  };

  const deleteCustomCategory = (id: string) => {
    const categoryToDelete = customCategories.find(c => c.id === id);
    if (!categoryToDelete) return;

    // Check if being used
    const isUsed = expenses.some(e => e.category === categoryToDelete.name) || 
                   recurringExpenses.some(r => r.category === categoryToDelete.name);
    
    if (isUsed) {
      if (!confirm(`The category "${categoryToDelete.name}" is currently used in your transactions or recurring rules. Deleting it will keep the history but remove it from the list. Continue?`)) {
        return;
      }
    }
    setCustomCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleCompleteOnboarding = () => {
    localStorage.setItem('spendwise-onboarded', 'true');
    setShowOnboarding(false);
  };

  const exportToCSV = () => {
    if (expenses.length === 0) {
      alert("No data to export!");
      return;
    }
    const headers = ["Date", "Description", "Category", "Amount", "Bank"];
    const rows = expenses.map(e => [
      e.date,
      `"${e.description.replace(/"/g, '""')}"`,
      e.category,
      e.amount,
      e.bankName || "N/A"
    ]);

    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `spendwise_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  const closeForm = () => {
    setShowForm(false);
    setEditingExpense(null);
    setEditingRecurring(null);
  };

  const NavItems = () => (
    <>
      <NavLink 
        to="/" 
        className={({ isActive }) => `flex flex-col md:flex-row items-center md:space-x-3 px-3 py-2 md:px-4 md:py-3 rounded-xl transition-all font-semibold ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
      >
        <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
        <span className="text-[10px] md:text-sm mt-1 md:mt-0">Dashboard</span>
      </NavLink>
      <NavLink 
        to="/history" 
        className={({ isActive }) => `flex flex-col md:flex-row items-center md:space-x-3 px-3 py-2 md:px-4 md:py-3 rounded-xl transition-all font-semibold ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
      >
        <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
        <span className="text-[10px] md:text-sm mt-1 md:mt-0 flex items-center">
          Transactions
          {expenses.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-[9px] md:text-[10px] font-black bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full min-w-[1.25rem] text-center shadow-sm">
              {expenses.length}
            </span>
          )}
        </span>
      </NavLink>
      <NavLink 
        to="/recurring" 
        className={({ isActive }) => `flex flex-col md:flex-row items-center md:space-x-3 px-3 py-2 md:px-4 md:py-3 rounded-xl transition-all font-semibold ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
      >
        <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        <span className="text-[10px] md:text-sm mt-1 md:mt-0">Recurring</span>
      </NavLink>
      <NavLink 
        to="/categories" 
        className={({ isActive }) => `flex flex-col md:flex-row items-center md:space-x-3 px-3 py-2 md:px-4 md:py-3 rounded-xl transition-all font-semibold ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
      >
        <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
        <span className="text-[10px] md:text-sm mt-1 md:mt-0">Categories</span>
      </NavLink>
      <NavLink 
        to="/settings" 
        className={({ isActive }) => `flex flex-col md:flex-row items-center md:space-x-3 px-3 py-2 md:px-4 md:py-3 rounded-xl transition-all font-semibold ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
      >
        <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        <span className="text-[10px] md:text-sm mt-1 md:mt-0">Settings</span>
      </NavLink>
    </>
  );

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-300 pb-28 md:pb-0">
        
        {showOnboarding && <Onboarding onComplete={handleCompleteOnboarding} />}

        {/* Mobile Header */}
        <header className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 via-violet-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-md shadow-indigo-100 dark:shadow-none border border-white/10">
              <Logo className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">SpendWise</h1>
          </div>
          <div className="flex items-center space-x-2">
            {showInstallBtn && (
              <button
                onClick={handleInstallClick}
                className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 animate-pulse"
                aria-label="Install App"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </button>
            )}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
            >
              {isDarkMode ? (
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" /></svg>
              ) : (
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
          </div>
        </header>

        {/* Desktop Navigation Sidebar */}
        <nav className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 flex-col sticky top-0 h-screen z-40">
          <div className="flex items-center space-x-3 mb-10">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-violet-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none border border-white/20">
              <Logo className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">SpendWise</h1>
          </div>

          <div className="flex-1 space-y-2">
            <NavItems />
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 mt-4"
            >
              {isDarkMode ? (
                <><svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" /></svg><span>Light Mode</span></>
              ) : (
                <><svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg><span>Dark Mode</span></>
              )}
            </button>
          </div>

          <div className="space-y-4 mt-6">
            {showInstallBtn && (
              <button 
                onClick={handleInstallClick}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg hover:opacity-90 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                <span>Install App</span>
              </button>
            )}

            <button 
              onClick={exportToCSV}
              className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 py-3.5 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all hover:text-indigo-600 dark:hover:text-indigo-400 group"
            >
              <svg className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              <span>Export CSV</span>
            </button>

            <button 
              onClick={() => setShowForm(true)}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-xl hover:bg-indigo-700 transition-all hover:-translate-y-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              <span>Add Expense</span>
            </button>
          </div>
        </nav>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-around z-50 pb-safe">
          <NavItems />
        </nav>

        {/* Mobile Floating Action Button (FAB) */}
        <button 
          onClick={() => setShowForm(true)}
          className="md:hidden fixed bottom-20 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform"
          aria-label="Add Expense"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
        </button>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-10 max-w-6xl mx-auto w-full">
          <Routes>
            <Route path="/" element={
              <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <header className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Overview</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Summary of your financial activity</p>
                  </div>
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
                  </div>
                </header>
                
                <Dashboard expenses={expenses} categories={allCategories} monthlyBudget={monthlyBudget} />
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                  <div className="lg:col-span-2">
                    <ExpenseList 
                      expenses={expenses} 
                      onDelete={deleteExpense} 
                      onEdit={handleEditExpense} 
                      categories={allCategories}
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Quick Stats</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Avg. Daily Spend</span>
                          <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(totalSpent / (expenses.length > 0 ? 30 : 1))}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Highest Transaction</span>
                          <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(Math.max(...expenses.map(e=>e.amount), 0))}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Active Categories</span>
                          <span className="font-bold text-slate-900 dark:text-white">{new Set(expenses.map(e=>e.category)).size}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            } />
            <Route path="/history" element={
              <div className="space-y-6 animate-in fade-in duration-500">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Transaction History</h2>
                <ExpenseList 
                  expenses={expenses} 
                  onDelete={deleteExpense} 
                  onEdit={handleEditExpense} 
                  categories={allCategories}
                />
              </div>
            } />
            <Route path="/recurring" element={
              <div className="space-y-6 animate-in fade-in duration-500">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Recurring Payments</h2>
                <RecurringManager 
                  recurringExpenses={recurringExpenses} 
                  onDelete={deleteRecurring} 
                  onEdit={handleEditRecurring}
                  onToggle={toggleRecurring}
                  categories={allCategories}
                />
              </div>
            } />
            <Route path="/categories" element={
              <div className="space-y-6 animate-in fade-in duration-500">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Manage Categories</h2>
                <CategoryManager 
                  categories={allCategories} 
                  onAddCategory={addCustomCategory}
                  onDeleteCategory={deleteCustomCategory}
                />
              </div>
            } />
            <Route path="/settings" element={
              <Settings 
                expenses={expenses}
                setExpenses={setExpenses}
                recurringExpenses={recurringExpenses}
                setRecurringExpenses={setRecurringExpenses}
                customCategories={customCategories}
                setCustomCategories={setCustomCategories}
                monthlyBudget={monthlyBudget}
                setMonthlyBudget={setMonthlyBudget}
              />
            } />
          </Routes>
        </main>

        {/* Global Modal */}
        {showForm && (
          <ExpenseForm 
            onAdd={handleSaveExpense} 
            onClose={closeForm}
            initialExpense={editingExpense || (editingRecurring ? {
              id: editingRecurring.id,
              amount: editingRecurring.amount,
              description: editingRecurring.description,
              category: editingRecurring.category,
              date: editingRecurring.nextOccurrenceDate,
              bankName: editingRecurring.bankName
            } : undefined)}
            initialRecurringFrequency={editingRecurring?.frequency}
            categories={allCategories}
            onSwitchToAdd={() => {
              setEditingExpense(null);
              setEditingRecurring(null);
            }}
          />
        )}
      </div>
    </Router>
  );
};

export default App;
