import React from 'react';
import {
  Bell,
  TrendingUp,
  CloudRain,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const FarmerAlertsPage: React.FC = () => {
  const alerts = [
    {
      id: 'alt-1',
      type: 'PRICE_SURGE',
      title: 'Mandi Price Surge: Carrot Vashi APMC (Navi Mumbai)',
      desc: 'Arrivals dropped by 32% today. Modal rates surged to ₹3,150/Q (+₹180 vs yesterday). Higher net realization available for refrigerated loads.',
      time: '2 hours ago',
      severity: 'HIGH',
      icon: TrendingUp,
      actionUrl: '/farmer/market',
      actionText: 'Check Mandi Comparison',
    },
    {
      id: 'alt-2',
      type: 'WEATHER',
      title: 'Monsoon Rain Advisory: Nashik North Corridor',
      desc: 'IMD forecasts heavy scattered showers across Dindori and Niphad over the next 48 hours. Ensure harvested produce is stored under ventilated waterproof sheds or cold chain.',
      time: '5 hours ago',
      severity: 'MEDIUM',
      icon: CloudRain,
      actionUrl: '/farmer/lots',
      actionText: 'View Storage Status',
    },
    {
      id: 'alt-3',
      type: 'BUYER_DEMAND',
      title: 'Institutional Demand Spike: Grade A Kuroda Carrots',
      desc: 'FreshKart Foods India posted 3 new bulk procurement requirements for processing-grade carrots at target price ₹3,100/Q with farm-gate pickup options.',
      time: '1 day ago',
      severity: 'INFO',
      icon: Bell,
      actionUrl: '/farmer/deals',
      actionText: 'View Matching Deals',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <h1 className="text-xl font-bold text-[#0d0a0b] tracking-tight">
          Real-Time Farmgate Alerts & Market Advisory
        </h1>
        <p className="text-xs text-[#454955] mt-0.5">
          Automated threshold notifications, weather warnings, and direct buyer demand spikes
        </p>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => {
          const Icon = alert.icon;
          return (
            <div
              key={alert.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:border-[#386641] transition"
            >
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[#6A994E]/15 text-[#386641] border border-[#6A994E]/30">
                  <Icon className="w-5 h-5 text-[#386641]" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-[#0d0a0b]">{alert.title}</h3>
                    <span className="text-[10px] text-[#454955]">• {alert.time}</span>
                  </div>
                  <p className="text-xs text-[#454955] mt-1">{alert.desc}</p>
                </div>
              </div>

              <Link
                to={alert.actionUrl}
                className="inline-flex items-center space-x-1 text-xs font-semibold text-[#386641] hover:text-[#2d5535] self-end sm:self-center shrink-0"
              >
                <span>{alert.actionText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};
