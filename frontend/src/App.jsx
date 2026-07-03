import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import { Send, CheckCircle2, ChevronRight, ShoppingCart, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Tabs: 'home' (Hero + Featured), 'mobiles' (Mobile category), 'appliances' (Home appliance category), 'checkout', 'confirmation'
  const [activeTab, setActiveTab] = useState('home');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState(null); // 'success' or error message
  const [orderId, setOrderId] = useState('');
  
  // Checkout Form State
  const [shippingForm, setShippingForm] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    zip: '',
    phone: ''
  });
  
  // Newsletter Email
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Fetch products from Flask API on load
  useEffect(() => {
    fetch('/api/products')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch product catalog.');
        return res.json();
      })
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleAddToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      handleRemoveFromCart(id);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const handleRemoveFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    
    const orderData = {
      customer_name: shippingForm.name,
      shipping_address: `${shippingForm.address}, ${shippingForm.city}, ${shippingForm.zip}`,
      total_amount: cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
      items: cart.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }))
    };

    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setOrderId(data.order_id);
          setCart([]);
          setCheckoutStatus('success');
          setActiveTab('confirmation');
        } else {
          alert('Order processing failed: ' + (data.error || 'Unknown error'));
        }
      })
      .catch((err) => {
        alert('Error connecting to backend server: ' + err.message);
      });
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newsletterEmail })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setNewsletterSubscribed(true);
          setNewsletterEmail('');
        }
      });
  };

  // Filtered Products
  const getFilteredProducts = () => {
    if (activeTab === 'mobiles') {
      return products.filter((p) => p.category === 'mobile');
    }
    if (activeTab === 'appliances') {
      return products.filter((p) => p.category === 'home_appliance');
    }
    return products; // All
  };

  const featuredProducts = products.filter((p) => p.featured);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="app-container">
      <Header 
        cartCount={cartCount} 
        onCartClick={() => setIsCartOpen(true)} 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          // Auto scroll to products if on home and clicking mobiles/appliances
          if (tab !== 'home') {
            setTimeout(() => {
              document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }
        }} 
      />

      {activeTab === 'home' && (
        <Hero onExploreClick={() => {
          document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
        }} />
      )}

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* Catalog Showcase (Home / Mobiles / Appliances tabs) */}
        {(activeTab === 'home' || activeTab === 'mobiles' || activeTab === 'appliances') && (
          <section id="catalog-section" className="categories-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">
                  {activeTab === 'home' ? 'Featured Collections' : activeTab === 'mobiles' ? 'Premium Mobile Phones' : 'Smart Home Appliances'}
                </h2>
                <p className="section-subtitle">
                  Browse through our carefully curated collection of high-tech smart solutions built for luxury, energy efficiency, and high-performance.
                </p>
              </div>

              {activeTab === 'home' && (
                <div className="category-tabs">
                  <button className="category-tab active" onClick={() => setActiveTab('home')}>Featured</button>
                  <button className="category-tab" onClick={() => setActiveTab('mobiles')}>Smartphones</button>
                  <button className="category-tab" onClick={() => setActiveTab('appliances')}>Appliances</button>
                </div>
              )}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
                <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 20px auto' }}></div>
                <p>Loading premium catalog items...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '20px', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p>Error: {error}</p>
                <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => window.location.reload()}>Retry Connection</button>
              </div>
            ) : (
              <div className="products-grid">
                {(activeTab === 'home' ? featuredProducts : getFilteredProducts()).map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAddToCart={handleAddToCart}
                    isAdded={cart.some((item) => item.id === product.id)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Checkout Page */}
        {activeTab === 'checkout' && (
          <section className="checkout-panel">
            <h2 className="section-title" style={{ marginBottom: '30px' }}>Shipping & Checkout</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '40px', alignItems: 'start' }}>
              
              <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder="John Doe"
                    value={shippingForm.name}
                    onChange={(e) => setShippingForm({ ...shippingForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    required 
                    placeholder="john@example.com"
                    value={shippingForm.email}
                    onChange={(e) => setShippingForm({ ...shippingForm, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Street Address</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder="123 Luxury Avenue"
                    value={shippingForm.address}
                    onChange={(e) => setShippingForm({ ...shippingForm, address: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      placeholder="New York"
                      value={shippingForm.city}
                      onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ZIP / Postal Code</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      placeholder="10001"
                      value={shippingForm.zip}
                      onChange={(e) => setShippingForm({ ...shippingForm, zip: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    required 
                    placeholder="+1 (555) 019-2834"
                    value={shippingForm.phone}
                    onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                  />
                </div>
                
                <button type="submit" className="btn btn-primary" style={{ marginTop: '20px', borderRadius: '16px' }}>
                  Place Secure Order
                </button>
              </form>

              {/* Checkout Summary panel */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '20px', padding: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingCart size={18} /> Order Summary
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '200px', overflowY: 'auto', marginBottom: '20px', paddingRight: '8px' }}>
                  {cart.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.name} <strong style={{ color: 'white' }}>x{item.quantity}</strong></span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                  <span>Total Amount:</span>
                  <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>${cartTotal.toFixed(2)}</span>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* Confirmation Screen */}
        {activeTab === 'confirmation' && (
          <section className="checkout-panel" style={{ textAlign: 'center', padding: '60px 4%' }}>
            <CheckCircle2 size={64} style={{ color: 'var(--secondary)', marginBottom: '24px', filter: 'drop-shadow(0 0 10px var(--secondary-glow))' }} />
            <h2 className="section-title" style={{ fontSize: '2.5rem', marginBottom: '16px', justifySelf: 'center' }}>Order Confirmed!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px auto' }}>
              Thank you for shopping with Aone Digital. Your order has been placed successfully and is currently being processed.
            </p>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '16px', padding: '20px', maxWidth: '400px', margin: '0 auto 40px auto' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Order Identifier</p>
              <code style={{ fontSize: '1rem', color: 'white', fontWeight: '700' }}>{orderId}</code>
            </div>
            <button className="btn btn-primary" onClick={() => setActiveTab('home')}>
              Return to Homepage
            </button>
          </section>
        )}

        {/* Core Value Props (Visible on homepage/catalog) */}
        {(activeTab === 'home' || activeTab === 'mobiles' || activeTab === 'appliances') && (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', padding: '60px 4%', borderTop: '1px solid var(--border-glass)', marginTop: '40px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
              <Truck size={36} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Global Insured Shipping</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Safe, tracked, and rapid delivery for all mobiles and appliances worldwide.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
              <ShieldCheck size={36} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Multi-Year Warranty</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Full manufacturer backing plus extended local product protection plans.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
              <RefreshCw size={36} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Hassle-Free Returns</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>30-day satisfaction window with quick and direct pick-up returns.</p>
              </div>
            </div>
          </section>
        )}

      </main>

      {/* Cart Drawer Overlay & Sidebar */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemoveFromCart}
        onCheckout={() => {
          setIsCartOpen(false);
          setActiveTab('checkout');
        }}
      />

      {/* Premium Footer */}
      <footer className="app-footer">
        <div className="footer-top">
          <div className="footer-column">
            <h3 className="logo-text" style={{ fontSize: '1.4rem' }}>AONE DIGITAL</h3>
            <p className="footer-column-desc">
              Your premium destination for luxury mobile technology and high-efficiency home appliances.
            </p>
          </div>
          
          <div className="footer-column">
            <h4 className="footer-column-title">Explore Tech</h4>
            <ul className="footer-links">
              <li><span className="footer-link" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('mobiles')}>Smartphones</span></li>
              <li><span className="footer-link" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('appliances')}>Kitchen Appliances</span></li>
              <li><span className="footer-link" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('appliances')}>Smart Laundry</span></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h4 className="footer-column-title">Newsletter</h4>
            <p className="footer-column-desc">Subscribe to receive exclusive deals, tech updates, and product launches.</p>
            {newsletterSubscribed ? (
              <p style={{ color: 'var(--secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} /> Subscribed successfully!
              </p>
            ) : (
              <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
                <input 
                  type="email" 
                  className="newsletter-input" 
                  placeholder="name@domain.com"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                />
                <button type="submit" className="add-cart-btn" aria-label="Subscribe">
                  <Send size={16} />
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Aone Digital. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span className="footer-link" style={{ cursor: 'pointer' }}>Privacy Policy</span>
            <span className="footer-link" style={{ cursor: 'pointer' }}>Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
