import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { FaArrowLeft, FaExchangeAlt, FaDownload, FaLink, FaToggleOn, FaToggleOff } from 'react-icons/fa';

function AdminSubscriptionSetter({ profileId, currentSubscription, onSuccess }) {
  const [plan, setPlan] = useState((currentSubscription?.plan || 'novice').toLowerCase());
  const [cycle, setCycle] = useState(currentSubscription?.cycle || 'monthly');
  const [activatedAt, setActivatedAt] = useState(currentSubscription?.activatedAt ? currentSubscription.activatedAt.slice(0, 10) : '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin-bs1978av1123ss2402/profile/${profileId}/subscription`,
        {
          plan: plan.toLowerCase(),
          cycle,
          activatedAt: activatedAt || undefined
        }
      );
      setSuccess('Subscription updated!');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Failed to update subscription');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 mb-4 flex flex-col gap-3">
      <div className="flex flex-wrap gap-4 items-center">
        <label className="text-gray-300">
          Plan:
          <select value={plan} onChange={e => setPlan(e.target.value)} className="ml-2 px-2 py-1 rounded bg-gray-900 text-white">
            <option value="free">Free</option>
            <option value="novice">Novice</option>
            <option value="corporate">Corporate</option>
            <option value="elite">Elite</option>
          </select>
        </label>
        <label className="text-gray-300">
          Cycle:
          <select value={cycle} onChange={e => setCycle(e.target.value)} className="ml-2 px-2 py-1 rounded bg-gray-900 text-white">
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
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
      {success && <div className="text-green-400 text-sm">{success}</div>}
      {error && <div className="text-red-400 text-sm">{error}</div>}
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
      })
      .catch(() => setError('Profile not found'))
      .finally(() => setLoading(false));
    // Fetch insights (contact saves/downloads, view time series)
    axios.get(`${API}/api/admin-bs1978av1123ss2402/profile/${id}/insights`)
      .then(res => setInsights(res.data))
      .catch(() => setInsightsError('Could not load insights'))
      .finally(() => setInsightsLoading(false));
  }, [API, id]);

  const handleToggleInsights = async () => {
    setSaving(true);
    try {
      await axios.patch(`${API}/api/admin-bs1978av1123ss2402/profile/${id}/insights-enabled`, { enabled: !insightsEnabled });
      setInsightsEnabled(!insightsEnabled);
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
            onSuccess={() => window.location.reload()}
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
        </div>

        {/* Weekly Activity Section */}
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 tracking-widest">WEEKLY ACTIVITY</span>
            <span className="text-xs text-gray-400">{insights && insights.viewCountsOverTime && insights.viewCountsOverTime.length > 0 ? `${insights.viewCountsOverTime[0].date} - ${insights.viewCountsOverTime[insights.viewCountsOverTime.length-1].date}` : ''}</span>
          </div>
          <div className="bg-gray-800 rounded-xl p-5 flex flex-col items-center mb-4">
            <div className="flex items-center gap-4 w-full">
              <div className="flex-1">
                <div className="text-3xl font-bold text-white">{insights?.totalViews ?? 0}</div>
                <div className="text-xs text-gray-400 mt-1">Profile views</div>
              </div>
              <div className="flex-1 h-16">
                {Array.isArray(insights?.viewCountsOverTime) && insights.viewCountsOverTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height={60}>
                    <LineChart data={insights.viewCountsOverTime} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                      <Line type="monotone" dataKey="count" stroke="#7b7bff" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-600">No data</div>
                )}
              </div>
            </div>
          </div>
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