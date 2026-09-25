import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Sprout,
  LogOut,
  Building,
  UserCheck,
  ShoppingBag,
} from 'lucide-react';

export const AppHeader: React.FC = () => {
  const { user, role, signOut } = useAuth();

  const getRoleBadge = () => {
    switch (role) {
      case 'FARMER':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#6A994E]/10 text-[#6A994E] border border-[#6A994E]/30">
            <UserCheck className="w-3 h-3 text-[#6A994E]" />
            <span>Farmer</span>
          </span>
        );
      case 'FPO':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#386641]/15 text-[#386641] border border-[#386641]/30">
            <Building className="w-3 h-3 text-[#386641]" />
            <span>FPO / Collective</span>
          </span>
        );
      case 'BUYER':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F2E8CF] text-[#0d0a0b] border border-[#454955]/20">
            <ShoppingBag className="w-3 h-3 text-[#454955]" />
            <span>Institutional Buyer</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <header className="bg-white border-b border-[#454955]/20 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand Identity */}
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-[#386641] text-white flex items-center justify-center shadow-xs">
                <Sprout className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-[#0d0a0b] tracking-tight text-base">
                    AgriMarket Intelligence
                  </span>
                  {getRoleBadge()}
                </div>
                <p className="text-[11px] text-[#454955] hidden sm:block">
                  {user?.organization_name || user?.location || 'Precision Agricultural Market Access Platform'}
                </p>
              </div>
            </div>

            {/* Right: User Profile & Logout */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* User Profile Summary */}
              <div className="flex items-center space-x-2 pl-2 border-l border-[#454955]/20 text-xs">
                <div className="text-right hidden sm:block">
                  <div className="font-semibold text-[#0d0a0b]">{user?.name}</div>
                  <div className="text-[10px] text-[#454955]">{user?.email}</div>
                </div>

                <button
                  onClick={signOut}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-[#454955] hover:text-red-700 hover:bg-red-50 transition cursor-pointer flex items-center space-x-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
