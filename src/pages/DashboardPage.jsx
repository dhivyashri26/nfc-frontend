// src/pages/DashboardPage.jsx

import React, { useEffect, useState, useCallback, memo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  FaEnvelope,
  FaPhone,
  FaInstagram,
  FaLinkedin,
  FaTwitter,
  FaGlobe,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaSave,
  FaRegCopy,
  FaMoon,
  FaSun,
  FaEdit,
  FaLock
} from 'react-icons/fa';
import { MdQrCode } from 'react-icons/md';
import QRCode from 'react-qr-code';
import { useTheme } from '../App';
import { useSpring, animated } from '@react-spring/web';
import ImageCropper from '../components/ImageCropper';
import { industries } from '../utils/constants';
import '../comma-branding.css';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// Reusable ContactRow
const ContactRow = memo(function ContactRow({ icon, label, value, href, onCopy }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-900 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition"
    >
      <div className="flex items-center gap-3">
        <div className="text-xl text-[#FFC300]">{icon}</div>
        <div className="text-left">
          <p className="font-medium text-sm text-gray-900 dark:text-white">{label}</p>
          <p className="text-xs text-gray-700 dark:text-gray-400 truncate">{value}</p>
        </div>
      </div>
      <button
        onClick={e => {
          e.preventDefault();
          onCopy();
        }}
        className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition"
      >
        <FaRegCopy className="text-sm" />
      </button>
    </a>
  );
});

// Subscription-based field restrictions
const PLAN_FIELDS = {
  Novice: ['name', 'title', 'subtitle', 'tags', 'phone', 'linkedin'],
  Corporate: ['name', 'title', 'subtitle', 'tags', 'phone', 'linkedin', 'industry', 'website', 'calendlyLink'],
  Elite: [] // All fields available
};

const ALL_FIELDS = [
  { key: 'name', label: 'Name', type: 'text', placeholder: 'e.g. Jane Doe' },
  { key: 'title', label: 'Title', type: 'text', placeholder: 'e.g. CEO' },
  { key: 'subtitle', label: 'Subtitle / Organization', type: 'text', placeholder: 'e.g. Acme Inc.' },
  { key: 'tags', label: 'Tags (comma-separated)', type: 'text', placeholder: 'e.g. Marketing, Networking, SaaS' },
  { key: 'phone', label: 'Phone', type: 'tel', placeholder: 'e.g. +91 9876543210' },
  { key: 'website', label: 'Website', type: 'url', placeholder: 'e.g. https://yourcompany.com' },
  { key: 'calendlyLink', label: 'Calendly Link', type: 'url', placeholder: 'e.g. https://calendly.com/yourlink' },
  { key: 'instagram', label: 'Instagram', type: 'text', placeholder: 'e.g. yourhandle' },
  { key: 'linkedin', label: 'LinkedIn', type: 'text', placeholder: 'e.g. your-linkedin-url-id' },
  { key: 'twitter', label: 'Twitter', type: 'text', placeholder: 'e.g. yourhandle' },
  { key: 'location', label: 'Location', type: 'text', placeholder: 'e.g. San Francisco, CA' },
  { key: 'industry', label: 'Industry', type: 'select', placeholder: 'Select an industry' }
];

