import React from 'react';
import { Plus, Check } from 'lucide-react';

export default function ProductCard({ product, onAddToCart, isAdded }) {
  // Convert specifications object to badges
  const specList = Object.entries(product.specifications || {}).slice(0, 3);

  return (
    <div className="product-card">
      <div className="product-image-container">
        <span className="product-tag">{product.category.replace('_', ' ')}</span>
        <img 
          src={product.image_url} 
          alt={product.name} 
          className="product-image" 
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=400&q=80";
          }}
        />
      </div>
      <div className="product-info">
        <span className="product-brand">{product.brand}</span>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-desc">{product.description}</p>
        
        <div className="product-specs">
          {specList.map(([key, val]) => (
            <span key={key} className="spec-badge">
              {key}: {val}
            </span>
          ))}
        </div>

        <div className="product-footer">
          <span className="product-price">${product.price.toFixed(2)}</span>
          <button 
            className="add-cart-btn" 
            onClick={() => onAddToCart(product)}
            style={{ backgroundColor: isAdded ? '#10b981' : '' }}
            aria-label="Add to cart"
          >
            {isAdded ? <Check size={18} /> : <Plus size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
