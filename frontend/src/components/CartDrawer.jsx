import React from 'react';

export default function CartDrawer({ isOpen, onClose, cartItems, onUpdateQuantity, onRemove, onCheckout }) {
  const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <>
      <div className={`cart-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2 className="cart-title">
            <span className="material-symbols-outlined text-secondary text-2xl">shopping_bag</span> Your Cart
          </h2>
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors" onClick={onClose} aria-label="Close cart">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="cart-items-container">
          {cartItems.length === 0 ? (
            <div className="empty-cart-message">
              <span className="material-symbols-outlined text-5xl text-slate-300">shopping_cart_off</span>
              <p className="font-ui-label-md">Your shopping cart is empty.</p>
              <button 
                className="px-6 py-2.5 bg-slate-100 text-slate-800 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors" 
                onClick={onClose}
              >
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
                  <span className="material-symbols-outlined text-lg">delete</span>
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
            <button 
              className="w-full py-4 bg-secondary text-white font-bold rounded-xl shadow-lg hover:bg-secondary-container transition-all text-sm" 
              onClick={onCheckout}
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
