import React from 'react';

export default function MetricCard({
  icon: Icon,
  label,
  value,
  visible = true,
  onUpgrade,
}) {
  return (
    <div className="relative bg-white/5 p-4 rounded-xl flex flex-col items-center justify-center h-full text-center overflow-hidden border border-white/10 shadow">
      {visible ? (
        <>
          <Icon className="text-2xl text-indigo-300 mb-2" />
          <span className="text-2xl font-bold text-white">{value}</span>
          <div className="text-xs text-gray-300 mt-2">{label}</div>
        </>
      ) : (
        <>
          {/* Blurred content */}
          <div className="blur-[3px] select-none pointer-events-none opacity-80">
            <Icon className="text-2xl text-indigo-300 mb-2" />
            <span className="text-2xl font-bold text-white">{value}</span>
            <div className="text-xs text-gray-300 mt-2">{label}</div>
          </div>
          {/* Glassmorphic overlay CTA, text-on-glass */}
          <button
            onClick={onUpgrade}
            className="absolute inset-0 flex flex-col items-center justify-center bg-white/20 backdrop-blur-md border border-white/10 rounded-xl shadow-lg focus:outline-none"
            style={{ boxShadow: '0 4px 32px 0 rgba(0,0,0,0.10)' }}
            aria-label={`Unlock ${label}`}
          >
            <span className="font-bold text-lg text-white drop-shadow">Upgrade</span>
            <span className="text-xs text-blue-100 drop-shadow">to Unlock full insights <span className="text-lg ml-1">→</span></span>
          </button>
        </>
      )}
    </div>
  );
} 