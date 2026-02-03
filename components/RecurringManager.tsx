
import React, { useState } from 'react';
import { RecurringExpense, CategoryItem } from '../types';
import { getCategoryIcon } from '../constants';
import { formatCurrency } from '../utils';

interface RecurringManagerProps {
  recurringExpenses: RecurringExpense[];
  onDelete: (id: string) => void;
  onEdit: (expense: RecurringExpense) => void;
  onToggle: (id: string) => void;
  categories: CategoryItem[];
}

const RecurringManager: React.FC<RecurringManagerProps> = ({ recurringExpenses, onDelete, onEdit, onToggle, categories }) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getCategoryColor = (name: string) => {
    return categories.find(c => c.name === name)?.color || '#94a3b8';
  };

  const ruleToDelete = recurringExpenses.find(r => r.id === deleteConfirmId);

  if (recurringExpenses.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full mb-4">
          <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">No recurring expenses set up.</p>
        <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Add automated payments via the Add Expense form.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recurringExpenses.map((rule) => {
          const nextDueDate = new Date(rule.nextOccurrenceDate);
          nextDueDate.setHours(0, 0, 0, 0);
          const isPastDue = rule.isActive && nextDueDate < today;
          const isDueToday = rule.isActive && nextDueDate.getTime() === today.getTime();
          const categoryColor = getCategoryColor(rule.category);

          return (
            <div 
              key={rule.id} 
              className={`bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border transition-all duration-300 group relative ${
                rule.isActive 
                  ? isPastDue 
                    ? 'border-red-300 dark:border-red-900/50 bg-red-50/30 dark:bg-red-900/10' 
                    : isDueToday
                      ? 'border-amber-300 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-900/10'
                      : 'border-slate-100 dark:border-slate-800' 
                  : 'border-slate-200 dark:border-slate-800 opacity-60 grayscale-[0.5]'
              }`}
            >
              {/* Pulsing Indicator */}
              {isPastDue && (
                <div className="absolute -top-1 -right-1 flex h-5 w-5 z-10">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 shadow-sm border-2 border-white dark:border-slate-900"></span>
                </div>
              )}
              {!isPastDue && isDueToday && (
                <div className="absolute -top-1 -right-1 flex h-5 w-5 z-10">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-500 shadow-sm border-2 border-white dark:border-slate-900"></span>
                </div>
              )}

              <div className="flex justify-between items-start mb-6">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm"
                  style={{ 
                    backgroundColor: rule.isActive 
                      ? (isPastDue ? '#ef4444' : isDueToday ? '#f59e0b' : categoryColor) 
                      : '#94a3b8' 
                  }}
                >
                  {getCategoryIcon(rule.category)}
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    rule.isActive 
                      ? isPastDue 
                        ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' 
                        : isDueToday
                          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                          : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {rule.frequency}
                  </div>
                  <button 
                    onClick={() => onToggle(rule.id)}
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded transition-colors ${
                      rule.isActive 
                        ? isPastDue ? 'text-red-600 hover:text-red-700' : isDueToday ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700' 
                        : 'text-slate-400 hover:text-indigo-500'
                    }`}
                  >
                    {rule.isActive ? (isPastDue ? 'Overdue' : isDueToday ? 'Due Today' : 'Active') : 'Paused'}
                  </button>
                </div>
              </div>
              
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-1 truncate">{rule.description}</h4>
              {rule.bankName && (
                <p className="text-xs font-bold text-indigo-500 dark:text-indigo-400 mb-2 truncate">{rule.bankName}</p>
              )}
              <p className="text-2xl font-black text-slate-900 dark:text-white mb-4">{formatCurrency(rule.amount)}</p>
              
              <div className="space-y-2 border-t border-slate-50 dark:border-slate-800 pt-4">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 dark:text-slate-500">Next Due:</span>
                  <div className="text-right">
                    <span className={`font-semibold ${
                      isPastDue ? 'text-red-600 dark:text-red-400' : isDueToday ? 'text-amber-600 dark:text-amber-400' : rule.isActive ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'
                    }`}>
                      {rule.isActive 
                        ? nextDueDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Paused'}
                    </span>
                    {isPastDue && <div className="text-[10px] font-bold text-red-500 uppercase mt-0.5">Missed Payment</div>}
                    {!isPastDue && isDueToday && <div className="text-[10px] font-bold text-amber-500 uppercase mt-0.5">Payment due now</div>}
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center overflow-hidden mr-2">
                    <span className="text-slate-400 dark:text-slate-500 shrink-0">Category:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate ml-2">{rule.category}</span>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(rule);
                      }}
                      className="p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                      title="Edit Rule"
                    >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(rule.id);
                      }}
                      className="p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                      title="Delete Rule"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && ruleToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6 text-red-600 dark:text-red-400">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Delete Recurring Payment?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">
                This will permanently stop automated tracking for:
              </p>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl mb-8">
                <p className="font-bold text-slate-800 dark:text-slate-200">{ruleToDelete.description}</p>
                <p className="text-sm font-black text-red-500 mt-1">{formatCurrency(ruleToDelete.amount)} / {ruleToDelete.frequency}</p>
              </div>
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => {
                    onDelete(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }}
                  className="w-full px-4 py-4 rounded-2xl bg-red-600 text-white font-black text-sm hover:bg-red-700 transition-all active:scale-[0.98] shadow-lg shadow-red-100 dark:shadow-none"
                >
                  Delete Permanently
                </button>
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="w-full px-4 py-3 rounded-2xl text-slate-500 dark:text-slate-400 font-bold text-sm hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  Keep It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RecurringManager;
