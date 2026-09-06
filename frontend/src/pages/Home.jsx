import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, Search, BarChart3, Brain, ArrowRight, Zap,
  Lock, Eye, Activity, Globe, Newspaper, Scan, CheckCircle,
  Sparkles, Database, FileText, HeartPulse
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import PublicNavbar from '../components/layout/PublicNavbar';
import Footer from '../components/Footer';
import BioCapsidCanvas from '../components/canvas/BioCapsidCanvas';
import HeartRatePulseCanvas from '../components/canvas/HeartRatePulseCanvas';
import TrustMePulseBadge from '../components/common/TrustMePulseBadge';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] },
  }),
};

const engines = [
  {
    icon: Zap,
    title: 'TrustMe AI Detector',
    badge: 'Domain Specific',
    description: 'Trained exclusively on 4,107 CoAID and FakeHealth clinical records with token-level SHAP explainability for COVID-19, vaccines, and medical treatments.',
    to: '/predict',
    color: 'text-cyan-800',
    border: 'border-pink-300',
    bg: 'bg-[#C8E4FA]',
    iconBg: 'bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-500 text-white shadow-md shadow-cyan-500/20',
    btnText: 'Launch Detector',
  },
  {
    icon: Search,
    title: 'Clinical Article Deep Scanner',
    badge: 'Multi-Signal',
    description: 'Fetch any web URL or paste article text. Evaluates biomedical vocabulary, sensationalist claim flags, and cross-references against medical consensus.',
    to: '/analyze',
    color: 'text-teal-800',
    border: 'border-pink-300',
    bg: 'bg-[#C8E4FA]',
    iconBg: 'bg-gradient-to-tr from-teal-400 via-emerald-400 to-cyan-500 text-white shadow-md shadow-teal-500/20',
    btnText: 'Scan Web Article',
  },
  {
    icon: Globe,
    title: 'Live Fact-Check Aggregator',
    badge: 'Real-time Cross Check',
    description: 'Query claims directly against clinical databases and verified fact-checkers like PolitiFact Health, Snopes Medical, and SciCheck.',
    to: '/factcheck',
    color: 'text-emerald-800',
    border: 'border-pink-300',
    bg: 'bg-[#C8E4FA]',
    iconBg: 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-600 text-white shadow-md shadow-emerald-500/20',
    btnText: 'Verify Claim',
  },
  {
    icon: Brain,
    title: 'SHAP Explainable AI (XAI)',
    badge: 'Interpretable ML',
    description: 'Transparent word-level attribution scoring with waterfall, force plots, and summary charts showing why claims are flagged as misinformation.',
    to: '/explainability',
    color: 'text-cyan-800',
    border: 'border-pink-300',
    bg: 'bg-[#C8E4FA]',
    iconBg: 'bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 text-white shadow-md shadow-cyan-600/20',
    btnText: 'View SHAP Plots',
  },
];

const stats = [
  { value: '4,107', label: 'Verified Health Claims', icon: Activity, color: 'text-sky-600' },
  { value: '77.5%', label: 'Clinical Accuracy', icon: BarChart3, color: 'text-teal-600' },
  { value: '0.895', label: 'ROC-AUC Score', icon: Zap, color: 'text-emerald-600' },
  { value: 'Dual Source', label: 'CoAID + FakeHealth', icon: Eye, color: 'text-indigo-600' },
];

