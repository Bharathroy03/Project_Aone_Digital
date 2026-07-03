import React from 'react';
import { ShoppingCart, Heart, Search, Menu } from 'lucide-react';

export default function Header({ cartCount, onCartClick, activeTab, setActiveTab }) {
  return (
    <header className="app-header">
      <div className="logo-container">
        {/* If the user puts logo.png in public/images, it will render here. 
            Otherwise it falls back to the clean textual brand. */}
        <img 
          src="/images/logo.png" 
          alt="Aone Digital" 
          className="logo-img" 
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <span className="logo-text">AONE DIGITAL</span>
      </div>

      <nav>
        <ul className="nav-links">
          <li>
            <span 
              className={`nav-link ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
            >
              Home
            </span>
          </li>
          <li>
            <span 
              className={`nav-link ${activeTab === 'mobiles' ? 'active' : ''}`}
              onClick={() => setActiveTab('mobiles')}
            >
              Mobiles
            </span>
          </li>
          <li>
            <span 
              className={`nav-link ${activeTab === 'appliances' ? 'active' : ''}`}
              onClick={() => setActiveTab('appliances')}
            >
              Home Appliances
            </span>
          </li>
        </ul>
      </nav>

      <div className="header-actions">
        <button className="icon-btn" aria-label="Search Catalog">
          <Search size={20} />
        </button>
        <button className="icon-btn" aria-label="Favorites List">
          <Heart size={20} />
        </button>
        <button className="icon-btn" onClick={onCartClick} aria-label="Shopping Cart">
          <ShoppingCart size={20} />
          {cartCount > 0 && <span className="badge">{cartCount}</span>}
        </button>
      </div>
    </header>
  );
}
