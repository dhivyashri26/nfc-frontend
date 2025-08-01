// src/pages/AdminPage.jsx

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaCopy,
  FaFileCsv,
  FaPlus,
  FaStar,
  FaTimes
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function AdminPage() {
  const API = import.meta.env.VITE_API_BASE_URL;
  const [authorized, setAuthorized] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [authError, setAuthError] = useState('');

  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // custom slug inputs & feedback
  const [slugInputs, setSlugInputs] = useState({});       // { [profileId]: inputValue }
  const [slugFeedback, setSlugFeedback] = useState({});   // { [profileId]: { type, message } }

  // Create-profile state
  const [creating, setCreating] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  // Exclusive badge state
  const [badgeInputs, setBadgeInputs] = useState({}); // { [profileId]: inputValue }
  const [badgeEditMode, setBadgeEditMode] = useState({}); // { [profileId]: boolean }
  const [badgeFeedback, setBadgeFeedback] = useState({}); // { [profileId]: { type, message } }

  const navigate = useNavigate();

  // Persist adminKey between reloads
  useEffect(() => {
    const stored = sessionStorage.getItem('adminKey');
    if (stored) {
      axios.defaults.headers.common['x-admin-key'] = stored;
      setAdminKey(stored);
      setAuthorized(true);
    }
  }, []);

  // Authenticate admin by attempting a protected call
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!adminKey) {
      setAuthError('Enter the admin key');
      return;
    }
    axios.defaults.headers.common['x-admin-key'] = adminKey;
    try {
      await axios.get(`${API}/api/admin-bs1978av1123ss2402/profiles`, { params: { page: 1, limit: 1 } });
      sessionStorage.setItem('adminKey', adminKey);
      setAuthorized(true);
    } catch {
      delete axios.defaults.headers.common['x-admin-key'];
      setAuthError('Invalid key');
    }
  };

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin-bs1978av1123ss2402/profiles`, {
        params: { search, status: statusFilter, page, limit }
      });
      setProfiles(res.data.data);
      setTotal(res.data.meta.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [API, search, statusFilter, page, limit]);

  useEffect(() => {
    if (authorized) fetchProfiles();
  }, [authorized, fetchProfiles]);

  // Fix: fetch profiles when route changes (for new admin URL)
  useEffect(() => {
    fetchProfiles();
    // eslint-disable-next-line
  }, []);

  const handleCreateProfile = async () => {
    setCreating(true);
    setCreateError('');
    setCreateSuccess('');
    setNewCode('');
    try {
      const res = await axios.post(`${API}/api/admin-bs1978av1123ss2402/create-profile`);
      setNewCode(res.data.activationCode);
      setCreateSuccess('Activation code generated!');
      fetchProfiles();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create profile');
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (id) => {
    try {
      const res = await axios.patch(`${API}/api/admin-bs1978av1123ss2402/profile/${id}/toggle-status`);
      const updatedProfile = res.data.profile || res.data;
      setProfiles(prev =>
        prev.map(p =>
          p._id === id ? { ...p, ...updatedProfile } : p
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const deleteProfile = async (id) => {
    if (!window.confirm('Delete this profile?')) return;
    try {
      await axios.delete(`${API}/api/admin-bs1978av1123ss2402/profiles/${id}`);
      setProfiles(prev => prev.filter(p => p._id !== id));
      setTotal(t => t - 1);
    } catch (err) {
      console.error(err);
    }
  };

  const exportCSV = () => {
    const qs = new URLSearchParams({ search, status: statusFilter });
    window.location.href = `${API}/api/admin-bs1978av1123ss2402/export?${qs}`;
  };

  // Use customSlug if present, else activationCode
  const getProfileSlug = (p) => p.customSlug || p.activationCode;

  const copyLink = (codeOrSlug) => {
    const url = `${window.location.origin}/p/${codeOrSlug}`;
    navigator.clipboard.writeText(url);
    alert('Copied: ' + url);
  };

  const totalPages = Math.ceil(total / limit);

  // assign custom slug
  const assignCustomSlug = async (id) => {
    const customSlug = (slugInputs[id] || '').trim();
    if (!/^[a-z0-9_-]{3,30}$/.test(customSlug)) {
      setSlugFeedback(fb => ({
        ...fb,
        [id]: { type: 'error', message: 'Invalid format' }
      }));
      return;
    }
    try {
      await axios.patch(`${API}/api/profile/${id}/custom-slug`, { customSlug });
      setSlugFeedback(fb => ({
        ...fb,
        [id]: { type: 'success', message: 'Slug set!' }
      }));
      fetchProfiles();
    } catch (err) {
      let msg = 'Error';
      if (err.response?.status === 409) msg = 'Already taken';
      else if (err.response?.status === 403) msg = 'Reserved';
      setSlugFeedback(fb => ({
        ...fb,
        [id]: { type: 'error', message: msg }
      }));
    }
  };

  // Set or remove exclusive badge
  const setExclusiveBadge = async (id, text) => {
    try {
      await axios.patch(`${API}/api/admin-bs1978av1123ss2402/profiles/${id}/exclusive-badge`, { text });
      setBadgeFeedback(fb => ({ ...fb, [id]: { type: 'success', message: text ? 'Badge set!' : 'Badge removed' } }));
      setBadgeEditMode(em => ({ ...em, [id]: false }));
      fetchProfiles();
    } catch (err) {
      setBadgeFeedback(fb => ({ ...fb, [id]: { type: 'error', message: 'Error saving badge' } }));
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <form
          onSubmit={handleAuth}
          className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-sm space-y-4"
        >
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Admin Login</h2>
          <input
            type="password"
            placeholder="Admin Key"
            value={adminKey}
            onChange={e => setAdminKey(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          {authError && <p className="text-red-600">{authError}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        Admin Dashboard
      </h1>

      {/* Create Profile */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={handleCreateProfile}
          disabled={creating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 shadow-lg"
        >
          <FaPlus /> {creating ? 'Creating…' : 'Create New Profile'}
        </button>
        {createSuccess && <span className="text-green-600 dark:text-green-400 font-semibold">{createSuccess}</span>}
        {createError && <span className="text-red-600 dark:text-red-400 font-semibold">{createError}</span>}
        {newCode && (
          <div className="flex items-center gap-2">
            <code className="font-mono text-blue-600 dark:text-blue-400 bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">{newCode}</code>
            <button
              onClick={() => copyLink(newCode)}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Copy Link
            </button>
          </div>
        )}
      </div>

      {/* Filters & Export */}
      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="Search code, email or name"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md flex-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400"
        />
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending_activation">Pending</option>
        </select>
        <button
          onClick={exportCSV}
          className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 shadow-lg"
        >
          <FaFileCsv className="mr-2" /> Export CSV
        </button>
      </div>

      {/* Profiles Table */}
      <div className="overflow-auto bg-white dark:bg-gray-900 rounded-md shadow-lg">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100">
              <th className="px-4 py-2 text-left">Code</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Custom URL</th>
              <th className="px-4 py-2 text-left">Exclusive Badge</th>
              <th className="px-4 py-2 text-center">Status</th>
              <th className="px-4 py-2 text-center">Insights</th>
              <th className="px-4 py-2 text-center">Manage</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-400">Loading…</td>
              </tr>
            ) : profiles.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-400">No profiles</td>
              </tr>
            ) : profiles.map(p => (
              <tr key={p._id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <td className="px-4 py-2 font-mono text-blue-600 dark:text-blue-400">
                  <a href={`/p/${getProfileSlug(p)}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {getProfileSlug(p)}
                  </a>
                </td>
                <td className="px-4 py-2 text-gray-800 dark:text-gray-100">{p.ownerEmail || '—'}</td>
                <td className="px-4 py-2 text-gray-800 dark:text-gray-100">{p.name || '—'}</td>

                {/* Custom URL Editor */}
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="your-slug"
                      value={slugInputs[p._id] ?? p.customSlug ?? ''}
                      onChange={e => setSlugInputs(si => ({ ...si, [p._id]: e.target.value }))}
                      className="w-32 px-2 py-1 border rounded text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                    <button
                      onClick={() => assignCustomSlug(p._id)}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    >
                      Set
                    </button>
                  </div>
                  {slugFeedback[p._id] && (
                    <p className={`mt-1 text-xs ${slugFeedback[p._id].type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                      {slugFeedback[p._id].message}
                    </p>
                  )}
                </td>

                {/* Exclusive Badge Column */}
                <td className="px-4 py-2 relative">
                  {p.exclusiveBadge && p.exclusiveBadge.text && !badgeEditMode[p._id] && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-400 text-xs font-bold text-gray-900 rounded shadow relative">
                      <FaStar className="text-yellow-700" /> {p.exclusiveBadge.text}
                      <button
                        className="ml-1 text-gray-700 hover:text-red-600"
                        title="Edit badge"
                        onClick={() => {
                          setBadgeEditMode(em => ({ ...em, [p._id]: true }));
                          setBadgeInputs(bi => ({ ...bi, [p._id]: p.exclusiveBadge.text }));
                        }}
                      >
                        ✎
                      </button>
                      <button
                        className="ml-1 text-gray-700 hover:text-red-600"
                        title="Remove badge"
                        onClick={() => setExclusiveBadge(p._id, null)}
                      >
                        <FaTimes />
                      </button>
                    </span>
                  )}
                  {badgeEditMode[p._id] ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="#001"
                        value={badgeInputs[p._id] || ''}
                        onChange={e => setBadgeInputs(bi => ({ ...bi, [p._id]: e.target.value }))}
                        className="w-20 px-2 py-1 border rounded text-xs bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        maxLength={12}
                      />
                      <button
                        className="px-2 py-1 bg-yellow-400 text-xs font-bold rounded hover:bg-yellow-500"
                        onClick={() => setExclusiveBadge(p._id, badgeInputs[p._id])}
                      >
                        Save
                      </button>
                      <button
                        className="px-2 py-1 bg-gray-200 text-xs rounded hover:bg-gray-300"
                        onClick={() => setBadgeEditMode(em => ({ ...em, [p._id]: false }))}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : !p.exclusiveBadge?.text && (
                    <button
                      className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded hover:bg-yellow-200"
                      onClick={() => {
                        setBadgeEditMode(em => ({ ...em, [p._id]: true }));
                        setBadgeInputs(bi => ({ ...bi, [p._id]: '' }));
                      }}
                    >
                      Set Badge
                    </button>
                  )}
                  {badgeFeedback[p._id] && (
                    <p className={`mt-1 text-xs ${badgeFeedback[p._id].type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                      {badgeFeedback[p._id].message}
                    </p>
                  )}
                </td>

                <td className="px-4 py-2 text-center">
                  <span className={`font-semibold ${p.computedStatus === 'active' ? 'text-green-600 dark:text-green-400' : 'text-yellow-500 dark:text-yellow-300'}`}>
                    {p.computedStatus ? p.computedStatus.charAt(0).toUpperCase() + p.computedStatus.slice(1) : (p.status === 'active' ? 'Active' : 'Pending')}
                  </span>
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    className={`px-3 py-1 rounded text-xs font-semibold ${p.insightsEnabled ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'} hover:bg-green-600`}
                    onClick={async () => {
                      try {
                        await axios.patch(`${API}/api/admin-bs1978av1123ss2402/profile/${p._id}/insights-enabled`, { enabled: !p.insightsEnabled });
                        fetchProfiles();
                      } catch (err) {
                        alert('Failed to update insights status');
                      }
                    }}
                  >
                    {p.insightsEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    className="px-3 py-1 rounded text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600"
                    onClick={() => navigate(`/admin-7x9q2v4k1b8z6r3p0/profile/${p._id}`)}
                  >
                    Manage
                  </button>
                </td>
                <td className="px-4 py-2 flex justify-center gap-3">
                  <button onClick={() => toggleStatus(p._id)} title={p.active ? 'Deactivate' : 'Activate'}>
                    {p.active ? (
                      <FaToggleOn size={20} className="text-green-500 dark:text-green-400" />
                    ) : (
                      <FaToggleOff size={20} className="text-yellow-400" />
                    )}
                  </button>
                  <button onClick={() => deleteProfile(p._id)} title="Delete">
                    <FaTrash size={20} className="text-red-500" />
                  </button>
                  <button onClick={() => copyLink(getProfileSlug(p))} title="Copy Link">
                    <FaCopy size={18} className="text-blue-600 dark:text-blue-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-3">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}