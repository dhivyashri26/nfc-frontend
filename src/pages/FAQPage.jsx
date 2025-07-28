import React, { useState } from 'react';
import { useSpring, animated, config, useTrail } from '@react-spring/web';

const faqs = [
  {
    question: 'Is my data secure on the card?',
    answer: `Yes. The card itself doesn’t store any raw data — it only has a link with a unique ID. Your actual profile data stays securely stored on our servers. No one can steal your info by scanning the card — they’ll just view what you’ve chosen to show publicly.`
  },
  {
    question: 'Do I need an app to use it?',
    answer: `No app needed. Everything is web based. Open commacards.com, enter your activation code to activate your profile, login and start customizing your Comma Profile.`
  },
  {
    question: 'Is it compatible with all mobile phones?',
    answer: `Almost all modern smartphones support NFC or QR code scanning. Older phones without NFC can still access your profile via the QR code on the back of the card.`
  },
  {
    question: 'I already use Linktree — what’s the difference?',
    answer: `Linktree is just a link in your bio. While Comma is a physical NFC card, not a sticker or a QR code on paper or mobile. It’s a real, premium card — fully customized in design and crafted to match your personal or brand identity. You carry it, tap it, and share your info instantly in real life. No link-sharing needed — it makes real-world networking seamless and impressive. Make your first impression stronger, make yourself STAND OUT OF THE CROWD.`
  },
  {
    question: 'How long does this card last? Do you give any warranty?',
    answer: `The card’s NFC chip is passive and lasts for years with normal use. And we provide you with Comma Insurance, with tenures depending on your subscription plan.`
  },
  {
    question: 'Can I see the analytics like who tapped my card?',
    answer: `Yes — you can see insights from total views, unique viewers till advanced insights Industry wise, performance scores for your links and much more in your dashboard. We don’t reveal personal data of who tapped unless they choose to share it with you (like exchanging you their contact).`
  },
  {
    question: 'Can I deactivate the card when I don’t want to use it anymore?',
    answer: `Yes — you can deactivate your profile anytime via your dashboard. Once deactivated, the link won’t show your info.`
  },
  {
    question: 'Do you store my contact data? If yes, where and how securely?',
    answer: `Yes. Even though everything in your profile is publicly available data, it is stored on our secure, encrypted servers. We follow best practices for data privacy. Don’t worry we’d never sell your data.`
  },
  {
    question: 'What if it gets outdated in a few months?',
    answer: `You can edit and update your profile anytime — your card always points to the latest version. You don’t need a new card for updates.`
  },
  {
    question: 'What happens if I lose my card?',
    answer: `No worries — your profile link still works. You can order a replacement card anytime and link it to your existing profile without losing any data.`
  },
  {
    question: 'Do you have options for teams and enterprises?',
    answer: `Yes — we offer Comma Cards for teams and companies with fully customized design: your brand theme, logo, color palette, and UI tailored just for you. We handle bulk orders and provide custom pricing to match your requirements.`
  },
];

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState(null);
  const trail = useTrail(faqs.length, {
    opacity: 1,
    y: 0,
    from: { opacity: 0, y: 30 },
    config: config.gentle,
    delay: 200,
  });

  return (
    <div className="bg-black min-h-screen text-gray-100 py-12 px-4 relative overflow-x-hidden">
      {/* Top fade effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120vw] h-64 bg-gradient-to-br from-[#23272f]/60 via-[#181a20]/80 to-[#D4AF37]/10 blur-2xl opacity-40 pointer-events-none z-0" />
      {/* Bottom fade effect */}
      <div className="absolute bottom-0 left-0 w-full h-[35vh] bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-10" />
      <div className="max-w-3xl mx-auto relative z-20">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-10 text-[#D4AF37] drop-shadow-lg animate-fade-in">COMMA FAQ</h1>
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            const spring = useSpring({
              opacity: isOpen ? 1 : 0,
              maxHeight: isOpen ? 500 : 0,
              y: isOpen ? 0 : -10,
              config: config.stiff,
            });
            return (
              <animated.div
                key={idx}
                style={trail[idx]}
                className={`transition-all duration-300 group bg-gradient-to-br from-[#23272f]/80 to-[#181a20]/80 border border-[#D4AF37]/20 rounded-xl shadow-xl overflow-hidden ${isOpen ? 'ring-2 ring-[#D4AF37]/40' : ''}`}
                tabIndex={0}
                role="button"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${idx}`}
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setOpenIdx(isOpen ? null : idx)}
              >
                <div className="flex items-center justify-between px-6 py-5 cursor-pointer select-none">
                  <h2 className="font-semibold text-lg sm:text-xl text-[#D4AF37] flex-1 transition-colors duration-200">{idx + 1}) {faq.question}</h2>
                  <span className={`ml-4 text-2xl transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#D4AF37]' : 'text-gray-400 group-hover:text-[#D4AF37]'}`}>▼</span>
                </div>
                <animated.div
                  id={`faq-answer-${idx}`}
                  style={spring}
                  className="px-6 pb-5 text-gray-200 text-base whitespace-pre-line will-change-transform"
                  aria-hidden={!isOpen}
                >
                  {faq.answer}
                </animated.div>
              </animated.div>
            );
          })}
        </div>
        <div className="mt-12 flex flex-col items-center gap-4 animate-fade-in-up">
            <a
            href="mailto:support@commacards.com"
            className="inline-block px-8 py-3 rounded-full bg-black/80 border border-[#D4AF37]/40 text-[#D4AF37] font-bold shadow hover:bg-[#23272f] hover:text-yellow-300 transition"
            style={{backdropFilter: 'blur(4px)'}}
          >
            Still have questions? Contact Us
          </a>
          <a href="/" className="inline-block px-8 py-3 rounded-full bg-[#D4AF37] text-black font-bold shadow hover:bg-[#b4972a] transition">Back to Home</a>
        </div>
      </div>
    </div>
  );
}
