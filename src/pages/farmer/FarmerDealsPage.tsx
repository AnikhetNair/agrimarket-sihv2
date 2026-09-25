import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { dataStore } from '../../services/dataStore';
import { User } from '../../types/domain';
import { NegotiationAndDealView } from '../../components/NegotiationAndDealView';
import { GOLDEN_LOT_NUMBER } from '../../data/seedLotsAndRequirements';

export const FarmerDealsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const domainUser: User = {
    id: user?.id || 'usr-farmer-1',
    name: user?.name || 'Ramesh Patil',
    role: 'FARMER',
    phone_demo: user?.phone || '+91 98220 33412',
    location: user?.location || 'Dindori, Nashik',
    district: user?.district || 'Nashik',
    state: user?.state || 'Maharashtra',
    created_at: new Date().toISOString(),
  };

  const lots = dataStore.getLots();
  const targetLot = lots.find((l) => l.lot_number === GOLDEN_LOT_NUMBER) || lots[0];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#454955]/20 p-5 shadow-2xs">
        <h1 className="text-xl font-bold text-[#0d0a0b] tracking-tight">
          {t('farmer.dealsTitle', 'Farmer Deals & Contracts')}
        </h1>
        <p className="text-xs text-[#454955] mt-0.5">
          {t('farmer.dealsSubtitle', 'Live contract negotiations, escrow milestones, and dispatch commitments')}
        </p>
      </div>

      <NegotiationAndDealView activeUser={domainUser} selectedLot={targetLot} />
    </div>
  );
};
