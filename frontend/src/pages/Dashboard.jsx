import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Target, Activity, AlertCircle } from 'lucide-react'
import { getMetrics, getOutputUrl } from '../api'
import HeartRatePulseCanvas from '../components/canvas/HeartRatePulseCanvas'
import TrustMePulseBadge from '../components/common/TrustMePulseBadge'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
}

function MetricCard({ label, value, icon: Icon, color, delay = 0 }) {
  return (
    <motion.div
      className="bg-[#D6EBFC]/95 border border-pink-300 rounded-2xl p-6 text-center shadow-card-soft hover:shadow-card-hover hover:border-pink-400 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
      initial="hidden" animate="visible" variants={fadeUp} custom={delay}
    >
      <div className={`w-12 h-12 mx-auto mb-3 rounded-2xl ${color} flex items-center justify-center shadow-md transition-transform duration-200 hover:scale-110`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-3xl font-extrabold text-slate-900 font-mono mb-1">{value}</div>
      <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</div>
    </motion.div>
  )
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await getMetrics()
        setMetrics(data)
      } catch (err) {
        setError('Failed to load metrics. Make sure the backend is running.')
      } finally {
        setLoading(false)
      }
    }
    fetchMetrics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-mono text-sm">Loading TrustMe AI telemetry metrics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-[#D6EBFC]/95 border border-rose-300 rounded-2xl p-8 max-w-md text-center shadow-md">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">Telemetry Unavailable</h3>
          <p className="text-slate-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-xs font-bold rounded-xl font-mono uppercase tracking-wider shadow-sm hover:opacity-95 cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  const baselineMetrics = metrics?.metrics?.baseline || null
  const bertMetrics = metrics?.metrics?.transformer || metrics?.metrics?.bert || null
  const activeMetrics = baselineMetrics

  const metricCards = activeMetrics ? [
    { label: 'Accuracy', value: `${(activeMetrics.accuracy * 100).toFixed(1)}%`, icon: Target, color: 'bg-gradient-to-tr from-cyan-500 to-teal-400 text-white' },
    { label: 'Precision', value: `${(activeMetrics.precision * 100).toFixed(1)}%`, icon: TrendingUp, color: 'bg-gradient-to-tr from-teal-400 to-emerald-500 text-white' },
    { label: 'Recall', value: `${(activeMetrics.recall * 100).toFixed(1)}%`, icon: Activity, color: 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white' },
    { label: 'F1 Score', value: `${(activeMetrics.f1_score * 100).toFixed(1)}%`, icon: BarChart3, color: 'bg-gradient-to-tr from-cyan-600 to-blue-500 text-white' },
  ] : []

  const plots = [
    { file: 'confusion_matrix_baseline.png', title: 'Confusion Matrix — Baseline' },
    { file: 'roc_curve_baseline.png', title: 'ROC Curve — Baseline' },
    { file: 'class_distribution.png', title: 'Dataset Class Distribution' },
    { file: 'text_length_distribution.png', title: 'Text Length Distribution' },
    { file: 'wordcloud_fake.png', title: 'Word Cloud — Fake News' },
    { file: 'wordcloud_real.png', title: 'Word Cloud — Real News' },
    { file: 'source_distribution.png', title: 'Source Distribution' },
  ]

  if (bertMetrics) {
    plots.unshift(
      { file: 'confusion_matrix_bert.png', title: 'Confusion Matrix — Transformer' },
      { file: 'roc_curve_bert.png', title: 'ROC Curve — Transformer' },
      { file: 'model_comparison.png', title: 'Model Comparison' },
      { file: 'training_loss_curve.png', title: 'Training Loss Curve' },
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#D6EBFC]/95 border border-pink-300 rounded-full text-xs font-mono text-pink-800 mb-3 shadow-sm hover:border-pink-400 hover:shadow-md transition-all">
          <TrustMePulseBadge size="sm" showLabel={false} />
          <span className="font-bold">TrustMe AI Clinical Telemetry & Vitality Node</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Model <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500">Performance & Live Heart Pulse</span>
        </h1>
        <p className="text-slate-700 text-sm sm:text-base max-w-xl mx-auto mt-2">
          Clinical benchmarks, confusion matrices, and ROC-AUC evaluation curves
        </p>
      </motion.div>

      {/* Hero Vitality & Heart Canvas Panel */}
      <div className="mb-10 bg-[#D6EBFC]/95 border border-pink-300 rounded-3xl p-6 sm:p-8 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 transition-all duration-300 relative overflow-hidden backdrop-blur-md">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C8E4FA] border border-pink-300 rounded-full text-xs font-mono text-emerald-800 font-semibold shadow-sm">
              <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Bio-Telemetry Simulator • Lub-Dub Heart Active</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Clinical Veracity Node & Vital Rate
            </h2>
            <p className="text-sm text-slate-700 max-w-xl leading-relaxed">
              Evaluating healthcare claims across 4,107 CoAID and FakeHealth medical records. The neural baseline operates at <strong className="text-cyan-800 font-bold">77.5% Accuracy</strong> with an <strong className="text-emerald-700 font-bold">ROC-AUC of 0.895</strong>.
            </p>
            <div className="flex flex-wrap gap-3 pt-2 text-xs font-mono text-slate-700">
              <span className="flex items-center gap-1.5 text-emerald-800 bg-[#C8E4FA] px-3 py-1.5 rounded-xl border border-pink-300 font-semibold shadow-sm hover:bg-[#BEE0FB] transition-colors">
                ● Heartbeat: 72 BPM Popping
              </span>
              <span className="flex items-center gap-1.5 text-cyan-800 bg-[#C8E4FA] px-3 py-1.5 rounded-xl border border-pink-300 font-semibold shadow-sm hover:bg-[#BEE0FB] transition-colors">
                ● 10,000 Medical N-grams
              </span>
              <span className="flex items-center gap-1.5 text-teal-800 bg-[#C8E4FA] px-3 py-1.5 rounded-xl border border-pink-300 font-semibold shadow-sm hover:bg-[#BEE0FB] transition-colors">
                ● SHAP Explainability Cleared
              </span>
            </div>
          </div>
          <div className="lg:col-span-5 h-64 sm:h-72 relative flex items-center justify-center bg-[#C8E4FA]/80 rounded-2xl border border-pink-300/80 shadow-inner overflow-hidden p-2">
            <HeartRatePulseCanvas className="w-full h-full" />
          </div>
        </div>
      </div>

      {activeMetrics && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-pink-500 rounded-full" />
            <h3 className="text-sm font-semibold text-pink-800 uppercase tracking-wider font-mono">
              Baseline Model (TF-IDF + Logistic Regression)
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {metricCards.map((card, i) => (
              <MetricCard key={card.label} {...card} delay={i} />
            ))}
          </div>

          <motion.div
            className="bg-[#D6EBFC]/95 border border-pink-300 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 rounded-2xl p-6 mb-10 transition-all duration-300"
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">ROC-AUC Veracity Score</div>
                <div className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 font-mono">
                  {activeMetrics.roc_auc}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Model Discrimination</div>
                <div className={`text-base font-bold ${
                  activeMetrics.roc_auc >= 0.9 ? 'text-emerald-700' :
                  activeMetrics.roc_auc >= 0.8 ? 'text-teal-700' :
                  activeMetrics.roc_auc >= 0.7 ? 'text-amber-700' : 'text-rose-700'
                }`}>
                  {activeMetrics.roc_auc >= 0.9 ? 'Excellent Clinical Separation' :
                   activeMetrics.roc_auc >= 0.8 ? 'Good Clinical Reliability' :
                   activeMetrics.roc_auc >= 0.7 ? 'Fair' : 'Needs Improvement'}
                </div>
              </div>
            </div>
            <div className="mt-4 w-full h-2.5 bg-pink-200/60 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${activeMetrics.roc_auc * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        </>
      )}

      {bertMetrics && baselineMetrics && (
        <motion.div
          className="bg-[#D6EBFC]/95 border border-pink-300 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 rounded-2xl p-6 mb-10 overflow-x-auto transition-all duration-300"
          initial="hidden" animate="visible" variants={fadeUp} custom={5}
        >
          <h3 className="text-lg font-bold text-slate-900 mb-4">Baseline vs Transformer Comparison</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-pink-300">
                <th className="text-left py-3 text-slate-600 font-semibold">Metric</th>
                <th className="text-center py-3 text-cyan-800 font-semibold">Baseline (TF-IDF + LR)</th>
                <th className="text-center py-3 text-teal-800 font-semibold">Transformer (DistilBERT)</th>
                <th className="text-center py-3 text-slate-600 font-semibold">Improvement</th>
              </tr>
            </thead>
            <tbody>
              {['accuracy', 'precision', 'recall', 'f1_score', 'roc_auc'].map(metric => {
                const b = baselineMetrics[metric]
                const t = bertMetrics[metric]
                const diff = t - b
                return (
                  <tr key={metric} className="border-b border-pink-200/70 hover:bg-[#C8E4FA] transition-colors">
                    <td className="py-3 text-slate-800 font-medium capitalize">
                      {metric.replace('_', ' ')}
                    </td>
                    <td className="py-3 text-center text-slate-800 font-mono">{(b * 100).toFixed(1)}%</td>
                    <td className="py-3 text-center text-slate-800 font-mono">{(t * 100).toFixed(1)}%</td>
                    <td className={`py-3 text-center font-bold font-mono ${
                      diff > 0 ? 'text-emerald-700' : diff < 0 ? 'text-rose-700' : 'text-slate-600'
                    }`}>
                      {diff > 0 ? '+' : ''}{(diff * 100).toFixed(1)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </motion.div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
          <BarChart3 className="w-5 h-5 text-teal-700" />
          Clinical Visualizations & Distributions
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plots.map(({ file, title }, i) => (
          <motion.div
            key={file}
            className="bg-[#D6EBFC]/95 border border-pink-300 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 hover:-translate-y-1.5 rounded-2xl overflow-hidden transition-all duration-300"
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={i * 0.5}
          >
            <div className="p-4 border-b border-pink-200 bg-[#C8E4FA]">
              <h4 className="text-sm font-bold text-slate-800">{title}</h4>
            </div>
            <div className="p-4 bg-[#D6EBFC] flex items-center justify-center">
              <img
                src={getOutputUrl(file)}
                alt={title}
                className="w-full rounded-xl border border-pink-200 hover:scale-[1.01] transition-transform duration-200"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
