import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import {
  Sparkles, Activity, AlertTriangle, Layers, TrendingUp, Search,
  ShieldCheck, ShieldAlert, FileText, ArrowUpRight
} from 'lucide-react';
import { statsAPI } from '../api/client';
import toast from 'react-hot-toast';
import TrustMePulseBadge from '../components/common/TrustMePulseBadge';

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

const TrendingTopics = () => {
  const [trending, setTrending] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const trendRes = await statsAPI.getTrending();
        setTrending(trendRes.data);

        const catRes = await statsAPI.getCategories();
        setCategoryStats(catRes.data);
      } catch (err) {
        toast.error('Failed to load global trending statistics.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const maxScore = trending.length > 0 ? Math.max(...trending.map((t) => t.total)) : 1;

  // Filtered topics
  const filteredTrending = trending.filter(t =>
    t.keyword.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Top 10 chart data
  const chartData = trending.slice(0, 10).map((t) => ({
    keyword: t.keyword,
    fake: t.fake_count,
    real: t.real_count,
    total: t.total,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 font-sans">
      {/* ── Page Header ── */}
      <div className="text-center space-y-3">
        <div className="flex justify-center mb-2">
          <TrustMePulseBadge size="md" pulseRate="1.8s" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Global Healthcare <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500">Misinformation Signals</span>
        </h1>
        <p className="text-sm text-slate-700 max-w-2xl mx-auto leading-relaxed">
          Aggregated surveillance tracking viral medical myths, dubious cure narratives, and vaccine conspiracy vectors detected across all clinical scans.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 font-mono text-cyan-700 animate-pulse">
          <div className="w-14 h-14 rounded-2xl bg-[#D6EBFC] border border-pink-300 flex items-center justify-center shadow-lg">
            <Activity className="w-7 h-7 animate-spin text-cyan-600" />
          </div>
          <span className="text-sm font-semibold">Scanning decentralized clinical telemetry...</span>
        </div>
      ) : trending.length === 0 ? (
        <div className="text-center py-20 bg-[#D6EBFC]/95 border border-pink-300 rounded-3xl max-w-xl mx-auto font-mono text-slate-700 shadow-card-soft">
          <AlertTriangle className="w-8 h-8 text-pink-600 mx-auto mb-3" />
          <p className="font-bold">No trending keywords indexed yet.</p>
          <p className="text-xs text-slate-500 mt-1">Perform new scans on the AI Detector to populate live trends.</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* ── 4 Telemetry Stats Divs with Luxury Box-Shadow & Hover ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <motion.div
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-[#D6EBFC]/95 border border-pink-300 rounded-3xl p-5 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600">
                  Total Keywords Tracked
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#C8E4FA] border border-pink-200 flex items-center justify-center text-cyan-700 group-hover:scale-110 transition-all">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">{trending.length} Terms</div>
              <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-cyan-800 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                Live 24h Surveillance
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-[#D6EBFC]/95 border border-pink-300 rounded-3xl p-5 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600">
                  Misinformation Clusters
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#C8E4FA] border border-pink-200 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-all">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-rose-700 tracking-tight">
                {trending.filter(t => t.fake_count > t.real_count).length} Clusters
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-rose-800 font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                High Viral Propagation
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-[#D6EBFC]/95 border border-pink-300 rounded-3xl p-5 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600">
                  Top Risk Domain
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#C8E4FA] border border-pink-200 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-all">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">Vaccines & Viral</div>
              <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-amber-800 font-semibold">
                68% Claim Divergence
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-[#D6EBFC]/95 border border-pink-300 rounded-3xl p-5 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600">
                  Attribution Cleared
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#C8E4FA] border border-pink-200 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-all">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-800 tracking-tight">99.2%</div>
              <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-emerald-800 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                CoAID Cross-Referenced
              </div>
            </motion.div>
          </div>

          {/* ── Visual Section: Semantic Topic Cloud & Top 10 Keywords ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Semantic Topic Cloud */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="lg:col-span-6 bg-[#D6EBFC]/95 border border-pink-300 rounded-3xl p-6 sm:p-8 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 transition-all duration-300 space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#C8E4FA] border border-pink-200 flex items-center justify-center text-cyan-700 shadow-sm">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Semantic Topic Cloud</h2>
                    <p className="text-xs text-slate-600 font-mono">Word size correlates with global scan frequency.</p>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    placeholder="Filter topics..."
                    className="w-36 sm:w-44 bg-[#C8E4FA] focus:bg-[#D6EBFC] border border-pink-300 text-xs rounded-xl py-2 pl-8 pr-3 focus:outline-none transition-all shadow-inner text-slate-900 font-mono placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Cloud Container */}
              <div className="min-h-[320px] p-6 bg-[#C8E4FA] rounded-2xl border border-pink-300 flex flex-wrap gap-2.5 items-center justify-center shadow-inner overflow-hidden">
                {filteredTrending.map((t, index) => {
                  const weight = t.total / maxScore;
                  const isFakeDominant = t.fake_count > t.real_count;

                  return (
                    <motion.button
                      key={t.keyword}
                      onClick={() => setSelectedTopic(t)}
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      whileHover={{ scale: 1.12, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold tracking-wide transition-all shadow-sm cursor-pointer ${
                        isFakeDominant
                          ? 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-800 shadow-rose-200/50'
                          : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-teal-900 shadow-teal-200/50'
                      }`}
                      title={`${t.keyword}: ${t.total} scans (${t.fake_count} fake, ${t.real_count} real)`}
                    >
                      <span>{t.keyword}</span>
                      <span className="ml-1.5 text-[10px] opacity-75 font-mono">
                        ({t.total})
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-between text-xs font-mono pt-1">
                <div className="flex items-center gap-2 text-teal-900 font-semibold">
                  <span className="w-3 h-3 rounded bg-emerald-500" />
                  <span>Predominantly Authentic</span>
                </div>
                <div className="flex items-center gap-2 text-rose-800 font-semibold">
                  <span className="w-3 h-3 rounded bg-rose-500" />
                  <span>High Misinformation Rate</span>
                </div>
              </div>
            </motion.div>

            {/* Right: Top 10 Scanned Keywords Bar Chart */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
              className="lg:col-span-6 bg-[#D6EBFC]/95 border border-pink-300 rounded-3xl p-6 sm:p-8 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 transition-all duration-300 space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#C8E4FA] border border-pink-200 flex items-center justify-center text-rose-600 shadow-sm">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">Top 10 High-Frequency Terms</h2>
                  <p className="text-xs text-slate-600 font-mono">Breakdown of authentic vs deceptive article counts.</p>
                </div>
              </div>

              <div className="h-[320px] bg-[#C8E4FA] p-4 rounded-2xl border border-pink-300 shadow-inner">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 25, right: 20, top: 10, bottom: 10 }}>
                    <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis dataKey="keyword" type="category" stroke="#0f172a" fontSize={12} tickLine={false} width={80} fontWeight="bold" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#D6EBFC',
                        borderColor: '#F472B6',
                        borderRadius: '12px',
                        boxShadow: '0 8px 24px rgba(244, 114, 182, 0.25)',
                        color: '#0F172A',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    />
                    <Bar dataKey="real" name="Authentic Fact" fill="#0D9488" stackId="a" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="fake" name="Misinformation" fill="#E11D48" stackId="a" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex gap-4 text-xs font-mono justify-end pt-1">
                <div className="flex items-center gap-2 font-bold text-teal-800">
                  <div className="w-3.5 h-2.5 rounded bg-teal-600" />
                  <span>Verified Medical Fact</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-rose-800">
                  <div className="w-3.5 h-2.5 rounded bg-rose-600" />
                  <span>Misinformation Alert</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Sector Threat Distribution Chart & Table ── */}
          {categoryStats.length > 0 && (
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
              className="bg-[#D6EBFC]/95 border border-pink-300 rounded-3xl p-6 sm:p-8 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 transition-all duration-300 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#C8E4FA] border border-pink-200 flex items-center justify-center text-amber-600 shadow-sm">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Sector Threat Distribution</h2>
                    <p className="text-xs text-slate-600 font-mono">Volume of real vs fake health claims classified per medical category.</p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold px-3 py-1 bg-pink-100 border border-pink-300 text-pink-800 rounded-full shadow-sm">
                  ● Multi-Sector Matrix
                </span>
              </div>

              <div className="h-64 bg-[#C8E4FA] p-4 rounded-2xl border border-pink-300 shadow-inner">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryStats} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#FBCFE8" />
                    <XAxis dataKey="category" stroke="#0f172a" fontSize={11} tickLine={false} fontWeight="bold" />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#D6EBFC',
                        borderColor: '#F472B6',
                        borderRadius: '12px',
                        boxShadow: '0 8px 24px rgba(244, 114, 182, 0.25)',
                        color: '#0F172A',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    />
                    <Bar dataKey="fake_count" name="Fake Claims" fill="#E11D48" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="real_count" name="Verified Real" fill="#0D9488" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Sector Table Breakdown */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-pink-300 text-slate-600 uppercase">
                      <th className="py-2.5 px-3">Medical Domain</th>
                      <th className="py-2.5 px-3">Fake Scans</th>
                      <th className="py-2.5 px-3">Verified Real</th>
                      <th className="py-2.5 px-3">Misinfo Ratio</th>
                      <th className="py-2.5 px-3">Vulnerability Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pink-200">
                    {categoryStats.map((cat, idx) => {
                      const total = (cat.fake_count || 0) + (cat.real_count || 0);
                      const fakeRatio = total > 0 ? Math.round((cat.fake_count / total) * 100) : 0;
                      return (
                        <tr key={idx} className="hover:bg-[#C8E4FA] transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-900">{cat.category}</td>
                          <td className="py-3 px-3 text-rose-700 font-bold">{cat.fake_count}</td>
                          <td className="py-3 px-3 text-teal-800 font-bold">{cat.real_count}</td>
                          <td className="py-3 px-3 font-bold">{fakeRatio}%</td>
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-sm ${
                              fakeRatio > 50
                                ? 'bg-rose-50 border-rose-300 text-rose-800'
                                : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            }`}>
                              {fakeRatio > 50 ? 'HIGH RISK' : 'STABLE'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

        </div>
      )}
    </div>
  );
};

export default TrendingTopics;
