import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Navigation View: 'home', 'checkout', 'confirmation', 'admin-login', 'admin-dashboard'
  const [view, setView] = useState('home');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderId, setOrderId] = useState('');
  
  // Category filter state ('all', 'mobile', 'home_appliance')
  const [categoryFilter, setCategoryFilter] = useState('all');

  // FAQ Accordion State (index of open FAQ, or null)
  const [openFaq, setOpenFaq] = useState(null);

  // Inquiry/Contact Form State
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    phone: '',
    email: '',
    category: 'Smartphones',
    budget: 'Select Range'
  });
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  // Shipping Form State (Checkout View)
  const [shippingForm, setShippingForm] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    zip: '',
    phone: ''
  });

  // Newsletter email state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Admin Portal state variables
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({ username: '', password: '' });
  const [adminLoginError, setAdminLoginError] = useState(null);
  
  // Admin product creation / editing variables
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    brand: '',
    category: 'mobile',
    price: '',
    stock: '',
    description: '',
    image_url: '',
    specifications: {}
  });

  const refreshProducts = () => {
    setLoading(true);
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
  };

  // Fetch products from Flask API on load
  useEffect(() => {
    refreshProducts();
  }, []);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminCredentials.username === 'Bharath' && adminCredentials.password === 'Bharath@123') {
      setIsAdminLoggedIn(true);
      setAdminLoginError(null);
      setView('admin-dashboard');
    } else {
      setAdminLoginError('Invalid administrator credentials.');
    }
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();
    const endpoint = editingProductId ? `/api/products/${editingProductId}` : '/api/products';
    const method = editingProductId ? 'PUT' : 'POST';

    fetch(endpoint, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productForm)
    })
      .then((res) => {
        if (!res.ok) throw new Error('Operation failed');
        return res.json();
      })
      .then(() => {
        setIsProductModalOpen(false);
        setEditingProductId(null);
        setProductForm({
          name: '',
          brand: '',
          category: 'mobile',
          price: '',
          stock: '',
          description: '',
          image_url: '',
          specifications: {}
        });
        refreshProducts();
      })
      .catch((err) => alert(err.message));
  };

  const handleDeleteProduct = (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    fetch(`/api/products/${productId}`, {
      method: 'DELETE'
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to delete product');
        return res.json();
      })
      .then(() => {
        refreshProducts();
      })
      .catch((err) => alert(err.message));
  };

  const handleEditClick = (product) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name || '',
      brand: product.brand || '',
      category: product.category || 'mobile',
      price: product.price || '',
      stock: product.stock || '',
      description: product.description || '',
      image_url: product.image_url || '',
      specifications: product.specifications || {}
    });
    setIsProductModalOpen(true);
  };

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

  const handleInquirySubmit = (e) => {
    e.preventDefault();
    if (!inquiryForm.name || !inquiryForm.email || !inquiryForm.phone) return;

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inquiryForm.email, name: inquiryForm.name, phone: inquiryForm.phone })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setInquirySubmitted(true);
          setInquiryForm({
            name: '',
            phone: '',
            email: '',
            category: 'Smartphones',
            budget: 'Select Range'
          });
        }
      })
      .catch((err) => {
        alert('Connection error: ' + err.message);
      });
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
          setShippingForm({ name: '', email: '', address: '', city: '', zip: '', phone: '' });
          setView('confirmation');
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

  // Filtered Products based on selection
  const getFilteredProducts = () => {
    if (categoryFilter === 'mobile') {
      return products.filter((p) => p.category === 'mobile');
    }
    if (categoryFilter === 'home_appliance') {
      return products.filter((p) => p.category === 'home_appliance');
    }
    return products;
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const scrollIntoCatalog = () => {
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const showMainNavbar = view === 'home' || view === 'checkout' || view === 'confirmation';

  return (
    <div className="bg-background text-on-background font-body-md overflow-x-hidden min-h-screen flex flex-col justify-between">
      {showMainNavbar && <Header cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} />}

      {view === 'home' && (
        <>
          <Hero onExploreClick={scrollIntoCatalog} />

          {/* Brand Showcase Carousel */}
          <section className="py-16 bg-surface-container-low overflow-hidden select-none">
            <div className="mb-8 text-center px-margin-mobile">
              <h3 className="font-ui-label-bold text-on-surface-variant uppercase tracking-[0.2em] text-xs md:text-sm font-bold">Global Brand Partners</h3>
            </div>
            <div className="brand-carousel-track">
              {[
                { slug: 'apple', name: 'Apple' },
                { slug: 'samsung', name: 'Samsung' },
                { slug: 'sony', name: 'Sony' },
                { slug: 'lg', name: 'LG' },
                { slug: 'vivo', name: 'Vivo' },
                { slug: 'whirlpool', name: 'Whirlpool' },
                { slug: 'dyson', name: 'Dyson' }
              ].map((brand, i) => (
                <div key={i} className="flex items-center justify-center w-[250px] grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                  <img 
                    src={`https://cdn.simpleicons.org/${brand.slug}/141b2b`} 
                    alt={brand.name} 
                    className="h-9 md:h-11 max-h-12 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const textNode = document.createTextNode(brand.name.toUpperCase());
                      const span = document.createElement('span');
                      span.className = "font-display-lg text-2xl text-on-surface font-bold tracking-wider";
                      span.appendChild(textNode);
                      e.target.parentNode.appendChild(span);
                    }}
                  />
                </div>
              ))}
              {/* Duplicate loop for seamless scroll */}
              {[
                { slug: 'apple', name: 'Apple' },
                { slug: 'samsung', name: 'Samsung' },
                { slug: 'sony', name: 'Sony' },
                { slug: 'lg', name: 'LG' },
                { slug: 'vivo', name: 'Vivo' },
                { slug: 'whirlpool', name: 'Whirlpool' },
                { slug: 'dyson', name: 'Dyson' }
              ].map((brand, i) => (
                <div key={`dup-${i}`} className="flex items-center justify-center w-[250px] grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                  <img 
                    src={`https://cdn.simpleicons.org/${brand.slug}/141b2b`} 
                    alt={brand.name} 
                    className="h-9 md:h-11 max-h-12 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const textNode = document.createTextNode(brand.name.toUpperCase());
                      const span = document.createElement('span');
                      span.className = "font-display-lg text-2xl text-on-surface font-bold tracking-wider";
                      span.appendChild(textNode);
                      e.target.parentNode.appendChild(span);
                    }}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Categories Navigation Grid */}
          <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto" id="categories">
            <div className="text-center mb-16 reveal active">
              <h2 className="font-headline-md-mobile md:text-headline-md text-on-surface mb-4">Shop by Category</h2>
              <div className="w-20 h-1 bg-secondary mx-auto rounded-full"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[
                { name: 'Smartphones', filter: 'mobile', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdOdknTPsNr5zyg78-8NVthlIVquiPV6mAdXyjEs_IAsUWku7v8Y7REvjsFjFEXk7YQcQOd_Ql4B_14hyS53YG2UcmbzZ6a6wpkHkmoDGI7bDYWHcgdOLYAGOC3U_tkiJWOS4qQD_g5rB6td-CkJ00EKfHMfuqpCrCxjAc6jWZJVNmO0aJTXoYlpg7DzeLNII-iHCgzAWdP1B8LFZp-GJxmZI5hEXp0-LunSvkRzDQDkxpQV33ed4Y' },
                { name: 'Smart TVs', filter: 'home_appliance', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyKPkk8V2_k7JnwBsBwKRADfYVOxj44Lk5wJ4dvr_K8TjCTF9fZVjJ5H1RFMiHYbQYfyDdXOYjM46qOu_IOxiJ_ebZXr2Oh3dsWgaO_fFQ3iaDg-S4_webQ3z83uACNtVe0cVuGh7m7Cc0b3b8_ggpbpXMQN-9THokwkdPYMokaNYdcfb7hekrxrFvSVOd54Skbm_8x9o4odnxM8oa8ENIfVkTZvZ1PfIknZYCRZRTPd08neDz2Xql' },
                { name: 'Laptops', filter: 'mobile', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQGexpsqIjuOeeJiyayAiqB33_ebDyBWp5Pa7W1zuUNDwDiAUIUU2J3IaGXssudZCOyQvCZ_3ir9YQWcWTnquYw8nKEAvNhq3JVWOFkPFyJWTwVqbEh-jkbTE6acYOeehpUlZtqMsgh2eaeCktWrIib8DUYdH7xxLsTJPhM4bPj2MNO5puIsHEs_fsP9LOZSlavdIJ8nHvjH2B3B7C_S4QF0PUdbJXQU6aqZrzP7uYREs6yQGiRLfn' },
                { name: 'Refrigerators', filter: 'home_appliance', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuClrCQkqLngs6_6g762UKkHunwxW-zNoHZM3EEzYuDu7Wd4mHbL1Ar5HpBkRyXWGWaEHFatxeSa8GBc0YbK5_rQLpFM_gF_rQQnrXv8lOXBNDQvfpWSpyEle8xclSL-ClFrOpYKota3iGMpWmy1E3kMpOD3x6-853hpV9FucOMuLLiikBS350nEV0AjJK8Xi9K7D52vK30NQoQGG0vSZGYaFLi8Dz79jV56dH13uEub2yA0zT07caxb' },
                { name: 'Washing Machines', filter: 'home_appliance', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4qI5XP952eDDSBpJ8W2_d8-Gopk_8xouu2K4NiDkl-2orsIeD3KKknlepeh2BipqSs4tDujYLn9LqOOVw0ll9qvMXMUUePMSLY5OUzMMHCLOH69WOBiZYez7H2tlJEEuhbtPhN78LAOJmdShnvDqvuyBatKpRMLnJxOYbu-6V4haRb5U4-g8Q72qK_vYhNb-rfRTtdZ9YASiJemA1MoqIenfQpfpPWRzyKDZVY8iIJ_gVlRjCYjyk' },
                { name: 'Air Conditioners', filter: 'home_appliance', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFLV2Bn1LCS4LeJdPrZjQFpL-cFBF5IlVO8WeAyjTlP9TGE8lmoGcGpsOVTisNPqfBc7K_Pg-8pLRJHIO3I1JJ4F4YagWzkmthKDaQ52toeTvkUEUnsqRAFQ3SOGVPXi_6XoCEDJB81Pzrlid_NM53ufkJ9_0-wqIgthMiQxyMo7X4l6TEplnTKf1yPsSipj0LysNeazfG_5niMkPqnOQK-PZIcAHHTuR3jQ8m-Emu_beOmdYeSBGg' },
                { name: 'Kitchen Appliances', filter: 'home_appliance', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqpkMQ4x4xAHAHf7jG8xC95joUBeR8lkl6pWge5_SSu3DPsnopDaxQg9j9DreXNVwpoQ7OMqOe2ti9jatOT8_gmxvvGEz_AoMLFbK_Py-knb7RjgWiLxtDdl64cTe1msLscds75A3DwwkwmLAw9x1jq1H21i6Ne0v_kKLQhS7fxj1xdKQF7wEXZT4j1xJt7TpGeBByQTtbB6B94GYjXAApiukT3UoAUz4S27t0LfDtqzP0Qy6_ZZF_' },
                { name: 'Smart Watches', filter: 'mobile', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJ9vxdHx3uFJqLuLR4yokiWkH30K55FCOTguzPSZVr9itxpaveGYUh4eGmju7TrNt9KjwE-S7Lqv0DTHXwTUr5fRl66gfISVNCr9Ko7rXehK3ByBI6bBzinUSRLRHt1ckBWq8DBEC3jLrxuCCn0qLe2RU6jlSDCRew2qcX-_S26ZNHacsiT4rK5ezCDdKmTPEnnj8G_u4hapqqabQP9Ij8L45wvj-XbU46c-BX1ogiCk-Yy6v9DpzB' },
                { name: 'Audio Accessories', filter: 'mobile', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMDtz6_ioW77EzTq1wqi7Alr3mez84oyeb0685Rnq51NQ2ybHBvtmWYAYfj0iKL3ilZMMdTS0-S4zxfjIWeuTLR1ppv3gofBZoX4rWoH87XXxAM6qo15x6x513WAcQ5x4c3M-26IXX3XoWkzhKeyd5neLpzIQLaTgYV0MiFezTHQdwhk_0Tu7Qn5aE_3Simb-spWVTBzJzageydAZl4ZZ6yyyIExDULIdzuhONYxLNPMxQLysSVYtI' },
                { name: 'Robot Cleaners', filter: 'home_appliance', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEqY5LrxZut0FWfW2rFzKauKChOttxrH1QNf8EOLYzTivwNfrVNCJ3p5Z0lXNFb36PlBbzt2Kw8D-LHyvvaDP2KeZ5vJWniDlsLeFfq-W27m5EOBT2sW4lwFmqQkZ-uuw6qj8_kSFpeYkvH1SSX688q69nbb4Isni7GcPSIByOVK5HYvnDn9j3DusbAYRfNz0RtK-wEcxiwf0gvuec1jHTc1qHHS-z0qS60p_CHQVOHD4NDKRiyujI' }
              ].map((cat, idx) => (
                <div 
                  key={idx} 
                  className="glass p-6 rounded-3xl flex flex-col items-center text-center hover:shadow-xl hover:translate-y-[-8px] transition-all cursor-pointer reveal active"
                  onClick={() => {
                    setCategoryFilter(cat.filter);
                    scrollIntoCatalog();
                  }}
                  style={{ transitionDelay: `${(idx % 5) * 100}ms` }}
                >
                  <div className="w-20 h-20 mb-4 bg-white rounded-2xl flex items-center justify-center shadow-inner overflow-hidden">
                    <img className="w-16 h-16 object-contain" alt={cat.name} src={cat.img} />
                  </div>
                  <span className="font-ui-label-bold text-on-surface text-sm">{cat.name}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Dynamic Product Catalog Section */}
          <section id="products-section" className="py-12 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto border-t border-outline-variant/30">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
              <div>
                <h2 className="font-headline-md text-on-surface">Explore Catalog</h2>
                <p className="text-text-secondary text-sm">Real-time collections synced with your online inventory.</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2">
                {['all', 'mobile', 'home_appliance'].map((filter) => (
                  <button 
                    key={filter} 
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      categoryFilter === filter 
                        ? 'bg-secondary text-white border-secondary shadow-md' 
                        : 'bg-white text-on-surface border-outline-variant hover:bg-slate-50'
                    }`}
                    onClick={() => setCategoryFilter(filter)}
                  >
                    {filter === 'all' ? 'All Products' : filter === 'mobile' ? 'Mobiles' : 'Home Appliances'}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20 color-text-secondary">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-secondary mx-auto mb-4"></div>
                <p className="text-sm font-ui-label-md">Loading products...</p>
              </div>
            ) : error ? (
              <div className="text-center py-10 bg-red-50 border border-red-200 rounded-3xl p-6">
                <p className="text-red-600 text-sm">Failed to connect to backend: {error}</p>
                <button 
                  className="mt-4 px-6 py-2 bg-secondary text-white text-xs font-bold rounded-xl"
                  onClick={() => window.location.reload()}
                >
                  Retry Connection
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {getFilteredProducts().map((product) => (
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

          {/* Featured Offers Section */}
          <section className="bg-primary-container py-section-gap relative overflow-hidden" id="offers">
            <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 blur-[120px] rounded-full"></div>
            <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
              <div className="text-center mb-16 reveal active">
                <h2 className="font-headline-md text-white mb-4">Exclusive Retail Offers</h2>
                <p className="text-on-primary-container font-ui-label-md">Maximum benefits on every purchase you make at Aone Digital.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { icon: 'credit_card', title: 'No Cost EMI', desc: 'Pay over 6-24 months with absolutely 0% interest on major credit cards.' },
                  { icon: 'currency_exchange', title: 'Exchange Bonus', desc: 'Get up to ₹15,000 extra value when you trade in your old devices.' },
                  { icon: 'payments', title: 'Instant Cashback', desc: 'Avail up to 10% instant discount on HDFC, ICICI, and SBI bank cards.' },
                  { icon: 'school', title: 'Student Offers', desc: 'Extra 5% discount for students on Laptops and Tablets with valid ID.' }
                ].map((offer, idx) => (
                  <div key={idx} className="p-8 bg-white/5 border border-white/10 rounded-[32px] hover:bg-white/10 transition-all group reveal active" style={{ transitionDelay: `${idx * 100}ms` }}>
                    <span className="material-symbols-outlined text-4xl text-secondary mb-6 block group-hover:scale-110 transition-transform">{offer.icon}</span>
                    <h4 className="text-white font-title-sm mb-2">{offer.title}</h4>
                    <p className="text-on-primary-container text-ui-label-md text-sm">{offer.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Why Choose Us Section */}
          <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-section-gap items-center">
              <div className="reveal active">
                <h2 className="font-headline-md text-on-surface mb-8">Redefining the Electronics Shopping Experience</h2>
                <div className="space-y-8">
                  {[
                    { icon: 'workspace_premium', title: 'Authorized Retailer', desc: 'We are certified partners for Apple, Samsung, Sony, and LG, ensuring genuine products every time.' },
                    { icon: 'support_agent', title: 'Expert Consultation', desc: 'Our in-store specialists help you choose products that best fit your lifestyle and home space.' },
                    { icon: 'rocket_launch', title: 'Priority Setup', desc: 'Complimentary home delivery and professional installation within 24 hours of purchase.' }
                  ].map((feat, idx) => (
                    <div key={idx} className="flex gap-6">
                      <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>{feat.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-title-sm text-on-surface mb-2">{feat.title}</h4>
                        <p className="text-text-secondary text-sm">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 reveal active">
                <div className="space-y-4 pt-12">
                  <div className="rounded-3xl overflow-hidden shadow-lg h-64 bg-slate-200">
                    <img alt="Aone Digital Showroom" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxBLMCShIxYItLtVpAx1-LoZjmeTkB6bIAyLfC5f_c619Ivt5O5IlEEvKDifOBEIa6VidmgDRf_Enw4ezJZooKPXQwaR4_HkVZ7-RlwoC4uWdnqH2y8n2dFwKHsgeuGPiuHghRcQyoneG3W2iR8sAb3Kr10kmc86qQEjHt0pPrjpkrfkrGEyLZOElGO1CEFkX1PmL5bjHfoznLEHm51feeP_eSG-dUhkwnjft-QYIg__ixCUEhI8Hd" />
                  </div>
                  <div className="rounded-3xl overflow-hidden shadow-lg h-80 bg-slate-300">
                    <img alt="Premium Appliances Display" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtwS_J52DBOarBMyyvacqSs9g8Voz-XeXVExcSqfmQiCo_NKS7_zCGSbS9DQi7ZWrcOf-M7h0EcatwizoV7Y1qmQ6MBmve527Y3oiehudH91X7xBDr7m7jfF6mX0MQQUrwPw879PE963P6ObNziJkFf9-Z5QLkOvajElEKuxptZPmuC1MNLKkFg0j1Gf0GjOslt0-pNlhsmQXqSKm1OnsERnU2M4hYyANas8XhAc9WHY57GKj0rH1p" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-3xl overflow-hidden shadow-lg h-80 bg-slate-300">
                    <img alt="Aone Digital Retail Showcase" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAa20rU_vwxaI5CpLSblrqlPSxke6ZbCzQV9Rw0vY4ojFwLhfLX6JtBIfzkm36EnXSJqbTdoSabw361IuJ64qPENfUVcAZsv3sU_mpw77wknLGOKuThCre2ABc_t9lEO6I0m9CA_xbneoFeCtnhTKSXDMCdM7rZqww9cccoP2fpvfSndFqewvi-gHo4bLi_lEEKN3M5VNTBK8v-xFBJv3s0u7Ha79XesHmuQF0JvjWEd86rUVAbq7mj" />
                  </div>
                  <div className="rounded-3xl overflow-hidden shadow-lg h-64 bg-slate-200">
                    <img alt="Customer Service Desk" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0B78xKWopY8aq-sqkFJU-jOeMmKFFam9XEPlU3pTlx3di19VkUwyOLhI8BEDEdx3NBkOkUkIQjgRL2-k1KUXNgztL2rxoNrLE-LK0BvmlHgrz_-YvCEkezizgjNsjiqxZVV9Zt7GQdDRC6X4qU_qQvR__SiMbK5SRM_qJnOx3Wm2colNNtzJOdRsewKPfBSOTCCWXH4gOnrZ7k47nGTqhPvEFaVRyMarO86MNNwZC98xu-6E-83Bd" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials Success Stories */}
          <section className="bg-surface-container py-section-gap overflow-hidden">
            <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center mb-16 reveal active">
              <h2 className="font-headline-md text-on-surface mb-4">Customer Success Stories</h2>
              <div className="flex justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-status-success" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                ))}
              </div>
            </div>
            <div className="flex gap-8 overflow-x-auto pb-12 snap-x px-margin-mobile hide-scrollbar">
              {[
                { name: 'Rajesh Kumar', role: 'Verified Buyer', initial: 'RK', comment: '"Bought my new S24 Ultra and an OLED TV from Hreeem Stores. The financing was smooth and the delivery was same-day. Truly a world-class experience."' },
                { name: 'Sneha Patel', role: 'Homeowner', initial: 'SP', comment: '"The best place for home appliances. Hreeem Stores helped me choose the right AC for my living room and the installation was very professional."' },
                { name: 'Aryan Mehta', role: 'Student', initial: 'AM', comment: '"Hreeem Stores is my go-to for Apple products. Authentic stock, great student discounts, and excellent after-sales support."' }
              ].map((testi, idx) => (
                <div key={idx} className="snap-center flex-shrink-0 w-full sm:w-[400px] glass p-8 rounded-[32px] reveal active" style={{ transitionDelay: `${idx * 100}ms` }}>
                  <p className="text-body-lg text-on-surface italic mb-8 h-28">{testi.comment}</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center font-bold text-secondary">{testi.initial}</div>
                    <div>
                      <h5 className="font-ui-label-bold text-on-surface">{testi.name}</h5>
                      <p className="text-ui-caption text-text-secondary">{testi.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Inquiry Form Section */}
          <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto" id="contact">
            <div className="glass p-8 md:p-16 rounded-[48px] shadow-2xl relative overflow-hidden reveal active">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
                <div>
                  <h2 className="font-headline-md text-on-surface mb-6">Plan Your Next Upgrade</h2>
                  <p className="text-body-lg text-text-secondary mb-10">Fill out the form and our specialist from Aone Digital will reach out to you with personalized offers.</p>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-secondary">call</span>
                      <span className="font-ui-label-bold text-on-surface">+91 7975774472</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-secondary">mail</span>
                      <span className="font-ui-label-bold text-on-surface">support@aonedigital.in</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-secondary">location_on</span>
                      <span className="font-ui-label-bold text-on-surface">Luxury Square, Tech City</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleInquirySubmit} className="space-y-6">
                  {inquirySubmitted ? (
                    <div className="text-center p-10 bg-green-50 border border-green-200 rounded-2xl">
                      <span className="material-symbols-outlined text-5xl text-status-success mb-4">check_circle</span>
                      <h3 className="font-title-sm text-on-surface mb-2">Inquiry Submitted!</h3>
                      <p className="text-sm text-text-secondary">Our product specialist will reach out to you shortly.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-ui-label-bold text-on-surface text-xs block">FULL NAME</label>
                          <input 
                            className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none" 
                            placeholder="John Doe" 
                            type="text"
                            required
                            value={inquiryForm.name}
                            onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-ui-label-bold text-on-surface text-xs block">MOBILE NUMBER</label>
                          <input 
                            className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none" 
                            placeholder="+91 00000 00000" 
                            type="tel"
                            required
                            value={inquiryForm.phone}
                            onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-ui-label-bold text-on-surface text-xs block">EMAIL ADDRESS</label>
                        <input 
                          className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none" 
                          placeholder="john@example.com" 
                          type="email"
                          required
                          value={inquiryForm.email}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-ui-label-bold text-on-surface text-xs block">PRODUCT INTERESTED IN</label>
                          <select 
                            className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none"
                            value={inquiryForm.category}
                            onChange={(e) => setInquiryForm({ ...inquiryForm, category: e.target.value })}
                          >
                            <option>Smartphones</option>
                            <option>Laptops</option>
                            <option>Smart TVs</option>
                            <option>Home Appliances</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-ui-label-bold text-on-surface text-xs block">BUDGET RANGE</label>
                          <select 
                            className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none"
                            value={inquiryForm.budget}
                            onChange={(e) => setInquiryForm({ ...inquiryForm, budget: e.target.value })}
                          >
                            <option>Select Range</option>
                            <option>₹10,000 - ₹30,000</option>
                            <option>₹30,000 - ₹70,000</option>
                            <option>₹70,000 - ₹1,50,000</option>
                            <option>₹1,50,000+</option>
                          </select>
                        </div>
                      </div>
                      <button type="submit" className="w-full py-4 bg-secondary text-white font-ui-label-bold rounded-xl shadow-lg hover:bg-secondary-container transition-all">Submit Inquiry</button>
                    </>
                  )}
                </form>
              </div>
            </div>
          </section>

          {/* FAQ Accordion Section */}
          <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto bg-white rounded-[64px] mb-section-gap">
            <div className="text-center mb-16 reveal active">
              <h2 className="font-headline-md text-on-surface mb-4">Frequently Asked Questions</h2>
            </div>
            <div className="max-w-3xl mx-auto space-y-4 px-margin-mobile">
              {[
                { q: 'What documents are needed for No-Cost EMI?', a: 'For credit card EMI, no documents are needed. For paper-based finance (Bajaj Finserv/HDFC), you will need your Aadhaar card, PAN card, and a cancelled cheque.' },
                { q: 'How long does the delivery and installation take?', a: 'Standard delivery from Aone Digital is within 24 hours for in-stock products. Professional installation for appliances is scheduled within 48 hours of delivery.' }
              ].map((faq, idx) => (
                <div key={idx} className="border border-outline-variant rounded-2xl overflow-hidden reveal active">
                  <button 
                    className="w-full px-6 py-4 flex justify-between items-center bg-white hover:bg-surface-container-low transition-colors text-left font-ui-label-bold text-on-surface"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  >
                    <span>{faq.q}</span>
                    <span className={`material-symbols-outlined transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>
                  {openFaq === idx && (
                    <div className="px-6 py-4 bg-surface-container-lowest text-text-secondary text-sm border-t border-outline-variant/30">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Checkout Screen */}
      {view === 'checkout' && (
        <section className="max-w-3xl mx-auto my-28 p-8 md:p-12 glass rounded-[32px] shadow-2xl w-full px-margin-mobile">
          <div className="flex items-center gap-2 mb-8">
            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors flex items-center" onClick={() => setView('home')}>
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h2 className="font-headline-md text-on-surface">Secure Checkout</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
            <form onSubmit={handleCheckoutSubmit} className="lg:col-span-3 space-y-6">
              <div className="space-y-2">
                <label className="text-ui-label-bold text-on-surface text-xs block">FULL NAME</label>
                <input 
                  type="text" 
                  className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-secondary" 
                  required 
                  placeholder="John Doe"
                  value={shippingForm.name}
                  onChange={(e) => setShippingForm({ ...shippingForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-ui-label-bold text-on-surface text-xs block">EMAIL ADDRESS</label>
                <input 
                  type="email" 
                  className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-secondary" 
                  required 
                  placeholder="john@example.com"
                  value={shippingForm.email}
                  onChange={(e) => setShippingForm({ ...shippingForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-ui-label-bold text-on-surface text-xs block">STREET ADDRESS</label>
                <input 
                  type="text" 
                  className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-secondary" 
                  required 
                  placeholder="123 Luxury Avenue"
                  value={shippingForm.address}
                  onChange={(e) => setShippingForm({ ...shippingForm, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-ui-label-bold text-on-surface text-xs block">CITY</label>
                  <input 
                    type="text" 
                    className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-secondary" 
                    required 
                    placeholder="New York"
                    value={shippingForm.city}
                    onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-ui-label-bold text-on-surface text-xs block">ZIP CODE</label>
                  <input 
                    type="text" 
                    className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-secondary" 
                    required 
                    placeholder="10001"
                    value={shippingForm.zip}
                    onChange={(e) => setShippingForm({ ...shippingForm, zip: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-ui-label-bold text-on-surface text-xs block">PHONE NUMBER</label>
                <input 
                  type="tel" 
                  className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-secondary" 
                  required 
                  placeholder="+91 00000 00000"
                  value={shippingForm.phone}
                  onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                />
              </div>
              <button type="submit" className="w-full py-4 bg-secondary text-white font-bold rounded-xl shadow-lg hover:bg-secondary-container transition-all">
                Place Secure Order (₹{cartTotal.toLocaleString('en-IN')})
              </button>
            </form>

            {/* Cart Summary */}
            <div className="lg:col-span-2 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6">
              <h3 className="font-ui-label-bold text-sm mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-lg">shopping_bag</span> Order Summary
              </h3>
              <div className="space-y-4 max-h-64 overflow-y-auto mb-6 pr-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs">
                    <span className="text-text-secondary line-clamp-1 flex-1">{item.name} <strong className="text-on-surface">x{item.quantity}</strong></span>
                    <span className="font-bold text-on-surface ml-2">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-outline-variant/30 pt-4 flex justify-between items-center font-bold">
                <span className="text-xs text-text-secondary">Subtotal:</span>
                <span className="text-lg text-secondary font-extrabold">₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Confirmation View */}
      {view === 'confirmation' && (
        <section className="max-w-lg mx-auto my-36 p-10 glass rounded-[40px] text-center shadow-2xl w-full px-margin-mobile">
          <span className="material-symbols-outlined text-6xl text-status-success mb-6 block" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <h2 className="font-headline-md text-on-surface mb-3">Order Confirmed!</h2>
          <p className="text-text-secondary text-sm mb-6 max-w-sm mx-auto">
            Thank you for shopping with Aone Digital. Your order has been registered successfully.
          </p>
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 mb-8">
            <span className="text-xs text-text-muted block mb-1">Order Identifier</span>
            <code className="text-sm font-bold text-on-surface">{orderId}</code>
          </div>
          <button 
            className="px-8 py-3.5 bg-secondary text-white font-bold rounded-xl shadow-lg hover:bg-secondary-container transition-all"
            onClick={() => setView('home')}
          >
            Return to Homepage
          </button>
        </section>
      )}

      {/* Admin Login View */}
      {view === 'admin-login' && (
        <section className="max-w-md mx-auto my-36 p-8 md:p-12 glass rounded-[32px] shadow-2xl w-full px-margin-mobile">
          <div className="text-center mb-8">
            <h2 className="font-headline-md text-on-surface mb-2">Admin Portal</h2>
            <p className="text-sm text-text-secondary">Please log in to manage your inventory.</p>
          </div>
          
          <form onSubmit={handleAdminLogin} className="space-y-6">
            {adminLoginError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold text-center animate-pulse">
                {adminLoginError}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-ui-label-bold text-on-surface text-xs block">USERNAME</label>
              <input 
                type="text" 
                className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all" 
                required 
                placeholder="Enter username"
                value={adminCredentials.username}
                onChange={(e) => setAdminCredentials({ ...adminCredentials, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-ui-label-bold text-on-surface text-xs block">PASSWORD</label>
              <input 
                type="password" 
                className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all" 
                required 
                placeholder="Enter password"
                value={adminCredentials.password}
                onChange={(e) => setAdminCredentials({ ...adminCredentials, password: e.target.value })}
              />
            </div>
            
            <div className="flex gap-4">
              <button 
                type="button" 
                className="w-1/2 py-3.5 border border-outline text-on-surface font-bold rounded-xl hover:bg-slate-50 transition-all text-sm cursor-pointer"
                onClick={() => setView('home')}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="w-1/2 py-3.5 bg-secondary text-white font-bold rounded-xl shadow-lg hover:bg-secondary-container transition-all text-sm cursor-pointer"
              >
                Login
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Admin Dashboard View */}
      {view === 'admin-dashboard' && (
        <section className="py-28 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 border-b border-outline-variant/30 pb-6">
            <div>
              <h2 className="font-headline-md text-on-surface">Admin Inventory Dashboard</h2>
              <p className="text-text-secondary text-sm">Manage products, pricing, stock levels, and brand information.</p>
            </div>
            <div className="flex gap-3">
              <button 
                className="px-5 py-3 bg-secondary text-white font-bold rounded-xl shadow-md hover:bg-secondary-container hover:scale-105 transition-all text-xs flex items-center gap-2 cursor-pointer"
                onClick={() => {
                  setEditingProductId(null);
                  setProductForm({
                    name: '',
                    brand: '',
                    category: 'mobile',
                    price: '',
                    stock: '',
                    description: '',
                    image_url: '',
                    specifications: {}
                  });
                  setIsProductModalOpen(true);
                }}
              >
                <span className="material-symbols-outlined text-sm">add</span> Add New Product
              </button>
              <button 
                className="px-5 py-3 border border-outline text-on-surface font-bold rounded-xl hover:bg-slate-50 hover:scale-105 transition-all text-xs flex items-center gap-2 cursor-pointer"
                onClick={() => {
                  setIsAdminLoggedIn(false);
                  setView('home');
                }}
              >
                <span className="material-symbols-outlined text-sm">logout</span> Logout
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-text-secondary">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-secondary mx-auto mb-4"></div>
              <p className="text-sm">Loading products...</p>
            </div>
          ) : (
            <div className="bg-white border border-outline-variant/30 rounded-[32px] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant/50">
                      <th className="p-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Product</th>
                      <th className="p-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Category</th>
                      <th className="p-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Brand</th>
                      <th className="p-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Price</th>
                      <th className="p-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">Stock</th>
                      <th className="p-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-6 flex items-center gap-4">
                          <img 
                            src={product.image_url} 
                            alt={product.name} 
                            className="w-12 h-12 rounded-xl object-contain bg-slate-50 border border-slate-100"
                            onError={(e) => {
                              e.target.src = "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=100&q=80";
                            }}
                          />
                          <div>
                            <span className="font-semibold text-on-surface text-sm block">{product.name}</span>
                            <span className="text-[10px] text-text-muted font-mono">{product.id}</span>
                          </div>
                        </td>
                        <td className="p-6 text-sm text-text-secondary capitalize">{product.category.replace('_', ' ')}</td>
                        <td className="p-6 text-sm text-text-secondary">{product.brand}</td>
                        <td className="p-6 text-sm text-on-surface font-bold text-right">₹{product.price.toLocaleString('en-IN')}</td>
                        <td className="p-6 text-sm text-text-secondary text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            product.stock > 10 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {product.stock} units
                          </span>
                        </td>
                        <td className="p-6 text-center">
                          <div className="flex gap-2 justify-center">
                            <button 
                              className="p-2 text-secondary hover:bg-secondary/10 rounded-lg transition-colors flex items-center cursor-pointer"
                              onClick={() => handleEditClick(product)}
                              title="Edit product"
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button 
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center cursor-pointer"
                              onClick={() => handleDeleteProduct(product.id)}
                              title="Delete product"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Product Add/Edit Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-outline-variant/30 rounded-[32px] p-8 md:p-10 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative my-8">
            <button 
              className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors flex items-center cursor-pointer"
              onClick={() => setIsProductModalOpen(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <h3 className="font-headline-sm text-on-surface mb-6">
              {editingProductId ? 'Edit Product Details' : 'Add New Product'}
            </h3>
            
            <form onSubmit={handleProductSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-ui-label-bold text-on-surface text-xs block">PRODUCT NAME</label>
                  <input 
                    type="text" 
                    className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all" 
                    required 
                    placeholder="e.g. iPhone 15 Pro"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-ui-label-bold text-on-surface text-xs block">BRAND</label>
                  <input 
                    type="text" 
                    className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all" 
                    required 
                    placeholder="e.g. Apple"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-ui-label-bold text-on-surface text-xs block">CATEGORY</label>
                  <select 
                    className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  >
                    <option value="mobile">Mobiles &amp; Tablets</option>
                    <option value="home_appliance">Home Appliances</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-ui-label-bold text-on-surface text-xs block">PRICE (₹)</label>
                  <input 
                    type="number" 
                    className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all" 
                    required 
                    placeholder="e.g. 79900"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-ui-label-bold text-on-surface text-xs block">STOCK COUNT</label>
                  <input 
                    type="number" 
                    className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all" 
                    required 
                    placeholder="e.g. 15"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-ui-label-bold text-on-surface text-xs block">IMAGE URL</label>
                <input 
                  type="url" 
                  className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all" 
                  placeholder="https://images.unsplash.com/..."
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-ui-label-bold text-on-surface text-xs block">DESCRIPTION</label>
                <textarea 
                  rows="3" 
                  className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all resize-none" 
                  placeholder="Briefly describe the product..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-outline-variant/30">
                <button 
                  type="button" 
                  className="w-1/2 py-3.5 border border-outline text-on-surface font-bold rounded-xl hover:bg-slate-50 transition-all text-sm cursor-pointer"
                  onClick={() => setIsProductModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 py-3.5 bg-secondary text-white font-bold rounded-xl shadow-lg hover:bg-secondary-container transition-all text-sm cursor-pointer"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cart Drawer overlays */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemoveFromCart}
        onCheckout={() => {
          setIsCartOpen(false);
          setView('checkout');
        }}
      />

      {/* Floating Action Buttons */}
      {showMainNavbar && (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4">
          <a 
            href="https://wa.me/917975774472" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-14 h-14 bg-[#25D366] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
          >
            <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.284l-.539 2.016 2.049-.526c.947.517 2.002.81 3.23.811 3.18 0 5.764-2.583 5.765-5.763 0-3.18-2.583-5.788-5.757-5.788zm3.284 8.232c-.131.368-.684.693-.941.737-.257.045-.584.059-1.21-.197-2.613-1.071-4.303-3.738-4.434-3.913-.131-.175-1.066-1.417-1.066-2.702 0-1.285.671-1.921.908-2.184.237-.263.513-.329.684-.329.171 0 .342.001.488.007.155.006.363-.058.567.437.204.496.697 1.706.756 1.823.059.117.098.253.02.409-.079.156-.118.253-.236.389-.118.136-.25.304-.355.408-.118.118-.242.247-.105.485.137.237.608 1.004 1.303 1.623.893.796 1.649 1.042 1.886 1.161.237.118.375.098.513-.059.138-.156.592-.691.751-.926.158-.236.315-.197.533-.117.217.08 1.382.652 1.618.77.237.118.395.175.454.272.059.098.059.563-.073.931z"></path>
            </svg>
          </a>
          <button 
            className="w-14 h-14 bg-white text-secondary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Back to top"
          >
            <span className="material-symbols-outlined">arrow_upward</span>
          </button>
        </div>
      )}

      {/* Global footer */}
      {showMainNavbar && (
        <footer className="bg-primary-container dark:bg-surface-container-lowest w-full pt-section-gap pb-8 mt-auto border-t border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto text-on-primary-container font-body-md text-body-md text-sm">
            <div className="space-y-6">
              <span className="font-headline-md text-headline-md text-on-primary block select-none">Aone Digital</span>
              <p className="max-w-xs text-on-primary-container/80 leading-relaxed">Experience the future of retail with India's most trusted premium electronics destination.</p>
              <div className="flex gap-4">
                <a className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors" href="#">
                  <span className="material-symbols-outlined text-on-primary text-sm">public</span>
                </a>
                <a className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors" href="#">
                  <span className="material-symbols-outlined text-on-primary text-sm">share</span>
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-ui-label-bold mb-6">Product Categories</h4>
              <ul className="space-y-3 text-on-primary-container/80">
                <li><span className="hover:text-on-primary transition-colors cursor-pointer" onClick={() => { setCategoryFilter('mobile'); scrollIntoCatalog(); }}>Smartphones</span></li>
                <li><span className="hover:text-on-primary transition-colors cursor-pointer" onClick={() => { setCategoryFilter('home_appliance'); scrollIntoCatalog(); }}>Appliances</span></li>
                <li><span className="hover:text-on-primary transition-colors cursor-pointer" onClick={() => { setCategoryFilter('home_appliance'); scrollIntoCatalog(); }}>Smart Home</span></li>
                <li><span className="hover:text-on-primary transition-colors cursor-pointer" onClick={() => { setCategoryFilter('mobile'); scrollIntoCatalog(); }}>Laptops</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-ui-label-bold mb-6">Quick Links</h4>
              <ul className="space-y-3 text-on-primary-container/80">
                <li><a className="hover:text-on-primary transition-colors" href="#">Store Locator</a></li>
                <li><a className="hover:text-on-primary transition-colors" href="#">Support</a></li>
                <li><a className="hover:text-on-primary transition-colors" href="#">Privacy Policy</a></li>
                <li><a className="hover:text-on-primary transition-colors" href="#">Terms of Service</a></li>
                <li><button className="hover:text-on-primary transition-colors cursor-pointer text-left" onClick={() => setView('admin-login')}>Admin Portal</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-ui-label-bold mb-6">Newsletter</h4>
              <p className="mb-4 text-on-primary-container/80 leading-relaxed">Subscribe for early access to exclusive sales and product launches.</p>
              {newsletterSubscribed ? (
                <p className="text-status-success text-xs font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">check_circle</span> Subscribed successfully!
                </p>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex">
                  <input 
                    className="bg-white/10 border-0 rounded-l-xl px-4 py-3 text-white focus:ring-1 focus:ring-secondary outline-none flex-grow text-xs" 
                    placeholder="Email" 
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                  />
                  <button type="submit" className="bg-secondary px-4 rounded-r-xl text-white hover:bg-secondary-container transition-colors flex items-center justify-center" aria-label="Subscribe">
                    <span className="material-symbols-outlined text-sm">send</span>
                  </button>
                </form>
              )}
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-white/10 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto text-center">
            <div className="space-y-2 text-xs">
              <p className="text-ui-caption text-on-primary-container/60">© 2026 Aone Digital. All rights reserved.</p>
              <p className="text-ui-caption text-on-primary-container/60">Designed &amp; Developed by Bharath Kumar</p>
              <p className="text-ui-caption text-on-primary-container/60">Contact: 7975774472, WhatsApp: 8453036381</p>
              <p className="text-ui-caption text-on-primary-container/60">Email: support@aonedigital.in | Admin: bharath.kumar@aonedigital.in</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
