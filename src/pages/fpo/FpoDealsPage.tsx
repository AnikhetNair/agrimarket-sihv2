import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../services/dataStore';
import { User } from '../../types/domain';
import { NegotiationAndDealView } from '../../components/NegotiationAndDealView';

export const FpoDealsPage: React.FC = () => {
  const { user } = useAuth();

  const domainUser: User = {
    id: user?.id || 'usr-fpo-1',
    name: user?.name || 'Vikram Deshmukh',
    role: 'FPO_MEMBER',
    phone_demo: user?.phone || '+91 98220 11223',
    location: user?.location || 'Pimpalgaon, Nashik',
    district: user?.district || 'Nashik',
    state: user?.state || 'Maharashtra',
    created_at: new Date().toISOString(),
  };

  const allLots = dataStore.getLots();
  const pooledLot = allLots.find((l) => l.is_pooled) || allLots[0];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#454955]/20 p-5 shadow-2xs">
        <h1 className="text-xl font-bold text-[#0d0a0b] tracking-tight">
          Collective Contract Negotiation Desk
        </h1>
        <p className="text-xs text-[#454955] mt-0.5">
          Represent aggregated member volume in institutional negotiations with binding tripartite legal contracts
        </p>
      </div>

      <NegotiationAndDealView activeUser={domainUser} selectedLot={pooledLot} />
    </div>
  );
};
