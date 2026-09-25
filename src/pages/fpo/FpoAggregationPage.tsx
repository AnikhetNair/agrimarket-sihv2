import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { User, ProduceLot } from '../../types/domain';
import { FPOAggregationView } from '../../components/FPOAggregationView';

export const FpoAggregationPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

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

  const handleLotCreated = (_newLot: ProduceLot) => {
    // New pooled lot created
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <h1 className="text-xl font-bold text-[#0d0a0b] tracking-tight">
          {t('fpo.aggregationTitle', 'Produce Aggregation & Lot Pooling')}
        </h1>
        <p className="text-xs text-[#454955] mt-0.5">
          {t('fpo.aggregationSubtitle', 'Merge smallholder farmer lots into high-volume institutional grade batches')}
        </p>
      </div>

      <FPOAggregationView activeUser={domainUser} onLotCreated={handleLotCreated} />
    </div>
  );
};
