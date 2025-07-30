export default function TestPage() {
  return (
    <div className="min-h-screen bg-black p-8">
      <h1 className="text-4xl font-bold text-white mb-4">Tailwind CSS Test</h1>
      <div className="bg-aqua p-4 rounded-lg mb-4">
        <p className="text-black">This should have an aqua background</p>
      </div>
      <div className="bg-gradient-to-r from-green-500 to-blue-500 p-4 rounded-lg mb-4">
        <p className="text-white">This should have a gradient background</p>
      </div>
      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Test Button
      </button>
    </div>
  );
} 