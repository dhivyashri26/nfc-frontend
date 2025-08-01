// src/pages/DashboardInsightsPage.jsx

import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import MetricCard from '../components/MetricCard';
import { FaUsers, FaUser, FaExchangeAlt, FaDownload, FaLink, FaStar, FaArrowLeft } from 'react-icons/fa';

// Returns { plan, daysLeft, expiresAt, trialDays } if on trial, else null
function getTrialInfo(subscription, planObj) {
  if (!subscription || subscription.cycle !== 'trial' || !subscription.activatedAt || !subscription.expiresAt) return null;
  const plan = subscription.plan;
  const trialDays = planObj?.trialDays || 0;
  const now = new Date();
  const expiresAt = new Date(subscription.expiresAt);
  const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
  if (daysLeft > 0) return { plan, daysLeft, expiresAt: subscription.expiresAt, trialDays };
  return null;
}

export default function DashboardInsightsPage() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [insightsEnabled, setInsightsEnabled] = useState(false);
  const profileId = localStorage.getItem('profileId');
  const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const navigate = useNavigate();
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateInput, setDeactivateInput] = useState('');
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState(null);
  const deactivateInputRef = useRef(null);

  // Add state for insightVisibility
  const [insightVisibility, setInsightVisibility] = useState({
    uniqueVisitors: true,
    totalViews: true,
    contactExchanges: true,
    contactDownloads: true,
    totalLinkTaps: true,
    topLink: true,
    linkClicks: true,
  });

  // Add state for graph days
  const [graphDays, setGraphDays] = useState(7);

  // Add the BlurredMetric component for locked metrics
  function BlurredMetric({ value, onUpgrade }) {
    return (
      <div className="relative w-full h-12 flex items-center justify-center">
        {/* 1. The blurred value */}
        <span
          aria-hidden="true"
          className="text-2xl font-bold text-white blur-sm select-none"
          style={{ filter: 'blur(6px)' }}
        >
          {value}
        </span>
        {/* 2. Semi-opaque overlay to mute any remaining details */}
        <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg" />
        {/* 3. Centered CTA button */}
        <button
          onClick={onUpgrade}
          className="absolute px-4 py-1 bg-yellow-400 text-black font-semibold rounded-lg animate-pulse focus:outline-none focus:ring-2 focus:ring-yellow-300 transition"
          aria-label="Upgrade to unlock full insights"
        >
          Upgrade to Unlock full insights
        </button>
      </div>
    );
  }

  // Helper for rendering a blurred value with overlay CTA (same as Link Tap Breakdown)
  function BlurredValue({ value, visible }) {
    return visible ? (
      <span className="text-xl font-bold text-white">{value}</span>
    ) : (
      <span className="relative inline-block" style={{ width: '100%' }}>
        <span className="blur-sm select-none text-xl font-bold text-white opacity-80" style={{ filter: 'blur(4px)' }}>{value}</span>
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 text-yellow-700 text-xs font-semibold rounded px-2 py-1 shadow pointer-events-auto" style={{ zIndex: 2 }}>
        Upgrade to Unlock full insights
        </span>
      </span>
    );
  }

  // Add the GatedSection component for gating entire sections
  function GatedSection({ children, onUpgrade }) {
    return (
      <div className="relative bg-white/5 rounded-lg overflow-hidden">
        {/* Blurred content */}
        <div className="p-4 text-gray-300 blur-sm select-none pointer-events-none">
          {children}
        </div>
        {/* Centered, minimal CTA */}
        <button
          onClick={onUpgrade}
          className="absolute inset-0 flex flex-col items-center justify-center text-sm font-medium bg-blue-600 bg-opacity-90 hover:bg-blue-700 text-white rounded-lg transition backdrop-blur-sm shadow-lg"
          aria-label="Upgrade to unlock full insights"
        >
          <span className="font-bold text-lg text-white">Upgrade</span>
          <span className="text-xs text-blue-100 flex items-center gap-1">
            to Unlock full insights <span className="text-lg ml-1">→</span>
          </span>
        </button>
      </div>
    );
  }

  // Refined GatedGraphSection for best UI/UX consistency
  function GatedGraphSection({ children, onUpgrade }) {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/20">
        {/* Blur + pointer lock */}
        <div className="pointer-events-none blur-[3px] brightness-[0.7] select-none">
          {children}
        </div>
        {/* Glassmorphic overlay CTA, text-on-glass */}
        <button
          onClick={onUpgrade}
          className="absolute inset-0 flex flex-col items-center justify-center bg-white/20 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg focus:outline-none"
          style={{ boxShadow: '0 4px 32px 0 rgba(0,0,0,0.10)' }}
          aria-label="Upgrade to unlock full insights"
        >
          <span className="font-bold text-lg text-white drop-shadow">Upgrade</span>
          <span className="text-xs text-blue-100 drop-shadow">to Unlock full insights <span className="text-lg ml-1">→</span></span>
        </button>
      </div>
    );
  }

  useEffect(() => {
    if (!profileId) return navigate('/login', { replace: true });
    axios
      .get(`${API}/api/profile/${profileId}`)
      .then(res => setInsightsEnabled(!!res.data.insightsEnabled))
      .catch(() => setInsightsEnabled(false));
  }, [API, profileId, navigate]);

  useEffect(() => {
    if (!profileId) return;
    axios
      .get(`${API}/api/profile/${profileId}/insights`)
      .then(res => {
        setInsights(res.data);
        // If insightVisibility is missing, fallback to all true (for backward compatibility)
        setInsightVisibility(res.data.insightVisibility || {
          uniqueVisitors: true,
          totalViews: true,
          contactExchanges: true,
          contactDownloads: true,
          totalLinkTaps: true,
          topLink: true,
          linkClicks: true,
        });
      })
      .catch(() => setError('Could not load insights'))
      .finally(() => setLoading(false));
  }, [API, profileId]);

  const handleDeactivateProfile = async () => {
    setDeactivating(true);
    setDeactivateError(null);
    try {
      await axios.patch(`${API}/api/profile/${profileId}/deactivate`, { active: false });
      setShowDeactivateModal(false);
      setDeactivateInput('');
      window.location.reload(); // Or navigate to login/dashboard if preferred
    } catch (err) {
      setDeactivateError('Error deactivating profile');
    } finally {
      setDeactivating(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-900 text-gray-200">
      Loading insights…
    </div>
  );

  if (error) return (
    <div className="h-screen flex items-center justify-center bg-gray-900 text-red-400">
      {error}
    </div>
  );

  if (!insightsEnabled) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 px-4">
        <div className="max-w-md w-full p-6 bg-white/10 border border-white/20 backdrop-blur-lg rounded-2xl shadow-lg text-center">
          <h2 className="text-2xl font-semibold text-white mb-4">Profile Insights</h2>
          <p className="text-gray-300">Insights are not enabled for your profile. Please contact support or your admin.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 w-full py-3 bg-yellow-500 bg-opacity-90 hover:bg-opacity-100 text-black font-medium rounded-xl transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Extract visibility object
  const visibility = insights?.insightVisibility || {};

  // Filter view counts based on graphDays
  const filteredViewCounts = insights?.viewCountsOverTime?.slice(-graphDays) || [];

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 flex flex-col items-center space-y-8">
      <div className="w-full max-w-lg bg-white/10 border border-white/20 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <header className="flex items-center px-4 py-3 border-b border-white/20">
          <button onClick={() => navigate('/dashboard')} className="text-gray-300 hover:text-white mr-2">
            <FaArrowLeft size={20} />
          </button>
          <h2 className="flex-1 text-center text-white font-semibold">Profile Insights</h2>
        </header>

        {/* Free Trial Info */}
        {getTrialInfo(insights.subscription, insights.plan) && (
          <div className="px-6 pt-5">
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-yellow-900 text-xs font-bold shadow border border-yellow-400">
              {getTrialInfo(insights.subscription, insights.plan).plan} Free Trial: {getTrialInfo(insights.subscription, insights.plan).daysLeft} day{getTrialInfo(insights.subscription, insights.plan).daysLeft !== 1 ? 's' : ''} left (ends {new Date(getTrialInfo(insights.subscription, insights.plan).expiresAt).toLocaleDateString()})
            </span>
            <div className="text-xs text-gray-400 mt-1">Trial duration: {getTrialInfo(insights.subscription, insights.plan).trialDays} days</div>
          </div>
        )}
        {/* Subscription */}
        {insights.subscription && (
          <section className="px-6 py-5">
            <h3 className="text-lg font-semibold text-white mb-3">Subscription Details</h3>
            <ul className="space-y-1 text-gray-200">
              <li><strong>Plan:</strong> {insights.subscription.plan}</li>
              <li><strong>Cycle:</strong> {insights.subscription.cycle}</li>
              <li><strong>Activated:</strong> {new Date(insights.subscription.activatedAt).toLocaleDateString()}</li>
              {insights.subscription.expiresAt && (
                <li><strong>Expires:</strong> {new Date(insights.subscription.expiresAt).toLocaleDateString()}</li>
              )}
            </ul>
          </section>
        )}

        {/* Detailed Views Graph (gated for Novice) */}
        {insightsEnabled && insights && Array.isArray(insights.viewCountsOverTime) && insights.viewCountsOverTime.length > 0 && (
          insights.subscription?.plan === 'Novice' ? (
            <GatedGraphSection onUpgrade={() => navigate('/plans')}>
              <div className="w-full max-w-lg mt-8 mb-2 p-6 flex flex-col items-center">
                <h3 className="text-lg font-bold text-white mb-2">Profile Views (Last {graphDays} Days)</h3>
                <div className="flex gap-2 mb-4">
                  {[7, 14, 30].map(days => (
                    <button
                      key={days}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-[#FFC300] ${graphDays === days ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-blue-400 dark:border-blue-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-800'}`}
                      disabled
                    >
                      Past {days} days
                    </button>
                  ))}
                </div>
                <div className="w-full h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredViewCounts} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#b3b8c5' }} angle={-30} textAnchor="end" height={50} dy={10} />
                      <YAxis tick={{ fontSize: 12, fill: '#b3b8c5' }} label={{ value: 'Views', angle: -90, position: 'insideLeft', fill: '#b3b8c5', fontSize: 13 }} allowDecimals={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ background: '#23272f', borderRadius: 8, color: '#e0e0e0', border: 'none', boxShadow: '0 2px 8px #0001' }}
                        labelStyle={{ color: '#a3a3ff', fontWeight: 500 }}
                        formatter={(value, name) => [`${value} views`, 'Views']}
                        labelFormatter={label => `Date: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#a3a3ff"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#b3b8c5', stroke: '#a3a3ff', strokeWidth: 1.5 }}
                        activeDot={{ r: 6, fill: '#23272f', stroke: '#a3a3ff', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {filteredViewCounts.length > 0 && `${filteredViewCounts[0].date} - ${filteredViewCounts[filteredViewCounts.length-1].date}`}
                </div>
              </div>
            </GatedGraphSection>
          ) : (
            <div className="w-full max-w-lg mt-8 mb-2 bg-white/10 border border-white/20 rounded-2xl shadow-xl p-6 flex flex-col items-center">
              <h3 className="text-lg font-bold text-white mb-2">Profile Views (Last {graphDays} Days)</h3>
              <div className="flex gap-2 mb-4">
                {[7, 14, 30].map(days => (
                  <button
                    key={days}
                    onClick={() => setGraphDays(days)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-[#FFC300] ${graphDays === days ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-blue-400 dark:border-blue-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-800'}`}
                  >
                    Past {days} days
                  </button>
                ))}
              </div>
              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredViewCounts} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#b3b8c5' }} angle={-30} textAnchor="end" height={50} dy={10} />
                    <YAxis tick={{ fontSize: 12, fill: '#b3b8c5' }} label={{ value: 'Views', angle: -90, position: 'insideLeft', fill: '#b3b8c5', fontSize: 13 }} allowDecimals={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#23272f', borderRadius: 8, color: '#e0e0e0', border: 'none', boxShadow: '0 2px 8px #0001' }}
                      labelStyle={{ color: '#a3a3ff', fontWeight: 500 }}
                      formatter={(value, name) => [`${value} views`, 'Views']}
                      labelFormatter={label => `Date: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#a3a3ff"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#b3b8c5', stroke: '#a3a3ff', strokeWidth: 1.5 }}
                      activeDot={{ r: 6, fill: '#23272f', stroke: '#a3a3ff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {filteredViewCounts.length > 0 && `${filteredViewCounts[0].date} - ${filteredViewCounts[filteredViewCounts.length-1].date}`}
              </div>
            </div>
          )
        )}

        {/* Metrics Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-6 py-5 border-t border-white/20">
          <MetricCard
            icon={FaUsers}
            label="Unique Visitors"
            value={insights.uniqueVisitors}
            visible={visibility.uniqueVisitors !== undefined ? visibility.uniqueVisitors : true}
            onUpgrade={() => navigate('/plans')}
          />
          <MetricCard
            icon={FaUser}
            label="Total Views"
            value={insights.totalViews}
            visible={visibility.totalViews !== undefined ? visibility.totalViews : true}
            onUpgrade={() => navigate('/plans')}
          />
          <MetricCard
            icon={FaExchangeAlt}
            label="Contact Exchanges"
            value={(typeof insights.contactExchanges === 'object' && insights.contactExchanges !== null) ? insights.contactExchanges.count : insights.contactExchanges ?? '—'}
            visible={visibility.contactExchanges !== undefined ? visibility.contactExchanges : true}
            onUpgrade={() => navigate('/plans')}
          />
          <MetricCard
            icon={FaDownload}
            label="Contact Downloads"
            value={insights.contactDownloads}
            visible={visibility.contactDownloads !== undefined ? visibility.contactDownloads : true}
            onUpgrade={() => navigate('/plans')}
          />
          {/* Full-width cards: */}
          <div className="sm:col-span-2">
            <MetricCard
              icon={FaLink}
              label="Total Link Taps"
              value={insights.totalLinkTaps}
              visible={visibility.totalLinkTaps !== undefined ? visibility.totalLinkTaps : true}
              onUpgrade={() => navigate('/plans')}
            />
          </div>
          <div className="sm:col-span-2">
            <MetricCard
              icon={FaStar}
              label="Top Contact Method"
              value={insights.mostPopularContactMethod
                ? insights.mostPopularContactMethod.charAt(0).toUpperCase() + insights.mostPopularContactMethod.slice(1)
                : '—'}
              visible={visibility.topLink !== undefined ? visibility.topLink : true}
              onUpgrade={() => navigate('/plans')}
            />
          </div>
        </section>

{insights?.viewsByIndustry && (
  <div className="sm:col-span-2 bg-white/10 border border-white/20 rounded-2xl shadow-xl p-6">
    <h3 className="text-lg font-bold text-white mb-2">Industry-wise Views</h3>
    <ul>
      {Object.entries(insights.viewsByIndustry).map(([industry, count]) => (
        <li key={industry} className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
          <span className="text-gray-200">{industry}</span>
          <span className="font-semibold text-white">{count}</span>
        </li>
      ))}
    </ul>
  </div>
)}

        {/* Timestamps */}
        <section className="px-6 py-5 border-t border-white/20">
          <div className="bg-white/5 p-4 rounded-xl text-gray-400 text-xs space-y-1">
            <p>Last Viewed: {new Date(insights.lastViewedAt).toLocaleString()}</p>
            <p>Created:     {new Date(insights.createdAt).toLocaleString()}</p>
            <p>Updated:     {new Date(insights.updatedAt).toLocaleString()}</p>
          </div>
        </section>

        {/* Deactivate Profile Button */}
        <div className="px-6 py-5 border-t border-white/20 flex flex-col items-center">
          <button
            onClick={() => setShowDeactivateModal(true)}
            className="w-full max-w-xs bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold transition shadow-lg"
          >
            Deactivate Profile
          </button>
        </div>

        {/* Deactivate Profile Confirmation Modal */}
        {showDeactivateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-sm text-center">
              <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Deactivate Profile</h2>
              <p className="mb-4 text-gray-700 dark:text-gray-300">Type <span className="font-mono font-bold text-red-600">deactivate</span> to confirm. This will hide your profile from public view. You can reactivate by contacting support.</p>
              <input
                ref={deactivateInputRef}
                type="text"
                className="w-full px-3 py-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-red-400 dark:bg-gray-900 dark:text-white"
                placeholder="Type 'deactivate' to confirm"
                value={deactivateInput}
                onChange={e => setDeactivateInput(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowDeactivateModal(false); setDeactivateInput(''); }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  disabled={deactivating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeactivateProfile}
                  className={`px-4 py-2 bg-red-600 text-white rounded-lg font-semibold transition ${deactivateInput !== 'deactivate' || deactivating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'}`}
                  disabled={deactivateInput !== 'deactivate' || deactivating}
                >
                  {deactivating ? 'Deactivating...' : 'Deactivate'}
                </button>
              </div>
              {deactivateError && <div className="mt-2 text-red-500 text-sm">{deactivateError}</div>}
            </div>
          </div>
        )}

        {/* Back Button */}
        <footer className="px-6 py-5 border-t border-white/20">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 bg-yellow-500 bg-opacity-90 hover:bg-opacity-100 text-black font-medium rounded-xl transition"
          >
            Back to Dashboard
          </button>
        </footer>
      </div>
    </div>
  );
}