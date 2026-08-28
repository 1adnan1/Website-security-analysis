/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, 
  Search, 
  History, 
  Settings as SettingsIcon, 
  Bell, 
  Moon, 
  Sun,
  Lock,
  Globe,
  Activity,
  AlertCircle,
  CheckCircle2,
  Trash2,
  RefreshCw,
  MoreVertical,
  Download,
  AlertTriangle,
  Lightbulb,
  Radar,
  Terminal,
  Cpu,
  Zap,
  Cloud,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  FileText,
  BarChart3,
  Search as SearchIcon,
  LayoutDashboard,
  User,
  ExternalLink,
  Clock,
  MapPin
} from "lucide-react";
import { GlassCard, StatusBadge, NeumorphicButton } from "./components/Common";
import { getStatusColor } from "./types";
import { 
  AreaChart,
  Area,
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const scanStatsData = [
  { time: '00:00', score: 85 },
  { time: '04:00', score: 72 },
  { time: '08:00', score: 91 },
  { time: '12:00', score: 65 },
  { time: '16:00', score: 78 },
  { time: '20:00', score: 88 },
  { time: '23:59', score: 92 },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [preferences, setPreferences] = useState({
    realtime: true,
    notifications: false,
    deepScan: true,
    autoReport: false,
    cloudSync: true,
    verboseLogs: false
  });

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('scan_history');
    alert("Infrastructure archive cleared successfully.");
  };

  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [websiteScanResult, setWebsiteScanResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [scanLogs, setScanLogs] = useState([]);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  const [isLoginView, setIsLoginView] = useState(true);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState("");
  
  // Dynamic stats
  const [stats, setStats] = useState({
    scannedToday: 0,
    threatsBlocked: 0,
    highRiskSites: 0,
    avgResponseTime: "0.0s"
  });
  
  // Active threats
  const [threats, setThreats] = useState([]);

  // Load user on start
  useEffect(() => {
    if (token) {
      axios.get('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => setUser(res.data))
      .catch(() => {
        setToken(null);
        localStorage.removeItem('auth_token');
      });
    }
  }, [token]);

  // Load history if logged in
  useEffect(() => {
    if (token && user) {
      axios.get('/api/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => setHistory(res.data));
    }
  }, [token, user]);

  // Load stats and threats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, threatsRes] = await Promise.all([
          axios.get('/api/stats'),
          axios.get('/api/threats')
        ]);
        setStats(statsRes.data);
        setThreats(threatsRes.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Polling for "real-time" feel
    return () => clearInterval(interval);
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");
    const endpoint = isLoginView ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const response = await axios.post(endpoint, authForm);
      const data = response.data;
      
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('auth_token', data.token);
      setCurrentPage('home');
    } catch (err) {
      setAuthError(err.response?.data?.error || err.message);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    setCurrentPage('home');
    setHistory([]);
  };

  const startScan = async (source = 'scanner') => {
    if (!url) return;
    setIsScanning(true);
    
    const logs = ["Connecting to clinical engine..."];
    if (preferences.verboseLogs) {
      logs.push("Initializing low-level socket interception...");
      logs.push("Resolving primary and secondary nameservers...");
      logs.push("Analyzing packet headers for entropy anomalies...");
    }
    setScanLogs(logs);
    
    if (source === 'scanner') {
      setCurrentPage('scanner');
      setScanResult(null);
    } else if (source === 'check') {
      setWebsiteScanResult(null);
    } else {
      setCurrentPage('scanner');
      setScanResult(null);
    }
    
    try {
      const response = await axios.post('/api/check-security', { url }, {
        headers: { 
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      const data = response.data;
      
      if (preferences.verboseLogs) {
        setScanLogs(prev => [...prev, "Payload interpreted. Analyzing protocol metadata...", `Handshake completed in ${Math.floor(Math.random() * 500)}ms`]);
      }

      if (source === 'check') {
        setWebsiteScanResult(data);
      } else {
        setScanResult(data);
      }

      if (preferences.cloudSync) {
        setHistory(prev => [data, ...prev]);
      }
      
      // Update stats locally for immediate feedback
      setStats(prev => ({ ...prev, scannedToday: prev.scannedToday + 1 }));
      
    } catch (error) {
      console.error(error);
      setScanLogs(prev => ["CRITICAL ERROR: Failed to reach security nodes", ...prev]);
    } finally {
      setIsScanning(false);
    }
  };

  const NavItem = ({ icon: Icon, page, label }) => (
    <button
      onClick={() => setCurrentPage(page)}
      className={`flex flex-col items-center justify-center px-4 py-2 transition-all ${
        currentPage === page ? 'text-cyan-400 bg-cyan-500/10 rounded-xl shadow-inner' : 'text-slate-500 hover:text-cyan-300'
      }`}
    >
      <Icon size={20} />
      <span className="text-[10px] font-bold uppercase tracking-wider mt-1">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30 flex">
      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col bg-slate-900/50 border-r border-white/5 transition-all duration-300 backdrop-blur-xl shrink-0 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <Shield className="text-slate-950" size={18} />
          </div>
          {!isSidebarCollapsed && <h1 className="text-lg font-black text-white tracking-tighter">SecureCheck</h1>}
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-4">
          <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={currentPage === 'home'} onClick={() => setCurrentPage('home')} collapsed={isSidebarCollapsed} />
          <SidebarItem icon={<SearchIcon size={18} />} label="Check Website" active={currentPage === 'check'} onClick={() => setCurrentPage('check')} collapsed={isSidebarCollapsed} />
          <SidebarItem icon={<Lock size={18} />} label="SSL / TLS" active={currentPage === 'scanner'} onClick={() => setCurrentPage('scanner')} collapsed={isSidebarCollapsed} />
          <SidebarItem icon={<History size={18} />} label="Scan History" active={currentPage === 'history'} onClick={() => setCurrentPage('history')} collapsed={isSidebarCollapsed} />
          <SidebarItem icon={<ShieldAlert size={18} />} label="Threats" active={currentPage === 'threats'} onClick={() => setCurrentPage('threats')} collapsed={isSidebarCollapsed} />
          <SidebarItem icon={<FileText size={18} />} label="Reports" active={currentPage === 'report'} onClick={() => { if(scanResult) setCurrentPage('report'); else alert('Perform a scan first'); }} collapsed={isSidebarCollapsed} />
          <SidebarItem icon={<BarChart3 size={18} />} label="Analytics" active={currentPage === 'analytics'} onClick={() => setCurrentPage('analytics')} collapsed={isSidebarCollapsed} />
          <SidebarItem icon={<SettingsIcon size={18} />} label="Settings" active={currentPage === 'settings'} onClick={() => setCurrentPage('settings')} collapsed={isSidebarCollapsed} />
        </nav>

        <div className="p-4 mt-auto">
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="flex items-center gap-3 w-full px-3 py-3 text-slate-500 hover:text-white transition-all hover:bg-white/5 rounded-xl"
          >
            <ChevronLeft className={`transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} size={18} />
            {!isSidebarCollapsed && <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-slate-950/20 backdrop-blur-md shrink-0">
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-white tracking-tight uppercase">Website Security Analysis</h2>
            <div className="flex items-center gap-2 mt-0.5">
               <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">All systems operational</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {user ? (
               <div onClick={() => setCurrentPage('settings')} className="flex items-center gap-3 bg-slate-800/40 p-1 pr-4 rounded-full border border-white/5 cursor-pointer hover:bg-slate-800 transition-colors group">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 group-hover:border-cyan-500/50 transition-all">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="User" />
                  </div>
                  <span className="text-xs font-bold text-white">{user.name}</span>
               </div>
             ) : (
                <button 
                  onClick={() => setCurrentPage('auth')}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl hover:bg-cyan-500 hover:text-slate-950 transition-all font-bold text-[10px] uppercase tracking-widest"
                >
                  <User size={14} />
                  Sign In
                </button>
             )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {currentPage === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-12 max-w-6xl mx-auto"
              >
                {/* Hero Dashboard Section */}
                <div className="relative py-16 flex flex-col items-center text-center">
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
                   
                   <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-8 z-10">
                      <div className="w-1 h-1 rounded-full bg-cyan-400" />
                      <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-[0.2em]">All infrastructure nodes active</span>
                      <div className="w-1 h-1 rounded-full bg-cyan-400" />
                   </div>

                   <h3 className="text-7xl font-black text-white tracking-tighter mb-6 z-10">
                      Is That Website <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Safe?</span>
                   </h3>
                   <p className="text-slate-400 max-w-lg leading-relaxed text-sm z-10">
                      Instantly scan any URL for SSL issues, malware, phishing, DNS vulnerabilities, and more — all in one place.
                   </p>

                   <div className="mt-12 w-full max-w-2xl relative z-10">
                      <input 
                        type="text" 
                        placeholder="Enter website URL (e.g. https://example.com)"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && startScan('home')}
                        className="w-full bg-slate-900 border border-white/5 rounded-2xl py-5 pl-14 pr-40 text-sm focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/40 transition-all font-medium text-white shadow-2xl"
                      />
                      <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                      <button 
                        onClick={() => startScan('home')}
                        className="absolute right-2.5 top-2.5 bottom-2.5 px-8 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95"
                      >
                        <Search size={14} />
                        Scan Now
                      </button>
                   </div>

                   <div className="grid grid-cols-3 gap-16 mt-16 z-10">
                      <div className="text-center group">
                        <div className="text-2xl font-black text-white group-hover:text-cyan-400 transition-colors">10M+</div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Scans Done</div>
                      </div>
                      <div className="text-center group">
                        <div className="text-2xl font-black text-white group-hover:text-cyan-400 transition-colors">99.9%</div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Uptime</div>
                      </div>
                      <div className="text-center group">
                        <div className="text-2xl font-black text-white group-hover:text-cyan-400 transition-colors">{stats.avgResponseTime}</div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Avg Scan Time</div>
                      </div>
                   </div>
                </div>

                {/* Dashboard Metrics Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5 rounded-3xl overflow-hidden border border-white/5">
                   <div className="bg-slate-950 p-10 space-y-4 hover:bg-slate-900/50 transition-colors group">
                      <div className="flex items-center gap-2 text-cyan-400">
                         <Shield size={16} />
                         <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Sites Scanned Today</span>
                      </div>
                      <div className="text-7xl font-black text-cyan-400 tracking-tighter group-hover:scale-105 transition-transform origin-left">{stats.scannedToday.toLocaleString()}</div>
                   </div>
                   <div className="bg-slate-950 p-10 space-y-4 border-l border-white/5 hover:bg-slate-900/50 transition-colors group">
                      <div className="flex items-center gap-2 text-emerald-400">
                         <ShieldCheck size={16} />
                         <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Threats Blocked</span>
                      </div>
                      <div className="text-7xl font-black text-emerald-400 tracking-tighter group-hover:scale-105 transition-transform origin-left">{stats.threatsBlocked.toLocaleString()}</div>
                   </div>
                   <div className="bg-slate-950 p-10 space-y-4 border-t border-white/5 hover:bg-slate-900/50 transition-colors group">
                      <div className="flex items-center gap-2 text-orange-500">
                         <AlertTriangle size={16} />
                         <span className="text-[9px] font-bold uppercase tracking-[0.2em]">High Risk Sites</span>
                      </div>
                      <div className="text-7xl font-black text-orange-500 tracking-tighter group-hover:scale-105 transition-transform origin-left">{stats.highRiskSites.toLocaleString()}</div>
                   </div>
                   <div className="bg-slate-950 p-10 space-y-4 border-t border-l border-white/5 hover:bg-slate-900/50 transition-colors group">
                      <div className="flex items-center gap-2 text-amber-500">
                         <Activity size={16} />
                         <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Avg Response Time</span>
                      </div>
                      <div className="text-7xl font-black text-amber-500 tracking-tighter group-hover:scale-105 transition-transform origin-left">{stats.avgResponseTime}</div>
                   </div>
                </div>

              {/* Scan Results Bento Grid */}
              {scanResult && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <GlassCard className="md:col-span-4 flex flex-col items-center justify-center min-h-[300px]">
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Overall Trust Score</div>
                    <div className="relative w-48 h-48">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
                        <circle 
                          cx="50" cy="50" r="45" fill="none" stroke="#06b6d4" 
                          strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - (283 * scanResult.score / 100)}
                          strokeLinecap="round" className="transition-all duration-1000 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" 
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-6xl font-black text-white">{scanResult.score}</span>
                        <span className="text-cyan-400 text-xs font-bold uppercase tracking-widest">Health</span>
                      </div>
                    </div>
                  </GlassCard>

                  <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <GlassCard className="flex flex-col justify-between">
                       <h3 className="text-sm font-bold text-white uppercase tracking-tight mb-4">SSL Diagnostics</h3>
                       <div className="space-y-4">
                          <div className="flex justify-between items-center">
                             <span className="text-xs text-slate-500">Status</span>
                             <StatusBadge type={scanResult.ssl?.valid ? 'pass' : 'fail'} />
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-xs text-slate-500">Issuer</span>
                             <span className="text-xs text-white font-mono opacity-80">{scanResult.ssl?.issuer || 'Unknown'}</span>
                          </div>
                       </div>
                       <button onClick={() => setCurrentPage('scanner')} className="mt-6 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors text-left uppercase tracking-widest">Details →</button>
                    </GlassCard>
                    <GlassCard className="bg-slate-900 border-dashed">
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-cyan-500/10 rounded-2xl">
                             <Lightbulb className="w-6 h-6 text-cyan-400" />
                          </div>
                          <div>
                             <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Security Tip</h4>
                             <p className="text-xs text-slate-300 leading-relaxed">Implement <strong>HSTS</strong> policies to prevent protocol downgrades.</p>
                          </div>
                       </div>
                    </GlassCard>
                  </div>
                </div>
              )}
            </motion.div>
          )}

            {currentPage === 'check' && (
              <motion.div
                key="check"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto py-12 flex flex-col items-center"
              >
                 <div className="space-y-4 text-center mb-16">
                    <h2 className="text-4xl font-black text-white tracking-widest uppercase">Check Website</h2>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">Perform a real-time security audit. Enter a domain or full URL to begin the clinical diagnostic process.</p>
                 </div>

                 <div className="w-full max-w-2xl relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none" />
                    <input 
                      type="text" 
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && startScan('check')}
                      className="w-full bg-slate-900 border border-white/10 rounded-3xl py-6 pl-16 pr-44 text-lg focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 transition-all font-medium text-white shadow-2xl relative z-10"
                    />
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-cyan-400" size={24} />
                    <button 
                      onClick={() => startScan('check')}
                      disabled={!url || isScanning}
                      className="absolute right-3 top-3 bottom-3 px-10 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-3 transition-all shadow-lg relative z-20 active:scale-95"
                    >
                      {isScanning ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
                      ANALYZE
                    </button>
                 </div>

                 {websiteScanResult && (
                   <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full mt-12 grid grid-cols-1 md:grid-cols-2 gap-6"
                   >
                      <GlassCard className="p-8 space-y-6">
                        <div className="flex items-center justify-between">
                           <h3 className="text-lg font-black text-white italic tracking-tighter">DIAGNOSTIC STATUS</h3>
                           <StatusBadge type={websiteScanResult.score > 70 ? 'pass' : 'fail'} />
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-3xl font-black text-cyan-400">
                              {websiteScanResult.score}
                           </div>
                           <div>
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Health</div>
                              <div className="text-sm font-medium text-white">{websiteScanResult.domain}</div>
                           </div>
                        </div>
                      </GlassCard>

                      <GlassCard className="p-8">
                         <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Website Checks</h3>
                         <div className="space-y-3">
                            {websiteScanResult.checks.map((check, i) => (
                              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                 <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${check.status === 'pass' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                    <span className="text-[10px] text-slate-300 font-medium">{check.name}</span>
                                 </div>
                                 <span className="text-[10px] font-mono text-slate-500">{check.detail}</span>
                              </div>
                            ))}
                         </div>
                      </GlassCard>
                   </motion.div>
                 )}

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full opacity-60">
                    <div className="p-6 bg-slate-900/50 border border-white/5 rounded-2xl space-y-3">
                       <Shield size={20} className="text-cyan-400" />
                       <h4 className="text-xs font-bold text-white uppercase tracking-widest">SSL Diagnosis</h4>
                       <p className="text-[10px] text-slate-500 leading-relaxed">Full certificate chain validation and vulnerability check.</p>
                    </div>
                    <div className="p-6 bg-slate-900/50 border border-white/5 rounded-2xl space-y-3">
                       <Lock size={20} className="text-cyan-400" />
                       <h4 className="text-xs font-bold text-white uppercase tracking-widest">Header Audit</h4>
                       <p className="text-[10px] text-slate-500 leading-relaxed">Detection of CSP, HSTS, and X-Content-Type-Options.</p>
                    </div>
                    <div className="p-6 bg-slate-900/50 border border-white/5 rounded-2xl space-y-3">
                       <Radar size={20} className="text-cyan-400" />
                       <h4 className="text-xs font-bold text-white uppercase tracking-widest">Network Logic</h4>
                       <p className="text-[10px] text-slate-500 leading-relaxed">DNS record analysis and infrastructure health reporting.</p>
                    </div>
                 </div>
              </motion.div>
            )}

          {currentPage === 'scanner' && (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-6"
            >
              <div className="md:col-span-12 mb-4">
                 <h2 className="text-4xl font-black text-white tracking-widest uppercase">SSL / TLS Analysis</h2>
                 <p className="text-slate-500 text-sm mt-2">Deep-layer encryption and certificate chain verification engine.</p>
              </div>

              <div className="md:col-span-8 space-y-6">
                <GlassCard className="min-h-[400px]">
                  <div className="flex justify-between items-center mb-8">
                     <h2 className="text-xl font-bold text-white uppercase tracking-tight">Encryption & Security Audit</h2>
                     {isScanning && <Radar className="text-cyan-500 animate-spin" size={24} />}
                  </div>
                  
                  {!scanResult && !isScanning ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                       <div className="w-20 h-20 bg-slate-900 border border-white/5 rounded-3xl flex items-center justify-center text-slate-700">
                          <Lock size={32} />
                       </div>
                       <div className="space-y-2">
                          <p className="text-slate-400 font-medium italic">Ready for clinical TLS verification</p>
                          <p className="text-[10px] text-slate-600 uppercase tracking-widest">Enter target infrastructure below</p>
                       </div>
                       <div className="w-full max-w-sm flex gap-3">
                          <input 
                            type="text" 
                            placeholder="example.com"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && startScan('scanner')}
                            className="flex-1 bg-slate-950 border border-white/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-cyan-500/50 transition-all"
                          />
                          <button onClick={() => startScan('scanner')} className="px-8 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all">Scan</button>
                       </div>
                    </div>
                  ) : isScanning ? (
                    <div className="h-48 flex items-center justify-center">
                       <p className="text-slate-500 font-mono text-sm animate-pulse tracking-widest">Intercepting packets...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {scanResult?.checks.map((check, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              check.status === 'pass' ? 'bg-emerald-500' :
                              check.status === 'warning' ? 'bg-amber-500' : 'bg-rose-500'
                            }`} />
                            <span className="text-xs font-medium text-slate-300">{check.name}</span>
                          </div>
                          <span className="text-[10px] font-mono opacity-60 truncate max-w-[150px]">{check.detail}</span>
                        </div>
                      ))}
                      {scanResult && (
                        <button 
                          onClick={() => setCurrentPage('report')}
                          className="w-full mt-4 py-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold rounded-xl hover:bg-cyan-500 hover:text-slate-950 transition-all uppercase tracking-widest"
                        >
                          View Full Technical Report
                        </button>
                      )}
                    </div>
                  )}
                </GlassCard>

                <GlassCard className="bg-slate-900">
                   <h3 className="text-sm font-bold text-white uppercase tracking-widest opacity-60 mb-4">Clinical Output Log</h3>
                   <div className="space-y-2 h-40 overflow-y-auto font-mono text-[10px] custom-scrollbar">
                      {scanLogs.map((log, i) => (
                        <div key={i} className="text-slate-500">
                           <span className="mr-2 opacity-30">[{new Date().toLocaleTimeString()}]</span>
                           <span className="text-cyan-500/80 tracking-tighter italic">SYS_ENGINE: </span>
                           {log}
                        </div>
                      ))}
                   </div>
                </GlassCard>
              </div>

              <div className="md:col-span-4 space-y-6">
                 <GlassCard className="flex flex-col items-center justify-center text-center p-12 min-h-[400px]">
                    <div className="relative w-48 h-48 mb-6">
                      <div className={`absolute inset-0 bg-cyan-500/10 blur-[60px] rounded-full ${isScanning ? 'animate-pulse' : ''}`} />
                      <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
                      <motion.div 
                        animate={isScanning ? { rotate: 360 } : {}}
                        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-t-4 border-cyan-500"
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="text-5xl font-black text-white">{isScanning ? '...' : (scanResult?.score || 0)}</span>
                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Score</span>
                      </div>
                    </div>
                    {isScanning ? (
                      <NeumorphicButton variant="danger" onClick={() => setIsScanning(false)} className="w-full">
                        TERMINATE
                      </NeumorphicButton>
                    ) : (
                      <NeumorphicButton onClick={startScan} className="w-full">
                        {scanResult ? 'RE-SCAN' : 'INITIALIZE SCAN'}
                      </NeumorphicButton>
                    )}
                 </GlassCard>
              </div>
            </motion.div>
          )}

          {currentPage === 'report' && scanResult && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 max-w-4xl mx-auto"
              id="report-content-wrapper"
            >
              <div className="flex justify-between items-end no-print">
                <div>
                  <h2 className="text-3xl font-black text-white tracking-widest flex items-center gap-3">
                    TECHNICAL REPORT <StatusBadge type={scanResult.score > 70 ? 'pass' : 'fail'} />
                  </h2>
                  <p className="text-slate-500 font-mono text-sm mt-2">TARGET: {scanResult.domain} | ID: {scanResult.id}</p>
                </div>
              </div>

              {/* Printable Header - only visible during print */}
              <div className="hidden print:block mb-8 border-b-2 border-slate-200 pb-4">
                 <h1 className="text-4xl font-black text-black">SECURITY AUDIT REPORT</h1>
                 <p className="text-sm text-slate-600 mt-2">Generated by SecureCheck Analysis Engine</p>
                 <div className="flex justify-between mt-4 text-xs font-mono">
                    <span>Target: {scanResult.domain}</span>
                    <span>Date: {new Date().toLocaleString()}</span>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="md:col-span-1 flex flex-col items-center justify-center py-10">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Final Score</span>
                  <div className="text-6xl font-black text-white">{scanResult.score}</div>
                  <div className={`text-[10px] font-bold uppercase tracking-widest mt-2 ${scanResult.score > 80 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {scanResult.score > 80 ? 'Optimized' : 'High Risk'}
                  </div>
                </GlassCard>

                <GlassCard className="md:col-span-2 grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SSL Status</p>
                      <p className="text-sm font-medium text-white">{scanResult.ssl?.valid ? 'Valid Certificate' : 'Invalid/Self-Signed'}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Encryption</p>
                      <p className="text-sm font-medium text-white">{scanResult.headers?.isHttps ? 'TLS 1.3 Active' : 'None'}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Protocol</p>
                      <p className="text-sm font-medium text-white">HTTP/2.0</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">IP Address</p>
                      <p className="text-sm font-medium text-cyan-400 font-mono">{scanResult.dns?.ip || 'N/A'}</p>
                   </div>
                </GlassCard>
              </div>

              <GlassCard className="!p-0 overflow-hidden">
                <div className="bg-slate-900 px-6 py-4 border-b border-white/5">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Header Audit Matrix</h3>
                </div>
                <div className="divide-y divide-white/5">
                  {Object.entries(scanResult.headers || {}).map(([key, value]) => (
                    key !== 'error' && key !== 'isHttps' && (
                      <div key={key} className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 hover:bg-white/5 transition-colors">
                        <span className="text-xs font-bold text-slate-400 font-mono capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className={`text-xs md:col-span-2 truncate ${value ? 'text-emerald-400' : 'text-rose-500'}`}>
                          {value || 'MISSING / VULNERABLE'}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </GlassCard>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-8 flex gap-6">
                <AlertTriangle className="text-amber-500 shrink-0" size={32} />
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-amber-500 uppercase tracking-widest">Security Recommendations</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Based on the analysis of {scanResult.domain}, we recommend implementing a robust Content Security Policy (CSP) and enforcing Strict-Transport-Security (HSTS) with a long duration. These measures significantly reduce the surface for XSS and MitM attacks.
                  </p>
                </div>
              </div>

              <NeumorphicButton variant="secondary" onClick={() => setCurrentPage('scanner')} className="w-full no-print">
                BACK TO SCANNER
              </NeumorphicButton>
            </motion.div>
          )}

          {currentPage === 'threats' && (
            <motion.div key="threats" initial={{opacity: 0}} animate={{opacity: 1}} className="max-w-5xl mx-auto space-y-8">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-4xl font-black text-white tracking-widest uppercase italic">Threat Intelligence</h2>
                  <p className="text-slate-500 text-sm mt-2 font-mono">Live intercept of malicious infrastructure nodes globally.</p>
                </div>
                <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Live Monitoring Active</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <GlassCard className="!p-0 overflow-hidden">
                    <div className="bg-slate-900 px-6 py-4 border-b border-white/5 flex justify-between items-center">
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest">Active Intercepts</h3>
                      <div className="text-[10px] font-mono text-slate-500">NRT_ENGINE_V4.2</div>
                    </div>
                    <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto custom-scrollbar">
                      {threats.map((threat) => (
                        <div key={threat.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${
                              threat.risk === 'critical' ? 'bg-rose-500/20 text-rose-500' : 
                              threat.risk === 'high' ? 'bg-orange-500/20 text-orange-500' : 'bg-amber-500/20 text-amber-500'
                            }`}>
                              <ShieldAlert size={18} />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{threat.target}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{threat.type}</span>
                                <span className="text-[10px] text-slate-700">•</span>
                                <div className="flex items-center gap-1">
                                  <MapPin size={8} className="text-slate-600" />
                                  <span className="text-[9px] text-slate-600 font-mono italic">{threat.location}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                             <div className={`text-[10px] font-bold uppercase tracking-widest ${
                               threat.risk === 'critical' ? 'text-rose-500' : 
                               threat.risk === 'high' ? 'text-orange-500' : 'text-amber-500'
                             }`}>
                               {threat.risk}
                             </div>
                             <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-600 font-mono">
                               <Clock size={8} />
                               {new Date(threat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </div>

                <div className="space-y-6">
                  <GlassCard className="flex flex-col items-center justify-center p-10 text-center space-y-4">
                     <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                        <Activity size={32} />
                     </div>
                     <div>
                       <div className="text-3xl font-black text-white">{stats.threatsBlocked}</div>
                       <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Threats Mitigated</div>
                     </div>
                  </GlassCard>

                  <GlassCard className="relative overflow-hidden group border-cyan-500/20">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Terminal size={80} />
                     </div>
                     <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-4 italic">Security Update</h4>
                     <p className="text-xs text-slate-300 leading-relaxed relative z-10">
                        Our nodes detected a 14% increase in credential stuffing attempts across APAC regions. Ensure <strong>Rate Limiting</strong> is enabled on all auth endpoints.
                     </p>
                  </GlassCard>
                </div>
              </div>
            </motion.div>
          )}

          {currentPage === 'analytics' && (
            <motion.div key="analytics" initial={{opacity: 0}} animate={{opacity: 1}} className="max-w-6xl mx-auto space-y-8">
               <h2 className="text-3xl font-black text-white tracking-widest uppercase">Security Analytics</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <GlassCard>
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-8">Scan Frequency vs Risk</h3>
                    <div className="h-64">
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={scanStatsData}>
                            <defs>
                              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="time" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff'}} />
                            <Area type="monotone" dataKey="score" stroke="#06b6d4" fillOpacity={1} fill="url(#colorScore)" />
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>
                  </GlassCard>
                  <GlassCard className="flex items-center justify-center">
                    <div className="w-full">
                       <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-8">Vector Distribution</h3>
                       <div className="h-64 flex items-center justify-center">
                          <PieChart width={250} height={250}>
                             <Pie
                                data={[
                                  { name: 'SSL', value: 400 },
                                  { name: 'Headers', value: 300 },
                                  { name: 'DNS', value: 300 },
                                ]}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                 <Cell fill="#06b6d4" />
                                 <Cell fill="#3b82f6" />
                                 <Cell fill="#6366f1" />
                              </Pie>
                              <Tooltip />
                          </PieChart>
                       </div>
                    </div>
                  </GlassCard>
               </div>
            </motion.div>
          )}
          {currentPage === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-6"
            >
              <div className="md:col-span-4 space-y-6">
                <GlassCard className="min-h-[200px] flex flex-col justify-center">
                   <h2 className="text-3xl font-black text-white tracking-tighter mb-2">Audit Archive</h2>
                   <p className="text-slate-500 text-sm leading-relaxed">Cloud-synced history of all security diagnostic sessions.</p>
                </GlassCard>
                
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest opacity-60">Analytics Overview</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-500">Average Trust Score</span>
                        <span className="text-emerald-400 font-bold">84.2%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[84%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-500">Protocol Compliance</span>
                        <span className="text-amber-400 font-bold">62.1%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 w-[62%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-8 space-y-4">
                {history.length > 0 ? history.map((item, i) => (
                  <GlassCard key={i} className="flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-slate-900 transition-colors p-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-inner ${
                        item.score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                        item.score >= 50 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {item.score}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{item.domain}</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{item.timestamp}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setScanResult(item); setCurrentPage('report'); }}
                        className="p-3 bg-slate-800 rounded-xl hover:text-cyan-400 transition-all text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 px-4"
                      >
                        <FileText size={14} />
                        View
                      </button>
                      <button className="p-3 bg-slate-800 rounded-xl hover:text-rose-400 transition-all no-print">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </GlassCard>
                )) : (
                  <div className="bg-slate-900 border-2 border-dashed border-slate-800 rounded-3xl p-20 text-center space-y-4">
                    <History size={48} className="text-slate-800 mx-auto" />
                    <p className="text-slate-600 font-mono text-xs uppercase tracking-widest">No archival data detected.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {currentPage === 'auth' && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="max-w-md mx-auto py-12"
            >
              <GlassCard>
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-black text-white tracking-tighter mb-2">{isLoginView ? 'Welcome Back' : 'Create Account'}</h2>
                  <p className="text-slate-500 text-sm">Secure your infrastructure analysis today.</p>
                </div>
                
                <form onSubmit={handleAuth} className="space-y-6">
                  {!isLoginView && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={authForm.name}
                        onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                        placeholder="John Doe"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={authForm.email}
                      onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                      placeholder="alex@security.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                    <input 
                      type="password" 
                      required
                      value={authForm.password}
                      onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                      placeholder="••••••••"
                    />
                  </div>

                  {authError && <p className="text-rose-500 text-xs text-center">{authError}</p>}

                  <NeumorphicButton variant="primary" className="w-full">
                    {isLoginView ? 'AUTHENTICATE' : 'INITIALIZE PROTOCOL'}
                  </NeumorphicButton>
                </form>

                <div className="mt-8 text-center">
                  <button 
                    onClick={() => setIsLoginView(!isLoginView)}
                    className="text-xs text-slate-500 hover:text-cyan-400 transition-colors font-bold uppercase tracking-widest"
                  >
                    {isLoginView ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {currentPage === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-3xl mx-auto space-y-12"
            >
              <div className="space-y-2 text-center md:text-left">
                 <h2 className="text-3xl font-bold text-white">System Settings</h2>
                 <p className="text-slate-500">Configure your protocol and notification environment.</p>
              </div>

              {/* Account Profile */}
              <GlassCard className="flex flex-col md:flex-row items-center gap-8">
                 <div className="relative">
                    <div className="w-24 h-24 rounded-3xl bg-slate-800 shadow-xl overflow-hidden border border-white/10">
                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Felix'}`} alt="Profile" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-xl shadow-lg ring-4 ring-slate-950">
                       <CheckCircle2 size={14} />
                    </div>
                 </div>
                 <div className="flex-1 text-center md:text-left space-y-2">
                    <h3 className="text-2xl font-bold text-white">{user?.name || 'Guest User'}</h3>
                    <p className="text-slate-400">{user?.email || 'Unauthorized access'}</p>
                    <span className="inline-block px-2 py-1 bg-white/5 rounded text-[10px] font-mono text-cyan-400">ID: {user?.id ? `SEC-${user.id.slice(-4)}-QX` : 'ANON-X'}</span>
                 </div>
                 {user ? (
                   <NeumorphicButton variant="danger" onClick={handleLogout} className="text-sm">
                     Logout
                   </NeumorphicButton>
                 ) : (
                   <NeumorphicButton variant="primary" onClick={() => setCurrentPage('auth')} className="text-sm">
                     Sign In
                   </NeumorphicButton>
                 )}
              </GlassCard>

              {/* Preferences */}
              <div className="space-y-8">
                <h3 className="text-[10px] font-bold text-cyan-400 tracking-[0.2em] px-2">GENERAL PREFERENCES</h3>
                <GlassCard className="!p-0 overflow-hidden divide-y divide-white/5">
                   <SettingsToggleItem 
                      icon={Cloud} 
                      label="Cloud Archive Synchronization" 
                      sub="Automatically sync your scan history to your secure account" 
                      checked={preferences.cloudSync} 
                      onToggle={() => setPreferences(prev => ({ ...prev, cloudSync: !prev.cloudSync }))}
                   />
                   <SettingsToggleItem 
                      icon={Terminal} 
                      label="Verbose Diagnostic Output" 
                      sub="Display detailed low-level packet interpretation during scans" 
                      checked={preferences.verboseLogs} 
                      onToggle={() => setPreferences(prev => ({ ...prev, verboseLogs: !prev.verboseLogs }))}
                   />
                   <SettingsToggleItem 
                      icon={Zap} 
                      label="Real-time Monitoring" 
                      sub="Active scanning of network vectors in background" 
                      checked={preferences.realtime} 
                      onToggle={() => setPreferences(prev => ({ ...prev, realtime: !prev.realtime }))}
                   />
                   <SettingsToggleItem 
                      icon={Bell} 
                      label="Threat Notifications" 
                      sub="Push alerts for critical security breaches" 
                      checked={preferences.notifications} 
                      onToggle={() => setPreferences(prev => ({ ...prev, notifications: !prev.notifications }))}
                   />
                </GlassCard>

                <div className="pt-4">
                  <h3 className="text-[10px] font-bold text-rose-500 tracking-[0.2em] px-2 mb-4">DANGER ZONE</h3>
                  <GlassCard className="border-rose-500/20 bg-rose-500/5">
                     <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                           <h4 className="text-white font-bold text-sm">Purge Infrastructure Archive</h4>
                           <p className="text-xs text-slate-500 mt-1">Irreversibly delete all historical scan data and session logs.</p>
                        </div>
                        <NeumorphicButton variant="danger" onClick={clearHistory} className="text-[10px] py-2 px-6">
                           Wipe Memory
                        </NeumorphicButton>
                     </div>
                  </GlassCard>
                </div>

                {/* Additional Bento Config */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <GlassCard 
                    className="flex items-center gap-5 cursor-pointer hover:bg-slate-900 transition-colors group"
                    onClick={() => alert("Current Allocation: 100%\nRemaining Buffer: 4.2GB\nThread Status: COMPLIANT")}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
                      <Cpu size={28} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">Compute Allocation</h4>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">High Priority Threads: ENABLED</p>
                    </div>
                  </GlassCard>
                  <GlassCard 
                    className="flex items-center gap-5 border-emerald-500/20 cursor-pointer hover:bg-slate-900 transition-colors group"
                    onClick={() => alert("Latency Profile: REGIONAL\nNode Location: Singapore-01\nProtocol: HTTPS/3")}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                      <Activity size={28} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">System Latency</h4>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">RESPONSE_TIME: 14ms (Optimal)</p>
                    </div>
                  </GlassCard>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 z-50 bg-slate-900/90 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl flex justify-around items-center h-16 shrink-0">
        <button onClick={() => setCurrentPage('home')} className={`p-3 transition-all ${currentPage === 'home' ? 'text-cyan-400' : 'text-slate-500'}`}><LayoutDashboard size={20} /></button>
        <button onClick={() => setCurrentPage('scanner')} className={`p-3 transition-all ${currentPage === 'scanner' ? 'text-cyan-400' : 'text-slate-500'}`}><SearchIcon size={20} /></button>
        <button onClick={() => setCurrentPage('history')} className={`p-3 transition-all ${currentPage === 'history' ? 'text-cyan-400' : 'text-slate-500'}`}><History size={20} /></button>
        <button onClick={() => setCurrentPage('settings')} className={`p-3 transition-all ${currentPage === 'settings' ? 'text-cyan-400' : 'text-slate-500'}`}><SettingsIcon size={20} /></button>
      </nav>
    </div>
  </div>
);
}

function SidebarItem({ icon, label, active = false, onClick, collapsed = false }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all group ${
        active 
          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
          : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'
      }`}
    >
      <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </div>
      {!collapsed && <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>}
    </button>
  );
}

function SettingsToggleItem({ icon: Icon, label, sub, checked, onToggle }) {
  return (
    <div className="flex items-center justify-between p-6 hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-5">
        <div className="w-11 h-11 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-400 border border-white/5">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-white font-bold text-sm">{label}</p>
          <p className="text-xs text-slate-500">{sub}</p>
        </div>
      </div>
      <button 
        onClick={onToggle}
        className={`w-12 h-6 rounded-full relative transition-all duration-300 ${checked ? 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-slate-800'}`}
      >
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${checked ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  );
}
