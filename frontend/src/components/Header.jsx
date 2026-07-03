import React from 'react';

export default function Header({ cartCount, onCartClick }) {
  return (
    <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-sm transition-all duration-300">
      <nav className="flex justify-between items-center h-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="flex items-center gap-3">
          <img 
            src="/images/logo.png" 
            alt="Aone Digital" 
            className="h-10 max-w-[180px] object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <span className="material-symbols-outlined text-secondary text-2xl" data-original-icon="grid_view">grid_view</span>
          <span className="font-display-lg text-2xl tracking-tighter text-on-surface select-none">Aone Digital</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <a className="text-secondary font-bold border-b-2 border-secondary pb-1 font-ui-label-md text-ui-label-md" href="#">Home</a>
          <a className="text-on-surface font-ui-label-md text-ui-label-md hover:text-secondary transition-colors" href="#categories">Products</a>
          <a className="text-on-surface font-ui-label-md text-ui-label-md hover:text-secondary transition-colors" href="#offers">Offers</a>
          <a className="text-on-surface font-ui-label-md text-ui-label-md hover:text-secondary transition-colors" href="#contact">Contact</a>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors relative" onClick={onCartClick} aria-label="Shopping Cart">
            <span className="material-symbols-outlined text-secondary">shopping_bag</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-secondary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </nav>
    </header>
  );
}
