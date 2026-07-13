'use client';

import React, { useState } from 'react';

interface StageData {
  stage: string;
  count: number;
  value: number;
}

interface DashboardChartsProps {
  stageSummary: StageData[];
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ stageSummary }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Maximum value for bar chart scaling
  const maxValue = Math.max(...stageSummary.map((s) => s.value), 1000);

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Color mapping for stages
  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'LEAD':
        return { fill: 'url(#gradient-lead)', border: '#6366f1' };
      case 'QUALIFIED':
        return { fill: 'url(#gradient-qualified)', border: '#06b6d4' };
      case 'PROPOSAL':
        return { fill: 'url(#gradient-proposal)', border: '#3b82f6' };
      case 'NEGOTIATION':
        return { fill: 'url(#gradient-negotiation)', border: '#a855f7' };
      case 'WON':
        return { fill: 'url(#gradient-won)', border: '#10b981' };
      case 'LOST':
        return { fill: 'url(#gradient-lost)', border: '#f43f5e' };
      default:
        return { fill: '#64748b', border: '#475569' };
    }
  };

  // Calculate Donut properties for Closed Won vs Lost
  const wonData = stageSummary.find((s) => s.stage === 'WON') || { count: 0, value: 0 };
  const lostData = stageSummary.find((s) => s.stage === 'LOST') || { count: 0, value: 0 };
  const totalClosed = wonData.value + lostData.value;
  
  const wonPercent = totalClosed > 0 ? (wonData.value / totalClosed) * 100 : 0;
  const lostPercent = totalClosed > 0 ? (lostData.value / totalClosed) * 100 : 0;

  // Donut SVG parameters
  const radius = 50;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const wonDashOffset = circumference - (wonPercent / 100) * circumference;
  const lostDashOffset = circumference - (lostPercent / 100) * circumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Pipeline Stage Value Chart (Pure SVG Bar Chart) */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Deal Value by Stage</h3>
          <p className="text-xs text-slate-400 mt-1">Total outstanding pipeline value distributed across active stages.</p>
        </div>

        <div className="mt-6 relative h-[220px]">
          <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
            {/* SVG Gradients definitions */}
            <defs>
              <linearGradient id="gradient-lead" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="gradient-qualified" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#0891b2" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="gradient-proposal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="gradient-negotiation" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c084fc" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#9333ea" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="gradient-won" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="gradient-lost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f87171" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#dc2626" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            <line x1="40" y1="20" x2="480" y2="20" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="40" y1="70" x2="480" y2="70" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="40" y1="120" x2="480" y2="120" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="40" y1="170" x2="480" y2="170" stroke="#334155" strokeWidth="1.5" />

            {/* Bars */}
            {stageSummary.map((item, index) => {
              const barWidth = 48;
              const spacing = 72;
              const x = 50 + index * spacing;
              const barHeight = (item.value / maxValue) * 140; // Max height 140px
              const y = 170 - barHeight;
              const colorInfo = getStageColor(item.stage);

              return (
                <g key={item.stage}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={colorInfo.fill}
                    stroke={colorInfo.border}
                    strokeWidth="1.5"
                    rx="4"
                    className="transition-all duration-300 cursor-pointer"
                    style={{
                      transformOrigin: `${x + barWidth / 2}px 170px`,
                      transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)',
                    }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                  {/* Values text on top of bars when hovered */}
                  <text
                    x={x + barWidth / 2}
                    y={y - 8}
                    textAnchor="middle"
                    fill="#e2e8f0"
                    fontSize="9.5"
                    className={`font-semibold transition-opacity duration-200 ${
                      hoveredIndex === index ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {formatCurrency(item.value)}
                  </text>
                  {/* X-axis labels */}
                  <text
                    x={x + barWidth / 2}
                    y="185"
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9"
                    fontWeight="500"
                  >
                    {item.stage}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 2. Win / Loss Comparison (Pure SVG Circular Gauge / Donut) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Closed Conversion</h3>
          <p className="text-xs text-slate-400 mt-1">Comparison of closed-won deals against closed-lost deals.</p>
        </div>

        <div className="flex flex-col items-center justify-center py-4">
          {totalClosed > 0 ? (
            <div className="relative flex items-center justify-center">
              <svg className="w-36 h-36 transform -rotate-90">
                {/* Background Track */}
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  fill="transparent"
                  stroke="#1e293b"
                  strokeWidth={strokeWidth}
                />
                {/* Lost Segment */}
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  fill="transparent"
                  stroke="#f43f5e"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={0}
                  strokeLinecap="round"
                />
                {/* Won Segment */}
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={wonDashOffset}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              {/* Central Text overlay */}
              <div className="absolute flex flex-col items-center text-center">
                <span className="text-2xl font-bold text-white font-mono">
                  {Math.round(wonPercent)}%
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Win Rate
                </span>
              </div>
            </div>
          ) : (
            <div className="h-36 flex items-center justify-center text-slate-500 text-xs font-medium">
              No closed deals to calculate
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="border-t border-slate-800/60 pt-3 flex justify-around text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <div className="flex flex-col">
              <span className="text-slate-400 text-[10px]">Won ({wonData.count})</span>
              <span className="font-semibold text-white font-mono">{formatCurrency(wonData.value)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block"></span>
            <div className="flex flex-col">
              <span className="text-slate-400 text-[10px]">Lost ({lostData.count})</span>
              <span className="font-semibold text-white font-mono">{formatCurrency(lostData.value)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
