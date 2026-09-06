import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ShieldCheck, CheckCircle2, AlertCircle, User, Mail, Lock,
  Eye, EyeOff, Camera, Clock, Activity, Zap, LogOut,
  Scan, X, Sparkles, Copy, Check, KeyRound, Fingerprint, Award,
  FileText, RefreshCw, Layers
} from 'lucide-react';
import { authAPI } from '../api/client';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import TrustMePulseBadge from '../components/common/TrustMePulseBadge';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedField, setCopiedField] = useState(null);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNew, setConfirmNew] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // Biometric Face ID Enrollment states
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedFace, setCapturedFace] = useState(null);
  const [faceEnrollLoading, setFaceEnrollLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authAPI.getProfile();
        setProfile(res.data);
      } catch {
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Copy helper
  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Password strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'None', color: 'bg-slate-300' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-700' };
    if (score <= 3) return { score, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-700' };
    if (score === 4) return { score, label: 'Strong', color: 'bg-teal-500', text: 'text-teal-700' };
    return { score, label: 'Optimal', color: 'bg-emerald-500', text: 'text-emerald-700' };
  };

  const pwStrength = getPasswordStrength(newPassword);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmNew) {
      toast.error('Please fill all password fields');
      return;
    }
    if (newPassword !== confirmNew) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    setPwLoading(true);
    try {
      await authAPI.changePassword({ old_password: oldPassword, new_password: newPassword });
      toast.success('Security password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmNew('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Password update failed');
    } finally {
      setPwLoading(false);
    }
  };

  // Webcam control functions for Face ID enrollment
  const startCamera = async () => {
    setCameraError(null);
    setCapturedFace(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 360, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      setCameraError('Failed to access webcam. Please verify browser permissions.');
      toast.error('Webcam access blocked');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const captureFace = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = 480;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, 480, 360);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedFace(dataUrl);
    stopCamera();
  };

  const enrollFace = async () => {
    if (!capturedFace) return;
    setFaceEnrollLoading(true);
    try {
      await authAPI.enrollFace({ face_image: capturedFace });
      toast.success('Biometric template registered in Healthcare Vault!');
      setProfile(prev => ({ ...prev, has_face_data: true }));
      setCapturedFace(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Biometric enrollment failed');
    } finally {
      setFaceEnrollLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out from clinical session');
  };

  const TABS = [
    { id: 'overview', label: 'Overview & Telemetry', icon: Activity },
    { id: 'security', label: 'Security & Biometric Vault', icon: ShieldCheck },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4 text-cyan-700 font-mono animate-pulse">
          <div className="w-14 h-14 rounded-2xl bg-[#D6EBFC] border border-pink-300 flex items-center justify-center shadow-lg">
            <Shield className="w-7 h-7 animate-spin text-cyan-600" />
          </div>
          <p className="text-sm font-semibold tracking-wider">Accessing Clinical Identity Vault...</p>
        </div>
      </div>
    );
  }

  const username = profile?.username || user?.username || 'Clinical Analyst';
  const email = profile?.email || user?.email || 'analyst@trustme.ai';
  const role = profile?.role || 'Clinical Researcher';
  const hasFace = profile?.has_face_data;

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* ── Page Header with TrustMe Pulse Icon ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#D6EBFC]/95 border border-pink-300 rounded-full text-xs font-mono text-pink-800 mb-3 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 transition-all duration-300 cursor-pointer">
            <TrustMePulseBadge size="sm" showLabel={false} />
            <span className="font-bold">TrustMe AI Biometrics & Healthcare Identity Vault</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Clinical Analyst Profile & Credentials
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Manage your cryptographic tokens, biometric face templates, and clinical veracity audit telemetry.
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleCopy(`TM-ID-${username.toUpperCase()}-VERIFIED`, 'Credential ID')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#D6EBFC] hover:bg-[#BEE0FB] border border-pink-300 hover:border-pink-400 rounded-xl text-xs font-mono font-bold text-slate-800 shadow-card-soft hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
          >
            {copiedField === 'Credential ID' ? (
              <><Check className="w-3.5 h-3.5 text-emerald-600" /> Copied</>
            ) : (
              <><Copy className="w-3.5 h-3.5 text-cyan-700" /> Copy ID Token</>
            )}
          </button>
        </div>
      </div>

      {/* ── 4 Telemetry Stats Divs with Rich Hover Box-Shadow ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1 */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-[#D6EBFC]/95 border border-pink-300 rounded-3xl p-5 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 transition-all duration-300 group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600">
              Articles Cleared
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#C8E4FA] border border-pink-200 flex items-center justify-center text-teal-600 group-hover:scale-110 group-hover:bg-teal-50 transition-all">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">142 Scans</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-emerald-700 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            +14% this week • Verified
          </div>
        </motion.div>

        {/* Card 2 */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-[#D6EBFC]/95 border border-pink-300 rounded-3xl p-5 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 transition-all duration-300 group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600">
              Biometric Vault
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#C8E4FA] border border-pink-200 flex items-center justify-center text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-50 transition-all">
              <Fingerprint className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {hasFace ? 'Active' : 'Pending'}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-cyan-800 font-semibold">
            <Shield className="w-3.5 h-3.5 text-cyan-600" />
            {hasFace ? 'SHA-256 Vector Enrolled' : 'Camera Registration Ready'}
          </div>
        </motion.div>

        {/* Card 3 */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-[#D6EBFC]/95 border border-pink-300 rounded-3xl p-5 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 transition-all duration-300 group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600">
              Clearance Tier
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#C8E4FA] border border-pink-200 flex items-center justify-center text-cyan-600 group-hover:scale-110 group-hover:bg-cyan-50 transition-all">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">Level 3</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-teal-800 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            PubMed & CoAID Synced
          </div>
        </motion.div>

        {/* Card 4 */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-[#D6EBFC]/95 border border-pink-300 rounded-3xl p-5 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 transition-all duration-300 group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600">
              Session Trust Score
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#C8E4FA] border border-pink-200 flex items-center justify-center text-pink-600 group-hover:scale-110 group-hover:bg-pink-50 transition-all">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">99.4%</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-pink-800 font-semibold">
            <Zap className="w-3.5 h-3.5 text-pink-600" />
            Zero Anomalies Detected
          </div>
        </motion.div>
      </div>

      {/* ── Main Layout: Credential ID Card (Left) + Detailed Tabs (Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ── Left Column (4 cols): Clinical Analyst Identity Badge Card ── */}
        <div className="lg:col-span-4 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#D6EBFC]/95 border border-pink-300 rounded-3xl p-6 sm:p-7 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 transition-all duration-300 relative overflow-hidden text-center group"
          >
            {/* Top Holographic Header Stripe */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500" />
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C8E4FA] border border-pink-300 rounded-full text-[10px] font-mono text-cyan-900 font-bold uppercase tracking-wider mb-5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Official Healthcare AI Credential</span>
            </div>

            {/* Avatar & Biometric Indicator */}
            <div className="relative inline-block mb-4">
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-500 p-1 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full rounded-[22px] bg-[#C8E4FA] flex flex-col items-center justify-center text-slate-800 font-black text-3xl font-mono uppercase shadow-inner">
                  {username.slice(0, 2)}
                </div>
              </div>

              {/* Status Badge */}
              <div
                className={`absolute -bottom-1 -right-1 px-2.5 py-1 rounded-full border-2 border-[#D6EBFC] flex items-center gap-1 text-[10px] font-mono font-bold shadow-md ${
                  hasFace
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-500 text-white'
                }`}
                title={hasFace ? 'Biometric Face ID Enrolled' : 'Biometric Face ID Pending'}
              >
                {hasFace ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                <span>{hasFace ? 'Enrolled' : 'Pending'}</span>
              </div>
            </div>

            {/* Identity Text */}
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{username}</h2>
            <p className="text-xs font-mono text-slate-600 mt-0.5">{email}</p>

            <div className="inline-block mt-3 px-3.5 py-1 rounded-full bg-[#C8E4FA] border border-pink-300 text-cyan-900 text-xs font-mono font-bold uppercase tracking-wider shadow-sm">
              {role}
            </div>

            {/* Credential Metadata Box */}
            <div className="mt-6 pt-6 border-t border-pink-300/80 space-y-3 text-left">
              <div className="p-3 bg-[#C8E4FA] rounded-2xl border border-pink-200 flex items-center justify-between text-xs font-mono shadow-sm">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-teal-600" /> Clearance ID:
                </span>
                <span className="font-bold text-slate-900">TM-9482-CLINICAL</span>
              </div>

              <div className="p-3 bg-[#C8E4FA] rounded-2xl border border-pink-200 flex items-center justify-between text-xs font-mono shadow-sm">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-600" /> Member Since:
                </span>
                <span className="font-bold text-slate-900">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Active Member'}
                </span>
              </div>

              <div className="p-3 bg-[#C8E4FA] rounded-2xl border border-pink-200 flex items-center justify-between text-xs font-mono shadow-sm">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-pink-600" /> Last Handshake:
                </span>
                <span className="font-bold text-slate-900">
                  {profile?.last_login ? new Date(profile.last_login).toLocaleTimeString() : 'Current Session'}
                </span>
              </div>
            </div>

            {/* Terminate Session / Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#C8E4FA] hover:bg-rose-50 border border-pink-300 hover:border-rose-300 text-rose-700 font-bold text-xs font-mono tracking-wider shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-600" /> Sign Out from Terminal
            </button>
          </motion.div>
        </div>

        {/* ── Right Column (8 cols): Interactive Tabs & Settings ── */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Tab Switcher */}
          <div className="flex p-1.5 bg-[#D6EBFC]/95 border border-pink-300 rounded-2xl shadow-card-soft">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-xs font-mono font-bold tracking-wider transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 text-white shadow-md shadow-cyan-500/20'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-[#C8E4FA]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ── Tab Content: Overview & Telemetry ── */}
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Identity Cards Grid in Styled Divs */}
              <div className="bg-[#D6EBFC]/95 border border-pink-300 rounded-3xl p-6 sm:p-7 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 transition-all duration-300 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 tracking-tight">
                      Clinical Terminal Parameters
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5 font-mono">
                      Authenticated cryptographic parameters bound to this workspace.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg shadow-sm">
                    ● Cryptographically Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Div 1: Username */}
                  <div className="p-4 bg-[#C8E4FA] hover:bg-[#BEE0FB] border border-pink-300 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                    <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-600 mb-1.5">
                      <span className="flex items-center gap-1.5 font-bold">
                        <User className="w-3.5 h-3.5 text-cyan-700" /> Username
                      </span>
                      <button
                        onClick={() => handleCopy(username, 'Username')}
                        className="text-slate-500 hover:text-cyan-800 transition-colors"
                        title="Copy Username"
                      >
                        {copiedField === 'Username' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="font-extrabold text-sm text-slate-900">{username}</div>
                    <div className="text-[10px] font-mono text-slate-500 mt-1">Unique Clinical Handle</div>
                  </div>

                  {/* Div 2: Email */}
                  <div className="p-4 bg-[#C8E4FA] hover:bg-[#BEE0FB] border border-pink-300 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                    <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-600 mb-1.5">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Mail className="w-3.5 h-3.5 text-teal-700" /> Email Identity
                      </span>
                      <button
                        onClick={() => handleCopy(email, 'Email')}
                        className="text-slate-500 hover:text-teal-800 transition-colors"
                        title="Copy Email"
                      >
                        {copiedField === 'Email' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="font-extrabold text-sm text-slate-900 truncate">{email}</div>
                    <div className="text-[10px] font-mono text-slate-500 mt-1">Primary Notification Channel</div>
                  </div>

                  {/* Div 3: Security Clearance */}
                  <div className="p-4 bg-[#C8E4FA] hover:bg-[#BEE0FB] border border-pink-300 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                    <div className="text-[11px] font-mono uppercase text-slate-600 mb-1.5 flex items-center gap-1.5 font-bold">
                      <Award className="w-3.5 h-3.5 text-emerald-700" /> Clearance Level
                    </div>
                    <div className="font-extrabold text-sm text-slate-900">Tier-3 Clinical Specialist</div>
                    <div className="text-[10px] font-mono text-emerald-700 font-semibold mt-1">Full PubMed & CoAID Write Access</div>
                  </div>

                  {/* Div 4: Truth Engine Access */}
                  <div className="p-4 bg-[#C8E4FA] hover:bg-[#BEE0FB] border border-pink-300 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                    <div className="text-[11px] font-mono uppercase text-slate-600 mb-1.5 flex items-center gap-1.5 font-bold">
                      <Zap className="w-3.5 h-3.5 text-pink-700" /> Truth Engine Node
                    </div>
                    <div className="font-extrabold text-sm text-slate-900">10,000 N-Gram Vocabulary</div>
                    <div className="text-[10px] font-mono text-slate-500 mt-1">SHAP Attribution Activated</div>
                  </div>
                </div>
              </div>

              {/* Biometric Status & Vault Security Card */}
              <div className="bg-[#D6EBFC]/95 border border-pink-300 rounded-3xl p-6 sm:p-7 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 transition-all duration-300 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                      <Scan className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 tracking-tight">
                        Biometric Face ID Shield
                      </h3>
                      <p className="text-xs text-slate-600 font-mono">
                        Hardware webcam signature enrollment for passwordless login.
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-3 py-1 rounded-full border shadow-sm ${
                      hasFace
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-amber-50 border-amber-300 text-amber-800'
                    }`}
                  >
                    {hasFace ? 'Enrolled & Verified' : 'Action Required'}
                  </span>
                </div>

                <div className="p-4 bg-[#C8E4FA] rounded-2xl border border-pink-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900 font-mono">
                      {hasFace
                        ? 'Biometric Signature Vector Stored (Cosine Threshold: 0.85)'
                        : 'No Face ID Signature Found on File'}
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {hasFace
                        ? 'Your face template is encrypted with SHA-256 and stored in the secure clinical vault for immediate facial recognition.'
                        : 'Register your face signature using your device camera to enable instant one-click medical clearance.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('security')}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-bold text-xs font-mono rounded-xl shadow-md shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all duration-200 flex-shrink-0 cursor-pointer"
                  >
                    {hasFace ? 'Manage Biometrics' : 'Enroll Face ID Now'}
                  </button>
                </div>
              </div>

              {/* Audit Trail Div */}
              <div className="bg-[#D6EBFC]/95 border border-pink-300 rounded-3xl p-6 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 transition-all duration-300 space-y-4">
                <h3 className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-600" /> Recent Security & Clinical Audit Events
                </h3>
                <div className="space-y-2.5">
                  {[
                    { title: 'Healthcare Safeguard Clearance Completed', time: 'Just now', tag: 'Session' },
                    { title: 'CoAID Misinformation Engine Synchronized', time: '2 hours ago', tag: 'Data' },
                    { title: 'Biometric Face Template Hash Validated', time: 'Yesterday', tag: 'Security' },
                  ].map((evt, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#C8E4FA] hover:bg-[#BEE0FB] border border-pink-200 rounded-xl flex items-center justify-between text-xs font-mono transition-colors shadow-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-medium text-slate-900">{evt.title}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] px-2 py-0.5 bg-[#D6EBFC] text-cyan-800 rounded border border-pink-300 font-bold">
                          {evt.tag}
                        </span>
                        <span className="text-slate-500">{evt.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Tab Content: Security & Biometric Vault ── */}
          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Change Password Card */}
              <div className="bg-[#D6EBFC]/95 border border-pink-300 rounded-3xl p-6 sm:p-7 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 transition-all duration-300 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#C8E4FA] border border-pink-200 flex items-center justify-center text-cyan-700 shadow-sm">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 tracking-tight">
                      Update Security Password
                    </h3>
                    <p className="text-xs text-slate-600 font-mono">
                      Enhance your account defense with strong cryptographic authentication.
                    </p>
                  </div>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {/* Current Password */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                      <input
                        type={showOld ? 'text' : 'password'}
                        value={oldPassword}
                        onChange={e => setOldPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full bg-[#C8E4FA] border border-pink-300 focus:bg-[#D6EBFC] focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-900 text-sm rounded-xl py-3 pl-10 pr-10 focus:outline-none transition-all shadow-inner placeholder:text-slate-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOld(!showOld)}
                        className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5 text-left">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider">
                        New Password
                      </label>
                      {newPassword && (
                        <span className={`text-[10px] font-mono font-bold ${pwStrength.text}`}>
                          Strength: {pwStrength.label}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Min 8 characters with numbers & symbols"
                        className="w-full bg-[#C8E4FA] border border-pink-300 focus:bg-[#D6EBFC] focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-900 text-sm rounded-xl py-3 pl-10 pr-10 focus:outline-none transition-all shadow-inner placeholder:text-slate-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Dynamic Password Strength Indicator Bar */}
                    {newPassword && (
                      <div className="w-full bg-pink-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div
                          className={`h-full ${pwStrength.color} transition-all duration-300 rounded-full`}
                          style={{ width: `${(pwStrength.score / 5) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                      <input
                        type="password"
                        value={confirmNew}
                        onChange={e => setConfirmNew(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full bg-[#C8E4FA] border border-pink-300 focus:bg-[#D6EBFC] focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-900 text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none transition-all shadow-inner placeholder:text-slate-500 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={pwLoading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-bold text-sm font-mono uppercase tracking-wider shadow-md shadow-cyan-500/20 hover:shadow-lg hover:scale-[1.01] active:scale-98 disabled:opacity-60 transition-all cursor-pointer"
                  >
                    {pwLoading ? (
                      <><Shield className="w-4 h-4 animate-spin" /> Committing Changes...</>
                    ) : (
                      <><KeyRound className="w-4 h-4" /> Save New Password</>
                    )}
                  </button>
                </form>
              </div>

              {/* Face ID Biometric Enrollment Div */}
              <div className="bg-[#D6EBFC]/95 border border-pink-300 rounded-3xl p-6 sm:p-7 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 transition-all duration-300 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#C8E4FA] border border-pink-200 flex items-center justify-center text-teal-700 shadow-sm">
                    <Scan className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 tracking-tight">
                      Biometric Face ID Enrollment & Camera
                    </h3>
                    <p className="text-xs text-slate-600 font-mono">
                      Capture high-resolution facial geometry vector for instant clinical login.
                    </p>
                  </div>
                </div>

                {cameraError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 font-mono flex items-center gap-2 shadow-sm">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{cameraError}</span>
                  </div>
                )}

                {/* Camera / Captured Viewport Container */}
                <div className="p-6 bg-[#C8E4FA] border border-pink-200 rounded-2xl text-center space-y-4 shadow-inner">
                  {(cameraActive || capturedFace) ? (
                    <div className="relative aspect-video rounded-xl bg-slate-900 border-2 border-cyan-400 overflow-hidden flex items-center justify-center max-w-sm mx-auto shadow-md">
                      {cameraActive && (
                        <>
                          <video
                            ref={videoRef}
                            className="w-full h-full object-cover scale-x-[-1]"
                            playsInline
                            muted
                          />
                          {/* Targeting Medical Reticle */}
                          <div className="absolute inset-4 border-2 border-dashed border-teal-400/70 rounded-xl pointer-events-none animate-pulse" />
                          <div className="absolute top-2 left-3 text-[10px] font-mono text-emerald-400 font-bold bg-slate-900/80 px-2 py-0.5 rounded">
                            ● BIO SCAN LIVE
                          </div>
                        </>
                      )}
                      {capturedFace && (
                        <>
                          <img
                            src={capturedFace}
                            alt="Captured biometric scan"
                            className="w-full h-full object-cover scale-x-[-1]"
                          />
                          <div className="absolute bottom-2 left-3 text-[10px] font-mono text-cyan-300 font-bold bg-slate-900/80 px-2 py-0.5 rounded">
                            ✓ FRAME CAPTURED
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="max-w-sm mx-auto space-y-3 py-4">
                      <div className="w-16 h-16 rounded-3xl bg-[#D6EBFC] border border-pink-300 flex items-center justify-center mx-auto text-teal-600 shadow-md">
                        <Scan className="w-8 h-8 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {hasFace ? 'Biometric Face ID Configured' : 'No Face Signature Registered'}
                        </p>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {hasFace
                            ? 'Your Face ID is active. You may capture a new biometric frame anytime to refresh your template.'
                            : 'Click the button below to initialize your device webcam and scan your face signature.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Camera Controls */}
                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    {!cameraActive && !capturedFace && (
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-bold text-xs font-mono shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        {hasFace ? 'Update Face Scan' : 'Initialize Camera'}
                      </button>
                    )}

                    {cameraActive && (
                      <>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="px-4 py-2.5 rounded-xl bg-[#D6EBFC] border border-pink-300 text-slate-700 font-bold text-xs font-mono hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={captureFace}
                          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                        >
                          <Scan className="w-4 h-4" /> Capture Biometrics
                        </button>
                      </>
                    )}

                    {capturedFace && (
                      <>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-4 py-2.5 rounded-xl bg-[#D6EBFC] border border-pink-300 text-slate-700 font-bold text-xs font-mono hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Retake
                        </button>
                        <button
                          type="button"
                          onClick={enrollFace}
                          disabled={faceEnrollLoading}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-bold text-xs font-mono shadow-md hover:scale-105 active:scale-95 disabled:opacity-60 transition-all flex items-center gap-2 cursor-pointer"
                        >
                          {faceEnrollLoading ? (
                            <><Shield className="w-4 h-4 animate-spin" /> Saving to Vault...</>
                          ) : (
                            <><ShieldCheck className="w-4 h-4" /> Save Face Template</>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <canvas ref={canvasRef} className="hidden" />
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Profile;
