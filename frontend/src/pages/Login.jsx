import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, User, Eye, EyeOff, Shield,
  AlertCircle, CheckCircle2, Scan, Camera, X, Zap, HeartPulse
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import ClinicalScanningModal from '../components/common/ClinicalScanningModal';
import TrustMePulseBadge from '../components/common/TrustMePulseBadge';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithFace, error, clearError, isLoading } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [authStatus, setAuthStatus] = useState('pending'); // 'pending' | 'success' | 'error'
  const [authErrorMessage, setAuthErrorMessage] = useState('');

  // Biometrics & Camera capture states
  const [showFaceDrawer, setShowFaceDrawer] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [hasFace, setHasFace] = useState(false);
  const [isFaceAuthenticating, setIsFaceAuthenticating] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Check if routed after registration
  const isJustRegistered = location.state?.registered;

  useEffect(() => {
    clearError();
    if (location.state?.username) {
      setUsername(location.state.username);
    }
  }, [clearError, location.state]);

  // Check face ID availability for user
  useEffect(() => {
    if (username.trim()) {
      const storedFace = localStorage.getItem(`biometrics_${username.trim()}`);
      setHasFace(!!storedFace);
    } else {
      setHasFace(false);
    }
  }, [username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    clearError();
    setAuthErrorMessage('');

    // 1. Validate credentials with the backend FIRST
    const success = await login(username.trim(), password);
    if (!success) {
      // Credentials invalid: Do NOT play animation, show error on login page directly!
      const failMsg = useAuthStore.getState().error || 'Authentication failed — invalid credentials';
      setAuthErrorMessage(failMsg);
      return;
    }

    // 2. Credentials valid: ONLY NOW play the 3D Doctor & Patient handshake and green heart animation!
    setAuthStatus('success');
    setIsScanning(true);
  };

  // Start Camera
  const openFaceLogin = async () => {
    setShowFaceDrawer(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      toast.error('Unable to access webcam for face verification.');
      setShowFaceDrawer(false);
    }
  };

  const closeFaceLogin = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setShowFaceDrawer(false);
  };

  // Capture current video frame
  const captureFrameBase64 = () => {
    if (!videoRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 320;
    canvas.height = videoRef.current.videoHeight || 240;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  // Authenticate with Face ID
  const handleFaceAuthenticate = async () => {
    if (!username.trim()) {
      setAuthErrorMessage('Please enter your username first to match your face signature.');
      return;
    }
    const photoBase64 = captureFrameBase64();
    if (!photoBase64) {
      setAuthErrorMessage('Failed to capture frame from webcam.');
      return;
    }

    closeFaceLogin();
    clearError();
    setAuthErrorMessage('');

    const success = await loginWithFace(username.trim(), photoBase64);
    if (!success) {
      // Biometrics failed: Do NOT play animation, show error on login page directly!
      const failMsg = useAuthStore.getState().error || 'Authentication failed — invalid credentials';
      setAuthErrorMessage(failMsg);
      return;
    }

    // Credentials valid: Play the 3D Doctor & Patient handshake and green heart animation!
    setAuthStatus('success');
    setIsScanning(true);
  };

  return (
    <div className="relative min-h-screen bg-[#FFE6EE] text-slate-900 flex items-center justify-center pt-12 pb-12 px-4 font-sans transition-colors duration-300">
      {/* Soft Ambient Clinical Pink Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-gradient-to-b from-pink-300/40 to-transparent rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[#D6EBFC]/95 border border-pink-300 shadow-card-hover hover:border-pink-400 rounded-3xl p-6 md:p-8 space-y-6 transition-all duration-300">
          {/* Header with Popping Concentric Icon */}
          <div className="text-center space-y-2">
            <div className="inline-flex justify-center mb-1">
              <TrustMePulseBadge size="md" showLabel={false} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              TrustMe <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500">AI</span> Portal
            </h1>
            <p className="text-xs text-slate-600 font-medium">Sign in to save and access your healthcare misinformation scan history.</p>
          </div>

          {/* Registration Success Banner */}
          {isJustRegistered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-[#C8E4FA] border border-pink-300 rounded-2xl text-left flex items-start gap-3 shadow-sm"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-800 font-mono">
                  Account Created Successfully
                </h4>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  Identity registered for <strong className="text-cyan-800 font-mono font-bold">{username}</strong>. Please authenticate your credentials to enter the workspace.
                </p>
              </div>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono text-slate-700 uppercase tracking-wider font-semibold">Username</label>
                {hasFace && (
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Biometrics Registered
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-500"><User className="w-4 h-4" /></span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => {
                    setUsername(e.target.value);
                    if (authErrorMessage) setAuthErrorMessage('');
                    if (error) clearError();
                  }}
                  placeholder="Enter your username"
                  className="w-full bg-[#C8E4FA] border border-pink-300 focus:bg-[#D6EBFC] focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-900 text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none transition-all shadow-inner placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-700 uppercase tracking-wider font-semibold">Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-500"><Lock className="w-4 h-4" /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (authErrorMessage) setAuthErrorMessage('');
                    if (error) clearError();
                  }}
                  placeholder="Enter your password"
                  className="w-full bg-[#C8E4FA] border border-pink-300 focus:bg-[#D6EBFC] focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-900 text-sm rounded-xl py-3 pl-10 pr-10 focus:outline-none transition-all shadow-inner placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {(authErrorMessage || error) && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-700 font-mono shadow-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span className="font-semibold">{authErrorMessage || error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-bold text-sm font-mono uppercase tracking-wider shadow-md shadow-cyan-500/20 hover:shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-60 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Shield className="w-4 h-4 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" /> Authenticate Session
                </>
              )}
            </button>
          </form>

          {/* Biometrics Login Button (Dense Light Blue, Zero White) */}
          <motion.button
            type="button"
            onClick={openFaceLogin}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-bold text-sm font-mono transition-all cursor-pointer ${
              hasFace
                ? 'bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 shadow-sm'
                : 'bg-[#C8E4FA] hover:bg-[#BEE0FB] border border-pink-300 text-slate-800 shadow-sm'
            }`}
          >
            <Scan className="w-4 h-4 text-teal-600" /> {hasFace ? 'Verify Biometric Face ID' : 'Face ID (Not Enrolled)'}
          </motion.button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-pink-300" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#D6EBFC] px-3 text-xs text-slate-500 font-mono font-bold">OR</span>
            </div>
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-3 p-3.5 bg-[#C8E4FA] border border-pink-300 rounded-2xl text-left shadow-sm">
            <Shield className="w-4 h-4 text-cyan-700 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-700 leading-relaxed">
              Don't have an account?{' '}
              <Link to="/register" className="text-cyan-800 hover:text-teal-700 underline font-bold">
                Register with face biometrics
              </Link>{' '}
              for enhanced clinical security.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Face Biometric Camera Capture Drawer */}
      <AnimatePresence>
        {showFaceDrawer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#D6EBFC] border border-pink-300 rounded-2xl p-6 shadow-2xl relative space-y-4"
            >
              <button
                onClick={closeFaceLogin}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-1">
                <Scan className="w-8 h-8 text-emerald-600 mx-auto mb-2 animate-pulse" />
                <h3 className="text-lg font-bold font-mono uppercase tracking-wider text-slate-900">Biometric Capture</h3>
                <p className="text-xs text-slate-600">Align your face inside the scan frame to log in.</p>
              </div>

              {/* Camera Preview Area */}
              <div className="relative w-full aspect-video bg-slate-900 rounded-xl overflow-hidden border-2 border-cyan-400/60 shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                <div className="absolute inset-0 border-2 border-dashed border-cyan-300/40 pointer-events-none rounded-xl" />
              </div>

              <button
                type="button"
                onClick={handleFaceAuthenticate}
                disabled={isFaceAuthenticating || !cameraActive}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-bold text-xs font-mono uppercase tracking-wider shadow-md active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isFaceAuthenticating ? (
                  <><Shield className="w-4 h-4 animate-spin" /> Verifying Face ID...</>
                ) : (
                  <><Camera className="w-4 h-4" /> Capture & Authenticate</>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Doctor & Patient Mutual Trust Handshake & Healthcare Security Modal */}
      <ClinicalScanningModal
        isOpen={isScanning}
        authStatus={authStatus}
        errorMessage={authErrorMessage}
        username={username}
        onSuccess={() => navigate('/dashboard')}
        onDismiss={() => {
          setIsScanning(false);
          setAuthStatus('pending');
        }}
      />
    </div>
  );
};

export default Login;
