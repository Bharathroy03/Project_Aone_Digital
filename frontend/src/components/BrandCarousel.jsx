import React, { useState } from 'react';

// ─── Static Fallback Brand list if settings aren't loaded ────────────────────
const FALLBACK_BRANDS = [
  { slug: 'apple',     name: 'Apple',     bg: '#F2F2F2', iconColor: '1a1a1a' },
  { slug: 'samsung',   name: 'Samsung',   bg: '#E8EDFF', iconColor: '1428A0' },
  { slug: 'sony',      name: 'Sony',      bg: '#F0F0F0', iconColor: '000000' },
  { slug: 'lg',        name: 'LG',        bg: '#FFF0F3', iconColor: 'A50034' },
  { slug: 'vivo',      name: 'Vivo',      bg: '#EEF0FF', iconColor: '415FFF' },
  { slug: 'whirlpool', name: 'Whirlpool', bg: '#EAF0FF', iconColor: '003087' },
  { slug: 'dyson',     name: 'Dyson',     bg: '#FFF0F0', iconColor: 'C41230' },
  { slug: 'oneplus',   name: 'OnePlus',   bg: '#FFF1F1', iconColor: 'F5010C' },
  { slug: 'xiaomi',    name: 'Xiaomi',    bg: '#FFF5EC', iconColor: 'FF6900' },
  { slug: 'bosch',     name: 'Bosch',     bg: '#EAF5FF', iconColor: '007BC0' },
];

// ─── Single brand circle tile ─────────────────────────────────────────────────
function BrandTile({ brand }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="brand-tile">
      {/* Colored circle background */}
      <div
        className="brand-circle"
        style={{ backgroundColor: brand.bg }}
      >
        {!imgFailed ? (
          <img
            src={`https://cdn.simpleicons.org/${brand.slug}/${brand.iconColor}`}
            alt={brand.name}
            onError={() => setImgFailed(true)}
            style={{
              width: '52px',
              height: '52px',
              objectFit: 'contain',
              objectPosition: 'center',
              display: 'block',
            }}
          />
        ) : (
          <span
            className="brand-text-fallback"
            style={{ color: `#${brand.iconColor}` }}
          >
            {brand.name.toUpperCase()}
          </span>
        )}
      </div>
      {/* Brand name label below the circle */}
      <span className="brand-name-label">{brand.name}</span>
    </div>
  );
}

// ─── Main carousel ────────────────────────────────────────────────────────────
export default function BrandCarousel({ settings }) {
  const activeBrands = settings?.brands?.length ? settings.brands : FALLBACK_BRANDS;
  
  // Triplicate array to make sure infinite marquee loop spans full screens
  const carouselItems = [...activeBrands, ...activeBrands, ...activeBrands];

  return (
    <section className="brand-section">
      <div className="brand-section-header">
        <div className="brand-divider-line" />
        <span className="brand-section-label">Global Brand Partners</span>
        <div className="brand-divider-line" />
      </div>

      <div className="brand-strip-wrapper">
        <div className="brand-track brand-track-left">
          {carouselItems.map((b, i) => (
            <BrandTile key={`${b.slug}-${i}`} brand={b} />
          ))}
        </div>
      </div>
    </section>
  );
}
