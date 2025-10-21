export default function HomePage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-bold text-2xl">MP</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 mb-6">
            MetaPulse AI
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            Feel the pulse before the market does
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-green-400 text-xl">🧠</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">AI-Powered Analysis</h3>
            <p className="text-gray-300 text-sm">
              Advanced machine learning algorithms analyze market sentiment and token performance in real-time.
            </p>
          </div>
          
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-400 text-xl">⚡</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Real-Time Intelligence</h3>
            <p className="text-gray-300 text-sm">
              Get instant notifications about emerging trends and high-potential tokens before they pump.
            </p>
          </div>
          
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-purple-400 text-xl">📊</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Market Pulse</h3>
            <p className="text-gray-300 text-sm">
              Track the heartbeat of the Solana ecosystem with comprehensive market intelligence.
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 justify-center">
          <a 
            href="/feed" 
            className="px-6 py-3 rounded-full border-2 border-cyan-400 bg-transparent text-cyan-400 hover:bg-cyan-400/20 transition-all duration-300"
          >
            📈 Live Feed
          </a>
          <a 
            href="/metas" 
            className="px-6 py-3 rounded-full border-2 border-cyan-400 bg-transparent text-cyan-400 hover:bg-cyan-400/20 transition-all duration-300"
          >
            🎯 Meta Analysis
          </a>
          <a 
            href="/tokens" 
            className="px-6 py-3 rounded-full border-2 border-cyan-400 bg-transparent text-cyan-400 hover:bg-cyan-400/20 transition-all duration-300"
          >
            📊 Token Scores
          </a>
        </div>
      </div>
    </div>
  );
}