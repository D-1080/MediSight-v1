export default function TestTailwind() {
  return (
    <div className="min-h-screen bg-black p-8">
      <div className="bg-red-600 text-white p-8 rounded-xl mb-4">
        <h1 className="text-4xl font-bold">RED BOX - Tailwind Working!</h1>
      </div>
      
      <div className="bg-blue-600 text-white p-8 rounded-xl mb-4">
        <h2 className="text-3xl font-bold">BLUE BOX</h2>
      </div>
      
      <div className="bg-green-600 text-white p-8 rounded-xl mb-4">
        <h2 className="text-3xl font-bold">GREEN BOX</h2>
      </div>
      
      <div className="bg-gray-900 border border-gray-700 p-8 rounded-xl">
        <p className="text-gray-300">Gray box with border</p>
      </div>
    </div>
  );
}