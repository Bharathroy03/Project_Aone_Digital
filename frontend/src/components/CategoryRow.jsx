import React, { useRef, useState } from 'react';

// ─── Brand pill color map ────────────────────────────────────────────────────
const BRAND_COLORS = {
  apple:          { bg: '#F2F2F2', text: '#1a1a1a' },
  samsung:        { bg: '#E8EDFF', text: '#1428A0' },
  sony:           { bg: '#F0F0F0', text: '#000000' },
  lg:             { bg: '#FFF0F3', text: '#A50034' },
  vivo:           { bg: '#EEF0FF', text: '#415FFF' },
  oneplus:        { bg: '#FFF1F1', text: '#F5010C' },
  xiaomi:         { bg: '#FFF5EC', text: '#FF6900' },
  realme:         { bg: '#FFF0E6', text: '#FF4712' },
  dell:           { bg: '#EAF0FF', text: '#007DB8' },
  hp:             { bg: '#EBF7FF', text: '#0096D6' },
  asus:           { bg: '#EEF0FF', text: '#00539C' },
  lenovo:         { bg: '#F0F0F0', text: '#E2231A' },
  acer:           { bg: '#F0F7FF', text: '#83B81A' },
  whirlpool:      { bg: '#EAF0FF', text: '#003087' },
  haier:          { bg: '#E6F4FF', text: '#007DC6' },
  godrej:         { bg: '#FFF0F5', text: '#E91F63' },
  ifb:            { bg: '#F0F5FF', text: '#2D5BE3' },
  bosch:          { bg: '#EAF5FF', text: '#007BC0' },
  daikin:         { bg: '#E6F9FF', text: '#007CC2' },
  voltas:         { bg: '#E6FFF5', text: '#006B4F' },
  bluestar:       { bg: '#EAF4FF', text: '#004B93' },
  philips:        { bg: '#E6F0FF', text: '#003087' },
  mi:             { bg: '#FFF5EC', text: '#FF6900' },
  tcl:            { bg: '#FFF3EC', text: '#EF4623' },
  mophyrichards:  { bg: '#F5F0FF', text: '#5C35AE' },
  prestige:       { bg: '#FFF3F0', text: '#E63946' },
};

export function brandStyle(name) {
  const key = name.toLowerCase().replace(/[\s-]/g, '');
  return BRAND_COLORS[key] || { bg: '#F1F5F9', text: '#475569' };
}

// ─── Clean Logo Renderers for major brands ───────────────────────────────────
export function getBrandLogo(brandName) {
  if (!brandName) return null;
  const brandLower = brandName.toLowerCase().trim();
  
  if (brandLower === 'apple') {
    return (
      <span className="flex items-center gap-1 font-sans text-[10px] font-black text-slate-800 tracking-tight">
        <span className="text-[11px] leading-none"></span> Apple
      </span>
    );
  }
  if (brandLower === 'samsung') {
    return (
      <span className="font-sans font-black italic text-[9px] tracking-wider text-[#1428A0]">
        SAMSUNG
      </span>
    );
  }
  if (brandLower === 'sony') {
    return (
      <span className="font-serif font-black tracking-widest text-[8px] text-slate-850">
        SONY
      </span>
    );
  }
  if (brandLower === 'oneplus') {
    return (
      <span className="flex items-center gap-0.5 font-sans font-bold text-[9px] text-[#F5010C] tracking-tighter">
        <span className="bg-[#F5010C] text-white text-[7px] px-1 py-0.2 rounded-sm font-black mr-0.5 leading-none">1+</span>ONEPLUS
      </span>
    );
  }
  if (brandLower === 'lg') {
    return (
      <span className="font-sans font-extrabold text-[10px] text-[#A50034] tracking-tight">
        LG
      </span>
    );
  }
  if (brandLower === 'vivo') {
    return (
      <span className="font-sans italic font-black text-[10px] text-[#415FFF] tracking-tighter">
        vivo
      </span>
    );
  }
  if (brandLower === 'xiaomi' || brandLower === 'mi') {
    return (
      <span className="flex items-center gap-1 font-sans font-extrabold text-[9px] text-[#FF6900]">
        <span className="bg-[#FF6900] text-white text-[7px] font-black px-1 rounded-sm leading-none">mi</span> Xiaomi
      </span>
    );
  }
  if (brandLower === 'bosch') {
    return (
      <span className="font-sans font-black italic text-[9px] text-[#007BC0] tracking-tight">
        BOSCH
      </span>
    );
  }
  if (brandLower === 'dyson') {
    return (
      <span className="font-mono font-bold tracking-widest text-[9px] text-slate-800">
        dyson
      </span>
    );
  }
  
  // Default fallback badge
  return (
    <span className="font-sans text-[9px] font-bold text-slate-500 uppercase tracking-wider">
      {brandName}
    </span>
  );
}

