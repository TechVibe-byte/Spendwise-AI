
import React, { useState, useRef } from 'react';
import { Expense, RecurringExpense, CategoryItem } from '../types';

interface SettingsProps {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  recurringExpenses: RecurringExpense[];
  setRecurringExpenses: React.Dispatch<React.SetStateAction<RecurringExpense[]>>;
  customCategories: CategoryItem[];
  setCustomCategories: React.Dispatch<React.SetStateAction<CategoryItem[]>>;
  monthlyBudget: number;
  setMonthlyBudget: React.Dispatch<React.SetStateAction<number>>;
}

const Settings: React.FC<SettingsProps> = ({
  expenses, setExpenses,
  recurringExpenses, setRecurringExpenses,
  customCategories, setCustomCategories,
  monthlyBudget, setMonthlyBudget
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [budgetInput, setBudgetInput] = useState(monthlyBudget.toString());
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateBudget = () => {
    const val = parseFloat(budgetInput);
    if (!isNaN(val) && val >= 0) {
      setMonthlyBudget(val);
      alert('Monthly budget updated successfully!');
    } else {
      alert('Please enter a valid amount.');
    }
  };

  const handleClearData = () => {
    localStorage.removeItem('spendwise-expenses');
    localStorage.removeItem('spendwise-recurring');
    localStorage.removeItem('spendwise-custom-categories');
    localStorage.removeItem('spendwise-onboarded');
    localStorage.removeItem('spendwise-theme');
    localStorage.removeItem('spendwise-budget');
    window.location.reload();
  };

  const exportJSON = () => {
    const data = {
      version: 1,
      timestamp: new Date().toISOString(),
      expenses,
      recurringExpenses,
      customCategories,
      monthlyBudget
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spendwise_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCSV = () => {
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
      e.bankName || ""
    ]);

    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `spendwise_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleJSONImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        let importedCount = 0;
        
        if (data.expenses && Array.isArray(data.expenses)) {
          const existingIds = new Set(expenses.map(e => e.id));
          const newExpenses = data.expenses.filter((e: Expense) => !existingIds.has(e.id));
          if (newExpenses.length > 0) {
            setExpenses(prev => [...prev, ...newExpenses]);
            importedCount += newExpenses.length;
          }
        }
        
        if (data.customCategories && Array.isArray(data.customCategories)) {
          const existingIds = new Set(customCategories.map(c => c.id));
          const newCats = data.customCategories.filter((c: CategoryItem) => !existingIds.has(c.id));
          if (newCats.length > 0) {
            setCustomCategories(prev => [...prev, ...newCats]);
          }
        }
        
        if (data.recurringExpenses && Array.isArray(data.recurringExpenses)) {
          const existingIds = new Set(recurringExpenses.map(r => r.id));
          const newRec = data.recurringExpenses.filter((r: RecurringExpense) => !existingIds.has(r.id));
          if (newRec.length > 0) {
            setRecurringExpenses(prev => [...prev, ...newRec]);
          }
        }

        if (data.monthlyBudget && typeof data.monthlyBudget === 'number') {
            setMonthlyBudget(data.monthlyBudget);
            setBudgetInput(data.monthlyBudget.toString());
        }
        
        alert(`Backup imported successfully! Added ${importedCount} transactions.`);
        if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
      } catch (err) {
        alert('Invalid backup file. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const newExpenses: Expense[] = [];
      let skipped = 0;

      // Expecting Header: Date, Description, Category, Amount, Bank
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Simple regex to split by comma but ignore commas inside quotes
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        
        if (parts.length >= 4) {
          const date = parts[0].trim();
          const description = parts[1].replace(/^"|"$/g, '').trim();
          const category = parts[2].trim();
          const amount = parseFloat(parts[3]);
          const bank = parts[4] ? parts[4].replace(/^"|"$/g, '').trim() : undefined;

          if (date && description && !isNaN(amount)) {
            newExpenses.push({
              id: Math.random().toString(36).substr(2, 9),
              date,
              description,
              category, 
              amount,
              bankName: bank
            });
          } else {
            skipped++;
          }
        } else {
          skipped++;
        }
      }
      
      if (newExpenses.length > 0) {
        setExpenses(prev => [...prev, ...newExpenses]);
        alert(`Successfully imported ${newExpenses.length} transactions from CSV.${skipped > 0 ? ` Skipped ${skipped} invalid lines.` : ''}`);
      } else {
        alert('No valid transactions found in CSV. Ensure format is: Date, Description, Category, Amount, Bank');
      }
      if (csvFileInputRef.current) csvFileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Settings</h2>
      
      {/* General Preferences: Budget */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">General Preferences</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Customize your experience.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Monthly Budget Goal (₹)
            </label>
            <input
              type="number"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
            />
          </div>
          <button
            onClick={handleUpdateBudget}
            className="w-full md:w-auto px-6 py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all h-[50px]"
          >
            Update Budget
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Data Import & Export</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Backup your data securely or transfer it to another device.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
             <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Export</h4>
             <button
               onClick={exportCSV}
               className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center justify-center group"
             >
               <svg className="w-5 h-5 mr-2 text-slate-400 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
               Export to CSV (Spreadsheet)
             </button>
             <button
               onClick={exportJSON}
               className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center justify-center group"
             >
               <svg className="w-5 h-5 mr-2 text-slate-400 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
               Full Backup (JSON)
             </button>
          </div>

          <div className="space-y-3">
             <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Import</h4>
             <div className="relative">
               <input
                 type="file"
                 accept=".csv"
                 ref={csvFileInputRef}
                 onChange={handleCSVImport}
                 className="hidden"
               />
               <button
                 onClick={() => csvFileInputRef.current?.click()}
                 className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold rounded-xl hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all flex items-center justify-center group"
               >
                 <svg className="w-5 h-5 mr-2 text-slate-400 group-hover:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m-4-4v12" /></svg>
                 Import CSV
               </button>
             </div>
             <div className="relative">
               <input
                 type="file"
                 accept=".json"
                 ref={jsonFileInputRef}
                 onChange={handleJSONImport}
                 className="hidden"
               />
               <button
                 onClick={() => jsonFileInputRef.current?.click()}
                 className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold rounded-xl hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all flex items-center justify-center group"
               >
                 <svg className="w-5 h-5 mr-2 text-slate-400 group-hover:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                 Restore Backup (JSON)
               </button>
             </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Danger Zone</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Manage your local data. All expenses are stored in your browser's local storage.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full md:w-auto px-6 py-3 bg-white dark:bg-slate-800 text-red-500 border border-slate-200 dark:border-slate-700 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Clear All Data
            </button>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
              <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-3">
                Are you sure? This will delete all your expenses and cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleClearData}
                  className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg text-sm hover:bg-red-700 transition-colors"
                >
                  Yes, Delete Everything
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl p-6 md:p-8 border border-indigo-100 dark:border-indigo-800/50">
        <h3 className="text-lg font-bold text-indigo-900 dark:text-white mb-2">About SpendWise</h3>
        <p className="text-indigo-700 dark:text-indigo-300 text-sm leading-relaxed mb-4">
          SpendWise helps you track daily expenses efficiently.
          Your financial data stays on your device.
        </p>
        <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium">
          Version 1.0.0
        </p>
      </div>
    </div>
  );
};

export default Settings;
