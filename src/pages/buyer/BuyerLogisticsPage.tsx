import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { User } from '../../types/domain';
import { LogisticsAndSettlementView } from '../../components/LogisticsAndSettlementView';

export const BuyerLogisticsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const domainUser: User = {
    id: user?.id || 'usr-buyer-1',
    name: user?.name || 'Arjun Mehta',
    role: 'BUYER',
    phone_demo: user?.phone || '+91 98200 44551',
    location: user?.location || 'Pune Distribution Hub',
    district: user?.district || 'Pune',
    state: user?.state || 'Maharashtra',
    created_at: new Date().toISOString(),
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <h1 className="text-xl font-bold text-[#0d0a0b] tracking-tight">
          {t('buyer.logisticsTitle', 'Logistics & Delivery Tracking')}
        </h1>
        <p className="text-xs text-[#454955] mt-0.5">
          {t('buyer.logisticsSubtitle', 'Track produce dispatches, truck allocation, and warehouse delivery receipts')}
        </p>
      </div>

      <LogisticsAndSettlementView activeUser={domainUser} />
    </div>
  );
};
