import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaBolt, 
  FaUser, 
  FaHandshake, 
  FaArrowDown, 
  FaPhoneAlt, 
  FaWhatsapp, 
  FaEnvelope 
} from 'react-icons/fa';
import { useSpring, useTrail, animated, config } from '@react-spring/web';
import ReactDOM from 'react-dom';
import '../index.css';

function AnimatedWave({ height = 60, amplitude = 8, speed = 0.8, points = 6 }) {
  const [d, setD] = useState('');
  const frame = useRef(0);

  useEffect(() => {
    let running = true;
    const animate = () => {
      if (!running) return;
      frame.current += speed;
      const wavePoints = [];
      for (let i = 0; i <= points; i++) {
        const x = (i / points) * 1440;
        const theta = (i / points) * Math.PI * 2;
        const y =
          height / 2 +
          Math.sin(theta + frame.current * 0.04) * amplitude +
          Math.sin(theta * 2 + frame.current * 0.07) * amplitude * 0.5;
        wavePoints.push(`${x},${y.toFixed(2)}`);
      }
      const path = [
        'M' + wavePoints[0],
        ...wavePoints.slice(1).map((pt) => 'L' + pt),
        `L1440,${height}`,
        'L0,' + height,
        'Z',
      ].join(' ');
      setD(path);
      requestAnimationFrame(animate);
    };
    animate();
    return () => { running = false; };
  }, [height, amplitude, speed, points]);

  return (
    <svg viewBox={`0 0 1440 ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-10">
      <path d={d} fill="url(#waveGradient)" />
      <defs>
        <linearGradient id="waveGradient" x1="0" y1="0" x2="1440" y2="0">
          <stop stopColor="#23272f" />
          <stop offset="0.5" stopColor="#444" />
          <stop offset="1" stopColor="#181a20" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function InteractiveCard({ icon, title, description, className = '', ...props }) {
  const [active, setActive] = useState(false);
  return (
    <div
      className={`
        relative bg-gradient-to-br from-[#23272f]/70 to-[#181a20]/70 backdrop-blur-xl
        border border-white/10 rounded-2xl p-8 flex flex-col items-center
        shadow-2xl transition-all duration-300 transform
        hover:scale-105 hover:-translate-y-2 hover:shadow-[0_8px_32px_0_rgba(212,175,55,0.15)]
        focus:scale-105 focus:-translate-y-2 focus:shadow-[0_8px_32px_0_rgba(212,175,55,0.15)]
        active:scale-95 active:shadow-[0_4px_16px_0_rgba(212,175,55,0.25)]
        outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]
        ${className}
      `}
      tabIndex={0}
      role="button"
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      onTouchStart={() => setActive(true)}
      onTouchEnd={() => setActive(false)}
      {...props}
    >
      <div className={`text-[#D4AF37] text-4xl mb-2 transition-transform duration-300 ${active ? 'animate-bounceOnce' : ''}`}>
        {icon}
      </div>
      <h3 className="font-semibold text-gray-100 text-xl mb-2 text-center">{title}</h3>
      <p className="text-gray-300 text-base text-center">{description}</p>
    </div>
  );
}

function ContactUsCTA() {
  return (
    <div
      className="relative bg-gradient-to-br from-yellow-100/10 to-yellow-400/10 backdrop-blur-xl
      border border-yellow-200/20 rounded-2xl p-4 sm:p-8 md:p-10 flex flex-col items-center shadow-2xl w-full max-w-xl mx-auto text-center animate-scroll-fade-up
      transition-transform duration-500 ease-in-out"
      tabIndex={0}
      aria-label="Contact Us Card"
      role="region"
    >
      <h2 className="text-2xl sm:text-3xl font-bold text-[#D4AF37] mb-4">
        Have questions or need help?
      </h2>
      <p className="text-gray-300 text-sm sm:text-base mb-6">
        Our team is here to help you get the most out of your commaCard experience. Reach out anytime!
      </p>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full justify-center">
        <a
          href="tel:+917338781505"
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full
            bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold shadow-xl
            hover:shadow-2xl hover:scale-105 focus:scale-105 active:scale-95 transition-all text-lg
            focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
          aria-label="Call us"
        >
          <FaPhoneAlt className="text-xl" /> Call
        </a>
        <a
          href="https://wa.me/18653862733"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full
            bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold shadow-xl
            hover:shadow-2xl hover:scale-105 focus:scale-105 active:scale-95 transition-all text-lg
            focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]"
          aria-label="WhatsApp us"
        >
          <FaWhatsapp className="text-xl" /> WhatsApp
        </a>
        <a
          href="mailto:support@commacards.com"
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full
            bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold shadow-xl
            hover:shadow-2xl hover:scale-105 focus:scale-105 active:scale-95 transition-all text-lg
            focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          aria-label="Email us"
        >
          <FaEnvelope className="text-xl" /> Mail
        </a>
      </div>
    </div>
  );
}

function FAQCTA() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const spring = useSpring({
    scale: hovered ? 1.04 : 1,
    boxShadow: hovered
      ? '0 8px 32px 0 rgba(212,175,55,0.18)'
      : '0 4px 16px 0 rgba(212,175,55,0.10)',
    config: config.wobbly,
  });
  const handleClick = () => {
    navigate('/faq');
    setTimeout(() => {
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
    }, 0);
  };
  return (
    <animated.div
      style={spring}
      className="relative bg-gradient-to-br from-[#23272f]/80 to-[#181a20]/80 border border-[#D4AF37]/30 rounded-2xl p-6 sm:p-8 flex flex-col items-center shadow-2xl w-full max-w-xl mx-auto text-center mt-8 cursor-pointer transition-all"
      tabIndex={0}
      aria-label="FAQ Card"
      role="region"
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <div className="flex items-center justify-center mb-3">
        <span className="text-2xl font-bold text-[#D4AF37]">Frequently Asked Questions (FAQs)</span>
      </div>
      <p className="text-gray-300 text-base mb-2">Check out our most frequently asked questions about Comma Cards, security, compatibility, analytics, and more.</p>
      <button
        className="mt-2 px-6 py-2 rounded-full bg-[#D4AF37] text-black font-bold shadow hover:bg-[#b4972a] transition"
        tabIndex={-1}
      >
        View FAQ
      </button>
    </animated.div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const cardRef = useRef(null);
  const contactRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  const entry = useSpring({
    from: { opacity: 0, transform: 'scale(0.9)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: config.molasses,
    delay: 200,
  });

  const [{ xys }, tiltApi] = useSpring(() => ({
    xys: [0, 0, 1],
    config: { mass: 5, tension: 350, friction: 40 },
  }));
  const calc = (x, y, r) => [-(y - r.height / 2) / 20, (x - r.width / 2) / 20, 1.02];

  const trail = useTrail(3, {
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(20px)',
    config: config.stiff,
    delay: 600,
  });
  useEffect(() => setMounted(true), []);

  /* // Only scroll to contact CTA if explicitly requested, and only on navigation
  useEffect(() => {
    if (location.state?.scrollToContact && contactRef.current) {
      contactRef.current.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [location]); */

  return (
    <div className="bg-black text-gray-100 flex flex-col min-h-screen relative">
      <div className="background-glow" />

      <header className="container mx-auto flex justify-between items-center px-4 py-4 z-10">
        <div className="text-2xl font-extrabold text-gray-200">
          comma<span className="text-[#D4AF37]">Cards</span>
        </div>
      </header>

      <main className="flex-1 z-10">
        <section className="container mx-auto min-h-[60vh] flex items-center justify-center px-4 relative">
          <animated.div
            style={entry}
            className="gradient-border rounded-2xl sm:rounded-3xl overflow-hidden w-full max-w-2xl md:max-w-3xl lg:max-w-4xl aspect-[4/5] sm:aspect-[16/7] flex items-center justify-center border-2 border-gray-400/60 shadow-2xl bg-black/80"
          >
            <div className="card-container relative w-full h-full flex flex-col justify-center px-2 py-4 sm:px-6 sm:py-8 md:px-8 md:py-10">
              <div className="hidden md:block card-reflection" />

              <animated.div
                ref={cardRef}
                style={{ transform: xys.to((x, y, s) =>
                  `perspective(600px) rotateX(${x}deg) rotateY(${y}deg) scale(${s})`
                )}}
                onMouseMove={e => {
                  const r = cardRef.current.getBoundingClientRect();
                  tiltApi.start({ xys: calc(e.clientX - r.left, e.clientY - r.top, r) });
                }}
                onMouseLeave={() => tiltApi.start({ xys: [0, 0, 1] })}
                className="bg-black w-full h-full rounded-2xl sm:rounded-3xl flex flex-col justify-center items-center"
              >
                <div className="flex justify-center mt-2 mb-2 sm:mt-1 sm:mb-1">
                  <span
                    style={{
                      color: '#D4AF37',
                      fontSize: '4.2rem',
                      fontWeight: 900,
                      //fontFamily: 'Quicksand, Nunito, Rubik, Arial Rounded MT Bold, Arial, sans-serif',
                      fontFamily: 'California FB',
                      lineHeight: 1,
                      display: 'block',
                      marginTop: '-3.5rem', // move much higher up
                      marginBottom: '1.2rem', // push content down
                      letterSpacing: '-0.12em',
                      textShadow: '0 2px 8px rgba(0,0,0,0.12)',
                      borderRadius: '50%',
                    }}
                  >
                    ,
                  </span>
                </div>

                <div className="text-center space-y-2 sm:space-y-3 w-full">
                  <animated.h1 style={trail[0]} className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-100 w-full">
                    Continued Relationships,
                  </animated.h1>
                  <animated.p style={trail[1]} className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto w-full">
                    Tap your Comma card to connect instantly and continue valuable conversations,
                  </animated.p>
                </div>

                <animated.div
                  style={trail[2]}
                  className="flex flex-col gap-3 mt-6 mb-1 w-full sm:flex-row sm:justify-center sm:items-center sm:gap-4 md:gap-6 px-2"
                >
                  <button
                    onClick={() => navigate('/activate')}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-3 md:px-10 md:py-4 bg-gray-900 text-[#D4AF37] rounded-full text-base sm:text-lg md:text-xl font-bold hover:bg-gray-800 transition shadow"
                  >
                    <FaBolt size={20} /> Activate
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-3 md:px-10 md:py-4 bg-[#D4AF37] text-black rounded-full text-base sm:text-lg md:text-xl font-bold hover:bg-[#b4972a] transition shadow"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate('/plans')}
                    className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-3 md:px-10 md:py-4 bg-gray-900 text-[#D4AF37] rounded-full text-base sm:text-lg md:text-xl font-bold hover:bg-gray-800 transition shadow"
                  >
                    Pricing
                  </button>
                </animated.div>
              </animated.div>
            </div>
          </animated.div>

          {/* <div className="absolute left-1/2 -bottom-10 transform -translate-x-1/2 flex flex-col items-center animate-bounce z-20">
            <span className="text-gray-400 text-xs mb-1">Scroll</span>
            <FaArrowDown className="text-[#D4AF37] text-2xl" />
          </div> */}
        </section>

        <AnimatedWave />

        <section className="container mx-auto py-16 space-y-12 px-4">
          <div className="text-center space-y-4 px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-100">What is Comma?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              commaCards are smart business cards powered by NFC. Tap your card to instantly share contact details,
              social links and more, making follow-ups effortless.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 px-4">
            <InteractiveCard
              icon={<FaBolt />}
              title="Instant Connections"
              description="Share your information with a single tap. No apps, no friction—just seamless networking."
              className="animate-scroll-fade-up"
              style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
            />
            <InteractiveCard
              icon={<FaUser />}
              title="Own Your Profile"
              description="Customize every detail of your digital card and update it anytime—no reprints required."
              className="animate-scroll-fade-up"
              style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
            />
            <InteractiveCard
              icon={<FaHandshake />}
              title="Stay Top of Mind"
              description="Keep conversations going beyond the event and turn new contacts into long-lasting relationships."
              className="animate-scroll-fade-up"
              style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}
            />
          </div>

          <div className="mt-20">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-100 text-center mb-10 flex items-center justify-center gap-2">
              <span>How it works</span>
              <span className="animate-wiggle inline-block">👋</span>
            </h2>
            <div className="grid gap-8 md:grid-cols-3 px-4">
              <InteractiveCard
                icon={<span className="font-bold text-3xl">1</span>}
                title="Get Your Card"
                description="Order your commaCard and receive it at your doorstep. Setup is quick and easy."
                className="animate-scroll-fade-up"
                style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
              />
              <InteractiveCard
                icon={<span className="font-bold text-3xl">2</span>}
                title="Activate & Personalize"
                description="Activate your card online and customize your digital profile with your info, links, and branding."
                className="animate-scroll-fade-up"
                style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}
              />
              <InteractiveCard
                icon={<span className="font-bold text-3xl">3</span>}
                title="Tap & Connect"
                description="Share your profile instantly by tapping your card. Make connections and grow your network!"
                className="animate-scroll-fade-up"
                style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}
              />
            </div>
          </div>

          <div ref={contactRef} id="contact" className="mt-20 flex flex-col items-center gap-6 px-4">
            <ContactUsCTA />
            <FAQCTA />
          </div>
        </section>
      </main>

      <footer className="container mx-auto py-4 text-center text-sm text-gray-500 z-10">
        &copy; {new Date().getFullYear()} Comma — Continued Relationships.
      </footer>
    </div>
  );
}