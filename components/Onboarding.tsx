
import React, { useState } from 'react';

interface OnboardingProps {
  onComplete: () => void;
}

const ONBOARDING_STEPS = [
  {
    title: "Welcome to SpendWise",
    description: "Take control of your finances with smart tracking and automated tools.",
    icon: (
      <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[32px] flex items-center justify-center shadow-2xl shadow-indigo-200 dark:shadow-none mx-auto mb-8 border border-white/20">
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          {/* Wallet Icon */}
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      </div>
    )
  },
  {
    title: "Simple Tracking",
    description: "Easily categorize and track your daily expenses in just a few taps.",
    icon: (
      <div className="w-24 h-24 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-200 dark:shadow-none mx-auto mb-8">
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
    )
  },
  {
    title: "Recurring Expenses",
    description: "Automate your bills! When adding an expense, simply toggle 'Set as recurring payment' at the bottom of the form and choose a frequency.",
    icon: (
      <div className="w-24 h-24 bg-amber-500 rounded-3xl flex items-center justify-center shadow-xl shadow-amber-200 dark:shadow-none mx-auto mb-8">
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
    )
  },
  {
    title: "Financial Overview",
    description: "Get weekly breakdowns and visualize your spending habits with intuitive charts.",
    icon: (
      <div className="w-24 h-24 bg-violet-600 rounded-3xl flex items-center justify-center shadow-xl shadow-violet-200 dark:shadow-none mx-auto mb-8">
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547a3.374 3.374 0 00-.987 2.384V19a2 2 0 11-4 0v-1.169a3.374 3.374 0 00-.987-2.384l-.548-.547z" />
        </svg>
      </div>
    )
  }
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const step = ONBOARDING_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 relative">
        
        {/* Progress dots */}
        <div className="absolute top-8 left-0 right-0 flex justify-center space-x-2">
          {ONBOARDING_STEPS.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200 dark:bg-slate-800'}`} 
            />
          ))}
        </div>

        <button 
          onClick={onComplete}
          className="absolute top-6 right-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold uppercase tracking-widest"
        >
          Skip
        </button>

        <div className="p-10 pt-20 text-center">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" key={currentStep}>
            {step.icon}
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight leading-tight">
              {step.title}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed mb-12">
              {step.description}
            </p>
          </div>

          <div className="flex flex-col space-y-4">
            <button
              onClick={handleNext}
              className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-[0.98]"
            >
              {currentStep === ONBOARDING_STEPS.length - 1 ? "Let's Get Started" : "Continue"}
            </button>
            
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="w-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-2 font-bold text-sm"
              >
                Go Back
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
