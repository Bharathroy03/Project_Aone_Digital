import React, { useState, useEffect } from 'react';

export default function Header({ cartCount, onCartClick }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const [activeLink, setActiveLink] = useState('Home');
  const [scrolled, setScrolled] = useState(false);

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

  return (
    <header 
      className={`fixed z-50 left-1/2 -translate-x-1/2 transition-all duration-500 ease-out ${
        scrolled 
          ? 'top-2 w-[92%] md:w-[85%] max-w-container-max bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-2xl py-3 px-6 h-16' 
          : 'top-0 w-full bg-white/40 backdrop-blur-md border-b border-slate-100/30 shadow-none py-5 px-margin-mobile md:px-margin-desktop h-24'
      }`}
    >
      <nav className="flex justify-between items-center h-full max-w-container-max mx-auto">
        {/* Brand/Logo Area */}
        <div className="flex items-center gap-3">
          {!logoFailed ? (
            <img 
              src="/images/logo.png" 
              alt="Aone Digital" 
              className={`object-contain transition-all duration-500 hover:scale-105 cursor-pointer ${
                scrolled ? 'h-9 max-h-9' : 'h-12 max-h-12'
              }`}
              onError={() => setLogoFailed(true)}
              onClick={() => {
                setActiveLink('Home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ) : (
            <div 
              className="flex items-center gap-2 cursor-pointer select-none group"
              onClick={() => {
                setActiveLink('Home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
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
                className={`relative pb-1 font-ui-label-md text-sm font-semibold tracking-wide transition-all duration-300 ${
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
        </div>
      </nav>
    </header>
  );
}
