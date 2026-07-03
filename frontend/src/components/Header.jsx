import React, { useState } from 'react';

export default function Header({ cartCount, onCartClick }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const [activeLink, setActiveLink] = useState('Home');

  return (
    <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-sm transition-all duration-300">
      <nav className="flex justify-between items-center h-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="flex items-center gap-3">
          {!logoFailed ? (
            <img 
              src="/images/logo.png" 
              alt="Aone Digital" 
              className="h-12 max-h-12 w-auto object-contain transition-transform duration-300 hover:scale-105 cursor-pointer"
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
              <span className="font-display-lg text-2xl tracking-tighter text-on-surface font-bold">Aone Digital</span>
            </div>
          )}
        </div>
        
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
                className={`relative pb-1 font-ui-label-md text-ui-label-md tracking-wide transition-all duration-300 ${
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

        <div className="flex items-center gap-4">
          <button 
            className="p-2 hover:bg-surface-container-low rounded-full transition-all duration-300 hover:scale-110 active:scale-95 relative group" 
            onClick={onCartClick} 
            aria-label="Shopping Cart"
          >
            <span className="material-symbols-outlined text-secondary transition-transform duration-300 group-hover:-translate-y-0.5">shopping_bag</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-secondary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg transition-all duration-300 scale-100 group-hover:scale-110">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </nav>
    </header>
  );
}
