
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Expense, CategoryItem } from '../types';
import { getCategoryIcon } from '../constants';
import { formatCurrency } from '../utils';

interface DashboardProps {
  expenses: Expense[];
  categories: CategoryItem[];
  monthlyBudget: number;
}

const Dashboard: React.FC<DashboardProps> = ({ expenses, categories, monthlyBudget }) => {
  const isDark = window.document.documentElement.classList.contains('dark');
  
  const getCategoryColor = (name: string) => {
    return categories.find(c => c.name === name)?.color || '#94a3b8';
  };

  const totalSpent = useMemo(() => 
    expenses.reduce((sum, e) => sum + e.amount, 0), 
  [expenses]);

  const categoryData = useMemo(() => {
    // Get all unique categories present in expenses
    const usedCategories = Array.from(new Set(expenses.map(e => e.category))) as string[];
    
    const data = usedCategories.map(catName => ({
      name: catName,
      value: expenses.filter(e => e.category === catName).reduce((sum, e) => sum + e.amount, 0),
      color: getCategoryColor(catName)
    })).filter(d => d.value > 0);
    return data;
  }, [expenses, categories]);

  const dailyData = useMemo(() => {
    const last30Days = [...Array(30)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last30Days.map(date => ({
      date: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      amount: expenses
        .filter(e => e.date === date)
        .reduce((sum, e) => sum + e.amount, 0)
    }));
  }, [expenses]);

  // Calculate 30-day averages per category
  const categoryAverages30Days = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const recentExpenses = expenses.filter(e => new Date(e.date) >= thirtyDaysAgo);
    const usedCategories = Array.from(new Set(recentExpenses.map(e => e.category))) as string[];

    return usedCategories.map(catName => {
      const totalInCategory = recentExpenses
        .filter(e => e.category === catName)
        .reduce((sum, e) => sum + e.amount, 0);
      
      return {
        category: catName,
        total: totalInCategory,
        average: totalInCategory / 30,
        color: getCategoryColor(catName)
      };
    }).filter(item => item.total > 0)
      .sort((a, b) => b.average - a.average);
  }, [expenses, categories]);

  const bankData = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const recentExpenses = expenses.filter(e => new Date(e.date) >= thirtyDaysAgo);
    const bankMap = new Map<string, number>();
    
    recentExpenses.forEach(e => {
      if (e.bankName) {
        const current = bankMap.get(e.bankName) || 0;
        bankMap.set(e.bankName, current + e.amount);
      }
    });

    return Array.from(bankMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium">Total Spending</p>
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(totalSpent)}</h3>
          <div className="mt-4 flex items-center text-emerald-600 dark:text-emerald-400 text-[10px] md:text-xs font-semibold">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            Overall history
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium">Monthly Budget</p>
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(monthlyBudget)}</h3>
          <div className="mt-4 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                totalSpent > monthlyBudget ? 'bg-red-500' : 'bg-blue-500 dark:bg-blue-600'
              }`}
              style={{ width: `${Math.min((totalSpent / monthlyBudget) * 100, 100)}%` }}
            />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 sm:col-span-2 md:col-span-1">
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium">Highest Category</p>
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mt-1 truncate">
            {categoryData.length > 0 
              ? [...categoryData].sort((a, b) => b.value - a.value)[0].name.split(' ')[0]
              : 'N/A'}
          </h3>
          <p className="text-slate-400 dark:text-slate-500 text-[10px] md:text-xs mt-4 italic">Updated just now</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h4 className="text-slate-800 dark:text-slate-200 font-semibold mb-6 text-sm md:text-base">Spending Trend (Last 30 Days)</h4>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10}} 
                  minTickGap={15}
                />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} width={40} />
                <Tooltip 
                  cursor={{fill: isDark ? '#1e293b' : '#f8fafc'}}
                  formatter={(value: number) => [formatCurrency(value), 'Amount']}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#f1f5f9' : '#1e293b',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h4 className="text-slate-800 dark:text-slate-200 font-semibold mb-6 text-sm md:text-base">Distribution</h4>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Spent']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#f1f5f9' : '#1e293b',
                    fontSize: '12px'
                  }}
                />
                <Legend 
                  iconType="circle" 
                  wrapperStyle={{fontSize: '10px', color: '#64748b', paddingTop: '10px'}} 
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Bank Breakdown Section */}
      {bankData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h4 className="text-slate-800 dark:text-slate-200 font-semibold mb-6 text-sm md:text-base">Bank Breakdown (Last 30 Days)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={bankData} margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} tickFormatter={(value) => formatCurrency(value)} />
                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fill: isDark ? '#e2e8f0' : '#475569', fontSize: 12, fontWeight: 500}} />
                <Tooltip 
                  cursor={{fill: isDark ? '#1e293b' : '#f8fafc'}}
                  formatter={(value: number) => [formatCurrency(value), 'Spent']}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#f1f5f9' : '#1e293b',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="value" fill="#818cf8" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 30-Day Averages Section */}
      <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-slate-800 dark:text-slate-200 font-semibold text-sm md:text-base">30-Day Category Averages</h4>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">Daily Burn Rate</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {categoryAverages30Days.length > 0 ? (
            categoryAverages30Days.map((item) => (
              <div key={item.category} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex items-center space-x-4">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: item.color }}
                >
                  {getCategoryIcon(item.category)}
                </div>
                <div className="min-w-0 flex-1">
                   <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">{item.category}</p>
                   <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(item.average)}/day</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
              Not enough data for 30-day averages yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
