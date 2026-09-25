import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { MapPin, CheckCircle2, Phone, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FpoMembersPage: React.FC = () => {
  const { t } = useLanguage();
  const members = [
    {
      id: 'usr-farmer-1',
      name: 'Ramesh Patil',
      village: 'Dindori, Nashik',
      landholding: '3.5 Acres',
      commodity: 'Carrot (Kuroda Hybrid)',
      harvestStatus: 'Harvested Yesterday',
      availableQty: 30,
      grade: 'Grade A',
      phone: '+91 98220 33412',
      pooledIn: 'POOL-MH-CAR-0926',
    },
    {
      id: 'usr-farmer-2',
      name: 'Suresh Gaikwad',
      village: 'Niphad, Nashik',
      landholding: '4.2 Acres',
      commodity: 'Carrot (Kuroda Hybrid)',
      harvestStatus: 'Harvesting Today',
      availableQty: 20,
      grade: 'Grade A',
      phone: '+91 98220 44556',
      pooledIn: 'POOL-MH-CAR-0926',
    },
    {
      id: 'usr-farmer-3',
      name: 'Anand Shinde',
      village: 'Lasalgaon, Nashik',
      landholding: '5.0 Acres',
      commodity: 'Carrot (Kuroda Hybrid)',
      harvestStatus: 'Ready in 24 Hours',
      availableQty: 25,
      grade: 'Grade A',
      phone: '+91 98220 66778',
      pooledIn: 'POOL-MH-CAR-0926',
    },
    {
      id: 'usr-farmer-4',
      name: 'Baburao Kadam',
      village: 'Chandwad, Nashik',
      landholding: '2.8 Acres',
      commodity: 'Mango (Alphonso / Kesar)',
      harvestStatus: 'Curing in Storage',
      availableQty: 45,
      grade: 'Grade B',
      phone: '+91 98220 77889',
      pooledIn: null,
    },
    {
      id: 'usr-farmer-5',
      name: 'Eknath Jadhav',
      village: 'Sinnar, Nashik',
      landholding: '3.0 Acres',
      commodity: 'Banana (Grand Naine)',
      harvestStatus: 'Threshed & Bagged',
      availableQty: 35,
      grade: 'Grade A',
      phone: '+91 98220 99001',
      pooledIn: null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0d0a0b] tracking-tight">
            {t('fpo.membersTitle', 'FPO Farmer Member Directory')}
          </h1>
          <p className="text-xs text-[#454955] mt-0.5">
            {t('fpo.membersSubtitle', 'Manage affiliated smallholder farmers, farm acreage, and harvest schedules')}
          </p>
        </div>

        <Link
          to="/fpo/aggregation"
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#386641] hover:bg-[#2d5535] text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer self-start sm:self-auto"
        >
          <Layers className="w-4 h-4 text-white" />
          <span>{t('fpo.aggregateProduce', 'Aggregate Member Produce')}</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[#454955] uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Farmer Member</th>
                <th className="py-2.5 px-3">Village Cluster</th>
                <th className="py-2.5 px-3">Crop Variety</th>
                <th className="py-2.5 px-3">Harvest Readiness</th>
                <th className="py-2.5 px-3 text-right">Available Qty</th>
                <th className="py-2.5 px-3">Grade</th>
                <th className="py-2.5 px-3">Pooling Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-[#F2E8CF]/60 transition">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-[#0d0a0b]">{m.name}</div>
                    <div className="text-[10px] text-[#454955] flex items-center space-x-1">
                      <Phone className="w-2.5 h-2.5" />
                      <span>{m.phone}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-[#454955]">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-[#454955]" />
                      <span>{m.village}</span>
                    </div>
                    <div className="text-[10px] text-[#454955]">{m.landholding}</div>
                  </td>
                  <td className="py-3 px-3 font-medium text-[#0d0a0b]">{m.commodity}</td>
                  <td className="py-3 px-3 text-[#454955]">{m.harvestStatus}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-[#0d0a0b]">
                    {m.availableQty} Q
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-[#6A994E]/15 text-[#386641] border border-[#6A994E]/30">
                      {m.grade}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {m.pooledIn ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#6A994E]/15 text-[#386641] border border-[#6A994E]/30">
                        <CheckCircle2 className="w-2.5 h-2.5 text-[#386641]" />
                        <span>{m.pooledIn}</span>
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-[#F2E8CF] text-[#454955] border border-slate-200">
                        Available for Pooling
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
