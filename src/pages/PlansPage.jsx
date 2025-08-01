// src/pages/PlansPage.jsx

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const navigate = useNavigate();
  const deckRef = useRef(null);

  useEffect(() => {
    const url = `${import.meta.env.VITE_API_BASE_URL}/api/plans`; 
    fetch(url)
      .then(res =>
        res.ok
          ? res.json()
          : Promise.reject(new Error(`Server responded ${res.status}: ${res.statusText}`))
      )
      .then(data => {
        if (!Array.isArray(data)) {
          throw new Error('Invalid plans format received from server');
        }
        // Inject default free plan if not present
        const hasFree = data.some(p => p.id === 'free');
        const freePlan = {
          id: 'free',
          name: 'Free',
          prices: { monthly: 0, quarterly: 0 },
          tagline: 'Basic digital card',
          benefits: [
            { title: 'Basic Comma Profile' },
            { title: 'Share your contact instantly' },
            { title: 'Limited analytics' },
            { title: 'Unlimited scans' },
            { title: 'No credit card required' }
          ]
        };
        setPlans(hasFree ? data : [freePlan, ...data]);
      })
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleOutside(e) {
      if (deckRef.current && !deckRef.current.contains(e.target)) {
        setSelected(null);
      }
    }
    document.addEventListener('click', handleOutside);
    return () => document.removeEventListener('click', handleOutside);
  }, []);

  const showTooltip = (content, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      content,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  };
  const hideTooltip = () => setTooltip(null);

  const onSubscribe = planId => {
    // WhatsApp business chat link (replace with your business number)
    const phone = '18653862733'; // e.g. 91 for India, then number
    const url = `https://wa.me/${phone}?text=Hi,%20I%20am%20interested%20in%20the%20${encodeURIComponent(planId)}%20plan%20on%20Comma%20Cards.`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-400">
        Error: {error.message || 'Something went wrong'}
      </div>
    );
  }

  const offsets = [-140, -45, 45, 140];

  return (
    <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-800 min-h-screen text-white py-16 px-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-5xl font-bold text-[#D4AF37] mb-4">
          Choose Your Plan
        </h1>
        <p className="text-gray-400 mb-6">
          Find the perfect fit for your network.
        </p>
        <div className="inline-flex rounded-full bg-white/10 backdrop-blur-md p-1">
          {['monthly', 'quarterly'].map(cycle => (
            <button
              key={cycle}
              onClick={() => setBillingCycle(cycle)}
              className={`relative px-5 py-2 rounded-full font-medium text-sm transition ${
                billingCycle === cycle
                  ? 'bg-[#D4AF37] text-black shadow-lg'
                  : 'text-gray-300 hover:bg-white/20'
              }`}
            >
              {cycle === 'monthly' ? 'Monthly' : 'Quarterly (gifting you 1 free month)'}
              {cycle === 'quarterly' && (
                <span className="absolute -top-3 right-2 animate-fire-bounce text-2xl select-none" style={{ pointerEvents: 'none' }}>
                  🔥
                </span>
              )}
            </button>
          ))}
        </div>
        <style>{`
          @keyframes fire-bounce {
            0%, 100% { transform: translateY(0) scale(1); filter: drop-shadow(0 0 6px #ff9800cc); }
            30% { transform: translateY(-6px) scale(1.12); filter: drop-shadow(0 0 16px #ff9800ee); }
            60% { transform: translateY(-2px) scale(1.05); filter: drop-shadow(0 0 10px #ff9800cc); }
          }
          .animate-fire-bounce {
            animation: fire-bounce 1.2s infinite cubic-bezier(.6,-0.28,.74,.05);
          }
        `}</style>
      </div>

      {/* Deck */}
      <div
        ref={deckRef}
        className="relative overflow-visible flex justify-center items-end h-[500px]
                   transform scale-75 sm:scale-90 md:scale-100 lg:scale-110"
      >
        {plans.map((plan, i) => {
          const isSel = selected === plan.id;
          const x = isSel ? 0 : offsets[i];
          const y = isSel ? -60 : 0;
          const rot = isSel ? 0 : offsets[i] / 20;
          const z = isSel ? 1000 : i;

          // Show POPULAR badge for Corporate plan
          const isCorporate = plan.id && plan.id.toLowerCase() === 'corporate';
          // Show free trial CTA for Novice and Corporate
          const isNovice = plan.id && plan.id.toLowerCase() === 'novice';
          const showTrialCTA = isNovice || isCorporate;
          const trialDays = plan.trialDays || (isNovice ? 14 : isCorporate ? 7 : 0);

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ x, y, rotate: rot, scale: isSel ? 1.1 : 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              style={{ transformOrigin: 'bottom left', zIndex: z }}
              whileHover={{
                y: -5,
                boxShadow: '0 8px 24px rgba(212,175,48,0.6)',
              }}
              whileTap={{ scale: 0.97 }}
              onClick={e => {
                e.stopPropagation();
                setSelected(isSel ? null : plan.id);
              }}
              className="absolute top-0 w-56 sm:w-64 md:w-72 lg:w-80
                         bg-gradient-to-br from-gray-900 to-black
                         border border-white/10 rounded-2xl p-6
                         flex flex-col shadow-2xl cursor-pointer overflow-visible will-change-transform"
            >
              {isCorporate && (
                <div className="absolute top-3 right-3 bg-gradient-to-br from-yellow-400 to-yellow-500 text-black px-3 py-1 rounded-tl-2xl rounded-br-2xl text-xs font-bold">
                  POPULAR
                </div>
              )}

              <h3
                className={`text-lg font-bold ${
                  plan.id === 'free' ? 'text-white' : 'text-yellow-400'
                }`}
              >
                {plan.name}
              </h3>



              <p className="mt-2 text-3xl font-semibold text-white">
                ₹{plan.prices[billingCycle]}
                <span className="text-sm text-gray-400">
                  /{billingCycle === 'monthly' ? 'mo' : '3 mo'}
                </span>
              </p>

              {/* Tagline and daily cost/price info together, only show tagline once */}
              {(plan.tagline || (plan.costPerDay && plan.prices && plan.prices.monthly > 0)) && (
                <div className="flex flex-col gap-1 mb-4 mt-1">
                  {plan.tagline && (
                    <p className="text-gray-400 text-sm italic mb-0">
                      {plan.tagline}
                    </p>
                  )}
                  {plan.costPerDay && plan.prices && plan.prices.monthly > 0 && (
                    <div className="text-xs text-gray-400 flex flex-col gap-0.5">
                      <span className="bg-black/30 rounded px-2 py-0.5">
                        Monthly: ₹{plan.costPerDay.monthly?.toFixed(2)} per day &nbsp;|&nbsp; ₹{(plan.costPerDay.monthly * 30).toFixed(0)} /mo
                      </span>
                      <span className="bg-black/30 rounded px-2 py-0.5">
                        Quarterly: ₹{plan.costPerDay.quarterly?.toFixed(2)} per day &nbsp;|&nbsp; ₹{(plan.costPerDay.quarterly * 90).toFixed(0)} /3 mo
                      </span>
                    </div>
                  )}
                </div>
              )}

              <ul className="flex-1 overflow-y-auto space-y-2 text-sm text-gray-300 pr-2">
                {plan.benefits.map((b, idx) => (
                  <li
                    key={idx}
                    className="relative flex items-start gap-2 overflow-visible"
                  >
                    <span className="mt-1">•</span>
                    <span>{b.title}</span>
                    {b.detail && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          showTooltip(b.detail, e);
                        }}
                        onMouseEnter={e => showTooltip(b.detail, e)}
                        onMouseLeave={hideTooltip}
                        className="ml-auto w-6 h-6 flex items-center justify-center border border-gray-500 rounded-full text-gray-400 hover:text-white hover:border-white transition-colors"
                      >
                        ℹ
                      </button>
                    )}
                  </li>
                ))}
              </ul>

              {showTrialCTA && (
                <div className="mt-4 mb-1">
                  <span className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-yellow-900 text-xs font-bold shadow border border-yellow-400">
                    {trialDays} Day Free Trial
                  </span>
                </div>
              )}

              <button
                onClick={() => onSubscribe(plan.id)}
                className={`mt-2 py-2 rounded-full font-semibold transition-all ${
                  plan.id === 'free'
                    ? 'bg-white text-black hover:bg-gray-100'
                    : 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-black hover:shadow-lg'
                }`}
              >
                {plan.id === 'free'
                  ? isSel
                    ? 'Free Plan Selected'
                    : 'Select Free Plan'
                  : `Start ${plan.name} — ₹${plan.prices[billingCycle]}/${
                      billingCycle === 'monthly' ? 'mo' : '3 mo'
                    }`}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Tooltip Portal */}
      {tooltip &&
        ReactDOM.createPortal(
          <div
            style={{
              position: 'fixed',
              top: tooltip.y,
              left: tooltip.x,
              transform: 'translateX(-50%) translateY(-110%)',
              zIndex: 2000,
              pointerEvents: 'none',
            }}
          >
            <div className="bg-gray-900 text-white text-sm rounded-md px-4 py-2 shadow-2xl max-w-md text-center">
              {tooltip.content}
            </div>
            <div className="w-4 h-4 bg-gray-900 rotate-45 mx-auto -mt-1" />
          </div>,
          document.body
        )}

      {/* Disclaimers */}
      <div className="max-w-7xl mx-auto mt-12 pt-8 text-center text-xs text-gray-400">
        <p>* Terms and conditions apply</p>
        <p>** Feature under development</p>
      </div>
    </div>
  );
}