import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ShieldCheck,
  RotateCcw,
  Bell,
  FileText,
  Bot,
  UserCheck,
  ChevronDown,
} from 'lucide-react';
import { User } from '../types/domain';
import { dataStore } from '../services/dataStore';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  activeUser: User;
  onUserChange: (userId: string) => void;
  onOpenVerification?: () => void;
  onOpenAssistant: () => void;
  onOpenAuditLogs: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onResetGolden: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeUser,
  onUserChange,
  onOpenVerification,
  onOpenAssistant,
  onOpenAuditLogs,
  activeTab,
  onTabChange,
  onResetGolden,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const alerts = dataStore.getAlerts().filter((a) => !a.read);

  const getDashboardPath = () => {
    if (activeUser.role === 'FARMER') return '/farmer';
    if (activeUser.role === 'FPO_MEMBER' || (activeUser.role as any) === 'FPO') return '/fpo';
    if (activeUser.role === 'BUYER') return '/buyer';
    return '/farmer';
  };

  const demoIdentities = [
    { id: 'usr-farmer-1', name: 'Ramesh Patil', role: 'FARMER', label: 'Farmer (Nashik - Carrot Grower)' },
    { id: 'usr-fpo-1', name: 'Vikram Deshmukh', role: 'FPO_MEMBER', label: 'FPO Lead (Sahyadri Producer Co)' },
    { id: 'usr-buyer-1', name: 'Arjun Mehta', role: 'BUYER', label: 'Institutional Buyer (FreshKart Foods)' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      {/* Top Utility Strip */}
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between text-xs border-b border-slate-800/60 text-slate-400">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1 font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>MANDI TERMINAL LIVE</span>
          </span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline">SIH 2026 Digital Market Infrastructure</span>
          <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-700/50">
            DEMO_MODE=true
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Language selector */}
          <div className="flex items-center space-x-1 bg-slate-800 rounded px-1 py-0.5 text-[11px]">
            <button
              onClick={() => setLanguage('en')}
              className={`px-1.5 py-0.5 rounded font-medium transition cursor-pointer ${language === 'en' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400'}`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-1.5 py-0.5 rounded font-medium transition cursor-pointer ${language === 'hi' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400'}`}
            >
              हिंदी
            </button>
            <button
              onClick={() => setLanguage('mr')}
              className={`px-1.5 py-0.5 rounded font-medium transition cursor-pointer ${language === 'mr' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400'}`}
            >
              मराठी
            </button>
          </div>

          <button
            onClick={onOpenAuditLogs}
            className="flex items-center space-x-1 hover:text-slate-200 transition text-slate-400 cursor-pointer"
            title="System Audit & State Machine Logs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Audit Logs</span>
          </button>
        </div>
      </div>

      {/* Main App Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div
            className="flex items-center space-x-2.5 cursor-pointer hover:opacity-90 transition"
            onClick={() => navigate(getDashboardPath())}
            title={t('header.goToDashboard', 'Go to Dashboard')}
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-inner">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-base tracking-tight text-white flex items-center space-x-1.5">
                <span>AGRIMARKET</span>
                <span className="text-[11px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  v2.6
                </span>
              </div>
              <div className="text-[11px] text-slate-400 leading-none">Decision & Transaction Terminal</div>
            </div>
          </div>

          {/* Primary Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1 text-sm font-medium">
            <button
              onClick={() => onTabChange('market')}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTab === 'market' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              Market Intelligence
            </button>
            <button
              onClick={() => onTabChange('lots')}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTab === 'lots' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              Produce Lots
            </button>
            <button
              onClick={() => onTabChange('matching')}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTab === 'matching' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              Buyer Demand & Matching
            </button>
            <button
              onClick={() => onTabChange('deals')}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTab === 'deals' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              Deals & Timeline
            </button>
            <button
              onClick={() => onTabChange('logistics')}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTab === 'logistics' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              Logistics & Settlement
            </button>
            <button
              onClick={() => onTabChange('fpo')}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTab === 'fpo' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              FPO Aggregation
            </button>
            <button
              onClick={() => onTabChange('trust')}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTab === 'trust' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              Trust & Reputation
            </button>
          </nav>
        </div>

        {/* Action Controls & Demo Switcher */}
        <div className="flex items-center space-x-2.5">
          {/* Golden Deal Fast-Reset Button */}
          <button
            onClick={onResetGolden}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-600/40 transition"
            title="Reset to Golden Transaction (LOT #NK-TOM-0926)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-mono">Golden Demo</span>
          </button>

          {/* AI Assistant Button */}
          <button
            onClick={onOpenAssistant}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
          >
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">Agri Assistant</span>
          </button>

          {/* Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center space-x-2 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-xs transition"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <div className="text-left hidden md:block">
                <div className="font-semibold text-slate-100">{activeUser.name}</div>
                <div className="text-[10px] text-slate-400 uppercase font-mono">{activeUser.role}</div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-2 z-50">
                <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider font-mono">
                  Switch Demo Persona
                </div>
                <div className="divide-y divide-slate-700/50 mt-1">
                  {demoIdentities.map((identity) => (
                    <button
                      key={identity.id}
                      onClick={() => {
                        onUserChange(identity.id);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-md text-xs transition flex flex-col ${
                        activeUser.id === identity.id ? 'bg-emerald-950 text-emerald-300 font-semibold' : 'hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{identity.name}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-900">
                          {identity.role}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-0.5">{identity.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden border-t border-slate-800 bg-slate-900/95 overflow-x-auto px-2 py-1.5 flex items-center space-x-1 scrollbar-none text-xs">
        {[
          { id: 'market', label: 'Market' },
          { id: 'lots', label: 'Lots' },
          { id: 'matching', label: 'Matching' },
          { id: 'deals', label: 'Deals' },
          { id: 'logistics', label: 'Logistics' },
          { id: 'fpo', label: 'FPO' },
          { id: 'trust', label: 'Trust' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`px-2.5 py-1 rounded whitespace-nowrap transition font-medium ${
              activeTab === t.id ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </header>
  );
};
