// Free Trial Control Section
function FreeTrialControl() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [defaultTrialDays, setDefaultTrialDays] = useState(0);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [trialStart, setTrialStart] = useState(null);
  const [daysLeft, setDaysLeft] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin-bs1978av1123ss2402/trial-control`)
      .then(res => res.json())
      .then(data => {
        setEnabled(!!data.enabled);
        setDefaultTrialDays(Number(data.defaultTrialDays) || 0);
        // If enabled, set trial start to now (simulate global trial start)
        if (data.enabled) {
          setTrialStart(Date.now());
        } else {
          setTrialStart(null);
        }
      })
      .catch(() => setError('Failed to fetch trial settings'))
      .finally(() => setLoading(false));
  }, []);

  // Live day counter
  useEffect(() => {
    if (!enabled || !trialStart || !defaultTrialDays) {
      setDaysLeft(null);
      return;
    }
    const update = () => {
      const now = Date.now();
      const msPerDay = 24 * 60 * 60 * 1000;
      const end = trialStart + defaultTrialDays * msPerDay;
      const left = Math.max(0, Math.ceil((end - now) / msPerDay));
      setDaysLeft(left);
    };
    update();
    const interval = setInterval(update, 60000); // update every minute
    return () => clearInterval(interval);
  }, [enabled, trialStart, defaultTrialDays]);

  const handleSave = async () => {
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin-bs1978av1123ss2402/trial-control`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, defaultTrialDays })
      });
      if (!res.ok) throw new Error('Failed to update');
      setSuccess('Trial settings updated!');
            if (enabled) setTrialStart(Date.now());
            else setTrialStart(null);
    } catch {
      setError('Failed to update trial settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="bg-gray-800 rounded-xl p-4 mb-4 text-gray-300">Loading trial settings…</div>;
  return (
    <div className="bg-gray-800 rounded-xl p-4 mb-4 flex flex-col gap-3">
      <div className="font-bold text-yellow-400 mb-2 text-lg">Global Free Trial Settings (applies to all new trials)</div>
      <div className="flex items-center gap-4 mb-2">
        <label className="flex items-center gap-2 text-gray-200">
          <input
            type="checkbox"
            checked={enabled}
            onChange={e => setEnabled(e.target.checked)}
            className="form-checkbox h-5 w-5 text-yellow-400"
          />
          Enable Free Trial
        </label>
        <label className="text-gray-200 flex items-center gap-2">
          Trial Days:
          <input
            type="number"
            min="0"
            value={defaultTrialDays}
            onChange={e => setDefaultTrialDays(Number(e.target.value))}
            className="w-16 px-2 py-1 rounded bg-gray-900 text-white border border-gray-700"
          />
        </label>
      </div>
            {enabled && daysLeft !== null && (
              <div className="text-yellow-300 font-semibold mb-2">Trial active: {daysLeft} day{daysLeft !== 1 ? 's' : ''} left</div>
            )}
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-500 font-semibold disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save Settings'}
      </button>
      {success && <div className="text-green-400 text-sm">{success}</div>}
      {error && <div className="text-red-400 text-sm">{error}</div>}
    </div>
  );
}
import React, { useEffect, useState } from 'react';

// Plans array for plan selection dropdown
const plans = [
  { id: 'Novice', name: 'Novice' },
  { id: 'Corporate', name: 'Corporate' },
  { id: 'Elite', name: 'Elite' },
];
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { FaArrowLeft, FaExchangeAlt, FaDownload, FaLink, FaToggleOn, FaToggleOff } from 'react-icons/fa';

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

function AdminSubscriptionSetter({ profileId, currentSubscription, onSuccess }) {
  const [plan, setPlan] = useState(currentSubscription?.plan || 'Novice');
  const [cycle, setCycle] = useState(currentSubscription?.cycle || 'monthly');
  const [activatedAt, setActivatedAt] = useState(currentSubscription?.activatedAt ? currentSubscription.activatedAt.slice(0, 10) : '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [trialControl, setTrialControl] = useState({ enabled: false, defaultTrialDays: 7 });
  const [trialLoading, setTrialLoading] = useState(true);
  const [trialAssigning, setTrialAssigning] = useState(false);
  const [trialAssignError, setTrialAssignError] = useState('');
  const [trialAssignSuccess, setTrialAssignSuccess] = useState('');
  const [trialStatus, setTrialStatus] = useState(null); // { isActive, startedAt, remainingDays }
  const [trialStatusLoading, setTrialStatusLoading] = useState(true);

  useEffect(() => {
    setTrialLoading(true);
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin-bs1978av1123ss2402/trial-control`)
      .then(res => res.json())
      .then(data => setTrialControl(data))
      .catch(() => setTrialControl({ enabled: false, defaultTrialDays: 7 }))
      .finally(() => setTrialLoading(false));
  }, []);

  // Fetch user trial status
  useEffect(() => {
    setTrialStatusLoading(true);
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/profile/${profileId}/trial-remaining`)
      .then(res => res.json())
      .then(data => setTrialStatus(data))
      .catch(() => setTrialStatus(null))
      .finally(() => setTrialStatusLoading(false));
  }, [profileId, trialAssignSuccess]);

  const handleSave = async () => {
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      // Only send allowed plans
      const payload = { plan, cycle };
      if (activatedAt) payload.activatedAt = activatedAt;
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin-bs1978av1123ss2402/profile/${profileId}/subscription`,
        payload
      );
      setSuccess('Subscription updated!');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Failed to update subscription');
    } finally {
      setSaving(false);
    }
  };

  // Assign trial to user
    const handleStartTrial = async () => {
        setTrialAssigning(true);
        setTrialAssignError('');
        setTrialAssignSuccess('');
        try {
            const now = new Date();
            const expires = new Date(now.getTime() + (trialControl.defaultTrialDays || 7) * 24 * 60 * 60 * 1000);
            const payload = {
                plan,
                cycle: 'trial',
                activatedAt: now.toISOString(),
                expiresAt: expires.toISOString(),
            };
            await axios.put(
                `${import.meta.env.VITE_API_BASE_URL}/api/admin-bs1978av1123ss2402/profile/${profileId}/subscription`,
                payload
            );
            setTrialAssignSuccess('Trial started!');
            if (onSuccess) onSuccess();
        } catch (err) {
            setTrialAssignError('Failed to start trial');
        } finally {
            setTrialAssigning(false);
        }
    };

  // Show trial status from API
  return (
    <div className="bg-gray-800 rounded-xl p-4 mb-4 flex flex-col gap-3">
      <div className="flex flex-wrap gap-4 items-center">
        <label className="text-gray-300">
          Plan:
          <select value={plan} onChange={e => setPlan(e.target.value)} className="ml-2 px-2 py-1 rounded bg-gray-900 text-white">
            {plans.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label className="text-gray-300">
          Cycle:
          <select value={cycle} onChange={e => setCycle(e.target.value)} className="ml-2 px-2 py-1 rounded bg-gray-900 text-white">
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="trial">Trial</option>
          </select>
        </label>
        <label className="text-gray-300">
          Activation Date:
          <input
            type="date"
            value={activatedAt}
            onChange={e => setActivatedAt(e.target.value)}
            className="ml-2 px-2 py-1 rounded bg-gray-900 text-white"
          />
        </label>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Subscription'}
        </button>
      </div>
    </div>
  );
}

export default function AdminProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [insightsEnabled, setInsightsEnabled] = useState(false);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState('');
  const [viewsGraphEnabled, setViewsGraphEnabled] = useState(true);
  const [viewsGraphSaving, setViewsGraphSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const API = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  useEffect(() => {
    // Set admin key from sessionStorage for all axios requests
    const adminKey = sessionStorage.getItem('adminKey');
    if (adminKey) {
      axios.defaults.headers.common['x-admin-key'] = adminKey;
    }
    axios.get(`${API}/api/admin-bs1978av1123ss2402/profile/${id}`)
      .then(res => {
        setProfile(res.data);
        setInsightsEnabled(!!res.data.insightsEnabled);
        setViewsGraphEnabled(res.data.viewsGraphEnabled !== false); // default true
      })
      .catch(() => setError('Profile not found'))
      .finally(() => setLoading(false));
    // Fetch insights (contact saves/downloads, view time series) from public endpoint
    axios.get(`${API}/api/profile/${id}/insights`)
      .then(res => setInsights(res.data))
      .catch(() => setInsightsError('Could not load insights'))
      .finally(() => setInsightsLoading(false));
  }, [API, id, refreshKey]);

  const handleToggleViewsGraph = async () => {
    setViewsGraphSaving(true);
    try {
      await axios.patch(`${API}/api/admin-bs1978av1123ss2402/profile/${id}/views-graph-enabled`, { enabled: !viewsGraphEnabled });
      setViewsGraphEnabled(!viewsGraphEnabled);
      setRefreshKey(k => k + 1); // trigger insights re-fetch
    } catch {
      alert('Failed to update views graph visibility');
    }
    setViewsGraphSaving(false);
  };

  const handleToggleInsights = async () => {
    setSaving(true);
    try {
      await axios.patch(`${API}/api/admin-bs1978av1123ss2402/profile/${id}/insights-enabled`, { enabled: !insightsEnabled });
      setInsightsEnabled(!insightsEnabled);
      setRefreshKey(k => k + 1); // trigger insights re-fetch
    } catch {
      alert('Failed to update insights status');
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black">Loading insights…</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-black text-red-500">{error}</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl shadow-2xl mt-10 p-0 overflow-hidden relative">
        {/* Free Trial Control Section */}
        <FreeTrialControl />
        {/* Header with Back Button */}
        <div className="flex items-center px-4 pt-5 pb-3 border-b border-gray-800 bg-gray-900">
          <button className="text-gray-300 hover:text-white mr-2" onClick={() => navigate('/admin-bs1978av1123ss2402')}>
            <FaArrowLeft size={22} />
          </button>
          <h2 className="text-xl font-bold text-white flex-1 text-center">Profile Insights</h2>
          <div className="w-8" /> {/* Spacer for symmetry */}
        </div>

        {/* Admin Subscription Setter */}
        {profile && (
          <AdminSubscriptionSetter
            profileId={profile._id}
            currentSubscription={profile.subscription}
            onSuccess={() => setRefreshKey(k => k + 1)}
          />
        )}

        {/* Admin Controls */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-300">Profile Status</span>
            <span className={`text-sm font-semibold ${profile.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
              {profile.status === 'active' ? 'Active' : 'Pending Activation'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">Insights Feature</span>
            <button
              onClick={handleToggleInsights}
              disabled={saving}
              className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-lg text-sm hover:bg-gray-700 transition"
            >
              {insightsEnabled ? (
                <><FaToggleOn className="text-green-400" size={20} /> <span className="text-green-400">Enabled</span></>
              ) : (
                <><FaToggleOff className="text-gray-400" size={20} /> <span className="text-gray-400">Disabled</span></>
              )}
            </button>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm font-medium text-gray-300">Normal Views Graph (user dashboard)</span>
            <button
              onClick={handleToggleViewsGraph}
              disabled={viewsGraphSaving}
              className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-lg text-sm hover:bg-gray-700 transition"
            >
              {viewsGraphEnabled ? (
                <><FaToggleOn className="text-green-400" size={20} /> <span className="text-green-400">Visible</span></>
              ) : (
                <><FaToggleOff className="text-gray-400" size={20} /> <span className="text-gray-400">Hidden</span></>
              )}
            </button>
          </div>
          {/* Toggle showInsightsCTA */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm font-medium text-gray-300">Show Insights CTA</span>
            <button
              onClick={async () => {
                try {
                  await axios.patch(
                    `${API}/api/admin-bs1978av1123ss2402/profile/${id}/show-insights-cta`,
                    { show: !profile?.showInsightsCTA },
                    { headers: { 'Content-Type': 'application/json' } }
                  );
                  setProfile(p => ({ ...p, showInsightsCTA: !p?.showInsightsCTA }));
                } catch {
                  alert('Failed to update showInsightsCTA');
                }
              }}
              className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-lg text-sm hover:bg-gray-700 transition"
            >
              {profile?.showInsightsCTA ? (
                <><FaToggleOn className="text-green-400" size={20} /> <span className="text-green-400">On</span></>
              ) : (
                <><FaToggleOff className="text-gray-400" size={20} /> <span className="text-gray-400">Off</span></>
              )}
            </button>
          </div>
        </div>

        {/* Weekly Activity Section (Normal and Detailed Views Graphs) */}
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 tracking-widest">WEEKLY ACTIVITY</span>
            <span className="text-xs text-gray-400">
              {insights && insights.viewCountsOverTime && insights.viewCountsOverTime.length > 0 ? `${insights.viewCountsOverTime[0].date} - ${insights.viewCountsOverTime[insights.viewCountsOverTime.length-1].date}` : ''}
            </span>
          </div>
          {/* Normal Views Graph: always show if viewCountsOverTime is present */}
          {Array.isArray(insights?.viewCountsOverTime) && insights.viewCountsOverTime.length > 0 && (
            <div className="bg-gray-800 rounded-xl p-5 flex flex-col items-center mb-4">
              <div className="flex items-center gap-4 w-full">
                <div className="flex-1">
                  <div className="text-3xl font-bold text-white">{insights?.totalViews ?? 0}</div>
                  <div className="text-xs text-gray-400 mt-1">Profile views</div>
                </div>
                <div className="flex-1 h-16">
                  <ResponsiveContainer width="100%" height={60}>
                    <LineChart data={insights.viewCountsOverTime} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                      <Line type="monotone" dataKey="count" stroke="#7b7bff" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
          {/* Detailed Insights Graph */}
          {Array.isArray(insights?.detailedViewCountsOverTime) && insights.detailedViewCountsOverTime.length > 0 && (
            <div className="bg-gray-800 rounded-xl p-5 flex flex-col items-center mb-4 mt-2">
              <div className="flex items-center gap-4 w-full">
                <div className="flex-1">
                  <div className="text-3xl font-bold text-white">Detailed Insights</div>
                  <div className="text-xs text-gray-400 mt-1">Detailed views</div>
                </div>
                <div className="flex-1 h-16">
                  <ResponsiveContainer width="100%" height={60}>
                    <LineChart data={insights.detailedViewCountsOverTime} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                      <Line type="monotone" dataKey="count" stroke="#ff9800" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Metrics List Section */}
        <div className="px-6 pb-6 space-y-3">
          <div className="flex items-center bg-gray-800 rounded-xl px-4 py-3 mb-1">
            <span className="bg-gray-700 rounded-full p-2 mr-3"><FaExchangeAlt className="text-blue-300" /></span>
            <span className="flex-1 text-white font-medium">Contact Exchanges</span>
            <span className="text-lg font-bold text-white">{typeof insights?.contactExchanges === 'object' && insights?.contactExchanges !== null ? insights.contactExchanges.count : insights?.contactExchanges ?? 0}</span>
          </div>
          {/* Contact Exchange Remaining */}
          <div className="flex items-center bg-gray-800 rounded-xl px-4 py-3 mb-1">
            <span className="bg-gray-700 rounded-full p-2 mr-3"></span>
            <span className="flex-1 text-gray-400 text-xs">Exchanges Left This Month</span>
            <span className="text-xs text-gray-300">
              {insights?.contactExchangeRemaining === 'Unlimited' || insights?.contactExchangeLimit === Infinity
                ? 'Unlimited'
                : (typeof insights?.contactExchangeRemaining === 'object' && insights?.contactExchangeRemaining !== null
                    ? insights.contactExchangeRemaining.count
                    : insights?.contactExchangeRemaining ?? '-')}
            </span>
          </div>
          <div className="flex items-center bg-gray-800 rounded-xl px-4 py-3 mb-1">
            <span className="bg-gray-700 rounded-full p-2 mr-3"><FaDownload className="text-purple-300" /></span>
            <span className="flex-1 text-white font-medium">Contact Downloads</span>
            <span className="text-lg font-bold text-white">{insights?.contactDownloads ?? 0}</span>
          </div>
          <div className="flex items-center bg-gray-800 rounded-xl px-4 py-3 mb-1">
            <span className="bg-gray-700 rounded-full p-2 mr-3"><FaLink className="text-green-300" /></span>
            <span className="flex-1 text-white font-medium">Total link taps</span>
            <span className="text-lg font-bold text-white">{insights?.totalLinkTaps ?? 0}</span>
          </div>
        </div>

        {/* Timestamps Section */}
        <div className="px-6 pb-6 flex flex-col gap-1 text-xs text-gray-500">
          <div>Last Viewed: {insights?.lastViewedAt ? new Date(insights.lastViewedAt).toLocaleString() : '-'}</div>
          <div>Created: {insights?.createdAt ? new Date(insights.createdAt).toLocaleString() : '-'}</div>
          <div>Last Updated: {insights?.updatedAt ? new Date(insights.updatedAt).toLocaleString() : '-'}</div>
        </div>

        {/* Back to Admin Button */}
        <button
          className="mx-6 mb-6 w-full px-6 py-2 bg-gray-800 text-gray-200 rounded-lg font-semibold hover:bg-gray-700 transition shadow"
          onClick={() => navigate('/admin-bs1978av1123ss2402')}
        >
          Back to Admin
        </button>
      </div>
    </div>
  );
}