// Extracted CardContent to top-level to preserve input focus
const CardContent = memo(function CardContent({
  API,
  form,
  editMode,
  handleChange,
  bannerFile,
  avatarFile,
  setBannerFile,
  setAvatarFile,
  uploadFile,
  theme,
  setTheme,
  handleThemeToggle, // <-- add this
  profile,
  setEditMode,
  setShowQR,
  copyToClipboard,
  showQR,
  downloadVCard,
  isDashboard,
  saveProfile,
  handleFileInput,
  uiStyle,
  subscription,
  navigate
}) {
  // Use backend-provided slug for all links
  const profileSlug = profile.slug || profile.customSlug || profile.activationCode;
  const plan = subscription?.plan || 'Novice';
  
  return (
    <>
      {/* COMMA Branding for Novice profiles */}
      {plan === 'Novice' && (
        <div className="comma-branding">COMMA,</div>
      )}
      {/* Theme toggle */}
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={handleThemeToggle}
          className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full shadow hover:scale-105 transition"
        >
          {theme === 'dark' ? <FaSun className="text-yellow-400" /> : <FaMoon className="text-gray-800" />}
        </button>
      </div>
      {/* Banner & Avatar (public profile style) */}
      <div className="h-32 bg-gray-300 dark:bg-gray-600 relative rounded-t-2xl overflow-visible">
        {form && form.bannerUrl && (
          <img
            src={form.bannerUrl.startsWith('http') ? form.bannerUrl : `${API}${form.bannerUrl}`}
            alt="Banner"
            className="w-full h-full object-cover rounded-t-2xl"
          />
        )}
        {form && form.avatarUrl && (
          <img
            src={form.avatarUrl.startsWith('http') ? form.avatarUrl : `${API}${form.avatarUrl}`}
            alt="Avatar"
            className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 shadow-lg object-cover"
            style={{zIndex: 10}}
          />
        )}
      </div>
      {/* Main Info (public profile style) */}
      <div className="px-6 pt-14 pb-2 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white break-words">{form && form.name ? form.name : ''}</h1>
        {form && form.title && <p className="mt-0 text-base font-medium text-gray-700 dark:text-gray-200">{form.title}</p>}
        {form && form.subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{form.subtitle}</p>}
        {form && form.industry && (
          <div className="flex justify-center mt-2">
            <span className="px-3 py-1 rounded-lg text-xs font-semibold shadow-lg border tracking-wide"
              style={{
                background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                color: '#fff',
                border: '1.5px solid #2563eb',
                boxShadow: '0 2px 8px 0 #2563eb55'
              }}>
              {form.industry}
            </span>
          </div>
        )}
        {form && form.tags && form.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1 mt-2">
            {form.tags.map(t => (
              <span
                key={t}
                className="px-3 py-1 rounded-lg text-xs font-semibold shadow border border-gray-300 dark:border-[#23272f] tracking-wide"
                style={{
                  background: theme === 'dark'
                    ? 'linear-gradient(120deg, #23272f 0%, #23272f 40%, #181a20 100%)'
                    : 'linear-gradient(120deg, #f8f8f8 0%, #e6e6e6 40%, #bdbdbd 100%)',
                  color: theme === 'dark' ? '#e0e0e0' : '#232323',
                  textShadow: theme === 'dark' ? '0 1px 2px #000a, 0 0.5px 0 #23272f' : '0 1px 2px #fff8, 0 0.5px 0 #bdbdbd',
                  boxShadow: theme === 'dark'
                    ? '0 2px 8px 0 #000a, 0 1.5px 0 #23272f'
                    : '0 2px 8px 0 #e0e0e0cc, 0 1.5px 0 #bdbdbd',
                  border: theme === 'dark' ? '1px solid #23272f' : '1px solid #bdbdbd',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
      {/* Actions */}
      {!editMode && (
        <div className="px-6 mt-2 flex gap-2">
          <button
            onClick={() => setShowQR(true)}
            className="flex-1 bg-blue-500 text-white py-1.5 rounded-lg flex items-center justify-center gap-1 shadow hover:bg-blue-600 transition text-sm border border-blue-600"
          >
            <MdQrCode /> QR Code
          </button>
          <button
            onClick={() => setEditMode(true)}
            className="flex-1 bg-yellow-500 text-white py-1.5 rounded-lg flex items-center justify-center gap-1 shadow hover:bg-yellow-600 transition text-sm border border-yellow-600"
          >
            <FaEdit /> Edit Profile
          </button>
          <button
            onClick={() => copyToClipboard(`${window.location.origin}/p/${profileSlug}`)}
            className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition border border-gray-400 dark:border-gray-600"
          >
            <FaRegCopy />
          </button>
        </div>
      )}
      {/* Contact Rows */}
      {!editMode && (
        <div className="px-6 mt-4 space-y-2">
          {profile.ownerEmail && (
            <a
              href={`mailto:${profile.ownerEmail}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-3 py-2 rounded-lg text-gray-900 dark:text-gray-100 text-sm font-semibold tracking-wide mb-2 shadow border border-gray-300 dark:border-[#23272f] transition hover:scale-[1.025] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-[#FFC300] flex items-center gap-2"
              style={{
                background: theme === 'dark'
                  ? 'linear-gradient(120deg, #23272f 0%, #23272f 40%, #181a20 100%)'
                  : 'linear-gradient(120deg, #f8f8f8 0%, #e6e6e6 40%, #bdbdbd 100%)',
                color: theme === 'dark' ? '#e0e0e0' : '#232323',
                border: theme === 'dark' ? '1px solid #23272f' : '1px solid #bdbdbd',
                minHeight: '44px',
              }}
            >
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 min-w-[60px]">Email</span>
              <FaEnvelope className="mr-2 text-blue-500 dark:text-blue-400" />{profile.ownerEmail}
            </a>
          )}
          {profile.phone && (
            <a
              href={`tel:${profile.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-3 py-2 rounded-lg text-gray-900 dark:text-gray-100 text-sm font-semibold tracking-wide mb-2 shadow border border-gray-300 dark:border-[#23272f] transition hover:scale-[1.025] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-[#FFC300] flex items-center gap-2"
              style={{
                background: theme === 'dark'
                  ? 'linear-gradient(120deg, #23272f 0%, #23272f 40%, #181a20 100%)'
                  : 'linear-gradient(120deg, #f8f8f8 0%, #e6e6e6 40%, #bdbdbd 100%)',
                color: theme === 'dark' ? '#e0e0e0' : '#232323',
                textShadow: theme === 'dark' ? '0 1px 2px #0008, 0 0.5px 0 #444' : '0 1px 2px #bdbdbd, 0 0.5px 0 #fff8',
                boxShadow: theme === 'dark'
                  ? '0 2px 8px 0 #111a, 0 1.5px 0 #444'
                  : '0 2px 8px 0 #e0e0e0cc, 0 1.5px 0 #bdbdbd',
                border: theme === 'dark' ? '1px solid #444' : '1px solid #bdbdbd',
                minHeight: '44px',
              }}
            >
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 min-w-[60px]">Phone</span>
              <FaPhone className="mr-2 text-green-500 dark:text-green-400" />{profile.phone}
            </a>
          )}
          {profile.website && (
            <a
              href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-3 py-2 rounded-lg text-gray-900 dark:text-gray-100 text-sm font-semibold tracking-wide mb-2 shadow border border-gray-300 dark:border-[#23272f] transition hover:scale-[1.025] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-[#FFC300] flex items-center gap-2"
              style={{
                background: theme === 'dark'
                  ? 'linear-gradient(120deg, #23272f 0%, #23272f 40%, #181a20 100%)'
                  : 'linear-gradient(120deg, #f8f8f8 0%, #e6e6e6 40%, #bdbdbd 100%)',
                color: theme === 'dark' ? '#e0e0e0' : '#232323',
                textShadow: theme === 'dark' ? '0 1px 2px #0008, 0 0.5px 0 #444' : '0 1px 2px #bdbdbd, 0 0.5px 0 #fff8',
                boxShadow: theme === 'dark'
                  ? '0 2px 8px 0 #111a, 0 1.5px 0 #444'
                  : '0 2px 8px 0 #e0e0e0cc, 0 1.5px 0 #bdbdbd',
                border: theme === 'dark' ? '1px solid #444' : '1px solid #bdbdbd',
                minHeight: '44px',
              }}
            >
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 min-w-[60px]">Website</span>
          <FaGlobe className="mr-2 text-purple-500 dark:text-purple-400" />{profile.website}
        </a>
      )}
      {profile.calendlyLink && (
        <a
          href={profile.calendlyLink.startsWith('http') ? profile.calendlyLink : `https://${profile.calendlyLink}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full px-3 py-2 rounded-lg text-gray-900 dark:text-gray-100 text-sm font-semibold tracking-wide mb-2 shadow border border-gray-300 dark:border-[#23272f] transition hover:scale-[1.025] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-[#FFC300] flex items-center gap-2"
          style={{
            background: theme === 'dark'
              ? 'linear-gradient(120deg, #23272f 0%, #23272f 40%, #181a20 100%)'
              : 'linear-gradient(120deg, #f8f8f8 0%, #e6e6e6 40%, #bdbdbd 100%)',
            color: theme === 'dark' ? '#e0e0e0' : '#232323',
            textShadow: theme === 'dark' ? '0 1px 2px #0008, 0 0.5px 0 #444' : '0 1px 2px #bdbdbd, 0 0.5px 0 #fff8',
            boxShadow: theme === 'dark'
              ? '0 2px 8px 0 #111a, 0 1.5px 0 #444'
              : '0 2px 8px 0 #e0e0e0cc, 0 1.5px 0 #bdbdbd',
            border: theme === 'dark' ? '1px solid #444' : '1px solid #bdbdbd',
            minHeight: '44px',
          }}
        >
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 min-w-[60px]">Calendly</span>
          <FaCalendarAlt className="mr-2 text-indigo-500 dark:text-indigo-400" />{profile.calendlyLink}
        </a>
      )}
      {profile.socialLinks && profile.socialLinks.instagram && (
            <a
              href={`https://instagram.com/${profile.socialLinks.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-3 py-2 rounded-lg text-gray-900 dark:text-gray-100 text-sm font-semibold tracking-wide mb-2 shadow border border-gray-300 dark:border-[#23272f] transition hover:scale-[1.025] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-[#FFC300] flex items-center gap-2"
              style={{
                background: theme === 'dark'
                  ? 'linear-gradient(120deg, #23272f 0%, #23272f 40%, #181a20 100%)'
                  : 'linear-gradient(120deg, #f8f8f8 0%, #e6e6e6 40%, #bdbdbd 100%)',
                color: theme === 'dark' ? '#e0e0e0' : '#232323',
                textShadow: theme === 'dark' ? '0 1px 2px #0008, 0 0.5px 0 #444' : '0 1px 2px #bdbdbd, 0 0.5px 0 #fff8',
                boxShadow: theme === 'dark'
                  ? '0 2px 8px 0 #111a, 0 1.5px 0 #444'
                  : '0 2px 8px 0 #e0e0e0cc, 0 1.5px 0 #bdbdbd',
                border: theme === 'dark' ? '1px solid #444' : '1px solid #bdbdbd',
                minHeight: '44px',
              }}
            >
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 min-w-[60px]">Instagram</span>
              <FaInstagram className="mr-2 text-pink-500 dark:text-pink-400" />{profile.socialLinks.instagram}
            </a>
          )}
          {profile.socialLinks && profile.socialLinks.linkedin && (
            <a
              href={`https://linkedin.com/in/${profile.socialLinks.linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-3 py-2 rounded-lg text-gray-900 dark:text-gray-100 text-sm font-semibold tracking-wide mb-2 shadow border border-gray-300 dark:border-[#23272f] transition hover:scale-[1.025] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-[#FFC300] flex items-center gap-2"
              style={{
                background: theme === 'dark'
                  ? 'linear-gradient(120deg, #23272f 0%, #23272f 40%, #181a20 100%)'
                  : 'linear-gradient(120deg, #f8f8f8 0%, #e6e6e6 40%, #bdbdbd 100%)',
                color: theme === 'dark' ? '#e0e0e0' : '#232323',
                textShadow: theme === 'dark' ? '0 1px 2px #0008, 0 0.5px 0 #444' : '0 1px 2px #bdbdbd, 0 0.5px 0 #fff8',
                boxShadow: theme === 'dark'
                  ? '0 2px 8px 0 #111a, 0 1.5px 0 #444'
                  : '0 2px 8px 0 #e0e0e0cc, 0 1.5px 0 #bdbdbd',
                border: theme === 'dark' ? '1px solid #444' : '1px solid #bdbdbd',
                minHeight: '44px',
              }}
            >
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 min-w-[60px]">LinkedIn</span>
              <FaLinkedin className="mr-2 text-blue-700 dark:text-blue-300" />{profile.socialLinks.linkedin}
            </a>
          )}
          {profile.socialLinks && profile.socialLinks.twitter && (
            <a
              href={`https://twitter.com/${profile.socialLinks.twitter}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-3 py-2 rounded-lg text-gray-900 dark:text-gray-100 text-sm font-semibold tracking-wide mb-2 shadow border border-gray-300 dark:border-[#23272f] transition hover:scale-[1.025] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-[#FFC300] flex items-center gap-2"
              style={{
                background: theme === 'dark'
                  ? 'linear-gradient(120deg, #23272f 0%, #23272f 40%, #181a20 100%)'
                  : 'linear-gradient(120deg, #f8f8f8 0%, #e6e6e6 40%, #bdbdbd 100%)',
                color: theme === 'dark' ? '#e0e0e0' : '#232323',
                textShadow: theme === 'dark' ? '0 1px 2px #0008, 0 0.5px 0 #444' : '0 1px 2px #bdbdbd, 0 0.5px 0 #fff8',
                boxShadow: theme === 'dark'
                  ? '0 2px 8px 0 #111a, 0 1.5px 0 #444'
                  : '0 2px 8px 0 #e0e0e0cc, 0 1.5px 0 #bdbdbd',
                border: theme === 'dark' ? '1px solid #444' : '1px solid #bdbdbd',
                minHeight: '44px',
              }}
            >
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 min-w-[60px]">Twitter</span>
              <FaTwitter className="mr-2 text-blue-400 dark:text-blue-200" />{profile.socialLinks.twitter}
            </a>
          )}
          {profile.location && (
            <span
              className="block w-full px-3 py-2 rounded-lg text-gray-900 dark:text-gray-100 text-sm font-semibold tracking-wide mb-2 shadow border border-gray-300 dark:border-[#23272f] flex items-center gap-2"
              style={{
                background: theme === 'dark'
                  ? 'linear-gradient(120deg, #23272f 0%, #23272f 40%, #181a20 100%)'
                  : 'linear-gradient(120deg, #f8f8f8 0%, #e6e6e6 40%, #bdbdbd 100%)',
                color: theme === 'dark' ? '#e0e0e0' : '#232323',
                textShadow: theme === 'dark' ? '0 1px 2px #0008, 0 0.5px 0 #444' : '0 1px 2px #bdbdbd, 0 0.5px 0 #fff8',
                boxShadow: theme === 'dark'
                  ? '0 2px 8px 0 #111a, 0 1.5px 0 #444'
                  : '0 2px 8px 0 #e0e0e0cc, 0 1.5px 0 #bdbdbd',
                border: theme === 'dark' ? '1px solid #444' : '1px solid #bdbdbd',
                minHeight: '44px',
              }}
            >
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 min-w-[60px]">Location</span>
              <FaMapMarkerAlt className="mr-2 text-gray-600 dark:text-gray-400" />{profile.location}
            </span>
          )}
        </div>
      )}
      {/* Logout Button */}
      {!editMode && (
        <button
          onClick={() => {
            localStorage.removeItem('profileId');
            window.location.href = '/login';
          }}
          className="w-40 mx-auto mt-10 mb-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold transition block shadow-lg"
          style={{marginBottom: '32px'}}
        >
          Logout
        </button>
      )}
      {/* Edit Mode Fields with Subscription Restrictions */}
      {editMode && (
        <div className="px-6 pt-4 pb-6 space-y-4 text-left">
          {/* Render fields based on subscription plan */}
          {ALL_FIELDS.map(({ key, label, type, placeholder }) => {
            // Normalize plan string to match PLAN_FIELDS keys
            const normalizedPlan = (profile?.subscription?.plan && PLAN_FIELDS[profile.subscription.plan]) ? profile.subscription.plan : 'Novice';
            const isElite = profile?.subscription?.plan === 'Elite';
            const isAllowed = isElite || PLAN_FIELDS[normalizedPlan]?.includes(key);
            if (isAllowed) {
              // Render normal input field
              if (type === 'select') {
                return (
                  <div key={key} className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 ml-1">{label}</label>
                    <select
                      name={key}
                      value={form[key] || ''}
                      onChange={handleChange}
                      className="w-full text-sm bg-white/40 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="" disabled>{placeholder}</option>
                      {key === 'industry' && industries.map(ind => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>
                );
              } else {
                return (
                  <div key={key} className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 ml-1">{label}</label>
                    <input
                      type={type}
                      name={key}
                      value={key === 'tags' ? form[key].join(', ') : (key === 'instagram' || key === 'linkedin' || key === 'twitter' ? form.socialLinks[key] : form[key])}
                      onChange={handleChange}
                      placeholder={placeholder}
                      className="w-full text-sm bg-white/40 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                );
              }
            } else {
              // Render locked field
              return (
                <div key={key} className="locked-field flex justify-between items-center p-3 mb-2 bg-white/40 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-lg shadow-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 17v.01M7 7v.01M17 7v.01M7 17v.01M17 17v.01M12 7v.01M12 12v.01M7 12v.01M17 12v.01" /></svg>
                    Upgrade to use
                  </span>
                </div>
              );
            }
          })}
          
          {/* File uploads - always available */}
          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Change Banner</label>  
              <input
                type="file"
                accept="image/*"
                onChange={e => handleFileInput(e, 'banner')}
                className="block w-full text-sm text-gray-900 dark:text-gray-100 bg-white/40 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none file:bg-blue-600 file:text-white file:font-semibold hover:file:bg-blue-700 transition"
              />
              {bannerFile && (
                <button
                  onClick={() => uploadFile(bannerFile, 'banner')}
                  className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-lg text-sm"
                >
                  Upload
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Change Avatar</label>  
              <input
                type="file"
                accept="image/*"
                onChange={e => handleFileInput(e, 'avatar')}
                className="block w-full text-sm text-gray-900 dark:text-gray-100 bg-white/40 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none file:bg-blue-600 file:text-white file:font-semibold hover:file:bg-blue-700 transition"
              />
              {avatarFile && (
                <button
                  onClick={() => uploadFile(avatarFile, 'avatar')}
                  className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-lg text-sm"
                >
                  Upload
                </button>
              )}
            </div>
          </div>
          {/* Save and Cancel Buttons */}
          <div className="flex gap-3 justify-end mt-6">
            <button
              onClick={() => setEditMode(false)}
              className="px-6 py-2 rounded-lg bg-white/40 text-gray-900 border border-gray-200 shadow font-semibold hover:bg-white/60 transition"
            >
              Cancel
            </button>
            <button
              onClick={saveProfile}
              className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow transition"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </>
  );
});

export default function DashboardPage() {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const profileId = localStorage.getItem('profileId');
  const { theme, setTheme } = useTheme();

  const initialForm = {
    name: '',
    title: '',
    subtitle: '',
    tags: [],
    ownerEmail: '',
    phone: '',
    website: '',
    calendlyLink: '',
    location: '',
    bio: '',
    industry: '', // <-- add industry field
    socialLinks: { instagram: '', linkedin: '', twitter: '' },
    bannerUrl: '',
    avatarUrl: ''
  };

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(theme === 'dark');
  const [form, setForm] = useState(initialForm);
  const [editMode, setEditMode] = useState(false);
  const [bannerFile, setBannerFile] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImage, setCropperImage] = useState(null);
  const [cropperAspect, setCropperAspect] = useState(3); // Default to banner aspect
  const [cropperField, setCropperField] = useState('banner');
  const [insights, setInsights] = useState(null);
  // Only show insights button if enabled
  const [insightsEnabled, setInsightsEnabled] = useState(false);
  const [industries, setIndustries] = useState([]);
  // UI Style toggle
  const [uiStyle, setUiStyle] = useState(() => localStorage.getItem('uiStyle') || 'chrome');
  const [graphDays, setGraphDays] = useState(30);
  const filteredViewCounts = React.useMemo(() => {
    if (!insights || !Array.isArray(insights.viewCountsOverTime)) return [];
    return insights.viewCountsOverTime.slice(-graphDays);
  }, [insights, graphDays]);
  useEffect(() => { localStorage.setItem('uiStyle', uiStyle); }, [uiStyle]);
  const [qrType, setQrType] = useState(() => localStorage.getItem('qrType') || 'url');
  useEffect(() => { localStorage.setItem('qrType', qrType); }, [qrType]);

  useEffect(() => {
    fetch('https://nfc-backend-9c1q.onrender.com/api/profile/industries')
      .then(res => res.json())
      .then(data => setIndustries(data.industries))
      .catch(err => console.error('Failed to fetch industries', err));
  }, []);

  useEffect(() => setDarkMode(theme === 'dark'), [theme]);

  // Add debug log for profile
  useEffect(() => {
    if (profile) console.log('Profile:', profile);
  }, [profile]);

  // Theme persistence: set theme from profile on load
  useEffect(() => {
    if (profile?.theme) {
      setTheme(profile.theme);
    }
  }, [profile, setTheme]);

  // Theme toggle handler that saves to backend
  const handleThemeToggle = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    try {
      await axios.patch(`${API}/api/profile/${profileId}/theme`, { theme: newTheme });
      setProfile(prev => prev ? { ...prev, theme: newTheme } : prev);
    } catch (err) {
      // Optionally show error
    }
  };

  const { rotateY } = useSpring({
    rotateY: darkMode ? 180 : 0,
    config: { tension: 200, friction: 20 }
  });

  // Clipboard
  const copyToClipboard = useCallback(txt => {
    navigator.clipboard.writeText(txt);
    setMessage('Copied!');
  }, []);

  // Handle changes
  const handleChange = useCallback(e => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev };
      if (name === 'tags') {
        updated.tags = value.split(',').map(t => t.trim());
      } else if (['instagram', 'linkedin', 'twitter'].includes(name)) {
        updated.socialLinks = { ...prev.socialLinks, [name]: value };
      } else {
        updated[name] = value;
      }
      return updated;
    });
  }, []);

  // Save edits
  const saveProfile = useCallback(async () => {
    try {
      await axios.put(`${API}/api/profile/${profileId}`, form);
      setProfile(form);
      setEditMode(false);
      setMessage('Profile saved!');
    } catch {
      setMessage('Save failed');
    }
  }, [API, profileId, form]);

  // Upload files
  const uploadFile = useCallback(
    async (file, field) => {
      if (!file) return;
      const fd = new FormData();
      fd.append(field, file);
      try {
        const { data } = await axios.post(
          `${API}/api/profile/${profileId}/${field}`,
          fd,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        setForm(f => ({ ...f, [`${field}Url`]: data.url }));
        setProfile(p => ({ ...p, [`${field}Url`]: data.url }));
        setMessage(`${field} uploaded`);
        if (field === 'banner') setBannerFile(null);
        else setAvatarFile(null);
      } catch {
        setMessage('Upload failed');
      }
    },
    [profileId]
  );

  // Handle file input for cropping
  const handleFileInput = useCallback((e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setCropperImage(ev.target.result);
      setCropperAspect(field === 'avatar' ? 1 : 3); // 1:1 for avatar, 3:1 for banner
      setCropperField(field);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle crop complete
  const handleCropComplete = useCallback(async (croppedBlob) => {
    setCropperOpen(false);
    if (!croppedBlob) return;
    const croppedFile = new File([croppedBlob], `${cropperField}.jpg`, { type: 'image/jpeg' });
    if (cropperField === 'banner') setBannerFile(croppedFile);
    else setAvatarFile(croppedFile);
  }, [cropperField]);

  // vCard
  const profileSlug = profile?.slug;
  const vCardLines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${profile?.name || ''}`,
    `TITLE:${profile?.title || ''}`,
    `ORG:${profile?.subtitle || ''}`,
    `EMAIL;TYPE=work:${profile?.ownerEmail || ''}`,
    profile?.phone && `TEL;TYPE=CELL:${profile.phone}`,
    `URL:${window.location.origin}/p/${profileSlug || ''}`,
    profile?.socialLinks?.instagram &&
      `X-SOCIALPROFILE;type=instagram:https://instagram.com/${profile.socialLinks.instagram}`,
    profile?.socialLinks?.linkedin &&
      `X-SOCIALPROFILE;type=linkedin:https://linkedin.com/in/${profile.socialLinks.linkedin}`,
    profile?.socialLinks?.twitter &&
      `X-SOCIALPROFILE;type=twitter:https://twitter.com/${profile.socialLinks.twitter}`,
    profile?.website && `URL;type=work:${profile.website}`,
    profile?.calendlyLink && `URL;type=calendly:${profile.calendlyLink}`,
    'END:VCARD'
  ].filter(Boolean);
  const vCard = vCardLines.join('\n');

  const downloadVCard = useCallback(() => {
    const blob = new Blob([vCard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(profile?.name || 'profile').replace(/\s+/g, '_')}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  }, [vCard, profile?.name]);

  // Auto-hide message
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(''), 2000);
    return () => clearTimeout(t);
  }, [message]);

  // Fetch profile
  useEffect(() => {
    if (!profileId) {
      navigate('/login', { replace: true });
      return;
    }
    axios
      .get(`${API}/api/profile/${profileId}`)
      .then(res => {
        const data = res.data || {};
        setProfile(data);
        setForm({
          ...initialForm,
          ...data,
          tags: Array.isArray(data.tags) ? data.tags : [],
          socialLinks: {
            ...initialForm.socialLinks,
            ...(data.socialLinks || {})
          },
          calendlyLink: data.calendlyLink || '',
          bannerUrl: data.bannerUrl || '',
          avatarUrl: data.avatarUrl || ''
        });
        setInsightsEnabled(!!data.insightsEnabled);
        // Set qrType from backend if present
        if (data.qrType) setQrType(data.qrType);
      })
      .catch((err) => {
        setError('Profile not found or server error.');
        setProfile(null);
      })
      .finally(() => setLoading(false));
    // Fetch insights for dashboard
    axios
      .get(`${API}/api/profile/${profileId}/insights`)
      .then(res => setInsights(res.data))
      .catch(() => setInsights(null));
  }, [API, profileId, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="animate-spin-slow">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="28" stroke="#D4AF37" strokeWidth="6" opacity="0.2" />
            <path d="M44 32c0 6.627-5.373 12-12 12S20 38.627 20 32 25.373 20 32 20c2.21 0 4 1.79 4 4s-1.79 4-4 4c-2.21 0-4 1.79-4 4s1.79 4 4 4c4.418 0 8-3.582 8-8" stroke="#D4AF37" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <animateTransform attributeName="transform" type="rotate" from="0 32 32" to="360 32 32" dur="1s" repeatCount="indefinite" />
            </path>
          </svg>
        </div>
        <style>{`
          @keyframes spin-slow { 100% { transform: rotate(360deg); } }
          .animate-spin-slow { animation: spin-slow 1s linear infinite; }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-red-500">Profile not found.</div>
      </div>
    );
  }

  // --- Plan Awareness & Feature Gating ---
  const subscriptionPlan = profile?.subscription?.plan || 'Novice';
  // --- CTA Label Logic (simple example, can be improved with plan info) ---
  const ctaLabel = subscriptionPlan === 'free' ? 'Upgrade to unlock insights' : `Upgrade your plan`;
  // --- Contact Exchange Limits ---
  const contactExchangeLimit = insights?.contactExchangeLimit ?? (subscriptionPlan === 'free' ? 0 : 'Unlimited');
  const contactExchangeRemaining = insights?.contactExchangeRemaining ?? (subscriptionPlan === 'free' ? 0 : 'Unlimited');

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-white via-gray-100 to-gray-200 dark:from-black dark:via-gray-900 dark:to-gray-800">
      {/* UI Style Toggle */}
      {/* <div className="w-full max-w-md flex justify-end mb-2 pr-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
          <span>Style:</span>
          <select
            value={uiStyle}
            onChange={e => setUiStyle(e.target.value)}
            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
          >
            <option value="chrome">Chrome</option>
            <option value="classic">Classic</option>
          </select>
        </label>
      </div> */}

      {/* Card Section */}
      <div style={{ perspective: '800px' }} className="relative w-full max-w-md flex-1 flex flex-col justify-center">
        <animated.div
          style={{
            transform: rotateY.to(r => `rotateY(${r}deg)`),
            transformStyle: 'preserve-3d',
            WebkitTransformStyle: 'preserve-3d',
            transformOrigin: 'center center'
          }}
          className="relative w-full"
        >
          {/* Front Face */}
          <div
            className="relative rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: darkMode
                ? 'linear-gradient(120deg, #23272f 0%, #23272f 40%, #181a20 100%)'
                : 'linear-gradient(120deg, #f8f8f8 0%, #e6e6e6 40%, #bdbdbd 100%)',
              border: darkMode ? '1.5px solid #23272f' : '1.5px solid #bdbdbd',
              boxShadow: darkMode
                ? '0 4px 32px 0 #000a, 0 2px 0 #23272f'
                : '0 4px 32px 0 #e0e0e0cc, 0 2px 0 #bdbdbd',
              backdropFilter: 'blur(2px)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <CardContent
              API={API}
              form={form}
              editMode={editMode}
              handleChange={handleChange}
              bannerFile={bannerFile}
              avatarFile={avatarFile}
              setBannerFile={setBannerFile}
              setAvatarFile={setAvatarFile}
              uploadFile={uploadFile}
              theme={theme}
              setTheme={setTheme}
              handleThemeToggle={handleThemeToggle}
              profile={{ ...profile, slug: profileSlug }}
              setEditMode={setEditMode}
              setShowQR={setShowQR}
              copyToClipboard={copyToClipboard}
              showQR={showQR}
              downloadVCard={downloadVCard}
              isDashboard={true}
              saveProfile={saveProfile}
              handleFileInput={handleFileInput}
              uiStyle={uiStyle}
              subscription={profile.subscription}
              navigate={navigate}
            />
          </div>
          {/* Back Face (edit mode) */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: darkMode
                ? 'linear-gradient(120deg, #23272f 0%, #23272f 40%, #181a20 100%)'
                : 'linear-gradient(120deg, #f8f8f8 0%, #e6e6e6 40%, #bdbdbd 100%)',
              border: darkMode ? '1.5px solid #23272f' : '1px solid #bdbdbd',
              boxShadow: darkMode
                ? '0 4px 32px 0 #000a, 0 2px 0 #23272f'
                : '0 4px 32px 0 #e0e0e0cc, 0 2px 0 #bdbdbd',
              backdropFilter: 'blur(2px)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <CardContent
              API={API}
              form={form}
              editMode={editMode}
              handleChange={handleChange}
              bannerFile={bannerFile}
              avatarFile={avatarFile}
              setBannerFile={setBannerFile}
              setAvatarFile={setAvatarFile}
              uploadFile={uploadFile}
              theme={theme}
              setTheme={setTheme}
              handleThemeToggle={handleThemeToggle}
              profile={{ ...profile, slug: profileSlug }}
              setEditMode={setEditMode}
              setShowQR={setShowQR}
              copyToClipboard={copyToClipboard}
              showQR={showQR}
              downloadVCard={downloadVCard}
              isDashboard={true}
              saveProfile={saveProfile}
              handleFileInput={handleFileInput}
              uiStyle={uiStyle}
              subscription={profile.subscription}
              navigate={navigate}
            />
          </div>
        </animated.div>
      </div>
      {/* Insights CTA or Insights Panel */}
      <div className="w-full max-w-md flex flex-col items-center">
        {insightsEnabled && (
          <div className="relative w-full flex flex-col items-center mt-6 mb-2">
            <div className="relative w-full flex justify-center">
              <button
                className={`px-8 py-2 rounded-lg font-semibold transition shadow bg-blue-600 text-white hover:bg-blue-700 z-10 ${insights?.showInsightsCTA ? 'opacity-60 cursor-not-allowed' : ''}`}
                onClick={async (e) => {
                  if (insights?.showInsightsCTA) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  try {
                    const res = await axios.get(`${API}/api/profile/${profileId}/insights`);
                    setInsights(res.data);
                    if (!res.data?.showInsightsCTA) {
                      navigate('/dashboard/insights');
                    }
                  } catch {
                    // Optionally show error
                  }
                }}
                disabled={!!insights?.showInsightsCTA}
                tabIndex={insights?.showInsightsCTA ? -1 : 0}
                style={{ position: 'relative', minWidth: 180, pointerEvents: insights?.showInsightsCTA ? 'none' : 'auto' }}
                aria-disabled={!!insights?.showInsightsCTA}
              >
                View Insights
              </button>
              {insights?.showInsightsCTA && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm rounded-lg z-20"
                  style={{ minWidth: 180 }}
                >
                  <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg shadow text-center w-full">
                    <div className="font-bold mb-1">Insights Locked</div>
                    <div className="mb-2">Upgrade your plan to unlock profile insights and analytics.</div>
                    <button
                      className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-2 rounded-full shadow transition mt-2"
                      onClick={() => navigate('/plans')}
                    >
                      {ctaLabel}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Insert Time vs Views Graph if insights are unlocked */}
      {profile?.viewsGraphEnabled && (!insights?.showInsightsCTA && insights && Array.isArray(insights.viewCountsOverTime) && insights.viewCountsOverTime.length > 0) && (
        (() => {
          // Calculate weekly views (last 7 days)
          const now = new Date();
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 6); // 7 days including today
          const weeklyViews = insights.viewCountsOverTime
            .filter(v => {
              const d = new Date(v.date);
              // Only include dates from weekAgo (inclusive) to now (inclusive)
              return d >= weekAgo && d <= now;
            })
            .reduce((sum, v) => sum + (v.count || 0), 0);
          const weekStart = insights.viewCountsOverTime.find(v => {
            const d = new Date(v.date);
            return d >= weekAgo;
          })?.date || insights.viewCountsOverTime[0]?.date;
          const weekEnd = insights.viewCountsOverTime.slice(-1)[0]?.date;
          return (
            <div className="w-full max-w-md mt-8 mb-2 bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 flex flex-col items-center">
              <div className="flex justify-between items-center w-full mb-2 text-xs text-gray-400">
                <span>WEEKLY ACTIVITY</span>
                <span>
                  {weekStart} – {weekEnd}
                </span>
              </div>
              <div className="flex items-center w-full">
                <div className="mr-6">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{weeklyViews}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-300">Profile views</div>
                </div>
                <div className="flex-1 h-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={insights.viewCountsOverTime}>
                      <Line type="monotone" dataKey="count" stroke="#A78BFA" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          );
        })()
      )}
      {/* Render industry-wise views info card if present
      {insights?.viewsByIndustry && (
        <div className="w-full max-w-md mt-4 bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-bold mb-2">Industry-wise Views</h3>
          <ul>
            {Object.entries(insights.viewsByIndustry).map(([industry, count]) => (
              <li key={industry} className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                <span>{industry}</span>
                <span className="font-semibold">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      )} */}

      <div className="w-full max-w-md flex flex-col items-center mb-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
          <span>QR Code Type:</span>
          <select
            value={qrType}
            onChange={async e => {
              const newType = e.target.value;
              setQrType(newType);
              localStorage.setItem('qrType', newType);
              try {
                await axios.put(`${API}/api/profile/${profileId}`, { qrType: newType });
              } catch {}
            }}
            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
          >
            <option value="url">Profile URL</option>
            <option value="vcard">Contact Card (vCard)</option>
          </select>
          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400" title="Contact Card QR works offline and lets people add you to contacts even without internet. Profile URL opens your online profile (needs internet)">
            {qrType === 'vcard' ? 'Works offline for contact sharing!' : 'Opens your online profile.'}
          </span>
        </label>
      </div>

      {/* Footer Branding */}
      <footer className="w-full flex flex-col items-center justify-center mt-10 mb-4">
        <div className="w-full flex flex-col items-center max-w-xs">
         <div className="text-xl font-bold text-gray-700 dark:text-gray-200" style={{ fontFamily: 'Garet, sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            COMMA PROFILE
          </div>
          <div className="text-xs uppercase text-gray-500 dark:text-gray-500 tracking-widest mt-1" style={{ fontFamily: 'SpaceMono, monospace', fontSize: '0.8rem', letterSpacing: '0.15em' }}>
            CONTINUED RELATIONSHIPS
          </div>
        </div>
      </footer>
      {/* QR Modal and Toast remain unchanged */}
      {showQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
            <QRCode
              value={qrType === 'vcard' ? vCard : `${window.location.origin}/p/${profileSlug}`}
              size={120}
              fgColor={theme === 'dark' ? '#D4AF37' : '#000000'}
              bgColor="transparent"
            />
            <p className="mt-2 text-xs text-gray-700 dark:text-gray-300">
              {qrType === 'vcard'
                ? 'Scan to add contact (works offline)'
                : 'Scan to open profile (needs internet)'}
            </p>
            <button onClick={() => setShowQR(false)} className="mt-3 text-blue-500 dark:text-blue-400 hover:underline">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Toast Message */}
      {message && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-200 dark:bg-gray-700 px-4 py-1 rounded-full text-sm shadow">
          {message}
        </div>
      )}

      {/* Image Cropper Modal */}
      {cropperOpen && (
        <ImageCropper
          imageSrc={cropperImage}
          aspect={cropperAspect}
          onCancel={() => setCropperOpen(false)}
          onCropComplete={handleCropComplete}
        />
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeUp {
          animation: fadeUp 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}