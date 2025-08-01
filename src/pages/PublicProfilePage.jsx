// src/pages/PublicProfilePage.jsx

import React, { useEffect, useState } from 'react';
import '../comma-branding.css';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  FaEnvelope,
  FaPhone,
  FaInstagram,
  FaLinkedin,
  FaTwitter,
  FaGlobe,
  FaMapMarkerAlt,
  FaRegCopy,
  FaMoon,
  FaSun,
  FaSave,
  FaStar, // <-- add star icon for badge
  FaExchangeAlt,
  FaDownload,
  FaCalendarAlt
} from 'react-icons/fa';
import { MdQrCode } from 'react-icons/md';
import QRCode from 'react-qr-code';
import { useTheme } from '../App';
import { useSpring, useTransition, animated } from '@react-spring/web';
import ContactForm from '../components/ContactForm';

// Subscription-based field restrictions
const PLAN_FIELDS = {
  Novice: ['name', 'title', 'subtitle', 'tags', 'phone', 'linkedin'],
  Corporate: ['name', 'title', 'subtitle', 'tags', 'phone', 'linkedin', 'industry', 'website', 'calendlyLink'],
  Elite: [] // All fields available
};

// Reusable ContactRow component
function ContactRow({ icon, label, value, href, onCopy, isTopLink }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => postLinkTap(href)}
      className={`flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-900 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition ${isTopLink ? 'ring-2 ring-yellow-400' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className="text-xl text-[#FFC300]">{icon}</div>
        <div className="text-left">
          <p className="font-medium text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1">
            {label}
            {isTopLink && <span className="ml-1 px-2 py-0.5 rounded-full bg-yellow-200 text-yellow-900 text-xs font-bold">Top</span>}
          </p>
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
}

// Badge component for both faces
function FoundersStackBadge({ number }) {
  if (!number) return null;
  return (
    <div className="absolute" style={{ left: '0.5rem', top: '0.5rem', zIndex: 9999 }}>
      <div
        className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-yellow-400 shadow-sm"
        style={{
          background: 'linear-gradient(90deg, #FFD700 80%, #fff8 100%)',
          boxShadow: '0 1px 4px 0 rgba(0,0,0,0.08)',
          fontWeight: 600,
          fontSize: '0.78rem',
          letterSpacing: '0.01em',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#FFD700',
        }}
      >
        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-yellow-400 border border-yellow-300 shadow" style={{ boxShadow: '0 1px 2px #FFD70033' }}>
          <FaStar style={{ color: '#fff', fontSize: '0.75em', filter: 'drop-shadow(0 0 1px #FFD700)' }} />
        </span>
        <span style={{ color: '#222', fontWeight: 700, fontSize: '0.85em', marginLeft: 3, marginRight: 3 }}>
          Founders&apos; Stack
        </span>
        <span style={{ marginLeft: 3, fontWeight: 800, fontSize: '0.85em', color: '#fff', background: '#222', borderRadius: 4, padding: '0 5px', letterSpacing: '0.01em', boxShadow: '0 1px 2px #FFD70033' }}>
          #{number}
        </span>
      </div>
    </div>
  );
}

export default function PublicProfilePage() {
  const { activationCode } = useParams();
  const API = import.meta.env.VITE_API_BASE_URL || 'https://nfc-backend-9c1q.onrender.com';
  const FRONTEND = import.meta.env.VITE_FRONTEND_BASE_URL || window.location.origin;
  const { theme, setTheme } = useTheme();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [msg, setMsg] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [insights, setInsights] = useState(null);
  const [qrType, setQrType] = useState(() => localStorage.getItem('qrType') || 'url');

  // Contact form state
  const [form, setForm] = useState({
    name: '',
    email: '',
    event: '',
    date: '',
    place: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState({ loading: false, error: '', success: '' });

  // Dark mode detection
  const [darkMode, setDarkMode] = useState(theme === 'dark');
  useEffect(() => setDarkMode(theme === 'dark'), [theme]);

  // UI Style toggle for public profile
  const [uiStyle, setUiStyle] = useState(() => localStorage.getItem('uiStyle') || 'chrome');
  useEffect(() => { localStorage.setItem('uiStyle', uiStyle); }, [uiStyle]);

  // Card flip animation
  const { rotateY } = useSpring({
    rotateY: darkMode ? 180 : 0,
    config: { tension: 200, friction: 20 }
  });

  // Modal fade animation
  const modalTransition = useTransition(modalOpen, {
    from: { opacity: 0, transform: 'scale(0.9)' },
    enter: { opacity: 1, transform: 'scale(1)' },
    leave: { opacity: 0, transform: 'scale(0.9)' },
    config: { tension: 300, friction: 25 }
  });

  // Fetch public profile and insights in parallel, set loading to false as soon as profile is fetched
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([
      axios.get(`${API}/api/public/${activationCode}`),
      axios.get(`${API}/api/public/${activationCode}/insights`).catch(() => null)
    ]).then(([profileRes, insightsRes]) => {
      if (!isMounted) return;
      setProfile(profileRes.data);
      setInsights(insightsRes ? insightsRes.data : null);
    }).catch(() => {
      if (!isMounted) return;
      setProfile(null);
      setInsights(null);
    }).finally(() => {
      if (!isMounted) return;
      setLoading(false);
    });
    return () => { isMounted = false; };
  }, [activationCode, API]);

  // Add debug log for profile
  useEffect(() => {
    if (profile) console.log('Profile:', profile);
  }, [profile]);

  // After fetching the profile, set the theme from profile.theme
  useEffect(() => {
    if (profile?.theme) {
      setTheme(profile.theme);
    }
  }, [profile?.theme, setTheme]);

  // Only destructure profile fields after loading is complete and profile is not null
  let bannerUrl = '', avatarUrl = '', name = '', title = '', subtitle = '', tags = [], location = '', email = '', phone = '', website = '', calendlyLink = '', socialLinks = {}, createdAt = '', industry = '', exclusiveBadge = undefined;
  if (!loading && profile) {
    ({
      bannerUrl = '',
      avatarUrl = '',
      name = '',
      title = '',
      subtitle = '',
      tags = [],
      location = '',
      email = '',
      phone = '',
      website = '',
      calendlyLink = '',
      socialLinks = {},
      createdAt = '',
      industry = '',
      exclusiveBadge = undefined
    } = profile);
  }

  // Copy helper
  const copyToClipboard = txt => {
    navigator.clipboard.writeText(txt);
    setMsg('Copied!');
    setTimeout(() => setMsg(''), 1500);
  };

  // Contact form handlers
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async e => {
    e.preventDefault();
    setFormStatus({ loading: true, error: '', success: '' });
    try {
      await axios.post(`${API}/api/contact/${activationCode}`, form);
      setFormStatus({ loading: false, error: '', success: 'Message sent!' });
      setForm({ name: '', email: '', event: '', date: '', place: '', message: '' });
    } catch (err) {
      setFormStatus({
        loading: false,
        error: err.response?.data?.message || 'Send failed',
        success: ''
      });
    }
  };

  // Helper to POST link tap
  const postLinkTap = async (link) => {
    try {
      await axios.post(`${API}/api/public/${activationCode}/link-tap`, { link });
      // Only refetch insights, not the profile
      setTimeout(() => {
        axios.get(`${API}/api/public/${activationCode}/insights`).then(res => setInsights(res.data));
      }, 300);
    } catch (e) {
      // Ignore errors for UX
    }
  };

  // Helper to get the correct profile URL (customSlug or activationCode)
  const getProfileUrl = () => {
    const slug = profile.customSlug || activationCode;
    return `${FRONTEND.replace(/\/$/, '')}/p/${slug}`;
  };

  // Add a helper to generate vCard string
  const getVCardString = () => [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${name}`,
    `TITLE:${title || ''}`,
    `ORG:${subtitle || ''}`,
    `EMAIL;TYPE=work:${email || ''}`,
    phone && `TEL;TYPE=CELL:${phone}`,
    website && `URL;type=work:${website}`,
    socialLinks.instagram && `X-SOCIALPROFILE;type=instagram:https://instagram.com/${socialLinks.instagram}`,
    socialLinks.linkedin && `X-SOCIALPROFILE;type=linkedin:https://linkedin.com/in/${socialLinks.linkedin}`,
    socialLinks.twitter && `X-SOCIALPROFILE;type=twitter:https://twitter.com/${socialLinks.twitter}`,
    'END:VCARD'
  ].filter(Boolean).join('\n');

  // Determine top link from insights
  const topLink = insights?.topLink;
  const mostPopularContactMethod = insights?.mostPopularContactMethod;
  const totalLinkTaps = insights?.totalLinkTaps;

  // Update isElite logic
  const isElite = profile?.subscription?.plan === 'Elite' || insights?.subscription?.plan === 'Elite';

  // Download vCard helper
  const downloadVCard = async () => {
    try {
      await axios.post(`${API}/api/public/${activationCode}/contact-download`);
    } catch (e) {
      // Ignore errors for UX
    }
    const vCard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${name}`,
      `TITLE:${title || ''}`,
      `ORG:${subtitle || ''}`,
      `EMAIL;TYPE=work:${email || ''}`,
      phone && `TEL;TYPE=CELL:${phone}`,
      `URL:${FRONTEND}/p/${activationCode}`,
      socialLinks.instagram && `X-SOCIALPROFILE;type=instagram:https://instagram.com/${socialLinks.instagram}`,
      socialLinks.linkedin && `X-SOCIALPROFILE;type=linkedin:https://linkedin.com/in/${socialLinks.linkedin}`,
      socialLinks.twitter && `X-SOCIALPROFILE;type=twitter:https://twitter.com/${socialLinks.twitter}`,
      website && `URL;type=work:${website}`,
      calendlyLink && `URL;type=calendly:${calendlyLink}`,
      'END:VCARD'
    ]
      .filter(Boolean)
      .join('\n');
    const blob = new Blob([vCard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/\s+/g, '_')}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Card content JSX
  const CardContent = () => (
    <>
      {/* Insights Section - removed from public profile */}
      {/* Theme toggle */}
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full shadow hover:scale-105 transition"
        >
          {theme === 'dark' ? <FaSun className="text-yellow-400" /> : <FaMoon className="text-gray-800" />}
        </button>
      </div>
      {/* Card container with rounded corners */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: darkMode
            ? 'linear-gradient(120deg, #232323 0%, #444 40%, #111 100%)'
            : 'linear-gradient(120deg, #f8f8f8 0%, #e6e6e6 40%, #bdbdbd 100%)',
          border: darkMode ? '1.5px solid #444' : '1.5px solid #bdbdbd',
          boxShadow: darkMode
            ? '0 4px 32px 0 #111a, 0 2px 0 #444'
            : '0 4px 32px 0 #e0e0e0cc, 0 2px 0 #bdbdbd',
          backdropFilter: 'blur(2px)',
        }}>
        {/* COMMA Branding for Novice profiles */}
        {profile?.subscription?.plan === 'Novice' && (
          <div className="comma-branding">COMMA,</div>
        )}
        {/* Banner & Avatar */}
        <div className="h-32 bg-gray-300 dark:bg-gray-600 relative rounded-t-2xl overflow-visible">
          {bannerUrl && (
            <img
              src={bannerUrl.startsWith('http') ? bannerUrl : `${API}${bannerUrl}`}
              alt="Banner"
              className="w-full h-full object-cover rounded-t-2xl"
            />
          )}
          {avatarUrl && (
            <img
              src={avatarUrl.startsWith('http') ? avatarUrl : `${API}${avatarUrl}`}
              alt="Avatar"
              className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 shadow-lg object-cover"
              style={{zIndex: 10}}
            />
          )}
        </div>
        {/* Main Info */}
        <div className="px-6 pt-14 pb-2 text-center">
          <h1 className="text-2xl font-bold dark:text-white">{name}</h1>
          {title && <p className="mt-0 text-base font-medium text-gray-700 dark:text-gray-300">{title}</p>}
          {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
          {/* Industry */}
          {industry && (isElite || PLAN_FIELDS[profile?.subscription?.plan || 'Novice']?.includes('industry')) && (
            <div className="flex justify-center mt-2">
              <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-blue-400 via-blue-600 to-blue-800 text-white text-xs font-semibold shadow-lg border border-blue-300 dark:border-blue-700 tracking-wide">
                {industry}
              </span>
            </div>
          )}
          {/* Tags */}
          {tags.length > 0 && (isElite || PLAN_FIELDS[profile?.subscription?.plan || 'Novice']?.includes('tags')) && (
            <div className="flex flex-wrap justify-center gap-1 mt-2">
              {tags.map(t => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-lg text-xs font-semibold shadow border border-gray-300 dark:border-gray-700 tracking-wide"
                  style={{
                    background: darkMode
                      ? 'linear-gradient(120deg, #232323 0%, #444 40%, #111 100%)'
                      : 'linear-gradient(120deg, #e6e6e6 0%, #f5f5f5 40%, #bdbdbd 100%)',
                    color: darkMode ? '#e0e0e0' : '#232323',
                    textShadow: darkMode ? '0 1px 2px #0008, 0 0.5px 0 #444' : '0 1px 2px #fff8, 0 0.5px 0 #bdbdbd',
                    boxShadow: darkMode
                      ? '0 2px 8px 0 #111a, 0 1.5px 0 #444'
                      : '0 2px 8px 0 #e0e0e0cc, 0 1.5px 0 #bdbdbd',
                    border: darkMode ? '1px solid #444' : '1px solid #bdbdbd',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          {/* Location */}
          {location && (isElite) && (
            <div className="flex justify-center mt-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-pink-400 via-pink-600 to-pink-800 text-white text-xs font-semibold shadow-lg border border-pink-300 dark:border-pink-700 tracking-wide hover:underline flex items-center gap-1"
                title={`View ${location} on Google Maps`}
              >
                <FaMapMarkerAlt className="inline mr-1" />{location}
              </a>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-6 mt-2 flex gap-2">
          <button
            onClick={() => setShowQR(true)}
            className="flex-1 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 text-white py-1.5 rounded-lg flex items-center justify-center gap-1 shadow hover:scale-105 transition text-sm"
          >
            <MdQrCode /> QR Code
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex-1 bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white py-1.5 rounded-lg flex items-center justify-center gap-1 shadow hover:scale-105 transition text-sm"
          >
            <FaExchangeAlt /> Exchange
          </button>
          <button
            onClick={downloadVCard}
            className="w-8 h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-400 dark:from-gray-600 dark:via-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center shadow hover:scale-105 transition"
          >
            <FaDownload />
          </button>
        </div>

        {/* Contact Rows */}
        <div className="px-6 mt-4 space-y-2">
          {/* Email - always shown */}
          {email && (
            <a
              href={`mailto:${email}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-3 py-2 rounded-lg text-gray-900 text-sm font-semibold tracking-wide mb-2 shadow border border-gray-300 dark:border-gray-700 transition hover:scale-[1.025] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-[#FFC300] flex items-center gap-2"
              style={{
                background: darkMode
                  ? 'linear-gradient(120deg, #232323 0%, #444 40%, #111 100%)'
                  : 'linear-gradient(120deg, #f8f8f8 0%, #e6e6e6 40%, #bdbdbd 100%)',
                color: darkMode ? '#e0e0e0' : '#232323',
                textShadow: darkMode ? '0 1px 2px #0008, 0 0.5px 0 #444' : '0 1px 2px #fff8, 0 0.5px 0 #bdbdbd',
                boxShadow: darkMode
                  ? '0 2px 8px 0 #111a, 0 1.5px 0 #444'
                  : '0 2px 8px 0 #e0e0e0cc, 0 1.5px 0 #bdbdbd',
                border: darkMode ? '1px solid #444' : '1px solid #bdbdbd',
                minHeight: '44px',
              }}
            >
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 min-w-[60px]">Email</span>
              <FaEnvelope className="mr-2 text-blue-500 dark:text-blue-400" />{email}
            </a>
          )}
          {/* Phone */}
          {phone && (isElite || PLAN_FIELDS[profile?.subscription?.plan || 'Novice']?.includes('phone')) && (
            <a
              href={`tel:${phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-3 py-2 rounded-lg text-gray-900 text-sm font-semibold tracking-wide mb-2 shadow border border-gray-300 dark:border-gray-700 transition hover:scale-[1.025] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-[#FFC300] flex items-center gap-2"
              style={{
                background: darkMode
                  ? 'linear-gradient(120deg, #232323 0%, #444 40%, #111 100%)'
                  : 'linear-gradient(120deg, #f8f8f8 0%, #e6e6e6 40%, #bdbdbd 100%)',
                color: darkMode ? '#e0e0e0' : '#232323',
                textShadow: darkMode ? '0 1px 2px #0008, 0 0.5px 0 #444' : '0 1px 2px #fff8, 0 0.5px 0 #bdbdbd',
                boxShadow: darkMode
                  ? '0 2px 8px 0 #111a, 0 1.5px 0 #444'
                  : '0 2px 8px 0 #e0e0e0cc, 0 1.5px 0 #bdbdbd',
                border: darkMode ? '1px solid #444' : '1px solid #bdbdbd',
                minHeight: '44px',
              }}
            >
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 min-w-[60px]">Phone</span>
              <FaPhone className="mr-2 text-green-500 dark:text-green-400" />{phone}
            </a>
          )}
          {/* Website */}
          {website && (isElite || PLAN_FIELDS[profile?.subscription?.plan || 'Novice']?.includes('website')) && (
            <a
              href={website.startsWith('http') ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { postLinkTap(website.startsWith('http') ? website : `https://${website}`); }}
              className="block w-full px-3 py-2 rounded-lg text-gray-900 text-sm font-semibold tracking-wide mb-2 shadow border border-gray-300 dark:border-gray-700 transition hover:scale-[1.025] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-[#FFC300] flex items-center gap-2"
              style={{
                background: darkMode
                  ? 'linear-gradient(120deg, #232323 0%, #444 40%, #111 100%)'
                  : 'linear-gradient(120deg, #f8f8f8 0%, #e6e6e6 40%, #bdbdbd 100%)',
                color: darkMode ? '#e0e0e0' : '#232323',
                textShadow: darkMode ? '0 1px 2px #0008, 0 0.5px 0 #444' : '0 1px 2px #fff8, 0 0.5px 0 #bdbdbd',
                boxShadow: darkMode
                  ? '0 2px 8px 0 #111a, 0 1.5px 0 #444'
                  : '0 2px 8px 0 #e0e0e0cc, 0 1.5px 0 #bdbdbd',
                border: darkMode ? '1px solid #444' : '1px solid #bdbdbd',
                minHeight: '44px',
              }}
            >
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 min-w-[60px]">Website</span>
          <FaGlobe className="mr-2 text-purple-500 dark:text-purple-400" />{website}
        </a>
      )}
          {/* Calendly
          {calendlyLink && (isElite || PLAN_FIELDS[profile?.subscription?.plan || 'Novice']?.includes('calendlyLink')) && (
            <a
              href={calendlyLink.startsWith('http') ? calendlyLink : `https://${calendlyLink}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { postLinkTap(calendlyLink.startsWith('http') ? calendlyLink : `https://${calendlyLink}`); }}
              className="block w-full px-3 py-2 rounded-lg text-gray-900 text-sm font-semibold tracking-wide mb-2 shadow border border-gray-300 dark:border-gray-700 transition hover:scale-[1.025] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-[#FFC300] flex items-center gap-2"
              style={{
                background: darkMode
                  ? 'linear-gradient(120deg, #232323 0%, #444 40%, #111 100%)'
                  : 'linear-gradient(120deg, #f8f8f8 0%, #e6e6e6 40%, #bdbdbd 100%)',
                color: darkMode ? '#e0e0e0' : '#232323',
                textShadow: darkMode ? '0 1px 2px #0008, 0 0.5px 0 #444' : '0 1px 2px #fff8, 0 0.5px 0 #bdbdbd',
                boxShadow: darkMode
                  ? '0 2px 8px 0 #111a, 0 1.5px 0 #444'
                  : '0 2px 8px 0 #e0e0e0cc, 0 1.5px 0 #bdbdbd',
                border: darkMode ? '1px solid #444' : '1px solid #bdbdbd',
                minHeight: '44px',
              }}
            >
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 min-w-[60px]">Calendly</span>
              <FaCalendarAlt className="mr-2 text-indigo-500 dark:text-indigo-400" />{calendlyLink}
            </a>
          )} */}

          {/* Instagram */}
          {socialLinks.instagram && (isElite) && (
            <a
              href={`https://instagram.com/${socialLinks.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { postLinkTap(`https://instagram.com/${socialLinks.instagram}`); }}
              className="block w-full px-3 py-2 rounded-lg text-gray-900 text-sm font-semibold tracking-wide mb-2 shadow border border-gray-300 dark:border-gray-700 transition hover:scale-[1.025] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-[#FFC300] flex items-center gap-2"
              style={{
                background: darkMode
                  ? 'linear-gradient(120deg, #232323 0%, #444 40%, #111 100%)'
                  : 'linear-gradient(120deg, #f8f8f8 0%, #e6e6e6 40%, #bdbdbd 100%)',
                color: darkMode ? '#e0e0e0' : '#232323',
                textShadow: darkMode ? '0 1px 2px #0008, 0 0.5px 0 #444' : '0 1px 2px #fff8, 0 0.5px 0 #bdbdbd',
                boxShadow: darkMode
                  ? '0 2px 8px 0 #111a, 0 1.5px 0 #444'
                  : '0 2px 8px 0 #e0e0e0cc, 0 1.5px 0 #bdbdbd',
                border: darkMode ? '1px solid #444' : '1px solid #bdbdbd',
                minHeight: '44px',
              }}
            >
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 min-w-[60px]">Instagram</span>
              <FaInstagram className="mr-2 text-pink-500 dark:text-pink-400" />{socialLinks.instagram}
            </a>
          )}
          {/* LinkedIn */}
          {socialLinks.linkedin && (isElite || PLAN_FIELDS[profile?.subscription?.plan || 'Novice']?.includes('linkedin')) && (
            <a
              href={`https://linkedin.com/in/${socialLinks.linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { postLinkTap(`https://linkedin.com/in/${socialLinks.linkedin}`); }}
              className="block w-full px-3 py-2 rounded-lg text-gray-900 text-sm font-semibold tracking-wide mb-2 shadow border border-gray-300 dark:border-gray-700 transition hover:scale-[1.025] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-[#FFC300] flex items-center gap-2"
              style={{
                background: darkMode
                  ? 'linear-gradient(120deg, #232323 0%, #444 40%, #111 100%)'
                  : 'linear-gradient(120deg, #f8f8f8 0%, #e6e6e6 40%, #bdbdbd 100%)',
                color: darkMode ? '#e0e0e0' : '#232323',
                textShadow: darkMode ? '0 1px 2px #0008, 0 0.5px 0 #444' : '0 1px 2px #fff8, 0 0.5px 0 #bdbdbd',
                boxShadow: darkMode
                  ? '0 2px 8px 0 #111a, 0 1.5px 0 #444'
                  : '0 2px 8px 0 #e0e0e0cc, 0 1.5px 0 #bdbdbd',
                border: darkMode ? '1px solid #444' : '1px solid #bdbdbd',
                minHeight: '44px',
              }}
            >
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 min-w-[60px]">LinkedIn</span>
              <FaLinkedin className="mr-2 text-blue-700 dark:text-blue-300" />{socialLinks.linkedin}
            </a>
          )}
          {/* Twitter */}
          {socialLinks.twitter && (isElite) && (
            <a
              href={`https://twitter.com/${socialLinks.twitter}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { postLinkTap(`https://twitter.com/${socialLinks.twitter}`); }}
              className="block w-full px-3 py-2 rounded-lg text-gray-900 text-sm font-semibold tracking-wide mb-2 shadow border border-gray-300 dark:border-gray-700 transition hover:scale-[1.025] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-[#FFC300] flex items-center gap-2"
              style={{
                background: darkMode
                  ? 'linear-gradient(120deg, #232323 0%, #444 40%, #111 100%)'
                  : 'linear-gradient(120deg, #f8f8f8 0%, #e6e6e6 40%, #bdbdbd 100%)',
                color: darkMode ? '#e0e0e0' : '#232323',
                textShadow: darkMode ? '0 1px 2px #0008, 0 0.5px 0 #444' : '0 1px 2px #fff8, 0 0.5px 0 #bdbdbd',
                boxShadow: darkMode
                  ? '0 2px 8px 0 #111a, 0 1.5px 0 #444'
                  : '0 2px 8px 0 #e0e0e0cc, 0 1.5px 0 #bdbdbd',
                border: darkMode ? '1px solid #444' : '1px solid #bdbdbd',
                minHeight: '44px',
              }}
            >
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 min-w-[60px]">Twitter</span>
              <FaTwitter className="mr-2 text-blue-400 dark:text-blue-200" />{socialLinks.twitter}
            </a>
          )}
        </div>

        {/* Calendly
        {calendlyLink && (isElite || PLAN_FIELDS[profile?.subscription?.plan || 'Novice']?.includes('calendlyLink')) && (
            <a href={calendlyLink.startsWith('http') ? calendlyLink : `https://${calendlyLink}`}target="_blank"
            rel="noopener noreferrer" onClick={() => postLinkTap(calendlyLink.startsWith('http') ? calendlyLink : `https://${calendlyLink}`)}
            className="block w-full px-4 py-3 rounded-lg text-sm font-semibold tracking-wide mb-2 shadow border transition flex items-center justify-between gap-2 hover:scale-[1.025] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-[#FFC300]"
            style={{
              background: darkMode ? 'linear-gradient(120deg, #232323 0%, #444 40%, #111 100%)'
                        : 'linear-gradient(120deg, #f8f8f8 0%, #e6e6e6 40%, #bdbdbd 100%)',
              color: darkMode ? '#e0e0e0' : '#232323',
              textShadow: darkMode ? '0 1px 2px #0008' : '0 1px 2px #fff8',
              boxShadow: darkMode ? '0 2px 8px 0 #111a, 0 1.5px 0 #444'
              : '0 2px 8px 0 #e0e0e0cc, 0 1.5px 0 #bdbdbd',
              border: darkMode ? '1px solid #444' : '1px solid #bdbdbd',
              minHeight: '44px',
          }}>
            <FaCalendarAlt className="text-indigo-500 dark:text-indigo-400" />
            <span className="text-sm font-medium">
            Schedule a meeting
            </span>
        </a>
      )} */}

        {/* Schedule Button */}
        {calendlyLink && (isElite || PLAN_FIELDS[profile?.subscription?.plan || 'Novice']?.includes('calendlyLink')) && (
          <div className="px-6 mt-2 flex gap-2">
            <button onClick={() => window.open(
              calendlyLink.startsWith('http') ? calendlyLink : `https://${calendlyLink}`,
              '_blank'
            )}
            className="flex-1 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 text-white py-1.5 rounded-lg flex items-center justify-center gap-1 shadow hover:scale-105 transition text-sm"
            >
              <FaCalendarAlt /> Schedule Meet
            </button>
          </div>
        )}

        {/* Member Since */}
        <div className="px-6 pt-4 pb-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Member since {createdAt ? new Date(createdAt).toLocaleDateString('en-GB') : ''}
          </p>
        </div>
      </div>
    </>
  );

  // Show loading animation while fetching profile
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

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-white via-gray-100 to-gray-200 dark:from-black dark:via-gray-900 dark:to-gray-800">
      <div style={{ perspective: '800px' }} className="w-full max-w-md relative">
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
            className="relative bg-white/20 dark:bg-gray-900/20 backdrop-blur-lg border border-white/30 dark:border-gray-700 rounded-2xl shadow-2xl overflow-visible"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <FoundersStackBadge number={exclusiveBadge?.text ? exclusiveBadge.text.replace(/^#?/, '') : undefined} />
            <CardContent />
          </div>
          {/* Back Face */}
          <div
            className="absolute inset-0 bg-white/20 dark:bg-gray-900/20 backdrop-blur-lg border border-white/30 dark:border-gray-700 rounded-2xl overflow-visible"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <FoundersStackBadge number={exclusiveBadge?.text ? exclusiveBadge.text.replace(/^#?/, '') : undefined} />
            <CardContent />
          </div>
        </animated.div>
      </div>
      
     
      {/* Branding Footer */}
      <footer className="w-full flex flex-col items-center justify-center mt-auto py-4">
        <div className="text-xl font-bold text-gray-700 dark:text-gray-200" style={{ fontFamily: 'Garet, sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          COMMA PROFILE
        </div>
        <div className="text-xs uppercase text-gray-500 dark:text-gray-500 tracking-widest mt-1" style={{ fontFamily: 'SpaceMono, monospace', fontSize: '0.8rem', letterSpacing: '0.15em' }}>
          CONTINUED RELATIONSHIPS
        </div>
        <a
          href="https://commacards.com"
          className="mt-1 inline-block text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          Learn More →
        </a>
      </footer>

      {/* Modal with Fade In/Out */}
      {modalTransition((style, item) =>
        item && (
          <animated.div style={style} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <animated.div
              style={style}
              className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-gray-900 dark:text-gray-100"
            >
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
              <h2 className="mb-4 text-xl font-semibold">Help them remember you better. Add a short message along with when & where you met</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm">Your Name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="So they remember you — e.g. Jane Doe"
                    className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm">Your Email</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="e.g. jane@email.com"
                    className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm">Where did we meet?</label>
                    <input
                      name="event"
                      value={form.event}
                      onChange={handleChange}
                      placeholder="e.g. TEDx IITM"
                      className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Date</label>
                    <input
                      name="date"
                      type="date"
                      value={form.date}
                      onChange={handleChange}
                      className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm">City/Venue</label>
                  <input
                    name="place"
                    value={form.place}
                    onChange={handleChange}
                    placeholder="e.g. Bangalore"
                    className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm">Message</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Add a personal touch or reminder"
                    className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-400"
                  />
                </div>
                {formStatus.error && <p className="text-red-600">{formStatus.error}</p>}
                {formStatus.success && <p className="text-green-600">{formStatus.success}</p>}
                <button
                  type="submit"
                  disabled={formStatus.loading}
                  className="w-full py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
                >
                  {formStatus.loading ? 'Sending…' : 'Connect'}
                </button>
              </form>
            </animated.div>
          </animated.div>
        )
      )}

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
            <QRCode
              value={qrType === 'vcard' ? getVCardString() : getProfileUrl()}
              size={120}
              fgColor={theme === 'dark' ? '#D4AF37' : '#000000'}
              bgColor="transparent"
            />
            <p className="mt-2 text-xs text-gray-700 dark:text-gray-300">
              {qrType === 'vcard'
                ? 'Scan to add contact (works offline)'
                : 'Scan to open profile (needs internet)'}
            </p>
            <button
              onClick={() => setShowQR(false)}
              className="mt-3 text-blue-500 dark:text-blue-400 hover:underline"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Flash copy message */}
      {msg && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-full text-sm shadow">
          {msg}
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeUp { animation: fadeUp 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
}