'use client';

interface Props {
  isSimulation: boolean;
  onToggle: (sim: boolean) => void;
}
export function LiveModeBanner({ isSimulation, onToggle }: Props) {
  return (
    <div className={isSimulation ? 'bg-yellow-500 p-2 text-black' : 'bg-green-500 p-2 text-white'}>
      {isSimulation ? 'Simulation Mode (No real txs)' : 'Live Mode Active'}
      <button onClick={() => onToggle(!isSimulation)} className="ml-2 underline">
        Toggle
      </button>
    </div>
  );
}
