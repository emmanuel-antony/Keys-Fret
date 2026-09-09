import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface Step {
  icon: string;
  label: string;
}

interface SkeletonLoaderProps {
  currentStep: number;
  steps: Step[];
}

export function SkeletonLoader({ currentStep, steps }: SkeletonLoaderProps) {
  const [dots, setDots] = useState('');

  // Animated ellipsis
  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div id="skeleton-loader" className="w-full space-y-6 animate-slide-up">

      {/* Step progress */}
      <div className="glass-card space-y-4">
        <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-4">
          Processing Pipeline
        </div>

        {steps.map((step, i) => {
          const isActive  = i === currentStep;
          const isDone    = i < currentStep;

          return (
            <div key={i} className="flex items-center gap-4">
              {/* Step icon */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border transition-all duration-500 ${
                isDone
                  ? 'bg-green-500/20 border-green-500/50'
                  : isActive
                  ? 'bg-indigo-500/20 border-indigo-500/60 shadow-glow-indigo'
                  : 'bg-white/5 border-white/10'
              }`}>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                ) : (
                  <span className="text-gray-600 text-sm">{i + 1}</span>
                )}
              </div>

              {/* Label */}
              <div className="flex-1">
                <div className={`text-sm font-medium transition-colors duration-300 ${
                  isDone ? 'text-green-400' : isActive ? 'text-white' : 'text-gray-600'
                }`}>
                  {step.icon} {step.label}
                  {isActive && <span className="text-indigo-400">{dots}</span>}
                </div>
                {isActive && (
                  <div className="mt-1.5 h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-progress-line" />
                  </div>
                )}
              </div>

              {/* Step number */}
              <span className={`text-xs font-mono transition-colors ${
                isDone ? 'text-green-500' : isActive ? 'text-indigo-400' : 'text-gray-700'
              }`}>
                {isDone ? 'Done' : isActive ? 'Running' : 'Queued'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Skeleton placeholder cards */}
      <div className="space-y-4">
        <div className="glass-card flex gap-6">
          <div className="w-28 h-28 rounded-xl animate-shimmer bg-white/5" />
          <div className="flex-1 space-y-3 pt-2">
            <div className="h-4 rounded-lg animate-shimmer bg-white/5 w-3/4" />
            <div className="h-8 rounded-xl animate-shimmer bg-white/5 w-full" />
            <div className="h-3 rounded-lg animate-shimmer bg-white/5 w-1/2" />
          </div>
        </div>

        <div className="h-24 glass-card animate-shimmer bg-white/5 rounded-2xl" />

        <div className="grid grid-cols-2 gap-4">
          <div className="h-52 glass-card animate-shimmer bg-white/5 rounded-2xl" />
          <div className="h-52 glass-card animate-shimmer bg-white/5 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
