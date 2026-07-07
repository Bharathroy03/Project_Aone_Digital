import React, { useState } from 'react';

export default function ProductCard({
  product,
  onAddToCart,
  cartQuantity = 0,
  onUpdateQuantity,
  isWishlisted = false,
  onToggleWishlist,
  variant,
  isAdmin = false,
  onEdit,
  onDelete,
}) {
  const [selectedColor, setSelectedColor] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Determine light/dark style based on prop or category
  const cardVariant = variant || (['smart_phone', 'laptop'].includes(product.category) ? 'light' : 'dark');

  // Specs helper
  const specList = Object.entries(product.specifications || {}).slice(0, 3);

  // Discount calculations
  const hasDiscount = product.featured || product.price > 40000;
  const discountPercent = hasDiscount ? (product.price > 100000 ? 15 : 12) : 0;
  const originalPrice = hasDiscount ? Math.round(product.price / (1 - discountPercent / 100)) : null;

  // Admin-uploaded color variant images { colorName: imageUrl }
  const colorVariants = product.color_variants || {};

  const getProductColors = () => {
    const specColor = Object.entries(product.specifications || {}).find(([key]) =>
      key.toLowerCase().trim() === 'colour' || key.toLowerCase().trim() === 'color'
    );
    const mainColorValue = specColor ? specColor[1] : null;

    const colorCodes = {
      'cosmic orange': '#ea580c', 'orange': '#ea580c', 'titanium': '#57534e',
      'graphite': '#374151', 'space gray': '#4b5563', 'space grey': '#4b5563',
      'silver': '#cbd5e1', 'gold': '#eab308', 'black': '#000000',
      'matte black': '#0f172a', 'glossy black': '#000000', 'white': '#ffffff',
      'pure white': '#ffffff', 'blue': '#3b82f6', 'midnight blue': '#0284c7',
      'green': '#22c55e', 'red': '#ef4444',
    };

    const swatchList = [];

    // Priority 1: admin-uploaded variant images
    Object.keys(colorVariants).forEach((label) => {
      const code = colorCodes[label.toLowerCase().trim()] || '#78716c';
      swatchList.push({ name: label, code, hasVariantImage: true });
    });

    // Priority 2: spec color
    if (mainColorValue && !swatchList.some(s => s.name.toLowerCase() === mainColorValue.toLowerCase())) {
      swatchList.push({
        name: mainColorValue,
        code: colorCodes[mainColorValue.toLowerCase().trim()] || '#78716c',
        hasVariantImage: false
      });
    }

    // Priority 3: category fallbacks
    const fallbackMap = {
      smart_phone: [
        { name: 'Space Gray', code: '#4b5563' }, { name: 'Silver', code: '#cbd5e1' },
        { name: 'Gold', code: '#eab308' }, { name: 'Cosmic Orange', code: '#ea580c' },
      ],
      tv: [{ name: 'Classic Black', code: '#000000' }, { name: 'Titanium Gray', code: '#475569' }],
      laptop: [{ name: 'Space Gray', code: '#475569' }, { name: 'Silver', code: '#cbd5e1' }, { name: 'Rose Gold', code: '#fda4af' }],
      refrigerator: [{ name: 'Steel', code: '#64748b' }, { name: 'Matte Black', code: '#0f172a' }, { name: 'Red Floral', code: '#be123c' }],
      washing_machine: [{ name: 'White', code: '#f8fafc' }, { name: 'Titanium', code: '#475569' }],
      air_conditioner: [{ name: 'Pure White', code: '#ffffff' }, { name: 'Alabaster', code: '#f1f5f9' }],
      home_appliance: [{ name: 'Glossy Black', code: '#000000' }, { name: 'Stainless', code: '#cbd5e1' }],
    };
    const fallbacks = fallbackMap[product.category] || fallbackMap.smart_phone;
    for (const item of fallbacks) {
      if (swatchList.length >= 4) break;
      if (!swatchList.some(s => s.name.toLowerCase().trim() === item.name.toLowerCase().trim()))
        swatchList.push({ ...item, hasVariantImage: false });
    }

    return swatchList;
  };

  const swatches = getProductColors();
  const activeColor = selectedColor || (swatches[0] ? swatches[0].name : null);

  // Resolve displayed image: variant image > main image
  const displayImage = (activeColor && colorVariants[activeColor])
    ? colorVariants[activeColor]
    : product.image_url;

  return (
    <div className={`redesigned-product-card group style-${cardVariant}`}>
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

      {/* Wishlist Button */}
      {onToggleWishlist && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleWishlist(product.id); }}
          className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${isWishlisted ? 1 : 0}` }}>
            favorite
          </span>
        </button>
      )}

      {/* Discount Badge */}
      {hasDiscount && (
        <div className="discount-badge">{discountPercent}% OFF</div>
      )}

      {/* Universal 1:1 image container with smooth variant swap on swatch click */}
      <div className="redesigned-img-wrap">
        <img
          src={displayImage}
          alt={`${product.name}${activeColor ? ` \u2014 ${activeColor}` : ''}`}
          className="redesigned-img"
          style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.25s ease' }}
          onLoad={() => setImgLoaded(true)}
          onError={(e) => {
            e.target.style.opacity = '1';
            e.target.src = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=300&q=60';
          }}
        />
      </div>

      {/* Card Body */}
      <div className="redesigned-body">
        <span className="redesigned-cat">
          {product.brand} &bull; {product.category.replace('_', ' ')}
        </span>

        <h4 className="redesigned-title" title={product.name}>
          {product.name}
        </h4>

        {/* Color Swatches — image-linked variants have a blue ring */}
        <div className="swatches-row">
          {swatches.map((swatch, idx) => (
            <button
              key={idx}
              className={`swatch-circle ${activeColor === swatch.name ? 'selected' : ''}`}
              style={{
                backgroundColor: swatch.code,
                boxShadow: swatch.hasVariantImage ? '0 0 0 2px rgba(0,81,213,0.4)' : undefined
              }}
              title={`${swatch.name}${swatch.hasVariantImage ? ' (has image)' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedColor(swatch.name);
                setImgLoaded(false); // trigger fade-in transition on swap
              }}
              aria-label={`Select color ${swatch.name}`}
            />
          ))}
        </div>

        {/* Price + Cart CTA */}
        <div className="redesigned-footer">
          <div className="price-group">
            <span className="current-price">
              &#x20B9;{product.price.toLocaleString('en-IN')}
            </span>
            {originalPrice && (
              <div className="original-price-row">
                <span className="original-price">
                  &#x20B9;{originalPrice.toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>

          <div className="action-box">
            {cartQuantity > 0 ? (
              <div className="quantity-stepper">
                <button
                  className="stepper-btn"
                  onClick={(e) => { e.stopPropagation(); onUpdateQuantity(product.id, cartQuantity - 1); }}
                  aria-label="Decrease quantity"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>remove</span>
                </button>
                <span className="stepper-count">{cartQuantity}</span>
                <button
                  className="stepper-btn"
                  onClick={(e) => { e.stopPropagation(); onUpdateQuantity(product.id, cartQuantity + 1); }}
                  aria-label="Increase quantity"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                className="redesigned-add-btn"
                aria-label="Add to cart"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>shopping_cart</span>
                <span>Add</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
