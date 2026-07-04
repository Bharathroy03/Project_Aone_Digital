import React, { useState, useEffect } from 'react';

export default function Header({ cartCount, onCartClick, settings, onLogoClick, products = [] }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const [activeLink, setActiveLink] = useState('Home');
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Monitor scroll height to apply compact styling on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const logoUrl = settings?.hero?.logo_url || "/images/logo.png";
  const logoHeight = settings?.hero?.logo_height || 48;
  const scrolledHeight = Math.round(logoHeight * 0.75);

  return (
    <header 
      className={`fixed z-50 left-1/2 -translate-x-1/2 transition-all duration-500 ease-out ${
        scrolled 
          ? 'top-4 w-[92%] lg:w-[1200px] bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-full py-3 px-8 h-16' 
          : 'top-0 w-full bg-white/40 backdrop-blur-md border-b border-slate-100/30 shadow-none py-5 px-margin-mobile md:px-margin-desktop h-24'
      }`}
    >
      <nav className="flex justify-between items-center h-full max-w-container-max mx-auto">
        {/* Brand/Logo Area */}
        <div className="flex items-center gap-3">
          {!logoFailed ? (
            <img 
              src={logoUrl} 
              alt="Aone Digital" 
              className="object-contain transition-all duration-500 hover:scale-105 cursor-pointer"
              style={{
                height: scrolled ? `${scrolledHeight}px` : `${logoHeight}px`,
                maxHeight: scrolled ? `${scrolledHeight}px` : `${logoHeight}px`
              }}
              onError={() => setLogoFailed(true)}
              onClick={() => {
                setActiveLink('Home');
                if (onLogoClick) onLogoClick();
              }}
            />
          ) : (
            <div 
              className="flex items-center gap-2 cursor-pointer select-none group"
              onClick={() => {
                setActiveLink('Home');
                if (onLogoClick) onLogoClick();
              }}
            >
              <span className="material-symbols-outlined text-secondary text-2xl transition-transform duration-300 group-hover:rotate-12">grid_view</span>
              <span className="font-display-lg text-2xl tracking-tighter text-on-surface font-extrabold">Aone Digital</span>
            </div>
          )}
        </div>
        
        {/* Central Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { name: 'Home', href: '#' },
            { name: 'Products', href: '#categories' },
            { name: 'Offers', href: '#offers' },
            { name: 'Contact', href: '#contact' }
          ].map((item) => {
            const isActive = activeLink === item.name;
            return (
              <a 
                key={item.name}
                href={item.href}
                onClick={() => setActiveLink(item.name)}
                className={`relative pb-1 font-body-md text-sm font-semibold tracking-wide transition-all duration-300 ${
                  isActive 
                    ? 'text-secondary font-bold' 
                    : 'text-on-surface hover:text-secondary'
                } after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-secondary after:transition-all after:duration-300 ${
                  isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'
                }`}
              >
                {item.name}
              </a>
            );
          })}
        </div>

        {/* Action Button Area */}
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative hidden lg:block w-48 xl:w-60">
            <div className="flex items-center bg-slate-50 border border-slate-200/80 rounded-full px-3.5 py-1.5 focus-within:ring-2 focus-within:ring-secondary/20 focus-within:border-secondary transition-all">
              <span className="material-symbols-outlined text-slate-400 text-sm">search</span>
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 250)}
                className="bg-transparent border-none text-xs text-slate-700 outline-none w-full ml-1.5 font-bold"
              />
            </div>

            {/* Search Dropdown Results */}
            {showResults && searchQuery.trim() !== '' && (() => {
              const matches = (products || []).filter(p => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
              ).slice(0, 5);

              return (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-slate-100 shadow-2xl rounded-2xl overflow-hidden py-1 z-[120] animate-fade-in font-body-md">
                  {matches.length > 0 ? (
                    matches.map(p => (
                      <div 
                        key={p.id}
                        onClick={() => {
                          window.open(`/?search=${encodeURIComponent(p.name)}`, '_blank');
                          setSearchQuery('');
                          setShowResults(false);
                        }}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-100 last:border-0"
                      >
                        <img src={p.image_url} alt={p.name} className="w-8 h-8 object-contain bg-slate-50 rounded p-0.5 shrink-0" />
                        <div className="flex-grow overflow-hidden text-left">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block leading-none">{p.brand}</span>
                          <span className="text-xs text-slate-800 font-bold block truncate mt-0.5">{p.name}</span>
                        </div>
                        <span className="text-xs font-bold text-secondary text-right shrink-0">₹{p.price.toLocaleString('en-IN')}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-xs text-slate-400 font-semibold">
                      No matching products found
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          <button 
            className="p-3 bg-slate-50 hover:bg-secondary border border-slate-100 hover:border-secondary hover:text-white rounded-full shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 active:scale-95 relative group cursor-pointer" 
            onClick={onCartClick} 
            aria-label="Shopping Cart"
          >
            <span className="material-symbols-outlined text-xl transition-transform duration-300 group-hover:-translate-y-0.5">shopping_bag</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-secondary text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-lg transition-transform duration-300 scale-100 group-hover:scale-110">
                {cartCount}
              </span>
            )}
          </button>

          {/* Hamburger button visible on mobile/tablet */}
          <button 
            className="md:hidden p-3 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-100 transition-all flex items-center justify-center cursor-pointer text-slate-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span className="material-symbols-outlined text-xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-[calc(100%+12px)] left-[4%] w-[92%] bg-white border border-slate-200 shadow-2xl rounded-3xl p-6 space-y-3 z-40 animate-fade-in text-left">
          {[
            { name: 'Home', href: '#' },
            { name: 'Products', href: '#categories' },
            { name: 'Offers', href: '#offers' },
            { name: 'Contact', href: '#contact' }
          ].map((item) => {
            const isActive = activeLink === item.name;
            return (
              <a 
                key={item.name}
                href={item.href}
                onClick={() => {
                  setActiveLink(item.name);
                  setMobileMenuOpen(false);
                }}
                className={`block py-2.5 px-4 font-body-md text-sm font-semibold tracking-wide rounded-xl transition-all ${
                  isActive 
                    ? 'text-white bg-secondary font-bold' 
                    : 'text-on-surface hover:bg-slate-50 hover:text-secondary'
                }`}
              >
                {item.name}
              </a>
            );
          })}
        </div>
      )}
    </header>
  );
}