export default function Home() {
  const { user, token } = useAuthStore();

  return (
    <div className="min-h-screen bg-[#FFE6EE] text-slate-900 flex flex-col selection:bg-pink-500/20 selection:text-pink-900 font-sans transition-colors duration-300">
      <PublicNavbar />

      <main className="flex-1 relative overflow-hidden">
        {/* Soft Clinical Ambient Gradient & Organic Waves */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[750px] pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[980px] h-[620px] bg-gradient-to-b from-pink-300/50 via-pink-200/30 to-transparent rounded-full blur-[90px]" />
          <div className="absolute top-44 left-1/6 w-[450px] h-[450px] bg-pink-200/40 rounded-full blur-[110px]" />
          <div className="absolute top-52 right-1/6 w-[420px] h-[420px] bg-sky-200/35 rounded-full blur-[110px]" />
        </div>

        {/* ── Hero Section (Matching Image 1 "MEDICAL №23 INSIGHTS" Layout) ── */}
        <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[540px]">
            
            {/* Left Column: Bold Editorial Typography & Actions */}
            <div className="lg:col-span-7 text-left z-10">
              {/* Pill Badge with Popping Concentric Icon */}
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#D6EBFC]/95 border border-pink-300 rounded-full text-xs font-semibold text-slate-800 shadow-sm font-mono mb-6 backdrop-blur-md hover:border-pink-400 hover:shadow-md transition-all duration-200">
                  <TrustMePulseBadge size="sm" showLabel={false} />
                  <span className="text-slate-900 font-bold uppercase tracking-wider text-[11px]">
                    Clinical Health Truth Platform • TrustMe AI
                  </span>
                </div>
              </motion.div>

              {/* Giant Editorial Title */}
              <motion.div
                initial="hidden" animate="visible" variants={fadeUp} custom={1}
                className="space-y-1 mb-6"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-slate-900 leading-none">
                    MEDICAL
                  </h1>
                  {/* Glowing circular heartbeat badge like in Image 1 */}
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-pink-400 via-rose-400 to-amber-300 border-2 border-[#D6EBFC] shadow-lg shadow-pink-300/40 flex items-center justify-center text-white flex-shrink-0 animate-pulse">
                    <HeartPulse className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                </div>

                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-2xl sm:text-3xl font-mono font-bold text-pink-600">№</span>
                  <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tight leading-none font-mono">
                    01
                  </span>
                  {/* Mixture of Cyan Blue and Green on Key Wording */}
                  <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 tracking-tight leading-none">
                    INSIGHTS
                  </span>
                </div>
              </motion.div>

              {/* Subtitle */}
              <motion.p
                className="text-base sm:text-lg text-slate-700 max-w-xl mb-8 leading-relaxed font-normal"
                initial="hidden" animate="visible" variants={fadeUp} custom={2}
              >
                TrustMe AI identifies unverified medical cures, vaccine myths, and viral healthcare rumors using dual domain-trained NLP models, token-level SHAP explainability, and peer-reviewed clinical knowledge graphs.
              </motion.p>

              {/* Action Buttons (Solid Pill + Play Button from Image 1, Zero White, Rich Hover) */}
              <motion.div
                className="flex flex-wrap items-center gap-5 mb-8"
                initial="hidden" animate="visible" variants={fadeUp} custom={3}
              >
                {token ? (
                  <Link
                    to="/dashboard"
                    className="px-8 py-4 bg-[#D6EBFC] hover:bg-[#C5E2F9] border-2 border-pink-300 hover:border-pink-400 text-slate-900 font-extrabold rounded-full shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-105 active:scale-95 transition-all duration-300 text-sm font-mono tracking-wider flex items-center gap-2"
                  >
                    <span>Enter Workspace</span>
                    <ArrowRight className="w-4 h-4 text-cyan-700" />
                  </Link>
                ) : (
                  <Link
                    to="/register"
                    className="px-8 py-4 bg-[#D6EBFC] hover:bg-[#C5E2F9] border-2 border-pink-300 hover:border-pink-400 text-slate-900 font-extrabold rounded-full shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-105 active:scale-95 transition-all duration-300 text-sm font-mono tracking-wider"
                  >
                    Get Started • Register
                  </Link>
                )}

                <Link
                  to="/predict"
                  className="inline-flex items-center gap-3 text-slate-800 hover:text-cyan-700 font-bold text-sm font-mono transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-500 text-white shadow-md shadow-cyan-500/30 flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-cyan-500/40 transition-all">
                    <Zap className="w-5 h-5 fill-current" />
                  </div>
                  <span className="underline underline-offset-4 decoration-cyan-400 group-hover:decoration-emerald-500">
                    Launch AI Detector
                  </span>
                </Link>
              </motion.div>
            </div>

            {/* Right Column: 3D Biological Capsid Model & Vertical Magazine Line from Image 1 */}
            <div className="lg:col-span-5 relative h-[420px] sm:h-[500px] flex items-center justify-center">
              <div className="w-full h-full relative z-10 flex items-center justify-center">
                <BioCapsidCanvas className="w-full h-full" />
              </div>

              {/* Vertical Magazine Text from Image 1 */}
              <div className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 flex-col items-center gap-4 text-[10px] font-mono font-bold text-slate-500 select-none pointer-events-none">
                <span className="[writing-mode:vertical-rl] tracking-widest uppercase">
                  TrustMe AI • Web Magazine
                </span>
                <div className="w-px h-16 bg-pink-300" />
                <span className="[writing-mode:vertical-rl] text-slate-600 tracking-wider">
                  2026©
                </span>
              </div>
            </div>

          </div>

          {/* ── Bottom Modular Cards (Directly matching Image 1 bottom row, Zero White, Rich Hover) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
            
            {/* Left Card: Filamentous Structures / NLP Architecture */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="lg:col-span-7 bg-[#D6EBFC]/95 border border-pink-300 rounded-3xl p-6 sm:p-7 shadow-card-soft hover:shadow-card-hover hover:-translate-y-1.5 hover:border-pink-400 flex flex-col sm:flex-row items-center gap-6 text-left transition-all duration-300 group"
            >
              <div className="w-32 h-32 flex-shrink-0 flex items-center justify-center bg-[#C8E4FA] rounded-2xl border border-pink-200 group-hover:scale-105 transition-transform">
                <HeartRatePulseCanvas className="w-full h-full" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-teal-800 font-bold tracking-widest bg-[#C8E4FA] px-2.5 py-0.5 rounded-full border border-pink-300 shadow-sm">
                  NLP Architecture
                </span>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  FILAMENTOUS STRUCTURES LOCATED IN THE NLP NUCLEUS:{' '}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600">
                    HOW IT WORKS
                  </span>
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Cross-referencing 10,000 biomedical n-grams against PubMed literature and CoAID verified datasets for token-level SHAP veracity scoring.
                </p>
              </div>
            </motion.div>

            {/* Right Card: Stats & Avatars Card (Image 1 "since 1996" / "1500+") */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
              className="lg:col-span-5 bg-[#D6EBFC]/95 border border-pink-300 rounded-3xl p-6 sm:p-7 shadow-card-soft hover:shadow-card-hover hover:-translate-y-1.5 hover:border-pink-400 flex flex-col justify-between text-left transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="inline-flex rounded-full border border-pink-300 bg-[#C8E4FA] p-0.5 shadow-sm">
                  <span className="px-3 py-0.5 bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-full text-[10px] font-mono font-bold">
                    since
                  </span>
                  <span className="px-3 py-0.5 text-[10px] font-mono font-bold text-pink-700">
                    2024
                  </span>
                </div>
                <span className="text-xs font-mono font-semibold text-teal-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  77.5% Accuracy • 0.895 AUC
                </span>
              </div>

              <div className="flex items-center justify-between mt-6">
                <div>
                  <div className="text-4xl sm:text-5xl font-black text-slate-900 font-mono tracking-tight">
                    4,107 <span className="text-pink-600 font-normal">+</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 mt-1">
                    Verified CoAID & FakeHealth Records
                  </p>
                </div>
                <div className="flex -space-x-2.5">
                  <div className="w-10 h-10 rounded-full bg-pink-200 border-2 border-[#D6EBFC] flex items-center justify-center text-xs font-bold text-pink-800 shadow-sm">
                    MD
                  </div>
                  <div className="w-10 h-10 rounded-full bg-sky-200 border-2 border-[#D6EBFC] flex items-center justify-center text-xs font-bold text-sky-800 shadow-sm">
                    AI
                  </div>
                  <div className="w-10 h-10 rounded-full bg-teal-200 border-2 border-[#D6EBFC] flex items-center justify-center text-xs font-bold text-teal-800 shadow-sm">
                    RN
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </section>

        {/* ── Stats Telemetry Section (Dense Light Blue, Zero White) ── */}
        <section className="relative z-10 border-y border-pink-300 bg-[#D6EBFC]/90 backdrop-blur-md shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map(({ value, label, icon: Icon, color }, i) => (
                <motion.div
                  key={label}
                  className="text-center p-3 rounded-2xl bg-[#C8E4FA]/60 border border-pink-200/80 hover:bg-[#C8E4FA] hover:border-pink-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={fadeUp} custom={i}
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-cyan-600" />
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">{value}</span>
                  </div>
                  <span className="text-xs text-slate-700 font-semibold">{label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Feature Modules (Dense Light Blue Healthcare Cards, Rich Hover Lift) ── */}
        <section id="features" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
          <div className="text-center mb-14">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <span className="text-xs uppercase font-mono tracking-widest text-pink-800 font-bold bg-[#D6EBFC] px-3.5 py-1.5 rounded-full border border-pink-300 shadow-sm">
                Clinical Intelligence Suite
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
                Healthcare{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500">
                  Misinformation Modules
                </span>
              </h2>
              <p className="text-slate-700 text-sm sm:text-base max-w-xl mx-auto mt-2 leading-relaxed">
                Accessible via authenticated session with persistent scan history and explainability records.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {engines.map(({ icon: Icon, title, badge, description, to, color, border, bg, iconBg, btnText }, i) => (
              <motion.div
                key={title}
                className="p-8 rounded-3xl bg-[#D6EBFC]/95 border border-pink-300 hover:border-pink-400 shadow-card-soft hover:shadow-card-hover hover:-translate-y-2 transition-all duration-300 group flex flex-col justify-between cursor-pointer"
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[11px] font-mono px-3 py-1 rounded-full font-bold ${bg} ${color} border ${border} shadow-sm`}>
                      {badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-pink-800 transition-colors">
                    {title}
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed mb-6 font-normal">
                    {description}
                  </p>
                </div>

                <Link
                  to={token ? to : "/login"}
                  className="inline-flex items-center gap-2 text-xs font-bold text-teal-800 hover:text-cyan-700 font-mono uppercase tracking-wider group-hover:translate-x-2 transition-transform"
                >
                  <span>{token ? btnText : 'Sign In to Access Module'}</span>
                  <ArrowRight className="w-4 h-4 text-emerald-600" />
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Datasets & Research Section (Dense Light Blue, Zero White) ── */}
        <section id="dataset" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 scroll-mt-20">
          <div className="rounded-3xl bg-[#D6EBFC]/95 border border-pink-300 p-8 md:p-12 shadow-card-soft hover:shadow-card-hover transition-all duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-center">
              <div className="lg:col-span-1 space-y-4 text-left">
                <span className="text-xs font-mono text-pink-800 uppercase tracking-wider font-bold bg-[#C8E4FA] px-3 py-1 rounded-full border border-pink-300 shadow-sm">
                  Clinical Evidence
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Trained Exclusively on Health Datasets
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Unlike generic classifiers, TrustMe AI is fine-tuned strictly on healthcare claims, incorporating COVID-19 medical rumors and expert-reviewed clinical news.
                </p>
                <div className="pt-2">
                  <Link
                    to="/about"
                    className="px-5 py-2.5 text-xs font-bold text-pink-900 bg-[#C8E4FA] hover:bg-[#BEE0FB] border border-pink-300 hover:border-pink-400 rounded-xl hover:shadow-md hover:scale-105 inline-flex items-center gap-2 transition-all font-mono shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    Read Clinical Methodology
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="p-5 rounded-2xl bg-[#C8E4FA] border border-pink-300 space-y-2.5 hover:bg-[#BEE0FB] hover:border-pink-400 hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-700" />
                    <h4 className="text-sm font-bold text-slate-900">CoAID Health Dataset</h4>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Over 5,900 COVID-19 healthcare news articles and claims verified by medical fact-checkers.
                  </p>
                  <span className="inline-block text-[10.5px] font-mono text-pink-800 bg-[#D6EBFC] border border-pink-300 px-2 py-0.5 rounded-md font-semibold shadow-sm">
                    Cui & Lee, 2020
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#C8E4FA] border border-pink-300 space-y-2.5 hover:bg-[#BEE0FB] hover:border-pink-400 hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-teal-700" />
                    <h4 className="text-sm font-bold text-slate-900">FakeHealth Dataset</h4>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Health stories scored on clinical criteria from HealthNewsReview.org expert medical reviewers.
                  </p>
                  <span className="inline-block text-[10.5px] font-mono text-pink-800 bg-[#D6EBFC] border border-pink-300 px-2 py-0.5 rounded-md font-semibold shadow-sm">
                    Dai et al., 2020
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#C8E4FA] border border-pink-300 space-y-2.5 hover:bg-[#BEE0FB] hover:border-pink-400 hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-emerald-700" />
                    <h4 className="text-sm font-bold text-slate-900">SHAP Explainability</h4>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    LinearExplainer calculates exact positive and negative token weightings for every health claim.
                  </p>
                  <span className="inline-block text-[10.5px] font-mono text-pink-800 bg-[#D6EBFC] border border-pink-300 px-2 py-0.5 rounded-md font-semibold shadow-sm">
                    Lundberg & Lee, 2017
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#C8E4FA] border border-pink-300 space-y-2.5 hover:bg-[#BEE0FB] hover:border-pink-400 hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                  <div className="flex items-center gap-2">
                    <Scan className="w-4 h-4 text-cyan-700" />
                    <h4 className="text-sm font-bold text-slate-900">Biometric Security</h4>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Browser webcam Face ID enrollment with normalized cosine similarity matrix authentication.
                  </p>
                  <span className="inline-block text-[10.5px] font-mono text-pink-800 bg-[#D6EBFC] border border-pink-300 px-2 py-0.5 rounded-md font-semibold shadow-sm">
                    Native WebRTC + NumPy
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
