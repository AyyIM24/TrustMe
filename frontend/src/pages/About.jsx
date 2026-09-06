import { motion } from 'framer-motion'
import { BookOpen, Database, Cpu, Layers, ExternalLink, Activity } from 'lucide-react'
import PublicNavbar from '../components/layout/PublicNavbar'
import Footer from '../components/Footer'
import TrustMePulseBadge from '../components/common/TrustMePulseBadge'

const datasets = [
  {
    name: 'CoAID (COVID-19 Healthcare Misinformation)',
    description: 'Diverse dataset including 4,251 news articles and claims related to COVID-19, with fact-checking labels from medical professionals and reputable fact-checking platforms.',
    size: '4,251 articles',
    source: 'Cui & Lee, 2020 (Penn State)',
    url: 'https://github.com/cuilimeng/CoAID',
  },
  {
    name: 'FakeHealth',
    description: 'Comprehensive health news dataset evaluated on 10 clinical criteria by expert medical reviewers from HealthNewsReview.org, including Story and Release subsets.',
    size: '2,000+ stories & reviews',
    source: 'Dai et al., 2020 (WPI)',
    url: 'https://github.com/safe-graph/FakeHealth',
  },
]

const techStack = [
  { category: 'Frontend', items: ['React 18', 'Vite', 'TailwindCSS', 'Framer Motion', 'Recharts', 'Lucide Icons', 'Zustand', 'Three.js'] },
  { category: 'Backend', items: ['FastAPI', 'Uvicorn', 'Pydantic v2', 'Python 3.10+'] },
  { category: 'Machine Learning', items: ['Scikit-learn', 'TF-IDF Vectorizer', 'Logistic Regression (Live)', 'DistilBERT / BioBERT (Roadmap)', 'HuggingFace Transformers'] },
  { category: 'Explainability (XAI)', items: ['SHAP (LinearExplainer)', 'Matplotlib', 'Feature Attribution'] },
  { category: 'Data & Processing', items: ['Pandas', 'NumPy', 'NLTK', 'BeautifulSoup4', 'WebRTC Biometrics'] },
]

const methodology = [
  { step: '1', title: 'Data Collection & Merging', desc: 'Combined CoAID + FakeHealth datasets into 4,107 labeled health news articles (1,369 fake, 2,738 real).' },
  { step: '2', title: 'Text Preprocessing', desc: 'Lowercase, URL/HTML removal, stopword removal, lemmatization, and TF-IDF vectorization.' },
  { step: '3', title: 'Trained Baseline Model (Live)', desc: 'TF-IDF (10K features, bigrams) + Logistic Regression with balanced class weights — actively serving inferences.' },
  { step: '4', title: 'Transformer Model (Roadmap)', desc: 'Planned fine-tuning of DistilBERT/BioBERT sequence classification on specialized GPU hardware as a future enhancement.' },
  { step: '5', title: 'Rigorous Evaluation', desc: 'Accuracy, Precision, Recall, F1, ROC-AUC, and confusion matrix benchmarking baseline model veracity.' },
  { step: '6', title: 'Explainability', desc: 'SHAP (LinearExplainer) for word-level contribution analysis and global feature importance.' },
]

export default function About() {
  return (
    <div className="min-h-screen bg-[#FFE6EE] text-slate-900 flex flex-col font-sans transition-colors duration-300">
      <PublicNavbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Header with TrustMe Pulse Icon */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#D6EBFC]/95 border border-pink-300 rounded-full text-xs font-mono text-pink-800 mb-3 shadow-sm hover:border-pink-400 hover:shadow-md transition-all">
            <TrustMePulseBadge size="sm" showLabel={false} />
            <span className="font-bold">Clinical Evidence & Defense Architecture</span>
          </div>
          <h1 className="section-title text-slate-900">
            About <span className="gradient-text">TrustMe AI</span>
          </h1>
          <p className="section-subtitle mx-auto">
            An AI/ML platform for detecting misinformation in healthcare-related news and medical claims
          </p>
        </motion.div>

        {/* Problem Statement Card */}
        <motion.div
          className="glass-card p-8 mb-10 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Problem Statement</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-normal">
            Healthcare misinformation causes real-world harm. During global health crises like COVID-19,
            unverified cures, vaccine myths, and misleading claims can lead to vaccine hesitancy,
            dangerous self-medication, and loss of life.
          </p>
          <p className="text-slate-700 leading-relaxed font-normal">
            TrustMe AI is designed specifically for the healthcare domain — moving beyond generic
            fake news classification to detect misinformation in COVID-19 treatments, vaccines,
            and health-related news articles with full explainability and user audit trails.
          </p>
        </motion.div>

        {/* Datasets */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Datasets Used</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {datasets.map(({ name, description, size, source, url }) => (
              <div key={name} className="glass-card p-6 flex flex-col justify-between shadow-card-soft hover:shadow-card-hover hover:-translate-y-1 hover:border-pink-400 transition-all duration-300">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
                    <span className="text-xs px-2.5 py-1 bg-[#C8E4FA] text-cyan-800 rounded-full font-medium border border-pink-200">
                      {size}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">{description}</p>
                </div>
                <div className="pt-4 border-t border-pink-200 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>Source: {source}</span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-cyan-700 hover:text-pink-700 hover:underline font-bold"
                  >
                    Repository <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Methodology Pipeline */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Methodology Pipeline</h2>
          <div className="space-y-4">
            {methodology.map(({ step, title, desc }) => (
              <div key={step} className="glass-card p-5 flex items-start gap-4 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 transition-all duration-300">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-sm">
                  {step}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tech Stack */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Technology Stack</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {techStack.map(({ category, items }) => (
              <div key={category} className="glass-card p-5 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 transition-all duration-300">
                <h3 className="text-sm font-semibold text-teal-800 mb-3 uppercase tracking-wider font-mono">
                  {category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {items.map((item) => (
                    <span
                      key={item}
                      className="text-xs px-2.5 py-1 bg-[#C8E4FA] border border-pink-200 rounded-lg text-slate-800 shadow-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* References */}
        <motion.div
          className="glass-card p-8 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-teal-700" />
            <h2 className="text-xl font-semibold text-slate-900">References</h2>
          </div>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex gap-2">
              <span className="text-cyan-600">•</span>
              <span>Cui, L., & Lee, D. (2020). CoAID: COVID-19 Healthcare Misinformation Dataset. arXiv:2006.00885</span>
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-600">•</span>
              <span>Dai, E., et al. (2020). Ginger Cannot Cure Cancer: Battling Fake Health News with a Comprehensive Data Repository. ICWSM 2020</span>
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-600">•</span>
              <span>Lundberg, S. M., & Lee, S.-I. (2017). A Unified Approach to Interpreting Model Predictions. NeurIPS 2017 (SHAP)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-600">•</span>
              <span>Sanh, V., et al. (2019). DistilBERT, a distilled version of BERT. arXiv:1910.01108</span>
            </li>
          </ul>
        </motion.div>
      </main>

      <Footer />
    </div>
  )
}
