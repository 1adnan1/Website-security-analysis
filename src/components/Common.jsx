/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";

export function GlassCard({ children, className = "", delay = 0, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className={`relative overflow-hidden bg-slate-900/50 border border-slate-800 rounded-3xl p-8 ${className}`}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      {children}
    </motion.div>
  );
}

export function StatusBadge({ type }) {
  const configs = {
    pass: { label: 'PASSED', color: 'bg-emerald-500/10 text-emerald-400' },
    warning: { label: 'WARNINGS', color: 'bg-amber-500/10 text-amber-400' },
    fail: { label: 'RISKY', color: 'bg-rose-500/10 text-rose-400' },
    risky: { label: 'CRITICAL', color: 'bg-rose-600/20 text-rose-400' },
  };
  
  const config = configs[type] || configs.pass;
  
  return (
    <span className={`${config.color} text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider`}>
      {config.label}
    </span>
  );
}

export function NeumorphicButton({ 
  children, 
  onClick, 
  className = "", 
  variant = 'primary' 
}) {
  const variants = {
    primary: "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20",
    secondary: "bg-slate-800 text-slate-300 hover:text-white border border-slate-700",
    danger: "bg-rose-600 text-white shadow-lg shadow-rose-600/20 hover:bg-rose-500",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`px-6 py-3 rounded-full font-bold text-xs transition-all tracking-widest ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}
