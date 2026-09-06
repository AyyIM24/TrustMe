import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, AlertTriangle, CheckCircle, Loader2, ArrowRight, RotateCcw, Sparkles } from 'lucide-react'
import { predictNews, getMetrics } from '../api'
import TrustMePulseBadge from '../components/common/TrustMePulseBadge'

const sampleTexts = [
  {
    label: 'Fake Claim',
    text: 'Drinking bleach mixed with water can cure COVID-19 and kill the virus within hours. Several doctors in South America have confirmed this treatment works better than any vaccine.',
  },
  {
    label: 'Real News',
    text: 'The CDC has approved the updated COVID-19 booster vaccine for the 2024-2025 season. The vaccine targets the most recent variants and is recommended for everyone aged 6 months and older.',
  },
  {
    label: 'Misleading',
    text: '5G towers are causing coronavirus symptoms in people living nearby. Multiple studies have shown a direct link between 5G radiation and the spread of COVID-19 in urban areas.',
  },
]

export default function Predict() {
  const [text, setText] = useState('')
  const [model, setModel] = useState('baseline')
  const [availableModels, setAvailableModels] = useState(['baseline'])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getMetrics()
      .then((data) => {
        if (data?.available_models && Array.isArray(data.available_models)) {
          setAvailableModels(data.available_models)
        }
      })
      .catch(() => {})
  }, [])

  const handlePredict = async () => {
    if (!text.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await predictNews(text, model)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to get prediction. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setText('')
    setResult(null)
    setError(null)
  }

  const handleSample = (sampleText) => {
    setText(sampleText)
    setResult(null)
    setError(null)
  }

  const isBertAvailable = availableModels.includes('bert')

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header with TrustMe Pulse Icon */}
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-center mb-2">
          <TrustMePulseBadge size="md" pulseRate="2.2s" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Verify <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500">Health News & Claims</span>
        </h1>
        <p className="text-slate-700 text-sm sm:text-base max-w-xl mx-auto mt-2 font-normal">
          Paste any healthcare article, viral rumor, or social media post to compute clinical credibility
        </p>
      </motion.div>

      {/* Sample Texts (Dense Light Blue, Zero White, Interactive Chips) */}
      <motion.div
        className="flex flex-wrap gap-2 justify-center mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className="text-xs font-mono font-bold text-pink-800 mr-1 self-center">Try Clinical Samples:</span>
        {sampleTexts.map(({ label, text: sampleText }) => (
          <button
            key={label}
            onClick={() => handleSample(sampleText)}
            className="text-xs px-3.5 py-1.5 bg-[#D6EBFC] border border-pink-300 rounded-full text-slate-800
                       hover:border-pink-400 hover:text-pink-900 hover:bg-[#C8E4FA] hover:scale-105 hover:shadow-md shadow-sm transition-all duration-300 font-mono font-semibold cursor-pointer active:scale-95"
          >
            {label}
          </button>
        ))}
      </motion.div>

      {/* Input Area */}
      <motion.div
        className="glass-card p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste a healthcare news article, claim, or social media post here..."
          rows={6}
          className="input-field resize-none text-base leading-relaxed mb-4"
        />

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Model Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-700 uppercase tracking-wider font-bold">Model:</span>
            <div className="flex bg-[#C8E4FA] rounded-xl p-1 border border-pink-300 shadow-inner">
              <button
                type="button"
                onClick={() => setModel('baseline')}
                className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg transition-all duration-300 ${
                  model === 'baseline'
                    ? 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 text-white shadow-sm shadow-cyan-500/20'
                    : 'text-slate-600 hover:text-pink-800'
                }`}
              >
                TF-IDF + LR (Live)
              </button>

              {isBertAvailable ? (
                <button
                  type="button"
                  onClick={() => setModel('bert')}
                  className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg transition-all duration-300 ${
                    model === 'bert'
                      ? 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 text-white shadow-sm shadow-cyan-500/20'
                      : 'text-slate-600 hover:text-pink-800'
                  }`}
                >
                  DistilBERT
                </button>
              ) : (
                <div
                  title="Transformer model fine-tuning is currently in the deployment roadmap"
                  className="px-3 py-1.5 text-xs font-mono font-bold rounded-lg text-slate-400 cursor-not-allowed flex items-center gap-1.5"
                >
                  <span>DistilBERT</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-pink-100 border border-pink-200 text-pink-700 rounded-full font-sans font-bold">
                    Coming Soon
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 sm:ml-auto">
            <button onClick={handleReset} className="btn-secondary flex items-center gap-2 py-2.5 px-4 font-mono text-xs">
              <RotateCcw className="w-4 h-4 text-slate-400" />
              Reset
            </button>
            <button
              onClick={handlePredict}
              disabled={loading || !text.trim()}
              className="btn-primary flex items-center gap-2 py-2.5 px-6 font-mono text-xs"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {loading ? 'Analyzing Claim...' : 'Analyze Health Claim'}
            </button>
          </div>
        </div>

        {/* Character Count */}
        <div className="mt-3 text-right text-xs text-slate-400 font-mono">
          {text.length} characters
        </div>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="glass-card p-4 mb-6 border-hg-danger/30 bg-hg-danger/5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-center gap-3 text-hg-danger">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {/* Prediction Card */}
            <div className={`glass-card p-8 mb-6 border-l-4 ${
              result.prediction === 0
                ? 'border-l-rose-500 bg-rose-50/30'
                : 'border-l-emerald-500 bg-emerald-50/30'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    result.prediction === 0
                      ? 'bg-rose-100 text-rose-600 shadow-sm'
                      : 'bg-emerald-100 text-emerald-600 shadow-sm'
                  }`}>
                    {result.prediction === 0
                      ? <AlertTriangle className="w-7 h-7" />
                      : <CheckCircle className="w-7 h-7" />
                    }
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {result.prediction === 0 ? 'Likely Fake / Misleading' : 'Likely Real / Credible'}
                    </h2>
                    <p className="text-slate-500 text-sm mt-0.5 font-mono">
                      Model: {result.model === 'baseline' ? 'TF-IDF + Logistic Regression' : 'DistilBERT Transformer'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Confidence Gauge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-800">Confidence</span>
                    <span className="text-lg font-bold text-slate-900 font-mono">
                      {(result.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-pink-100/60 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        result.prediction === 0
                          ? 'bg-gradient-to-r from-rose-400 to-rose-600'
                          : 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${result.confidence * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-mono font-bold mb-2 uppercase">
                    <span className="text-rose-600">Fake</span>
                    <span className="text-emerald-600">Real</span>
                  </div>
                  <div className="w-full h-3 bg-pink-100/60 rounded-full overflow-hidden flex">
                    <motion.div
                      className="h-full bg-rose-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${result.probabilities.fake * 100}%` }}
                      transition={{ duration: 0.8 }}
                    />
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${result.probabilities.real * 100}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-mono text-slate-500 mt-1">
                    <span>{(result.probabilities.fake * 100).toFixed(1)}%</span>
                    <span>{(result.probabilities.real * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Word Importance */}
            {result.word_importance && result.word_importance.length > 0 && (
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Sparkles className="w-5 h-5 text-teal-600" />
                  <h3 className="text-lg font-bold text-slate-900">Word-Level Attribution (SHAP)</h3>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  These words had the strongest influence on the clinical prediction. Red words push toward &quot;Fake&quot;, cyan-green toward &quot;Real&quot;.
                </p>
                <div className="space-y-2.5">
                  {result.word_importance.map(({ word, contribution, direction }, i) => {
                    const absVal = Math.abs(contribution)
                    const maxContrib = Math.max(...result.word_importance.map(w => Math.abs(w.contribution)))
                    const pct = maxContrib > 0 ? (absVal / maxContrib) * 100 : 0

                    return (
                      <div key={`${word}-${i}`} className="flex items-center gap-3 p-2 bg-[#C8E4FA] hover:bg-[#BEE0FB] rounded-xl border border-pink-200 transition-colors">
                        <span className="text-sm font-mono text-slate-900 min-w-[130px] max-w-[200px] font-extrabold text-left">{word}</span>
                        <div className="flex-1 h-4 bg-[#D6EBFC] rounded-full border border-pink-200 overflow-hidden relative shadow-inner">
                          <motion.div
                            className={`h-full rounded-full ${
                              direction === 'fake'
                                ? 'bg-gradient-to-r from-rose-400 to-rose-600'
                                : 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                          />
                        </div>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border shadow-sm w-20 text-center ${
                          direction === 'fake' ? 'text-rose-700 bg-rose-50 border-rose-200' : 'text-teal-800 bg-emerald-50 border-emerald-200'
                        }`}>
                          {direction === 'fake' ? 'Fake' : 'Real'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
