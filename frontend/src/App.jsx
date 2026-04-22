import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Map common backend emotions to emojis
const EMOTION_MAP = {
  joy: '😄',
  happy: '😊',
  sadness: '😢',
  sad: '😔',
  anger: '😡',
  angry: '😠',
  fear: '😨',
  surprise: '😲',
  disgust: '🤢',
  neutral: '😐',
  love: '🥰',
  optimism: '🌟',
  pessimism: '🌧️',
  default: '🤔'
};

function App() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounced API call: triggers automatically when the user stops typing
  useEffect(() => {
    if (!text.trim()) {
      setResult(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const baseURL = import.meta.env.VITE_API_URL || '/api';
        const response = await axios.post(`${baseURL}/analyze`, { text });
        setResult(response.data);
      } catch (err) {
        console.error(err);
        setError("Could not connect to the backend. Is Flask running?");
      } finally {
        setLoading(false);
      }
    }, 500); // Waits 500ms after the last keystroke before fetching

    return () => clearTimeout(delayDebounceFn);
  }, [text]);

  // Helper to get the correct emoji
  const getEmoji = (emotion) => {
    const key = emotion?.toLowerCase();
    return EMOTION_MAP[key] || EMOTION_MAP.default;
  };

  // Helper to position the dial on the sentiment reading meter (0 to 100%)
  const getMeterPosition = (sentiment) => {
    const s = sentiment?.toLowerCase();
    if (s === 'positive') return '85%';
    if (s === 'negative') return '15%';
    return '50%'; // Neutral or unknown
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 font-sans">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-200">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Live Sentiment AI</h1>
            <p className="text-slate-500 text-sm mt-1">Start typing to see real-time analysis.</p>
          </div>
          {/* Subtle loading indicator */}
          <div className={`transition-opacity duration-300 ${loading ? 'opacity-100' : 'opacity-0'}`}>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>
          </div>
        </div>

        <textarea
          className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none text-slate-700 mb-2 resize-none"
          rows="4"
          placeholder="I am feeling fantastic today!..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {error && <p className="mt-2 text-red-500 text-sm font-medium">{error}</p>}

        {/* Empty State vs Results State */}
        {!result && !error && text.trim() && !loading && (
          <p className="text-center text-slate-400 mt-8 animate-pulse">Analyzing text...</p>
        )}

        {result && (
          <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Top Row: Emotion Emoji & Sentiment Badge */}
            <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="flex-shrink-0 text-7xl transition-transform duration-500 hover:scale-110">
                {getEmoji(result.top_emotion)}
              </div>
              <div className="flex-1">
                <span className="block text-sm uppercase font-bold text-slate-400 tracking-wider mb-1">
                  Primary Emotion
                </span>
                <span className="text-3xl font-black text-slate-800 capitalize block mb-2">
                  {result.top_emotion}
                </span>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                  ${result.sentiment === 'Positive' ? 'bg-green-100 text-green-700' :
                    result.sentiment === 'Negative' ? 'bg-red-100 text-red-700' :
                      'bg-slate-200 text-slate-700'}
                `}>
                  {result.sentiment} Sentiment
                </span>
              </div>
            </div>

            {/* Sentiment Reading Meter */}
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                Sentiment Reading
              </h3>
              <div className="relative pt-6 pb-2">
                {/* Gradient Track */}
                <div className="w-full h-3 rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-green-500"></div>

                {/* Meter Indicator Needle */}
                <div
                  className="absolute top-2 w-4 h-8 bg-white border-4 border-slate-800 rounded-full shadow-lg transition-all duration-700 ease-out transform -translate-x-1/2"
                  style={{ left: getMeterPosition(result.sentiment) }}
                ></div>

                {/* Labels */}
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
                  <span>Negative</span>
                  <span>Neutral</span>
                  <span>Positive</span>
                </div>
              </div>
            </div>

            {/* Confidence Breakdown Bars */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Emotion Breakdown
              </h3>
              {result.breakdown.map((item) => (
                <div key={item.label} className="group">
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5 capitalize">
                    <span>{item.label}</span>
                    <span className="text-slate-400 group-hover:text-indigo-600 transition-colors">
                      {(item.score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-slate-800 h-full transition-all duration-1000 ease-out rounded-full"
                      style={{ width: `${item.score * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default App;