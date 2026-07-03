import React from 'react';

export default function ProductCard({ product, onAddToCart, isAdded }) {
  const specList = Object.entries(product.specifications || {}).slice(0, 3);

  return (
    <div className="glass p-6 rounded-3xl flex flex-col justify-between hover:shadow-xl hover:translate-y-[-8px] transition-all duration-300 relative group overflow-hidden">
      <div>
        <div className="h-48 w-full mb-4 bg-white rounded-2xl flex items-center justify-center shadow-inner overflow-hidden relative">
          <span className="absolute top-2 left-2 bg-secondary/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            {product.category.replace('_', ' ')}
          </span>
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="h-36 object-contain group-hover:scale-108 transition-transform duration-500" 
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=400&q=80";
            }}
          />
        </div>
        
        <span className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1">
          {product.brand}
        </span>
        <h4 className="font-title-sm text-on-surface mb-2 font-bold line-clamp-1">
          {product.name}
        </h4>
        <p className="text-sm text-text-secondary line-clamp-2 mb-4 h-10">
          {product.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {specList.map(([key, val]) => (
            <span key={key} className="bg-surface-container-low border border-outline-variant text-[10px] font-medium px-2 py-0.5 rounded-md text-text-secondary">
              {key}: {val}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-outline-variant/30 pt-4 mt-auto">
        <span className="font-ui-label-bold text-lg font-extrabold text-on-surface">
          ${product.price.toFixed(2)}
        </span>
        <button 
          onClick={() => onAddToCart(product)}
          className={`h-10 px-4 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-md ${
            isAdded 
              ? 'bg-status-success text-white' 
              : 'bg-secondary text-white hover:bg-secondary-container shadow-secondary/10'
          }`}
          aria-label="Add to cart"
        >
          <span className="material-symbols-outlined text-sm">{isAdded ? 'done' : 'add_shopping_cart'}</span>
          {isAdded ? 'Added' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
