import React from 'react';
import { X, Trash2, ShoppingBag } from 'lucide-react';

export default function CartDrawer({ isOpen, onClose, cartItems, onUpdateQuantity, onRemove, onCheckout }) {
  const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <>
      <div className={`cart-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2 className="cart-title">
            <ShoppingBag size={22} style={{ color: '#6366f1' }} /> Your Cart
          </h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        <div className="cart-items-container">
          {cartItems.length === 0 ? (
            <div className="empty-cart-message">
              <ShoppingBag size={48} style={{ strokeWidth: 1.2, color: 'var(--text-muted)' }} />
              <p>Your shopping cart is empty.</p>
              <button className="btn btn-secondary" style={{ padding: '10px 20px', borderRadius: '15px' }} onClick={onClose}>
                Continue Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                <img 
                  src={item.image_url} 
                  alt={item.name} 
                  className="cart-item-img"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=100&q=80";
                  }}
                />
                <div className="cart-item-details">
                  <h4 className="cart-item-name">{item.name}</h4>
                  <p className="cart-item-price">${(item.price * item.quantity).toFixed(2)}</p>
                  
                  <div className="quantity-controller">
                    <button className="qty-btn" onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>-</button>
                    <span className="qty-value">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                </div>
                <button className="remove-item-btn" onClick={() => onRemove(item.id)} aria-label="Remove item">
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total-row">
              <span className="total-label">Subtotal:</span>
              <span className="total-value">${total.toFixed(2)}</span>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', borderRadius: '16px' }} onClick={onCheckout}>
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
