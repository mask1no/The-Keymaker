/**
 * Loading spinner component for Suspense boundaries and async operations
 */
export function LoadingSpinner({ text = 'Loading...', size = 'md' }: { text?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex items-center justify-center p-8" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-zinc-700 border-t-sky-500`} aria-hidden="true" />
        <span className="text-sm text-zinc-400">{text}</span>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for content placeholders
 */
export function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-zinc-800/50 rounded-lg ${className}`}
      role="status"
      aria-label="Loading content"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Card skeleton for bento layouts
 */
export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 md:p-5" role="status" aria-label="Loading card">
      <SkeletonLoader className="h-6 w-32 mb-2" />
      <SkeletonLoader className="h-4 w-48" />
    </div>
  );
}
