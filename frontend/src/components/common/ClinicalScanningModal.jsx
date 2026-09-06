import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Lock, CheckCircle2, AlertTriangle, Heart, Sparkles, X
} from 'lucide-react';
import DoctorPatientHandshakeCanvas from '../canvas/DoctorPatientHandshakeCanvas';

export default function ClinicalScanningModal({
  isOpen,
  authStatus = 'pending', // 'pending' | 'success' | 'error'
  errorMessage = 'Authentication failed — invalid credentials',
  username = '',
  onSuccess,
  onDismiss,
}) {
  // State machine:
  // 'ENTRY'        -> State 1: Doctor & Patient walking in from sides (0 -> 1.6s)
  // 'HANDSHAKE'    -> State 2: Characters handshake + camera zoom-in (1.6s -> 2.6s)
  // 'VERIFICATION' -> State 3: Heart appears with pulsing lock/shield & "Verifying credentials..." label
  // 'SUCCESS'      -> State 4a: Icon morphs to green checkmark, green glow, transitions to dashboard
  // 'FAILURE'      -> State 4b: Icon morphs to caution triangle, red pulse, shake animation, return to login
  const [animState, setAnimState] = useState('ENTRY');

  // Keep track of latest authStatus inside timeouts without stale closures
  const authStatusRef = useRef(authStatus);
  useEffect(() => {
    authStatusRef.current = authStatus;
  }, [authStatus]);

  useEffect(() => {
    if (!isOpen) {
      setAnimState('ENTRY');
      return;
    }

    // State 1 (Entry): 0s to 1.6s
    setAnimState('ENTRY');

    // Transition to State 2 (Handshake) at 1.6s
    const tHandshake = setTimeout(() => {
      setAnimState('HANDSHAKE');
    }, 1600);

    // Transition to State 3 (Trust Verification) at 2.6s
    const tVerify = setTimeout(() => {
      setAnimState('VERIFICATION');
    }, 2600);

    return () => {
      clearTimeout(tHandshake);
      clearTimeout(tVerify);
    };
  }, [isOpen]);

  // Branch into State 4a or 4b once in VERIFICATION state and authStatus resolves
  useEffect(() => {
    if (!isOpen || animState !== 'VERIFICATION') return;

    const minVerificationTime = 400; // Minimum duration to appreciate State 3 pulse
    const verifyStartTime = Date.now();

    const proceedWithBranch = () => {
      const elapsedSinceVerify = Date.now() - verifyStartTime;
      const remainingDelay = Math.max(0, minVerificationTime - elapsedSinceVerify);

      const timer = setTimeout(() => {
        const current = authStatusRef.current;
        if (current === 'success') {
          setAnimState('SUCCESS');
          // State 4a: Green checkmark & pulse for 850ms, then enter dashboard (< 5s total)
          const tSuccess = setTimeout(() => {
            if (onSuccess) onSuccess();
          }, 850);
          return () => clearTimeout(tSuccess);
        } else if (current === 'error') {
          setAnimState('FAILURE');
          // State 4b: Caution triangle, red/amber pulse & shake for 2000ms, then fade back to login
          const tFail = setTimeout(() => {
            if (onDismiss) onDismiss();
          }, 2000);
          return () => clearTimeout(tFail);
        }
      }, remainingDelay);

      return () => clearTimeout(timer);
    };

    // If already resolved, schedule branch transition with minimum delay
    if (authStatusRef.current === 'success' || authStatusRef.current === 'error') {
      return proceedWithBranch();
    }

    // Otherwise poll while waiting for backend auth check promise
    const interval = setInterval(() => {
      if (authStatusRef.current === 'success' || authStatusRef.current === 'error') {
        clearInterval(interval);
        proceedWithBranch();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen, animState, onSuccess, onDismiss]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45, ease: 'easeInOut' }}
        className="fixed inset-0 z-50 bg-gradient-to-b from-[#FFE6EE] via-[#FFDCE8] to-[#FFE6EE] overflow-hidden flex flex-col items-center justify-between p-6 sm:p-10 font-sans"
      >
        {/* Soft Ambient Radial Glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-pink-300/35 via-cyan-200/25 to-teal-300/30 rounded-full blur-[160px] pointer-events-none animate-pulse" />

        {/* ── Top Header Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative z-20 text-center pt-2"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#D6EBFC]/90 backdrop-blur-md border border-pink-300 rounded-full text-xs font-mono font-bold text-slate-800 shadow-card-soft">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span>TrustMe AI • Healthcare Verification Portal</span>
          </div>
        </motion.div>

        {/* ── Main Centerpiece: Full-Screen 3D Theater & Heart Stage ── */}
        <div className="relative w-full max-w-4xl flex-1 flex flex-col items-center justify-center my-2">
          
          {/* 3D Doctor & Patient Canvas */}
          <div className="relative w-full h-[360px] sm:h-[440px] flex items-center justify-center">
            <DoctorPatientHandshakeCanvas
              sequenceState={animState}
              className="w-full h-full relative z-10"
            />

            {/* Stage 1 & 2: Sub-labels identifying the characters */}
            {(animState === 'ENTRY' || animState === 'HANDSHAKE') && (
              <>
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="absolute left-4 sm:left-12 top-6 z-20 px-3.5 py-1.5 bg-[#D6EBFC]/95 border border-pink-300 rounded-xl text-xs font-mono font-bold text-slate-800 shadow-sm backdrop-blur-sm flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                  <span>Dr. Medical Specialist</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="absolute right-4 sm:right-12 top-6 z-20 px-3.5 py-1.5 bg-[#D6EBFC]/95 border border-pink-300 rounded-xl text-xs font-mono font-bold text-slate-800 shadow-sm backdrop-blur-sm flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                  <span>Verified Patient Citizen</span>
                </motion.div>
              </>
            )}

            {/* Handshake Clasp Ripple Banner */}
            {animState === 'HANDSHAKE' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', damping: 14 }}
                className="absolute top-8 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 bg-[#D6EBFC] border border-cyan-400 rounded-full text-xs font-mono font-black text-cyan-900 shadow-lg shadow-cyan-500/25 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-cyan-600 animate-spin" />
                <span>🤝 Mutual Healthcare Trust Handshake</span>
              </motion.div>
            )}

            {/* ── State 3, 4a, 4b: Heart Centerpiece Morphing Emblem & Status Label ── */}
            {(animState === 'VERIFICATION' || animState === 'SUCCESS' || animState === 'FAILURE') && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: animState === 'FAILURE' ? [-8, 8, -6, 6, -3, 3, 0] : 0,
                }}
                transition={{
                  duration: 0.45,
                  ease: 'easeOut',
                  x: animState === 'FAILURE' ? { duration: 0.5, repeat: 1 } : { duration: 0.45 },
                }}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none"
              >
                {/* Radiant Ambient Core Behind 3D Heart */}
                <div
                  className={`w-36 h-36 rounded-full blur-2xl transition-colors duration-500 absolute ${
                    animState === 'SUCCESS'
                      ? 'bg-emerald-400/40'
                      : animState === 'FAILURE'
                      ? 'bg-rose-500/40'
                      : 'bg-cyan-400/35'
                  }`}
                  style={{ top: '20%' }}
                />

                {/* Central Morphing Shield/Lock Emblem -> Green Checkmark -> Caution */}
                <div className="absolute" style={{ top: '24%' }}>
                  <AnimatePresence mode="wait">
                    {animState === 'VERIFICATION' && (
                      <motion.div
                        key="lock"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0.88, 1.1, 0.88], opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#D6EBFC]/90 backdrop-blur-md border-2 border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/30"
                      >
                        <Lock className="w-6 h-6 text-cyan-700 animate-pulse" />
                      </motion.div>
                    )}

                    {animState === 'SUCCESS' && (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: [0, 1.25, 1], rotate: 0 }}
                        transition={{ type: 'spring', damping: 10 }}
                        className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/50 border-2 border-white"
                      >
                        <CheckCircle2 className="w-8 h-8 text-white" />
                      </motion.div>
                    )}

                    {animState === 'FAILURE' && (
                      <motion.div
                        key="caution"
                        initial={{ scale: 0, rotate: 20 }}
                        animate={{ scale: [0, 1.25, 1], rotate: 0 }}
                        transition={{ type: 'spring', damping: 10 }}
                        className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xl shadow-rose-600/50 border-2 border-amber-300"
                      >
                        <AlertTriangle className="w-8 h-8 text-amber-300" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* State Label Floating Directly Below 3D Heart */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute px-5 py-2 rounded-full border text-xs font-mono font-bold shadow-lg flex items-center gap-2 backdrop-blur-md"
                  style={{
                    top: '46%',
                    backgroundColor: animState === 'SUCCESS' ? '#ECFDF5' : animState === 'FAILURE' ? '#FFF1F2' : '#D6EBFC',
                    borderColor: animState === 'SUCCESS' ? '#6EE7B7' : animState === 'FAILURE' ? '#FDA4AF' : '#38BDF8',
                    color: animState === 'SUCCESS' ? '#065F46' : animState === 'FAILURE' ? '#9F1239' : '#0F172A',
                  }}
                >
                  {animState === 'VERIFICATION' && (
                    <>
                      <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                      <span>Verifying credentials...</span>
                    </>
                  )}
                  {animState === 'SUCCESS' && (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Credentials valid — entering platform...</span>
                    </>
                  )}
                  {animState === 'FAILURE' && (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>{errorMessage || "Authentication failed — invalid credentials"}</span>
                    </>
                  )}
                </motion.div>
              </motion.div>
            )}


          </div>

          {/* ── Status Bar & ECG Waveform ── */}
          <div className="w-full max-w-lg mt-2 space-y-2 text-center">
            {/* Real-time Physiological ECG Waveform SVG */}
            <div className="w-full h-9 bg-[#D6EBFC] rounded-2xl border border-pink-300 p-1 flex items-center overflow-hidden relative shadow-inner">
              <svg
                className={`w-full h-full stroke-current fill-none stroke-[2.2] transition-colors duration-400 ${
                  animState === 'FAILURE' ? 'text-rose-600' : 'text-emerald-600 opacity-90'
                }`}
                viewBox="0 0 300 40"
                preserveAspectRatio="none"
              >
                {animState === 'FAILURE' ? (
                  <path d="M0,20 L60,20 L70,32 L80,8 L90,20 L150,20 L160,35 L170,5 L180,20 L300,20" />
                ) : (
                  <path d="M0,20 L45,20 L55,10 L65,30 L75,4 L85,36 L95,20 L150,20 L160,8 L170,32 L180,2 L190,38 L200,20 L300,20" />
                )}
              </svg>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent animate-[shimmer_2s_infinite]" />
              <div className="absolute right-3 top-1 text-[10px] font-mono font-bold text-slate-800 bg-[#C8E4FA] px-2 py-0.5 rounded border border-pink-200 shadow-sm">
                {animState === 'FAILURE' ? 'DISRUPTED' : '72 BPM • STABLE'}
              </div>
            </div>

            {/* Bottom State Caption */}
            <p className="text-xs font-mono text-slate-600">
              {animState === 'ENTRY' && "Doctor & Patient entering verification portal..."}
              {animState === 'HANDSHAKE' && "Executing mutual trust handshake..."}
              {animState === 'VERIFICATION' && `Synchronizing neural security credentials for ${username || 'user'}...`}
              {animState === 'SUCCESS' && "Trust verified! Welcome to TrustMe AI Clinical Workspace."}
              {animState === 'FAILURE' && "Security caution triggered. Returning to login form..."}
            </p>
          </div>

        </div>

        {/* ── Footer Micro-Text ── */}
        <div className="relative z-20 text-center pb-1 text-[11px] font-mono text-slate-500">
          <span>TrustMe AI Clinical Security Engine • HIPAA & Neural Safeguards</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
