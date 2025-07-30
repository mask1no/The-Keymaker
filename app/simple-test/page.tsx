export default function SimpleTestPage() {
  return (
    <div className="min-h-screen bg-black p-8">
      <h1 className="text-4xl font-bold text-white mb-4">Simple Test Page</h1>
      
      {/* Test basic Tailwind colors */}
      <div className="space-y-4">
        <div className="p-4 bg-red-500 text-white rounded">
          Red Background - Tailwind Working
        </div>
        
        <div className="p-4 bg-blue-500 text-white rounded">
          Blue Background - Tailwind Working
        </div>
        
        {/* Test custom color */}
        <div className="p-4 bg-aqua text-black rounded">
          Aqua Background - Custom Color
        </div>
        
        {/* Test gradient */}
        <div className="p-4 bg-gradient-to-r from-green-900 to-black text-white rounded">
          Gradient Background
        </div>
        
        {/* Native HTML button */}
        <button className="px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white rounded transition-colors">
          Native HTML Button
        </button>
      </div>
    </div>
  );
} 