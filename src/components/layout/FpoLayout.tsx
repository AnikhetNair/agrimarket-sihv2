import React from 'react';
import { NavLink, Navigate } from 'react-router-dom';
import { AnimatedOutlet } from './AnimatedOutlet';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { AppHeader } from './AppHeader';
import {
  LayoutDashboard,
  Users,
  Layers,
  Boxes,
  BarChart3,
  Scale,
} from 'lucide-react';

export const FpoLayout: React.FC = () => {
  const { role, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  // Route guard: only FPO can access
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role !== 'FPO') {
    const target = role === 'FARMER' ? '/farmer' : '/buyer';
    return <Navigate to={target} replace />;
  }

  const navItems = [
    { to: '/fpo', label: t('nav.overview', 'Overview'), icon: LayoutDashboard, end: true },
    { to: '/fpo/members', label: t('nav.memberDirectory', 'Member Directory'), icon: Users },
    { to: '/fpo/aggregation', label: t('nav.lotAggregation', 'Lot Aggregation'), icon: Layers },
    { to: '/fpo/lots', label: t('nav.pooledLots', 'Pooled Lots'), icon: Boxes },
    { to: '/fpo/analytics', label: t('nav.settlementAudit', 'Settlement & Audit'), icon: BarChart3 },
    { to: '/fpo/disputes', label: t('nav.disputesArbitration', 'Disputes & Arbitration'), icon: Scale },
  ];

  return (
    <div className="min-h-screen bg-[#F2E8CF] flex flex-col font-sans text-[#0d0a0b]">
      <AppHeader />

      {/* Role Navigation Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      isActive
                        ? 'bg-[#6A994E]/15 text-[#386641] border border-[#6A994E]/35 shadow-2xs'
                        : 'text-[#454955] hover:text-[#0d0a0b] hover:bg-[#F2E8CF]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatedOutlet />
      </main>
    </div>
  );
};
