import React from 'react';
import { NavLink, Navigate } from 'react-router-dom';
import { AnimatedOutlet } from './AnimatedOutlet';
import { useAuth } from '../../context/AuthContext';
import { AppHeader } from './AppHeader';
import {
  LayoutDashboard,
  ClipboardList,
  Sparkles,
  Handshake,
  Scale,
  Truck,
} from 'lucide-react';

export const BuyerLayout: React.FC = () => {
  const { role, isAuthenticated } = useAuth();

  // Route guard: only BUYER can access
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role !== 'BUYER') {
    const target = role === 'FARMER' ? '/farmer' : '/fpo';
    return <Navigate to={target} replace />;
  }

  const navItems = [
    { to: '/buyer', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/buyer/procurement', label: 'Procurement Demands', icon: ClipboardList },
    { to: '/buyer/matches', label: 'Farm-Direct Matches', icon: Sparkles },
    { to: '/buyer/deals', label: 'Active Contracts', icon: Handshake },
    { to: '/buyer/disputes', label: 'Disputes', icon: Scale },
    { to: '/buyer/logistics', label: 'Logistics & Delivery', icon: Truck },
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