// ─── Tiny product card for horizontal row ────────────────────────────────────
export function RowProductCard({ product, onAddToCart, isAdded, isAdmin, onEdit, onDelete }) {
  const bStyle = brandStyle(product.brand || '');
  return (
    <div className="cat-product-card group relative">
      {/* Admin overlay */}
      {isAdmin && (
        <div className="cat-admin-overlay">
          <button
            className="cat-admin-btn edit"
            onClick={(e) => { e.stopPropagation(); onEdit(product); }}
            title="Edit product"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
          </button>
          <button
            className="cat-admin-btn delete"
            onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}
            title="Delete product"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
          </button>
        </div>
      )}

      {/* Product image */}
      <div className="cat-card-img-wrap">
        <div 
          className="cat-card-badge"
          style={{ 
            backgroundColor: bStyle.bg,
            border: `1px solid ${bStyle.text}20`,
            padding: '4px 10px',
            borderRadius: '99px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {getBrandLogo(product.brand)}
        </div>
        <img
          src={product.image_url}
          alt={product.name}
          className="cat-card-img"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=300&q=60';
          }}
        />
      </div>

      {/* Info */}
      <div className="cat-card-body">
        {/* Clean layout: Brand logo is on image badge; show name & price footer */}
        <h5 className="cat-card-name" style={{ marginTop: '4px' }}>{product.name}</h5>
        <div className="cat-card-footer">
          <span className="cat-card-price">₹{product.price.toLocaleString('en-IN')}</span>
          <button
            className={`cat-card-btn ${isAdded ? 'added' : ''}`}
            onClick={() => onAddToCart(product)}
            aria-label="Add to cart"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              {isAdded ? 'done' : 'add_shopping_cart'}
            </span>
            {isAdded ? 'Added' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main CategoryRow ─────────────────────────────────────────────────────────
export default function CategoryRow({
  title,
  emoji,
  filterKey,
  brands,
  products,
  loading,
  isAdmin,
  onAddToCart,
  cart,
  onEdit,
  onDelete,
  onViewAll,
}) {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const filtered = products.filter((p) => p.category === filterKey);

  const updateScrollState = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' });
    setTimeout(updateScrollState, 350);
  };

  return (
    <section className="cat-row-section">
      {/* Row header */}
      <div className="cat-row-header">
        <div className="cat-row-title-group">
          <span className="cat-row-emoji">{emoji}</span>
          <h3 className="cat-row-title">{title}</h3>
          {/* Brand pills */}
          <div className="cat-brand-pills">
            {brands.map((b) => {
              const s = brandStyle(b);
              return (
                <span
                  key={b}
                  className="cat-brand-pill"
                  style={{ backgroundColor: s.bg, color: s.text }}
                >
                  {b}
                </span>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="cat-row-controls">
          <button
            className={`cat-scroll-btn ${!canScrollLeft ? 'disabled' : ''}`}
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            disabled={!canScrollLeft}
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            className={`cat-scroll-btn ${!canScrollRight ? 'disabled' : ''}`}
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            disabled={!canScrollRight}
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
          <button
            className="cat-view-all-btn"
            onClick={() => onViewAll(filterKey)}
          >
            View All
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Scroll track */}
      <div
        className="cat-scroll-track hide-scrollbar"
        ref={trackRef}
        onScroll={updateScrollState}
      >
        {loading ? (
          // Skeleton placeholders
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="cat-card-skeleton" />
          ))
        ) : filtered.length === 0 ? (
          <div className="cat-empty-row">
            <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>inventory_2</span>
            <p>No {title} in stock yet.</p>
          </div>
        ) : (
          filtered.map((product) => (
            <RowProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              isAdded={cart.some((i) => i.id === product.id)}
              isAdmin={isAdmin}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </section>
  );
}
