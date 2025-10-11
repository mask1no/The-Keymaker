'use client';

import { useState } from 'react';

export type ExecutionMode = 'RPC_FANOUT';

interface ModeToggleProps {
  currentMode: ExecutionMode;
  onModeChange: (mode: ExecutionMode) => void;
}

export function ModeToggle({ currentMode, onModeChange }: ModeToggleProps) {
  const [mode, setMode] = useState<ExecutionMode>(currentMode);

  const handleChange = (newMode: ExecutionMode) => {
    setMode(newMode);
    onModeChange(newMode);
  };

  return (
    <div className="inline-flex rounded-lg border border-zinc-800 p-1 bg-zinc-900">
      <button
        onClick={() => handleChange('RPC_FANOUT')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          mode === 'RPC_FANOUT' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        RPC Fan-Out
      </button>
    </div>
  );
}
