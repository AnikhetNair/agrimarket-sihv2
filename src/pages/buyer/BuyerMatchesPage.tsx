import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../services/dataStore';
import { User, ProduceLot, BuyerRequirement } from '../../types/domain';
import { BuyerMatchingView } from '../../components/BuyerMatchingView';
import { useNavigate } from 'react-router-dom';

export const BuyerMatchesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const lots = dataStore.getLots();
  const [selectedLot, setSelectedLot] = useState<ProduceLot>(lots[0]);

  const handleInitiateDeal = (_lot: ProduceLot, _req: BuyerRequirement) => {
    navigate('/buyer/deals');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <h1 className="text-xl font-bold text-[#0d0a0b] tracking-tight">
          Match Explorer & Compatibility Scorecard
        </h1>
        <p className="text-xs text-[#454955] mt-0.5">
          Transparent algorithmic matching across quality specs, volume tolerance, and transport proximity
        </p>
      </div>

      <BuyerMatchingView
        activeUser={domainUser}
        selectedLot={selectedLot}
        onSelectLot={(lot) => setSelectedLot(lot)}
        onInitiateDeal={handleInitiateDeal}
      />
    </div>
  );
};
