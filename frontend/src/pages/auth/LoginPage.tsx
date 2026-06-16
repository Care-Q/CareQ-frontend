import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Mail, Lock, Shield, Users, Stethoscope, Landmark, ToggleLeft, ToggleRight, QrCode, ArrowRight } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import AppLogo from '../../components/common/AppLogo';
import Card from '../../components/common/Card';
import { db } from '../../lib/mockServer';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(db.demoMode);

  const handleToggleDemoMode = () => {
    const nextMode = !isDemoMode;
    db.demoMode = nextMode;
    setIsDemoMode(nextMode);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    try {
      const profile = await login(email, password);
      // Route based on role
      if (profile.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (profile.role === 'nurse') {
        navigate('/nurse/triage');
      } else if (profile.role === 'doctor') {
        navigate('/doctor/station');
      }
    } catch (err) {
      // toast is already fired in useAuth hook
    }
  };

  const handleQuickLogin = async (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password123'); // stub
    
    try {
      // Force demo mode for quick logins
      db.demoMode = true;
      setIsDemoMode(true);
      
      const profile = await login(roleEmail);
      
      if (profile.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (profile.role === 'nurse') {
        navigate('/nurse/triage');
      } else if (profile.role === 'doctor') {
        navigate('/doctor/station');
      }
    } catch (err) {
      // error handled in useAuth
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark via-primary to-bg-secondary flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-lg space-y-6">
        
        {/* Upper Card containing Login */}
        <Card className="bg-white/95 backdrop-blur-md shadow-2xl border border-white/20 p-8 rounded-[32px] animate-slide-up flex flex-col items-center">
          
          <AppLogo className="mb-4" textClassName="text-2xl" />
          
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-text-primary tracking-tight">Staff Portal Login</h1>
            <p className="text-xs text-text-secondary mt-1 max-w-xs mx-auto">
              Access the CareQ Hospital Smart Queue and OPD Station Console.
            </p>
          </div>

          {/* Demo Mode Toggle */}
          <div className="w-full bg-bg-secondary p-3 rounded-2xl border border-primary/10 flex items-center justify-between mb-5">
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black text-primary uppercase tracking-wider">Demo / Testing Mode</span>
              <span className="text-[9px] text-text-secondary font-medium">Bypass Firebase backend using simulated browser database</span>
            </div>
            <button 
              type="button" 
              onClick={handleToggleDemoMode}
              className="text-primary focus:outline-none"
            >
              {isDemoMode ? (
                <ToggleRight size={38} className="text-primary stroke-[1.5]" />
              ) : (
                <ToggleLeft size={38} className="text-text-secondary stroke-[1.5]" />
              )}
            </button>
          </div>

          <form onSubmit={handleLoginSubmit} className="w-full space-y-4">
            {/* Email */}
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Email Address</label>
              <div className="relative w-full">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/50 z-10">
                  <Mail size={18} />
                </span>
                <Input
                  type="email"
                  placeholder="staff@hospital.lk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="pl-11 rounded-xl border-border-default focus:border-primary"
                />
              </div>
            </div>

            {/* Password */}
            {!isDemoMode && (
              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Credential Password</label>
                <div className="relative w-full">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/50 z-10">
                    <Lock size={18} />
                  </span>
                  <Input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-11 rounded-xl border-border-default focus:border-primary"
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full py-3.5 shadow-md shadow-primary/20 rounded-xl hover:shadow-lg font-bold"
            >
              Sign In to Console
            </Button>
          </form>
        </Card>

        {/* Demo Quick Logins */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/30 shadow-xl p-6 rounded-3xl animate-slide-up [animation-delay:150ms]">
          <h3 className="text-xs font-black text-text-primary uppercase tracking-widest text-center mb-4 flex items-center justify-center gap-1.5">
            <Landmark size={14} className="text-primary shrink-0" />
            <span>Developer Sandbox Quick Login</span>
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Admin */}
            <button
              onClick={() => handleQuickLogin('admin@hospital.lk')}
              disabled={isLoading}
              className="flex items-center gap-3.5 sm:flex-col sm:gap-2 p-3.5 bg-white border border-primary/10 rounded-2xl hover:border-primary hover:shadow-md transition-all text-left sm:text-center group disabled:opacity-50"
            >
              <div className="p-2 bg-amber-50 border border-amber-200 text-amber-500 rounded-xl group-hover:scale-105 transition-transform shrink-0">
                <Shield size={20} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-text-primary">Super Admin</span>
                <span className="text-[9px] text-text-secondary mt-0.5">Control Panel</span>
              </div>
            </button>

            {/* Nurse */}
            <button
              onClick={() => handleQuickLogin('nurse@hospital.lk')}
              disabled={isLoading}
              className="flex items-center gap-3.5 sm:flex-col sm:gap-2 p-3.5 bg-white border border-primary/10 rounded-2xl hover:border-primary hover:shadow-md transition-all text-left sm:text-center group disabled:opacity-50"
            >
              <div className="p-2 bg-primary-light border border-primary/20 text-primary rounded-xl group-hover:scale-105 transition-transform shrink-0">
                <Users size={20} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-text-primary">Triage Nurse</span>
                <span className="text-[9px] text-text-secondary mt-0.5">Queue Console</span>
              </div>
            </button>

            {/* Doctor */}
            <button
              onClick={() => handleQuickLogin('doctor@hospital.lk')}
              disabled={isLoading}
              className="flex items-center gap-3.5 sm:flex-col sm:gap-2 p-3.5 bg-white border border-primary/10 rounded-2xl hover:border-primary hover:shadow-md transition-all text-left sm:text-center group disabled:opacity-50"
            >
              <div className="p-2 bg-indigo-50 border border-indigo-200 text-indigo-500 rounded-xl group-hover:scale-105 transition-transform shrink-0">
                <Stethoscope size={20} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-text-primary">OPD Doctor</span>
                <span className="text-[9px] text-text-secondary mt-0.5">Consultation Station</span>
              </div>
            </button>
          </div>
        </Card>

        {/* Patient Kiosk & Mobile Phone Simulator Launcher Card */}
        <Card 
          onClick={() => navigate('/kiosk')}
          className="bg-gradient-to-r from-teal-500 to-emerald-600 border border-teal-400/25 shadow-xl p-4.5 rounded-3xl animate-slide-up [animation-delay:250ms] text-white flex items-center justify-between group cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 bg-white/10 rounded-2xl text-white group-hover:scale-105 transition-transform shrink-0 border border-white/10">
              <QrCode size={22} className="animate-pulse" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-black uppercase tracking-wider">Patient Self-Service Kiosk</span>
              <span className="text-[10px] text-white/80 mt-0.5 leading-relaxed font-semibold">
                Simulate mobile QR scanning, token registration, and wait-time tracking on screen
              </span>
            </div>
          </div>
          <ArrowRight size={18} className="text-white/80 group-hover:translate-x-1.5 transition-transform duration-300 ml-4 shrink-0" />
        </Card>

      </div>
    </div>
  );
};

export default LoginPage;
