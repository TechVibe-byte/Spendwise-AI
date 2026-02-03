
import React, { useState, useEffect, useRef } from 'react';
import { Expense, Category, RecurringFrequency, CategoryItem, DefaultCategory } from '../types';
import { getCategoryIcon } from '../constants';

interface ExpenseFormProps {
  onAdd: (expense: Omit<Expense, 'id'>, recurringInfo?: { frequency: RecurringFrequency }) => void;
  onClose: () => void;
  initialExpense?: Expense;
  initialRecurringFrequency?: RecurringFrequency;
  categories: CategoryItem[];
  onSwitchToAdd?: () => void;
}

const COMMON_BANKS = [
  "HDFC Bank", "SBI", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank", 
  "IndusInd Bank", "Yes Bank", "Punjab National Bank", "Bank of Baroda", 
  "Union Bank of India", "Canara Bank", "IDFC First Bank", "Bajaj Finserv", 
  "Tata Capital", "Muthoot Finance", "HDB Financial Services", "Home Credit", 
  "MoneyTap", "KreditBee", "Navi", "Paytm Postpaid", "Amazon Pay Later", 
  "Flipkart Pay Later", "Lazypay", "ZestMoney", "Simpl", "mPokket", "Cashe"
];

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAdd, onClose, initialExpense, initialRecurringFrequency, categories, onSwitchToAdd }) => {
  const [description, setDescription] = useState(initialExpense?.description || '');
  const [amount, setAmount] = useState(initialExpense?.amount.toString() || '');
  const [category, setCategory] = useState<Category>(initialExpense?.category || DefaultCategory.OTHER);
  const [bankName, setBankName] = useState(initialExpense?.bankName || '');
  const [date, setDate] = useState(initialExpense?.date || new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurringFrequency>(RecurringFrequency.MONTHLY);
  const [showBankSuggestions, setShowBankSuggestions] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(initialExpense?.receiptImage || null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [userHasManuallySetCategory, setUserHasManuallySetCategory] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!initialExpense;
  const showBankField = category === DefaultCategory.LOAN || category === DefaultCategory.EMI;

  // Sync state when initialExpense changes (e.g., when switching from Edit to Add mode)
  useEffect(() => {
    if (initialExpense) {
      setDescription(initialExpense.description);
      setAmount(initialExpense.amount.toString());
      setCategory(initialExpense.category);
      setBankName(initialExpense.bankName || '');
      setDate(initialExpense.date);
      setReceiptImage(initialExpense.receiptImage || null);
      
      if (initialRecurringFrequency) {
        setIsRecurring(true);
        setFrequency(initialRecurringFrequency);
      } else {
        setIsRecurring(false);
      }
      setUserHasManuallySetCategory(false);
    } else {
      // Reset form to default "Add New" state
      setDescription('');
      setAmount('');
      setCategory(DefaultCategory.OTHER);
      setBankName('');
      setDate(new Date().toISOString().split('T')[0]);
      setReceiptImage(null);
      setIsRecurring(false);
      setFrequency(RecurringFrequency.MONTHLY);
      setShowBankSuggestions(false);
      setUserHasManuallySetCategory(false);
    }
  }, [initialExpense, initialRecurringFrequency]);

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
        setIsProcessingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReceipt = () => {
    setReceiptImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;
    if (showBankField && !bankName) return;

    onAdd(
      {
        description,
        amount: parseFloat(amount),
        category,
        date,
        bankName: showBankField ? bankName : undefined,
        receiptImage: receiptImage || undefined
      },
      isRecurring ? { frequency } : undefined
    );
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value as Category);
    setUserHasManuallySetCategory(true);
  };

  const handleClearCategory = () => {
    setCategory(DefaultCategory.OTHER);
    setUserHasManuallySetCategory(true);
  };

  const filteredBanks = bankName 
    ? COMMON_BANKS.filter(b => b.toLowerCase().includes(bankName.toLowerCase()))
    : COMMON_BANKS;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-full md:slide-in-from-bottom-4 duration-300 border-x border-t md:border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
        
        {/* Drag handle for mobile visual cue */}
        <div className="md:hidden flex justify-center py-3">
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>

        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {isEditMode ? 'Edit Expense' : 'Add Expense'}
            </h2>
            {isEditMode && onSwitchToAdd && (
              <button 
                type="button"
                onClick={onSwitchToAdd}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline text-left mt-1 flex items-center group"
              >
                <svg className="w-3 h-3 mr-1 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                Switch to Add New
              </button>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto pb-10 md:pb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Description</label>
              <input
                type="text"
                required
                placeholder="Rent, Coffee, Netflix..."
                className="w-full px-4 py-4 md:py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-base"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {showBankField && (
              <div className="animate-in slide-in-from-top-2 duration-300 relative z-20">
                <label className="block text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-2">
                  Bank / Lender Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-600 dark:text-indigo-400">
                    <div className="scale-90">
                      {getCategoryIcon(category)}
                    </div>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC Bank, SBI, MoneyTap"
                    className="w-full pl-12 pr-4 py-4 md:py-3 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-900/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 text-base font-medium"
                    value={bankName}
                    onChange={(e) => {
                      setBankName(e.target.value);
                      setShowBankSuggestions(true);
                    }}
                    onFocus={() => setShowBankSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowBankSuggestions(false), 200)}
                    autoComplete="off"
                  />
                  {showBankSuggestions && filteredBanks.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto z-30">
                      {filteredBanks.map((bank) => (
                        <button
                          key={bank}
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-200 border-b border-slate-50 dark:border-slate-700/50 last:border-0 transition-colors"
                          onClick={() => {
                            setBankName(bank);
                            setShowBankSuggestions(false);
                          }}
                        >
                          {bank}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="w-full px-4 py-4 md:py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-base font-semibold"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-4 md:py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-base"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center">
                  Category
                </label>
                {/* Show clear button if user wants to reset to Default */}
                {(category !== DefaultCategory.OTHER || userHasManuallySetCategory) && (
                   <button
                     type="button"
                     onClick={handleClearCategory}
                     className="text-[10px] font-bold text-slate-400 hover:text-indigo-500 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors flex items-center group"
                     title="Reset selection"
                   >
                     <span className="mr-1 group-hover:rotate-90 transition-transform">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                     </span>
                     RESET
                   </button>
                )}
              </div>
              <div className="relative">
                <select
                  className="w-full px-4 py-4 md:py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer text-base font-medium"
                  value={category}
                  onChange={handleCategoryChange}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            {/* Receipt Section */}
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Receipt Attachment
              </label>
              
              {isProcessingImage ? (
                <div className="mt-1 w-full max-w-[150px] aspect-[3/4] rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 flex flex-col items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 animate-pulse">
                  <svg className="w-6 h-6 text-indigo-500 animate-spin mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Processing...</span>
                </div>
              ) : !receiptImage ? (
                <div className="mt-1">
                  <input
                    type="file"
                    accept="image/*"
                    // Removed capture="environment" to allow gallery selection
                    ref={fileInputRef}
                    onChange={handleImageCapture}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-500 dark:hover:text-indigo-500 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-xs font-bold">Upload Receipt</span>
                  </button>
                </div>
              ) : (
                <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 w-full max-w-[150px] aspect-[3/4] bg-black">
                  <img 
                    src={receiptImage} 
                    alt="Receipt" 
                    className="w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <a
                      href={receiptImage}
                      download={`receipt_${date}_${amount}.png`}
                      className="bg-white/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/30 transition-colors shadow-lg"
                      title="Save to Device"
                      onClick={(e) => e.stopPropagation()}
                    >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </a>
                    <button
                      type="button"
                      onClick={removeReceipt}
                      className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                      title="Remove Photo"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {!isEditMode && (
              <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                <label className="flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 transition-all" 
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                  />
                  <span className="ml-3 text-sm font-bold text-slate-700 dark:text-slate-300">Set as recurring payment</span>
                </label>
                
                {isRecurring && (
                  <div className="mt-5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Billing Cycle</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.values(RecurringFrequency).map(freq => (
                        <button
                          key={freq}
                          type="button"
                          onClick={() => setFrequency(freq)}
                          className={`px-3 py-3 rounded-xl text-xs font-bold transition-all border ${frequency === freq 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100 dark:shadow-none' 
                            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-800'}`}
                        >
                          {freq}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-5 md:py-4 rounded-2xl font-black text-base shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-[0.97] mb-safe"
          >
            {isEditMode ? 'Update Transaction' : 'Confirm Expense'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;
