import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { departmentService } from '../../services/departmentService';
import { tokenService } from '../../services/tokenService';
import { useToken } from '../../hooks/useToken';
import { useAuthStore } from '../../stores/authStore';
import { db } from '../../lib/mockServer';
import {
  QrCode,
  Smartphone,
  Flame,
  CheckCircle2,
  AlertTriangle,
  User,
  Phone,
  Landmark,
  Heart,
  Baby,
  RefreshCw,
  Zap,
  ArrowRight,
  Shield,
  Stethoscope,
  Volume2,
  VolumeX,
  Camera,
  Play,
  RotateCcw,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

// Sound effect generator using standard browser Web Audio API
const playSound = (type: 'beep' | 'success' | 'alert' | 'camera', soundEnabled: boolean) => {
  if (!soundEnabled) return;
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'beep') {
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'camera') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } else if (type === 'success') {
      // Dual rising chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, audioCtx.currentTime + 0.12); // G5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } else if (type === 'alert') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    }
  } catch (e) {
    console.warn('Audio play failed', e);
  }
};

// Deterministic SVG QR Code Generator Component
const QRCodeSVG: React.FC<{
  seed: string;
  colorClass: string;
  logoIcon: React.ReactNode;
}> = ({ seed, colorClass, logoIcon }) => {
  const size = 23; // Grid density
  
  // Deterministic LCG hash based on seed for a consistent pattern
  let s = 0;
  for (let i = 0; i < seed.length; i++) {
    s = (s << 5) - s + seed.charCodeAt(i);
    s |= 0;
  }
  const hash = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const blocks: { r: number; c: number }[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Finder patterns
      const isTopLeft = r < 7 && c < 7;
      const isTopRight = r < 7 && c >= size - 7;
      const isBottomLeft = r >= size - 7 && c < 7;
      // Center logo boundary
      const isCenter = r >= 10 && r <= 12 && c >= 10 && c <= 12;

      if (!isTopLeft && !isTopRight && !isBottomLeft && !isCenter) {
        if (hash() > 0.45) {
          blocks.push({ r, c });
        }
      }
    }
  }

  // Draw finder pattern eye
  const FinderPattern = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x}, ${y})`}>
      {/* Outer block */}
      <rect x={0} y={0} width={7} height={7} rx={1.5} fill="currentColor" />
      {/* Middle transparent spacer */}
      <rect x={1} y={1} width={5} height={5} rx={1} fill="white" />
      {/* Inner block */}
      <rect x={2} y={2} width={3} height={3} rx={0.5} fill="currentColor" />
    </g>
  );

  return (
    <div className={`relative p-3 bg-white border border-slate-200 shadow-sm rounded-2xl flex items-center justify-center ${colorClass}`}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-full text-slate-800"
        shapeRendering="crispEdges"
      >
        {/* Render grid pixels */}
        {blocks.map((b, idx) => (
          <rect
            key={idx}
            x={b.c}
            y={b.r}
            width={0.88}
            height={0.88}
            rx={0.2}
            fill="currentColor"
          />
        ))}

        {/* Outer Corner Finder Patterns */}
        <FinderPattern x={0} y={0} />
        <FinderPattern x={size - 7} y={0} />
        <FinderPattern x={0} y={size - 7} />
      </svg>
      {/* Central stylized medical logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="bg-white p-1.5 rounded-full border border-slate-200 shadow-md scale-95 shrink-0 flex items-center justify-center text-current w-7 h-7">
          {logoIcon}
        </div>
      </div>
    </div>
  );
};

export const KioskPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Seeding simulated credentials to make triage actions bypass unauthenticated checks
  useEffect(() => {
    const activeStaff = useAuthStore.getState().staffProfile;
    if (!activeStaff) {
      const mockStaff = {
        id: 'staff-nurse-1',
        firebaseUid: 'uid-nurse-1',
        name: 'Triage Simulator Engine',
        email: 'operator@hospital.lk',
        role: 'admin' as const,
        departmentId: 'dept-opd',
        hospitalId: 'hosp-1',
        isActive: true
      };
      const mockUser = {
        uid: 'uid-nurse-1',
        email: 'operator@hospital.lk',
        displayName: 'Triage Simulator Engine',
        emailVerified: true
      };
      useAuthStore.getState().setUser(mockUser, mockStaff);
    }
  }, []);

  // Simulator Settings & Views
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentPhoneView, setCurrentPhoneView] = useState<'scanner' | 'register' | 'status'>('scanner');
  const [scannedDeptSlug, setScannedDeptSlug] = useState<string | null>(null);
  
  // Active simulated token registered inside the simulator
  const [activeTokenId, setActiveTokenId] = useState<string | null>(() => {
    return sessionStorage.getItem('careq_active_token_id') || null;
  });

  // Camera scanner animation state
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [scanFlash, setScanFlash] = useState(false);
  const [dynamicIslandMessage, setDynamicIslandMessage] = useState<string | null>(null);

  // Form Fields State
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [isSubmittingToken, setIsSubmittingToken] = useState(false);

  // Operator Actions state
  const [selectedStationId, setSelectedStationId] = useState('st-1');

  // Fetch departments for statistics and kiosk lobby cards
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.getDepartments(),
  });

  // Pull tokens database state directly for operator panel
  const [mockTokensList, setMockTokensList] = useState(db.tokens);
  
  // Real-time synchronization hooks for active token status view
  const { token: liveToken, events: liveEvents } = useToken(activeTokenId);

  // Update simulator state from db changes
  useEffect(() => {
    setMockTokensList(db.tokens);
  }, [activeTokenId, liveToken]);

  // Sync session storage on change
  useEffect(() => {
    if (activeTokenId) {
      sessionStorage.setItem('careq_active_token_id', activeTokenId);
      setCurrentPhoneView('status');
    } else {
      sessionStorage.removeItem('careq_active_token_id');
      setCurrentPhoneView('scanner');
    }
  }, [activeTokenId]);

  // Simulated live local time for smartphone status bar
  const [phoneTime, setPhoneTime] = useState('00:00');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setPhoneTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Monitor window-based custom events to update token state
  useEffect(() => {
    const handleMockSocketEvent = (e: any) => {
      const { event, payload } = e.detail;
      // Refresh queries
      if (activeTokenId) {
        queryClient.invalidateQueries({ queryKey: ['token', activeTokenId] });
        queryClient.invalidateQueries({ queryKey: ['tokenEvents', activeTokenId] });
      }
      setMockTokensList(db.tokens);

      if (event === 'patient:called' && payload.tokenId === activeTokenId) {
        playSound('success', soundEnabled);
        setDynamicIslandMessage(`Proceed to ${payload.stationName}!`);
        setTimeout(() => setDynamicIslandMessage(null), 5000);
      }
    };
    window.addEventListener('careq_mock_socket_event', handleMockSocketEvent);
    return () => window.removeEventListener('careq_mock_socket_event', handleMockSocketEvent);
  }, [activeTokenId, queryClient, soundEnabled]);

  // Trigger simulated scan sequence
  const handleSimulateScan = (deptSlug: string) => {
    if (isScanningActive) return;
    setIsScanningActive(true);
    setScannedDeptSlug(deptSlug);
    playSound('beep', soundEnabled);

    // Play high-fidelity scanner sweep
    setTimeout(() => {
      // Trigger shutter flash
      setScanFlash(true);
      playSound('camera', soundEnabled);
      
      const dept = departments.find(d => d.slug === deptSlug);
      setDynamicIslandMessage(`${dept?.name || 'OPD'} QR Detected!`);
      
      setTimeout(() => {
        setScanFlash(false);
      }, 150);

      setTimeout(() => {
        setIsScanningActive(false);
        setDynamicIslandMessage(null);
        setCurrentPhoneView('register');
      }, 1000);
    }, 1500); // 1.5s visual beam alignment delay
  };

  // Register Token internally in mock database
  const handleRegisterTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      toast.error('Patient Name is required');
      return;
    }
    if (!patientPhone.trim()) {
      toast.error('Phone number is required');
      return;
    }

    const matchedDept = departments.find(d => d.slug === scannedDeptSlug);
    if (!matchedDept) {
      toast.error('No matching department found');
      return;
    }

    setIsSubmittingToken(true);
    // Simulate brief network delay
    setTimeout(async () => {
      try {
        // Sri Lanka phone fallback format mapping
        let phone = patientPhone.trim();
        if (!phone.startsWith('+')) {
          if (phone.startsWith('0')) {
            phone = '+94' + phone.slice(1);
          } else if (phone.startsWith('7')) {
            phone = '+94' + phone;
          } else {
            phone = '+' + phone;
          }
        }

        const response = await tokenService.registerToken({
          patientName: patientName.trim(),
          patientPhone: phone,
          departmentId: matchedDept.id,
        });

        playSound('success', soundEnabled);
        toast.success(`Token ${response.tokenNumber} successfully issued!`);
        setActiveTokenId(response.tokenId);
        
        // Dynamic Island success pop-up
        setDynamicIslandMessage(`Token ${response.tokenNumber} Issued!`);
        setTimeout(() => setDynamicIslandMessage(null), 4000);

        // Reset forms
        setPatientName('');
        setPatientPhone('');
      } catch (err: any) {
        toast.error(err.message || 'Token issuance failed');
      } finally {
        setIsSubmittingToken(false);
      }
    }, 800);
  };

  // Simulation Controls: Nurse Priority Setter
  const handleSetPriority = async (priorityCode: 0 | 1 | 2, label: string) => {
    if (!activeTokenId) return;
    try {
      await tokenService.updatePriority(activeTokenId, {
        priority: priorityCode,
        reason: `Simulation: Set to ${label} priority level.`
      });
      // Force reload UI
      queryClient.invalidateQueries({ queryKey: ['token', activeTokenId] });
      queryClient.invalidateQueries({ queryKey: ['tokenEvents', activeTokenId] });
      setMockTokensList(db.tokens);
      playSound('beep', soundEnabled);
      toast.success(`Priority updated to ${label}`);
    } catch (e) {
      toast.error('Failed to update priority');
    }
  };

  // Simulation Controls: Doctor Station Queue Caller
  const handleSetStatus = async (status: 'CALLED' | 'IN_CONSULTATION' | 'COMPLETED' | 'NO_SHOW') => {
    if (!activeTokenId) return;
    try {
      await tokenService.updateStatus(activeTokenId, {
        status,
        stationId: selectedStationId
      });
      
      // Force reload queries
      queryClient.invalidateQueries({ queryKey: ['token', activeTokenId] });
      queryClient.invalidateQueries({ queryKey: ['tokenEvents', activeTokenId] });
      setMockTokensList(db.tokens);
      
      if (status === 'CALLED') {
        playSound('success', soundEnabled);
        toast.success(`Patient called to ${db.stations.find(s => s.id === selectedStationId)?.name || 'Station'}`);
      } else {
        playSound('beep', soundEnabled);
        toast.success(`Status updated to ${status}`);
      }
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  // Reset phone session to initial scan screen
  const handleResetPhoneSimulator = () => {
    setActiveTokenId(null);
    setScannedDeptSlug(null);
    setCurrentPhoneView('scanner');
    queryClient.clear();
    toast('Phone Simulator Reset. Ready for new QR Scan.');
  };

  // Get active selected department's styling parameters
  const getDeptConfig = (slug: string) => {
    switch (slug) {
      case 'general-opd':
        return {
          bgClass: 'bg-teal-50 border-teal-200/60',
          accent: 'text-primary border-primary/20 bg-primary/5',
          fillColor: 'text-primary',
          icon: <Landmark size={20} className="text-primary" />,
          logo: <Stethoscope size={14} className="text-primary fill-primary/10" />
        };
      case 'cardiology':
        return {
          bgClass: 'bg-rose-50 border-rose-200/60',
          accent: 'text-rose-600 border-rose-200 bg-rose-50',
          fillColor: 'text-rose-600',
          icon: <Heart size={20} className="text-rose-500 fill-rose-100" />,
          logo: <Heart size={14} className="text-rose-600 fill-rose-600" />
        };
      case 'pediatrics':
        return {
          bgClass: 'bg-indigo-50 border-indigo-200/60',
          accent: 'text-indigo-600 border-indigo-200 bg-indigo-50',
          fillColor: 'text-indigo-600',
          icon: <Baby size={20} className="text-indigo-500 fill-indigo-100 animate-bounce" />,
          logo: <Baby size={14} className="text-indigo-600 fill-indigo-600" />
        };
      default:
        return {
          bgClass: 'bg-slate-50 border-slate-200/60',
          accent: 'text-slate-600 border-slate-200 bg-slate-50',
          fillColor: 'text-slate-600',
          icon: <Landmark size={20} className="text-slate-600" />,
          logo: <Landmark size={14} className="text-slate-600" />
        };
    }
  };

  const matchedDeptInfo = scannedDeptSlug ? getDeptConfig(scannedDeptSlug) : null;
  const currentDeptDetail = departments.find(d => d.slug === scannedDeptSlug);

  // Queue length for active department
  const getQueueSize = (deptId: string) => {
    return mockTokensList.filter(t => t.departmentId === deptId && t.status === 'WAITING').length;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col antialiased selection:bg-primary selection:text-white">
      
      {/* Top Simulator Branding Bar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <QrCode size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white">CareQ</h1>
              <span className="text-[10px] uppercase font-black tracking-widest bg-primary/20 text-primary-light border border-primary/30 px-1.5 py-0.5 rounded-md">
                Simulator
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              Interactive Self-Service Lobby Kiosk & Patient Mobile Scanner Simulator
            </p>
          </div>
        </div>

        {/* Controls and navigation */}
        <div className="flex items-center gap-4">
          {/* Sounds Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-teal-400'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
            title={soundEnabled ? 'Disable Sounds' : 'Enable Sounds'}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span className="hidden sm:inline">{soundEnabled ? 'Audio ON' : 'Muted'}</span>
          </button>

          {/* Quick Exit to Login Portal */}
          <button
            onClick={() => navigate('/login')}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-850 hover:border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <Shield size={14} className="text-primary" />
            <span>Staff Portal</span>
            <ExternalLink size={12} className="text-slate-500 shrink-0" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Hospital Lobby Desk & Operator Control Center */}
        <div className="lg:col-span-7 space-y-8 flex flex-col justify-start">
          
          {/* Section 1: Self-Service Kiosk Board */}
          <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Landmark size={18} className="text-primary" />
                <h2 className="text-base font-black text-white uppercase tracking-wider">
                  Self-Service Triage Lobby Kiosk Desk
                </h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                Simulate the physical kiosk standing in the hospital lobby. Scan a clinic QR code on the signboards below to instantly trigger patient registration on your mobile browser.
              </p>

              {/* Department Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
                {departments.map((dept) => {
                  const cfg = getDeptConfig(dept.slug);
                  const isCurrentTarget = scannedDeptSlug === dept.slug;
                  const queueSize = getQueueSize(dept.id);
                  
                  return (
                    <div
                      key={dept.id}
                      className={`group border rounded-2xl p-4.5 flex flex-col justify-between transition-all duration-300 relative ${
                        isCurrentTarget
                          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/5'
                          : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400">
                            OPD Department
                          </span>
                          <span className="text-sm font-black text-white mt-0.5 leading-none">
                            {dept.name}
                          </span>
                        </div>
                        <div className={`p-2 rounded-xl shrink-0 ${cfg.accent}`}>
                          {cfg.icon}
                        </div>
                      </div>

                      {/* Interactive SVG QR Code Card */}
                      <div className="my-5 aspect-square max-w-[130px] mx-auto w-full transition-transform group-hover:scale-[1.03] duration-300">
                        <QRCodeSVG
                          seed={dept.slug}
                          colorClass={cfg.fillColor}
                          logoIcon={cfg.logo}
                        />
                      </div>

                      {/* Mini Statistics */}
                      <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span className="flex items-center gap-1">
                          <Zap size={11} className="text-amber-400 animate-pulse" />
                          <span>SLA: {dept.slaMinutes}m</span>
                        </span>
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950/40 border border-slate-800/60">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                          <span>Queue: {queueSize}</span>
                        </span>
                      </div>

                      {/* Trigger Scan Button */}
                      <button
                        onClick={() => handleSimulateScan(dept.slug)}
                        disabled={isScanningActive || currentPhoneView === 'status'}
                        className={`w-full mt-4 py-2 px-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                          isScanningActive && isCurrentTarget
                            ? 'bg-primary/20 text-primary border border-primary/40'
                            : currentPhoneView === 'status'
                            ? 'bg-slate-950 text-slate-700 border border-slate-900 cursor-not-allowed'
                            : 'bg-primary hover:bg-primary-dark text-slate-950 font-black hover:shadow-lg hover:shadow-primary/20'
                        }`}
                      >
                        {isScanningActive && isCurrentTarget ? (
                          <>
                            <RefreshCw size={12} className="animate-spin text-primary" />
                            <span>Scanning...</span>
                          </>
                        ) : (
                          <>
                            <Smartphone size={12} />
                            <span>Simulate Scan</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Section 2: Real-time Operator Command Console */}
          <section className="bg-slate-900/60 border border-slate-850 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <Stethoscope size={18} className="text-teal-400" />
                  <h2 className="text-base font-black text-white uppercase tracking-wider">
                    Interactive Operator Command Desk
                  </h2>
                </div>
                {activeTokenId ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[9px] font-extrabold uppercase tracking-wider animate-pulse">
                    Live Tracking: {liveToken?.tokenNumber || 'Active Patient'}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-950/60 text-slate-500 border border-slate-800 text-[9px] font-extrabold uppercase tracking-wider">
                    Offline
                  </span>
                )}
              </div>

              {!activeTokenId ? (
                <div className="p-8 text-center bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 border border-slate-800 mb-3 animate-pulse">
                    <Smartphone size={20} />
                  </div>
                  <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">
                    Waiting for Mobile Registration
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-sm leading-relaxed">
                    Once you simulate scanning a QR code and fill the patient registration form inside the smartphone simulator, this clinical control panel will unlock instantly!
                  </p>
                  
                  {/* Quick Action bypass */}
                  <button
                    onClick={() => handleSimulateScan('general-opd')}
                    className="mt-4 px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-[9px] font-extrabold uppercase tracking-widest text-slate-300 hover:text-white transition-all flex items-center gap-1"
                  >
                    <span>Auto-Trigger General OPD Scan</span>
                    <ArrowRight size={10} />
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Active Patient Details Mini Dashboard */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/50 border border-slate-850 p-4 rounded-2xl">
                    <div className="flex flex-col justify-center min-w-0">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        Patient Profile
                      </span>
                      <span className="text-xs font-black text-white mt-1 leading-none flex items-center gap-1.5 truncate">
                        <User size={13} className="text-slate-400" />
                        <span>{liveToken?.patientName || 'Loading...'}</span>
                      </span>
                      <span className="text-[9px] text-slate-400 mt-1 truncate">
                        {liveToken?.patientPhone || 'No Phone'}
                      </span>
                    </div>

                    <div className="flex flex-col justify-center min-w-0">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        Active Queue Position
                      </span>
                      <span className="text-xs font-black text-white mt-1 leading-none flex items-center gap-1.5 truncate">
                        <Flame size={13} className="text-amber-500" />
                        <span>
                          {liveToken?.status === 'WAITING'
                            ? `Position #${liveToken?.position}`
                            : liveToken?.status === 'CALLED'
                            ? 'Being Called'
                            : liveToken?.status || 'Active'}
                        </span>
                      </span>
                      <span className="text-[9px] text-slate-400 mt-1">
                        Est. Wait: {liveToken?.estimatedWaitMinutes || 0} mins
                      </span>
                    </div>

                    <div className="flex flex-col justify-center min-w-0">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        OPD Department
                      </span>
                      <span className="text-xs font-black text-white mt-1 leading-none flex items-center gap-1.5 truncate">
                        <Landmark size={13} className="text-teal-400" />
                        <span>{liveToken?.departmentName || 'General OPD'}</span>
                      </span>
                      <span className="text-[9px] text-slate-400 mt-1">
                        Status: <span className="font-extrabold text-primary">{liveToken?.status}</span>
                      </span>
                    </div>
                  </div>

                  {/* Simulator Controls Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Phase 1: Nurse Triage Actions */}
                    <div className="p-4 bg-slate-900 border border-slate-850 rounded-2xl">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-800/60 pb-2 mb-3.5 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        <span>Nurse Triage Console Simulator</span>
                      </h4>
                      <p className="text-[9px] text-slate-500 leading-relaxed mb-4">
                        Simulate the Triage Nurse reviewing the patient and adjusting their queue priority based on clinical severity. Emergency priority updates list order instantly!
                      </p>

                      <div className="space-y-2.5">
                        {/* Emergency (Level 0) */}
                        <button
                          onClick={() => handleSetPriority(0, 'Emergency')}
                          disabled={liveToken?.status !== 'WAITING'}
                          className={`w-full py-2 px-3 border border-red-500/20 hover:border-red-500/40 rounded-xl flex items-center justify-between text-xs font-extrabold text-red-400 hover:bg-red-500/5 transition-all ${
                            liveToken?.priority === 0 ? 'bg-red-500/10 border-red-500/50 text-red-300' : ''
                          } disabled:opacity-30 disabled:hover:bg-transparent`}
                        >
                          <span className="flex items-center gap-1.5">
                            <AlertTriangle size={13} className="text-red-500 animate-pulse" />
                            <span>1. Elevate to Emergency</span>
                          </span>
                          <span className="text-[8px] bg-red-950/60 border border-red-500/30 px-1.5 py-0.5 rounded-md">
                            Red Priority
                          </span>
                        </button>

                        {/* Urgent (Level 1) */}
                        <button
                          onClick={() => handleSetPriority(1, 'Urgent')}
                          disabled={liveToken?.status !== 'WAITING'}
                          className={`w-full py-2 px-3 border border-amber-500/20 hover:border-amber-500/40 rounded-xl flex items-center justify-between text-xs font-extrabold text-amber-400 hover:bg-amber-500/5 transition-all ${
                            liveToken?.priority === 1 ? 'bg-amber-500/10 border-amber-500/50 text-amber-300' : ''
                          } disabled:opacity-30 disabled:hover:bg-transparent`}
                        >
                          <span className="flex items-center gap-1.5">
                            <Zap size={13} className="text-amber-500" />
                            <span>2. Elevate to Urgent</span>
                          </span>
                          <span className="text-[8px] bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.5 rounded-md">
                            Orange Priority
                          </span>
                        </button>

                        {/* Normal (Level 2) */}
                        <button
                          onClick={() => handleSetPriority(2, 'Normal')}
                          disabled={liveToken?.status !== 'WAITING'}
                          className={`w-full py-2 px-3 border border-teal-500/20 hover:border-teal-500/40 rounded-xl flex items-center justify-between text-xs font-extrabold text-teal-400 hover:bg-teal-500/5 transition-all ${
                            liveToken?.priority === 2 ? 'bg-teal-500/10 border-teal-500/50 text-teal-300' : ''
                          } disabled:opacity-30 disabled:hover:bg-transparent`}
                        >
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-teal-400" />
                            <span>3. Reset to Standard OPD</span>
                          </span>
                          <span className="text-[8px] bg-teal-950/60 border border-teal-500/30 px-1.5 py-0.5 rounded-md">
                            Green Priority
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Phase 2: Doctor Station Actions */}
                    <div className="p-4 bg-slate-900 border border-slate-850 rounded-2xl">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-800/60 pb-2 mb-3.5 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        <span>OPD Doctor Station Simulator</span>
                      </h4>
                      
                      <div className="space-y-3">
                        {/* Select Doctor Station */}
                        <div className="flex flex-col">
                          <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Choose Active Station / Doctor
                          </label>
                          <select
                            value={selectedStationId}
                            onChange={(e) => setSelectedStationId(e.target.value)}
                            disabled={liveToken?.status === 'COMPLETED' || liveToken?.status === 'NO_SHOW'}
                            className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg p-1.5 text-[10px] font-extrabold focus:outline-none focus:border-primary disabled:opacity-40"
                          >
                            {db.stations
                              .filter(st => st.departmentId === liveToken?.departmentId)
                              .map(st => (
                                <option key={st.id} value={st.id}>
                                  {st.name} - {st.activeDoctorName}
                                </option>
                              ))}
                          </select>
                        </div>

                        {/* Station Action Workflow Buttons */}
                        <div className="space-y-2 pt-1">
                          {/* Call Patient */}
                          <button
                            onClick={() => handleSetStatus('CALLED')}
                            disabled={liveToken?.status !== 'WAITING'}
                            className="w-full py-2 px-3 bg-primary hover:bg-primary-dark text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-primary/10 transition-all disabled:opacity-30 disabled:hover:bg-primary"
                          >
                            <Volume2 size={12} />
                            <span>1. Call Patient (Announce)</span>
                          </button>

                          <div className="grid grid-cols-2 gap-2">
                            {/* Start Consultation */}
                            <button
                              onClick={() => handleSetStatus('IN_CONSULTATION')}
                              disabled={liveToken?.status !== 'CALLED'}
                              className="py-2 px-2 border border-teal-500 hover:border-teal-400 text-teal-400 bg-teal-950/20 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                              <Play size={10} />
                              <span>2. Start Session</span>
                            </button>

                            {/* Complete Consultation */}
                            <button
                              onClick={() => handleSetStatus('COMPLETED')}
                              disabled={liveToken?.status !== 'IN_CONSULTATION' && liveToken?.status !== 'CALLED'}
                              className="py-2 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all disabled:opacity-30 disabled:hover:bg-emerald-600"
                            >
                              <CheckCircle2 size={10} />
                              <span>3. Serve Done</span>
                            </button>
                          </div>

                          {/* No Show / Missed Call */}
                          <button
                            onClick={() => handleSetStatus('NO_SHOW')}
                            disabled={liveToken?.status !== 'CALLED'}
                            className="w-full py-1.5 px-3 border border-red-500/20 hover:border-red-500/40 text-red-500 hover:bg-red-500/5 rounded-lg text-[9px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-1 transition-all disabled:opacity-30"
                          >
                            <AlertTriangle size={11} />
                            <span>Mark Patient as Missed (No-Show)</span>
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Developer Walkthrough & Instructions */}
          <footer className="bg-slate-900/30 border border-slate-900 rounded-3xl p-5 select-none text-[10px] text-slate-500 leading-relaxed font-semibold">
            <h4 className="text-slate-400 font-extrabold uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Sparkles size={11} className="text-primary animate-pulse" />
              <span>Full End-to-End Test Walkthrough Instructions</span>
            </h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Choose a department card above and click <span className="text-slate-300 font-bold">Simulate Scan</span>. The virtual camera feed on the phone will load and scan.</li>
              <li>Type patient details into the smartphone inputs and submit to generate a live queue token.</li>
              <li>Watch the live token state in the phone, then use the <span className="text-slate-300 font-bold">Operator Command Desk</span> on the left to set priority, call, or complete consultation.</li>
              <li>Open a separate browser tab to the Nurse console (<span className="text-slate-400 hover:text-white transition-colors cursor-pointer" onClick={() => window.open('/nurse/triage', '_blank')}>/nurse/triage</span>) or TV Screen to witness cross-tab real-time socket updates!</li>
            </ul>
          </footer>

        </div>

        {/* Right Side: High-Fidelity Glassmorphic Mobile Phone Mockup */}
        <div className="lg:col-span-5 flex justify-center sticky top-24 select-none">
          
          {/* Main Smartphone Shell Chassis */}
          <div className="relative mx-auto w-[335px] h-[685px] bg-slate-950 rounded-[55px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] border-[12px] border-slate-800 p-3.5 flex flex-col transition-all duration-300 ring-[5px] ring-slate-900/50">
            
            {/* Top Speaker Slot */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-1 bg-slate-850 rounded-full z-30" />
            
            {/* Left Side Volume rocker / alert slider button stubs */}
            <div className="absolute -left-[14px] top-28 w-1 h-8 bg-slate-800 rounded-l-md" />
            <div className="absolute -left-[14px] top-40 w-1 h-12 bg-slate-800 rounded-l-md" />
            <div className="absolute -left-[14px] top-56 w-1 h-12 bg-slate-800 rounded-l-md" />
            
            {/* Right Side Power button stub */}
            <div className="absolute -right-[14px] top-36 w-1 h-16 bg-slate-800 rounded-r-md" />

            {/* Screen Glass Container */}
            <div className="relative w-full h-full bg-slate-900 rounded-[38px] overflow-hidden flex flex-col border border-slate-950/20 shadow-inner">
              
              {/* Dynamic Island Notch Pill */}
              <div 
                className={`absolute top-2.5 left-1/2 -translate-x-1/2 bg-black rounded-full z-40 transition-all duration-500 ease-out flex items-center justify-center px-4 ${
                  dynamicIslandMessage 
                    ? 'h-8.5 w-68 shadow-lg shadow-black/40 border border-slate-800' 
                    : 'h-6.5 w-26'
                }`}
              >
                {dynamicIslandMessage ? (
                  <div className="w-full flex items-center justify-between text-[9px] font-black text-white truncate uppercase tracking-wider animate-fade-in gap-1">
                    <span className="flex items-center gap-1 text-primary-light">
                      <Zap size={11} className="text-primary fill-primary/10 animate-pulse" />
                      <span>CareQ Dynamic:</span>
                    </span>
                    <span className="text-slate-200 font-bold truncate max-w-[120px]">{dynamicIslandMessage}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-800/80" />
                    <div className="h-1 w-3 bg-slate-850 rounded-full" />
                  </div>
                )}
              </div>

              {/* Status Bar */}
              <div className="h-9 px-6 bg-slate-900/60 backdrop-blur-md flex items-center justify-between text-[10px] font-black text-slate-300 select-none z-30 shrink-0">
                <span>{phoneTime}</span>
                <div className="flex items-center gap-1.5">
                  {/* Signal bars */}
                  <div className="flex items-end gap-[1.5px] h-2.5">
                    <div className="w-[2.5px] h-[3px] bg-slate-300 rounded-[0.5px]" />
                    <div className="w-[2.5px] h-[5px] bg-slate-300 rounded-[0.5px]" />
                    <div className="w-[2.5px] h-[7px] bg-slate-300 rounded-[0.5px]" />
                    <div className="w-[2.5px] h-[9px] bg-slate-300 rounded-[0.5px]" />
                  </div>
                  <span className="text-[8px] font-black leading-none bg-slate-800 px-1 py-0.5 rounded text-slate-400">5G</span>
                  {/* Battery icon */}
                  <div className="w-5 h-2.5 border border-slate-400 rounded-[3px] p-[1px] flex items-center">
                    <div className="w-3.5 h-full bg-primary rounded-[1.5px]" />
                    <div className="w-[1px] h-1 bg-slate-400 rounded-r-sm -mr-[2px] ml-[1px]" />
                  </div>
                </div>
              </div>

              {/* Safari Address Chrome */}
              <div className="bg-slate-900/90 border-b border-slate-800/40 p-2 select-none z-30 shrink-0 shadow-md">
                <div className="bg-slate-950/80 border border-slate-800 text-slate-300 rounded-xl px-3 py-1.5 text-[9px] font-bold flex items-center justify-between shadow-inner">
                  <span className="flex items-center gap-1 text-slate-500">
                    <span className="h-1 w-1 bg-emerald-500 rounded-full animate-ping" />
                    <span className="text-[8px]">🔒</span>
                  </span>
                  <span className="truncate max-w-[170px] tracking-wide text-slate-400 font-semibold lowercase">
                    {currentPhoneView === 'scanner' && 'careq.hospital/scanner'}
                    {currentPhoneView === 'register' && `careq.hospital/register/${scannedDeptSlug}`}
                    {currentPhoneView === 'status' && `careq.hospital/token/${activeTokenId || 'active'}`}
                  </span>
                  <button 
                    onClick={() => {
                      playSound('beep', soundEnabled);
                      if (activeTokenId) {
                        queryClient.invalidateQueries({ queryKey: ['token', activeTokenId] });
                        queryClient.invalidateQueries({ queryKey: ['tokenEvents', activeTokenId] });
                      }
                      toast.success('Simulated Page Reloaded');
                    }}
                    className="text-slate-500 hover:text-slate-300 font-extrabold focus:outline-none"
                  >
                    <RefreshCw size={10} />
                  </button>
                </div>
              </div>

              {/* Viewport Screen Content Frame */}
              <div className="flex-1 bg-slate-950 overflow-y-auto relative flex flex-col select-none scrollbar-none">
                
                {/* Visual Camera Scan Flash effect */}
                {scanFlash && (
                  <div className="absolute inset-0 bg-white z-50 animate-flash pointer-events-none" />
                )}

                {/* ================= VIEW 1: CAMERA SCANNER ================= */}
                {currentPhoneView === 'scanner' && (
                  <div className="flex-1 flex flex-col justify-between p-5 relative overflow-hidden bg-slate-950">
                    {/* Glowing circular overlay */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06)_0%,transparent_70%)] pointer-events-none" />

                    <div className="text-center select-none pt-4 z-10">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-full text-[9px] font-black tracking-widest text-primary-light uppercase">
                        <Camera size={10} className="text-primary animate-pulse" />
                        <span>Triage Smart Scanner</span>
                      </div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider mt-2.5">
                        Scanning for QR Code
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                        Aim your phone camera at one of the clinical kiosk QR codes on the left.
                      </p>
                    </div>

                    {/* Viewfinder Reticle Box */}
                    <div className="relative w-48 h-48 mx-auto my-auto flex items-center justify-center z-10">
                      
                      {/* Four corner targeting brackets */}
                      <div className="absolute top-0 left-0 w-5 h-5 border-t-3 border-l-3 border-primary rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-5 h-5 border-t-3 border-r-3 border-primary rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-5 h-5 border-b-3 border-l-3 border-primary rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-5 h-5 border-b-3 border-r-3 border-primary rounded-br-lg" />

                      {/* Moving laser scanning line */}
                      {isScanningActive ? (
                        <div className="absolute w-[94%] h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_8px_rgba(20,184,166,0.8)] animate-scanner-laser z-20" />
                      ) : (
                        <div className="absolute w-[94%] h-[2px] bg-slate-800 z-10" />
                      )}

                      {/* Camera simulation layout background */}
                      <div className="h-full w-full bg-slate-900/60 rounded-lg flex flex-col items-center justify-center border border-slate-800/40">
                        {isScanningActive ? (
                          <div className="relative">
                            <QrCode size={40} className="text-primary/30 animate-pulse" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <RefreshCw size={20} className="text-primary animate-spin" />
                            </div>
                          </div>
                        ) : (
                          <QrCode size={45} className="text-slate-700 animate-pulse" />
                        )}
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-2">
                          {isScanningActive ? 'Aligning Frame...' : 'Ready to capture'}
                        </span>
                      </div>
                    </div>

                    {/* Auto Scan Helper Buttons in Phone for accessibility */}
                    <div className="space-y-2 z-10 pb-4 select-none">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center block">
                        Quick Auto-Scan Shortcuts
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          onClick={() => handleSimulateScan('general-opd')}
                          disabled={isScanningActive}
                          className="py-1.5 px-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-lg text-[8px] font-bold text-slate-300 transition-all truncate"
                        >
                          Gen. OPD
                        </button>
                        <button
                          onClick={() => handleSimulateScan('cardiology')}
                          disabled={isScanningActive}
                          className="py-1.5 px-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-lg text-[8px] font-bold text-slate-300 transition-all truncate"
                        >
                          Cardio
                        </button>
                        <button
                          onClick={() => handleSimulateScan('pediatrics')}
                          disabled={isScanningActive}
                          className="py-1.5 px-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-lg text-[8px] font-bold text-slate-300 transition-all truncate"
                        >
                          Pediatrics
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ================= VIEW 2: PATIENT REGISTER FORM ================= */}
                {currentPhoneView === 'register' && scannedDeptSlug && (
                  <div className="flex-1 flex flex-col justify-between p-5 bg-slate-950 relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex-1 flex flex-col justify-center select-none pt-4">
                      {/* Department visual identification banner */}
                      <div className={`p-3.5 border rounded-2xl mb-4 ${matchedDeptInfo?.bgClass || 'bg-slate-900 border-slate-800'} text-slate-800 flex items-center justify-between`}>
                        <div className="flex flex-col text-left">
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                            Registered Clinic
                          </span>
                          <span className="text-xs font-black text-slate-800 mt-0.5">
                            {currentDeptDetail?.name || 'OPD Service'}
                          </span>
                          <span className="text-[8px] text-slate-400 font-bold mt-0.5">
                            Average Wait time: {currentDeptDetail?.slaMinutes || 20}m
                          </span>
                        </div>
                        <div className="p-2 bg-white rounded-xl shadow-sm shrink-0">
                          {matchedDeptInfo?.icon}
                        </div>
                      </div>

                      {/* Header title */}
                      <div className="text-center pb-4">
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">
                          Queue Token Check-In
                        </h3>
                        <p className="text-[9px] text-slate-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                          Please enter your details below to generate a digital waiting token.
                        </p>
                      </div>

                      {/* Inline Form */}
                      <form onSubmit={handleRegisterTokenSubmit} className="space-y-3.5 text-left">
                        {/* Name */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            Patient Name
                          </label>
                          <div className="relative w-full">
                            <input
                              type="text"
                              value={patientName}
                              onChange={(e) => setPatientName(e.target.value)}
                              disabled={isSubmittingToken}
                              placeholder="e.g. Jane Doe"
                              required
                              className="w-full bg-slate-900 border border-slate-800 focus:border-primary text-slate-200 placeholder-slate-600 rounded-xl pl-9 pr-3.5 py-2.5 text-[11px] font-bold focus:outline-none transition-all shadow-inner"
                            />
                            <div className="absolute left-3 top-3 text-slate-500 pointer-events-none">
                              <User size={13} />
                            </div>
                          </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            <span>Phone Number</span>
                            <span className="text-slate-500 lowercase">e.g. 0771234567</span>
                          </div>
                          <div className="relative w-full">
                            <input
                              type="text"
                              value={patientPhone}
                              onChange={(e) => setPatientPhone(e.target.value)}
                              disabled={isSubmittingToken}
                              placeholder="e.g. 0771234567"
                              required
                              className="w-full bg-slate-900 border border-slate-800 focus:border-primary text-slate-200 placeholder-slate-600 rounded-xl pl-9 pr-3.5 py-2.5 text-[11px] font-bold focus:outline-none transition-all shadow-inner"
                            />
                            <div className="absolute left-3 top-3 text-slate-500 pointer-events-none">
                              <Phone size={13} />
                            </div>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={isSubmittingToken}
                          className="w-full mt-4 py-2.5 bg-primary hover:bg-primary-dark text-slate-950 hover:shadow-lg hover:shadow-primary/20 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          {isSubmittingToken ? (
                            <>
                              <RefreshCw size={12} className="animate-spin text-slate-950" />
                              <span>Generating Token...</span>
                            </>
                          ) : (
                            <>
                              <Play size={12} className="fill-slate-950" />
                              <span>Issue Digital Token</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>

                    {/* Secondary Back to Scan Trigger */}
                    <button
                      type="button"
                      onClick={() => {
                        playSound('beep', soundEnabled);
                        setCurrentPhoneView('scanner');
                      }}
                      className="py-1.5 text-center text-slate-500 hover:text-slate-400 text-[8px] font-black uppercase tracking-widest focus:outline-none"
                    >
                      ← Back to Camera Scanner
                    </button>
                  </div>
                )}

                {/* ================= VIEW 3: PATIENT LIVE TOKEN STATUS ================= */}
                {currentPhoneView === 'status' && activeTokenId && (
                  <div className="flex-1 flex flex-col justify-between p-4.5 bg-slate-950 relative">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

                    {liveToken ? (
                      <div className="space-y-4 flex-1 flex flex-col justify-start">
                        
                        {/* 1. Header Banner */}
                        <div className={`p-2.5 rounded-xl border flex items-center justify-between text-left ${
                          liveToken.status === 'CALLED'
                            ? 'bg-amber-950/40 border-amber-500/30 text-amber-400 animate-pulse'
                            : liveToken.status === 'IN_CONSULTATION'
                            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                            : liveToken.status === 'COMPLETED'
                            ? 'bg-slate-900 border-slate-800 text-slate-400'
                            : 'bg-teal-950/40 border-teal-500/20 text-primary-light'
                        }`}>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[7px] uppercase font-black tracking-widest text-slate-500">
                              Current Status
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider mt-0.5 truncate">
                              {liveToken.status === 'WAITING' && 'Waiting in queue'}
                              {liveToken.status === 'CALLED' && `Called! Go to ${liveToken.stationName || 'Station'}`}
                              {liveToken.status === 'IN_CONSULTATION' && 'In Consultation Station'}
                              {liveToken.status === 'COMPLETED' && 'Consultation Finished'}
                              {liveToken.status === 'NO_SHOW' && 'No-Show / Missed Call'}
                            </span>
                          </div>
                          <div className="shrink-0 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 bg-current rounded-full animate-ping" />
                            <span className="text-[8px] font-black uppercase tracking-widest">
                              {liveToken.status}
                            </span>
                          </div>
                        </div>

                        {/* 2. Big Token Hero Card */}
                        <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl text-center flex flex-col items-center relative overflow-hidden select-none">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                            Your Ticket Number
                          </span>
                          <h2 className="text-3xl font-black tracking-tight text-white mt-1.5 bg-gradient-to-r from-primary to-teal-400 bg-clip-text text-transparent">
                            {liveToken.tokenNumber}
                          </h2>
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">
                            {liveToken.departmentName || 'OPD Service'}
                          </span>
                        </div>

                        {/* 3. Waiting Position Ring */}
                        {liveToken.status === 'WAITING' ? (
                          <div className="bg-slate-900/60 border border-slate-850/80 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                            <div className="relative h-14 w-14 rounded-full border border-slate-800 flex flex-col items-center justify-center shrink-0">
                              <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                                Queue
                              </span>
                              <span className="text-base font-black text-white mt-0.5 leading-none">
                                #{liveToken.position}
                              </span>
                              {/* Glowing outer progress ring */}
                              <div className="absolute inset-0 rounded-full border border-primary animate-pulse opacity-20 scale-[1.05]" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <h4 className="text-[10px] font-extrabold text-slate-300">
                                Estimated Wait: <span className="text-primary font-black">{liveToken.estimatedWaitMinutes} mins</span>
                              </h4>
                              <p className="text-[8px] text-slate-500 mt-1 leading-relaxed">
                                Wait estimates dynamically adjust based on doctor consultation speed.
                              </p>
                            </div>
                          </div>
                        ) : liveToken.status === 'CALLED' ? (
                          <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl text-center space-y-1">
                            <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-wider animate-pulse flex items-center justify-center gap-1">
                              <Volume2 size={12} />
                              <span>Proceed Immediately</span>
                            </h4>
                            <p className="text-[9px] text-slate-300 leading-relaxed font-semibold">
                              Please walk directly to <span className="text-white font-black underline">{liveToken.stationName || 'OPD Station'}</span>. The doctor is waiting for you now.
                            </p>
                          </div>
                        ) : liveToken.status === 'IN_CONSULTATION' ? (
                          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl text-center space-y-1">
                            <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-wider flex items-center justify-center gap-1">
                              <Stethoscope size={12} className="animate-pulse" />
                              <span>Session in Progress</span>
                            </h4>
                            <p className="text-[9px] text-slate-300 leading-relaxed font-semibold">
                              Your medical consultation is active at {liveToken.stationName || 'Station'}. Thank you for using CareQ.
                            </p>
                          </div>
                        ) : (
                          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl text-center space-y-1 select-none">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                              <CheckCircle2 size={12} />
                              <span>Session Completed</span>
                            </h4>
                            <p className="text-[9px] text-slate-500 leading-relaxed max-w-[200px] mx-auto">
                              This token session is closed. To join the queue again, please scan the QR code to check in.
                            </p>
                          </div>
                        )}

                        {/* 4. Timeline Milestones */}
                        {liveEvents.length > 0 && (
                          <div className="p-3 bg-slate-950 border border-slate-850 rounded-2xl text-left select-none max-h-[160px] overflow-y-auto">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-2.5">
                              Milestone Activity Feed
                            </span>
                            <div className="space-y-3 relative before:absolute before:left-1.5 before:top-1.5 before:bottom-1.5 before:w-[1px] before:bg-slate-800">
                              {liveEvents.map((evt) => {
                                const isIssued = evt.eventType === 'TOKEN_ISSUED';
                                const isCalled = evt.eventType === 'PATIENT_CALLED';
                                const isConsult = evt.eventType === 'IN_CONSULTATION_STARTED';
                                
                                return (
                                  <div key={evt.id} className="flex gap-2.5 relative pl-1 flex-row">
                                    <div className={`h-3 w-3 rounded-full border flex items-center justify-center text-[6px] shrink-0 z-10 ${
                                      isIssued ? 'bg-primary border-primary/20 text-slate-950' :
                                      isCalled ? 'bg-amber-500 border-amber-500/20 text-slate-950' :
                                      isConsult ? 'bg-emerald-500 border-emerald-500/20 text-slate-950' :
                                      'bg-slate-700 border-slate-600 text-slate-400'
                                    }`}>
                                      ✓
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[9px] font-extrabold text-slate-300 leading-none">
                                        {isIssued && 'Token Registered'}
                                        {isCalled && 'Called to Station'}
                                        {isConsult && 'Consultation Active'}
                                        {evt.eventType === 'CONSULTATION_COMPLETED' && 'Consultation Completed'}
                                        {evt.eventType === 'NO_SHOW' && 'Marked as No-Show'}
                                        {evt.eventType === 'PRIORITY_CHANGED' && `Priority Changed`}
                                      </span>
                                      <span className="text-[7.5px] text-slate-500 mt-0.5 leading-none">
                                        {new Date(evt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        {evt.actorName && ` • by ${evt.actorName}`}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col justify-center items-center py-10">
                        <RefreshCw size={24} className="text-primary animate-spin" />
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-2 animate-pulse">
                          Syncing Active Token...
                        </span>
                      </div>
                    )}

                    {/* Reset Simulator Trigger */}
                    <button
                      onClick={handleResetPhoneSimulator}
                      className="mt-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 focus:outline-none"
                    >
                      <RotateCcw size={10} />
                      <span>Scan Another QR Code</span>
                    </button>
                  </div>
                )}

              </div>

              {/* Physical Home Button stub */}
              <div className="h-5.5 bg-slate-950 flex justify-center items-center select-none z-30 shrink-0">
                <div className="w-24 h-1 bg-slate-850 rounded-full" />
              </div>

            </div>
          </div>

        </div>

      </main>
    </div>
  );
};

export default KioskPage;
