import React, { useState, useEffect } from 'react';

// ─── Default ticker items if admin hasn't configured any ─────────────────────
const DEFAULT_TICKER_ITEMS = [
  '🔥 Festive Sale — Up to 40% OFF on all Smartphones',
  '💳 No-Cost EMI available on orders above ₹10,000',
  '📦 Free Home Delivery on all orders above ₹5,000',
  '🎁 Exchange your old device — Get up to ₹15,000 extra value',
  '⚡ Apple, Samsung, Sony — Authorized Premium Retailer',
  '🛡️ 100% Genuine products with full manufacturer warranty',
  '🚀 Same-day delivery available in select cities',
];

export default function Hero({ onExploreClick, settings }) {
  const [bgImg, setBgImg]       = useState(settings?.hero?.bg_image_url || '/images/hero-bg.png');
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const targetUrl = settings?.hero?.bg_image_url || '/images/hero-bg.png';
    setBgImg(targetUrl);
    setImgError(false);
  }, [settings?.hero?.bg_image_url]);



  const fallbackImg = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1920&q=80';

  // ── Ticker data ────────────────────────────────────────────────────────────
  const tickerEnabled = settings?.ticker?.enabled !== false;
  const rawItems      = settings?.ticker?.items?.length
    ? settings.ticker.items
    : DEFAULT_TICKER_ITEMS;
  // Triplicate so the loop is always seamless on any screen width
  const tickerItems   = [...rawItems, ...rawItems, ...rawItems];

  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        minHeight: '600px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* ── Full-bleed background image with smooth Parallax scroll ── */}
      <img
        src={imgError ? fallbackImg : bgImg}
        alt="Hero background"
        onError={() => setImgError(true)}
        className="parallax-bg-slow"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '115%', // taller to accommodate scroll movement without exposing white space
          objectFit: 'cover',
          objectPosition: 'center right',
          zIndex: 0,
          display: 'block',
        }}
      />

      {/* ── Left-to-right gradient overlay ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background:
            'linear-gradient(to right, #f9f9ff 0%, #f9f9ff 40%, rgba(249,249,255,0.82) 58%, rgba(249,249,255,0.3) 72%, transparent 100%)',
        }}
      />

      {/* ── Mobile bottom veil ── */}
      <div
        className="md:hidden"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          background:
            'linear-gradient(to top, rgba(249,249,255,0.97) 0%, rgba(249,249,255,0.85) 45%, rgba(249,249,255,0.4) 70%, transparent 100%)',
        }}
      />

      {/* ── Hero text content ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '1280px',
          margin: '0 auto',
          paddingLeft: '20px',
          paddingRight: '20px',
          paddingTop: '96px',
          paddingBottom: '80px', /* extra bottom room so ticker doesn't overlap content */
        }}
        className="md:px-16"
      >
        <div style={{ maxWidth: '580px' }}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-fixed text-on-secondary-fixed rounded-full mb-6">
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
            <span className="text-ui-caption font-ui-label-bold">Authorized Premium Retailer</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight text-primary mb-5 leading-tight overflow-hidden">
            <span className="inline-block animate-hero-text" style={{ animationDelay: '0.1s', opacity: 0 }}>
              {settings?.hero?.title || 'Smart Tech.'}
            </span>{' '}
            <span className="inline-block text-secondary font-semibold animate-hero-text" style={{ animationDelay: '0.3s', opacity: 0 }}>
              {settings?.hero?.highlight || 'Modern Living.'}
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-base md:text-lg text-text-secondary mb-8 max-w-lg leading-relaxed animate-hero-text" style={{ animationDelay: '0.5s', opacity: 0 }}>
            {settings?.hero?.subtitle ||
              'Curated smartphones and premium smart appliances designed to elevate your home.'}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 font-bold animate-hero-text" style={{ fontFamily: 'var(--font-body)', animationDelay: '0.7s', opacity: 0 }}>
            <button
              className="px-8 py-4 bg-gradient-to-r from-secondary to-secondary-container text-white rounded-xl shadow-lg hover:shadow-secondary/20 transition-all text-center cursor-pointer font-bold"
              onClick={onExploreClick}
            >
              {settings?.hero?.cta1_text || 'Explore Products'}
            </button>
            <a
              className="px-8 py-4 border border-outline text-on-surface rounded-xl hover:bg-surface-container-low transition-all text-center font-bold"
              href={settings?.hero?.cta2_link || '#contact'}
            >
              {settings?.hero?.cta2_text || 'Contact Us'}
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-status-success">check_circle</span>
              <span className="text-ui-caption font-ui-label-bold">100% Genuine</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-status-success">shield</span>
              <span className="text-ui-caption font-ui-label-bold">Full Warranty</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-status-success">local_shipping</span>
              <span className="text-ui-caption font-ui-label-bold">Fast Delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SCROLLING ADVERTISEMENT TICKER — pinned to bottom of hero
      ══════════════════════════════════════════════════════════ */}
      {tickerEnabled && (
        <div className="hero-ticker-bar">
          {/* Clipping viewport */}
          <div className="hero-ticker-viewport">
            <div
              className="hero-ticker-track"
              style={{
                animationDuration:
                  settings?.ticker?.speed === 'slow'
                    ? '75s'
                    : settings?.ticker?.speed === 'fast'
                    ? '35s'
                    : '55s',
              }}
            >
              {tickerItems.map((item, i) => (
                <span key={i} className="hero-ticker-item">
                  {item}
                  <span className="hero-ticker-dot" aria-hidden="true">✦</span>
                </span>
              ))}
            </div>
          </div>

          {/* Left fade-out edge (since text enters from left) */}
          <div className="hero-ticker-fade-left" aria-hidden="true" />
        </div>
      )}
    </section>
  );
}
