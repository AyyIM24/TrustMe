import { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Lock, User, Mail, AlertCircle, Eye, EyeOff,
  Camera, CheckCircle, RefreshCw, ArrowRight, ArrowLeft,
  UserCheck, Scan, X, HeartPulse
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import TrustMePulseBadge from '../components/common/TrustMePulseBadge';
import toast from 'react-hot-toast';

// ── Password Strength Meter ───────────────────────────────────────
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  const levels = [
    { label: 'Very Weak', color: '#FF2D55' },
    { label: 'Weak',      color: '#FF6B35' },
    { label: 'Fair',      color: '#FFB300' },
    { label: 'Strong',    color: '#00D4FF' },
    { label: 'Very Strong', color: '#00FF88' },
  ];
  return { score, ...levels[Math.max(0, score - 1)] };
};

const PasswordStrengthBar = ({ password }) => {
  const { score, label, color } = getPasswordStrength(password);
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1,2,3,4,5].map(i => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i <= score ? color : '#1A2540' }}
          />
        ))}
      </div>
      <p className="text-[10px] font-mono" style={{ color }}>{label}</p>
    </div>
  );
};

// ── Step Indicator ────────────────────────────────────────────────
const StepIndicator = ({ currentStep, totalSteps }) => (
  <div className="flex items-center gap-2 justify-center mb-6">
    {Array.from({ length: totalSteps }).map((_, i) => (
      <div key={i} className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono border-2 transition-all duration-300 ${
            i + 1 < currentStep
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
              : i + 1 === currentStep
              ? 'bg-pink-100 border-pink-400 text-pink-700 shadow-sm font-bold'
              : 'bg-[#C8E4FA] border-pink-300 text-slate-500'
          }`}
        >
          {i + 1 < currentStep ? <CheckCircle className="w-4 h-4" /> : i + 1}
        </div>
        {i < totalSteps - 1 && (
          <div
            className="w-8 h-0.5 rounded transition-all duration-500"
            style={{ backgroundColor: i + 1 < currentStep ? '#10b981' : '#fbcfe8' }}
          />
        )}
      </div>
    ))}
  </div>
);

// ── Input Field ───────────────────────────────────────────────────
const InputField = ({ label, type = 'text', value, onChange, placeholder, icon: Icon, error, hint }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="space-y-1.5 text-left">
      <label className="text-xs font-mono text-slate-600 uppercase tracking-wider font-semibold">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-3.5 text-slate-400"><Icon className="w-4 h-4" /></span>
        <input
          type={isPassword && showPassword ? 'text' : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full bg-[#C8E4FA] border text-slate-900 placeholder:text-slate-500 text-sm rounded-xl py-3 pl-10 pr-${isPassword ? '10' : '4'} transition-all focus:outline-none focus:bg-[#D6EBFC] shadow-inner ${
            error ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' : 'border-pink-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20'
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {hint && !error && <p className="text-[10px] text-slate-500 font-mono">{hint}</p>}
      {error && <p className="text-[10px] text-rose-600 font-mono flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );
};

// ── Face Capture Component ────────────────────────────────────────
const FaceCapture = ({ onCapture, onSkip }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [captured, setCaptured] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraError('Camera access denied. You can skip this step.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const startCountdown = () => {
    let count = 3;
    setCountdown(count);
    const interval = setInterval(() => {
      count--;
      if (count === 0) {
        clearInterval(interval);
        setCountdown(null);
        capturePhoto();
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, 320, 240);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCaptured(dataUrl);
    stopCamera();
  };

  const retake = () => {
    setCaptured(null);
    startCamera();
  };

  const confirmCapture = () => {
    onCapture(captured);
    toast.success('Face registered successfully!');
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <div className="inline-flex p-3 bg-[#C8E4FA] border border-pink-300 rounded-2xl text-cyan-800 mb-2 shadow-sm">
          <Scan className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold font-mono uppercase tracking-wider text-slate-900">Face Registration</h2>
        <p className="text-xs text-slate-600">Capture your face to enable biometric identification. Fully optional.</p>
      </div>

      {cameraError ? (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-xs text-rose-700 font-mono text-center shadow-sm">
          {cameraError}
        </div>
      ) : (
        <div className="relative mx-auto" style={{ width: 280, height: 210 }}>
          {/* Camera frame */}
          <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-pink-300 bg-slate-900 shadow-md">
            {!captured ? (
              <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" muted playsInline />
            ) : (
              <img src={captured} alt="Captured" className="w-full h-full object-cover scale-x-[-1]" />
            )}
            {/* Overlay corners */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-cyan-400 rounded-tl" />
            <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-cyan-400 rounded-tr" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-cyan-400 rounded-bl" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-cyan-400 rounded-br" />
            {/* Countdown overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                <span className="text-6xl font-black text-cyan-300 font-mono animate-pulse">{countdown}</span>
              </div>
            )}
            {captured && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
                <CheckCircle className="w-12 h-12 text-emerald-400 drop-shadow-lg" />
              </div>
            )}
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex gap-2">
        {!captured ? (
          <>
            <button
              type="button"
              onClick={startCountdown}
              disabled={!cameraActive || countdown !== null}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#C8E4FA] hover:bg-[#BEE0FB] border border-pink-300 text-cyan-900 text-xs font-mono font-bold hover:border-pink-400 disabled:opacity-40 transition-all shadow-sm cursor-pointer"
            >
              <Camera className="w-4 h-4 text-cyan-700" />
              {countdown !== null ? `Capturing in ${countdown}...` : 'Capture Face'}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={retake}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#C8E4FA] hover:bg-[#BEE0FB] border border-pink-300 text-slate-800 text-xs font-mono font-bold transition-all shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Retake
            </button>
            <button
              type="button"
              onClick={confirmCapture}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white text-xs font-bold font-mono transition-all shadow-sm cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" /> Confirm
            </button>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="w-full text-xs text-slate-500 font-mono hover:text-slate-800 transition-colors py-1 cursor-pointer"
      >
        Skip this step — I'll set it up later
      </button>
    </div>
  );
};

// ── Success Step ──────────────────────────────────────────────────
const SuccessStep = ({ username, hasFace, onProceedToLogin }) => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="text-center space-y-4 py-4"
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      className="inline-flex p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-600 shadow-lg shadow-emerald-500/20"
    >
      <UserCheck className="w-10 h-10" />
    </motion.div>
    <div>
      <h2 className="text-2xl font-black font-mono uppercase tracking-wider text-emerald-700">
        Clinical Identity Created
      </h2>
      <p className="text-xs text-slate-600 mt-1">
        Account successfully created for <span className="text-cyan-800 font-bold">{username}</span>
      </p>
    </div>
    <div className="space-y-2 text-xs font-mono text-slate-800 bg-[#C8E4FA] border border-pink-300 p-3.5 rounded-xl max-w-xs mx-auto text-left shadow-sm">
      <p className="flex items-center gap-2 text-emerald-700 font-semibold">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Account registered in TrustMe AI
      </p>
      <p className="flex items-center gap-2 text-cyan-800 font-semibold">
        <CheckCircle className="w-3.5 h-3.5 text-cyan-600" /> Credentials encrypted & ready
      </p>
      {hasFace && (
        <p className="flex items-center gap-2 text-teal-800 font-semibold">
          <CheckCircle className="w-3.5 h-3.5 text-teal-600" /> Biometric Face ID enrolled
        </p>
      )}
    </div>
    <p className="text-xs text-cyan-800 font-mono font-semibold animate-pulse">
      Redirecting to Login Portal... Please sign in to enter.
    </p>
    <button
      type="button"
      onClick={onProceedToLogin}
      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-bold text-xs font-mono uppercase tracking-wider transition-all shadow-md shadow-cyan-500/20 hover:shadow-lg hover:scale-[1.02] active:scale-95 cursor-pointer"
    >
      Proceed to Sign In Now →
    </button>
  </motion.div>
);

// ── Main Register Component ───────────────────────────────────────
const Register = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [step, setStep] = useState(1);
  const [faceData, setFaceData] = useState(null);
  const [registered, setRegistered] = useState(false);

  // Step 1 fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validateStep1 = () => {
    const errs = {};
    if (!username.trim() || username.trim().length < 3)
      errs.username = 'Username must be at least 3 characters';
    if (!email.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(email))
      errs.email = 'Please enter a valid email address';
    if (!password || password.length < 8)
      errs.password = 'Password must be at least 8 characters';
    if (!confirmPassword || confirmPassword !== password)
      errs.confirmPassword = 'Passwords do not match';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleStep1Next = () => {
    clearError();
    if (validateStep1()) setStep(2);
  };

  const handleFaceCapture = (data) => {
    setFaceData(data);
    handleFinalRegister(data);
  };

  const handleFaceSkip = () => {
    handleFinalRegister(null);
  };

  const handleFinalRegister = async (face) => {
    clearError();
    const res = await register(username.trim(), email.trim(), password, confirmPassword, face);
    if (res?.success) {
      toast.success('Registration successful! Redirecting to login...');
      setStep(3);
      setRegistered(true);
      setTimeout(() => {
        navigate(`/login?registered=1&user=${encodeURIComponent(username.trim())}`, {
          state: { registered: true, username: username.trim() },
        });
      }, 1500);
    }
  };

  const handleManualProceed = () => {
    navigate(`/login?registered=1&user=${encodeURIComponent(username.trim())}`, {
      state: { registered: true, username: username.trim() },
    });
  };

  const totalSteps = 3;

  return (
    <div className="relative min-h-screen bg-[#FFE6EE] text-slate-900 flex items-center justify-center pt-12 pb-12 px-4 font-sans transition-colors duration-300">
      {/* Soft Ambient Clinical Pink Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-gradient-to-b from-pink-300/40 to-transparent rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <motion.div
          className="bg-[#D6EBFC]/95 border border-pink-300 shadow-card-hover hover:border-pink-400 rounded-3xl p-6 md:p-8 space-y-5 transition-all duration-300"
          layout
        >
          {/* Header with TrustMe Pulse Icon */}
          <div className="text-center">
            <div className="inline-flex justify-center mb-2">
              <TrustMePulseBadge size="md" showLabel={false} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              TrustMe <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500">AI</span> Registration
            </h1>
            <p className="text-xs text-slate-600 mt-1 font-mono">
              {step === 1 ? 'Step 1 — Analyst Account Details' : step === 2 ? 'Step 2 — Biometric Profile (Optional)' : 'Registration Complete'}
            </p>
          </div>

          <StepIndicator currentStep={step} totalSteps={totalSteps} />

          <AnimatePresence mode="wait">
            {/* ── Step 1: Credentials ── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-4"
              >
                <InputField
                  label="Username"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setFieldErrors(p => ({ ...p, username: '' })); }}
                  placeholder="e.g. dr_alex"
                  icon={User}
                  error={fieldErrors.username}
                />
                <InputField
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: '' })); }}
                  placeholder="alex@hospital.org"
                  icon={Mail}
                  error={fieldErrors.email}
                />
                <div className="space-y-1.5">
                  <InputField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })); }}
                    placeholder="Min 8 chars, upper, lower, digit, symbol"
                    icon={Lock}
                    error={fieldErrors.password}
                  />
                  <PasswordStrengthBar password={password} />
                </div>
                <InputField
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setFieldErrors(p => ({ ...p, confirmPassword: '' })); }}
                  placeholder="Re-enter password"
                  icon={Lock}
                  error={fieldErrors.confirmPassword}
                />

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-mono">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleStep1Next}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-bold text-sm font-mono uppercase tracking-wider shadow-md shadow-cyan-500/20 hover:shadow-lg hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
                >
                  Next: Face Registration <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center text-xs text-slate-500 font-mono pt-1">
                  Already authorized?{' '}
                  <Link to="/login" className="text-cyan-700 hover:text-teal-700 underline font-bold">Sign In Here</Link>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Face Capture ── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
              >
                {isLoading ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-fs-cyan font-mono text-sm animate-pulse">
                    <Shield className="w-8 h-8 animate-spin" />
                    <p>Creating your account...</p>
                  </div>
                ) : (
                  <FaceCapture onCapture={handleFaceCapture} onSkip={handleFaceSkip} />
                )}

                {error && (
                  <div className="mt-3 flex items-center gap-2 p-3 bg-fs-crimson/10 border border-fs-crimson/20 rounded-xl text-xs text-fs-crimson font-mono">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mt-3 w-full flex items-center justify-center gap-2 text-xs text-fs-muted font-mono hover:text-fs-text transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to credentials
                </button>
              </motion.div>
            )}

            {/* ── Step 3: Success ── */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <SuccessStep
                  username={username}
                  hasFace={!!faceData}
                  onProceedToLogin={handleManualProceed}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
