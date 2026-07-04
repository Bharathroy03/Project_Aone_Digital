import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import BrandCarousel from './components/BrandCarousel';
import CategoryRow, { brandStyle, getBrandLogo } from './components/CategoryRow';
import BannerSection from './components/BannerSection';
import { supabase } from './supabaseClient';
import './admin.css';
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught UI crash error:", error, errorInfo);
    fetch('/api/error-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message || 'React UI crash',
        stack_trace: error.stack || '',
        context: { componentStack: errorInfo.componentStack || '' }
      })
    }).catch((err) => console.error("Failed to post error logs:", err));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center font-sans">
          <div className="bg-white border border-slate-200 rounded-[32px] p-8 md:p-12 shadow-xl max-w-md w-full space-y-6">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-3xl">gavel</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-800">Something went wrong</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                The application encountered an unexpected interface crash. Our team has been notified.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl shadow-md hover:bg-secondary-container transition-all flex items-center gap-1.5 mx-auto cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">refresh</span> Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AdPlacementBlock({ placementName, onClick }) {
  const isLeaderboard = placementName.includes("Brands") || placementName.includes("Banner") || placementName.includes("Choose") || placementName.includes("FAQ");
  const sizeText = isLeaderboard ? "1200 × 200 px" : "728 × 90 px";
  const formatLabel = isLeaderboard ? "Leaderboard Slot" : "Billboard Slot";
  
  return (
    <div 
      className={`ad-placement-box ${isLeaderboard ? 'leaderboard' : 'billboard'} max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop my-8 transition-all`}
      onClick={() => onClick(placementName)}
    >
      <div className="ad-placement-inner flex flex-col sm:flex-row items-center justify-between p-6 bg-white/40 backdrop-blur-md border border-dashed border-slate-350 rounded-2xl cursor-pointer hover:border-secondary hover:bg-white/60 transition-all gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined text-lg">ads_click</span>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>✦ Advertise Here</span>
              <span className="px-1.5 py-0.5 text-[9px] bg-slate-200 text-slate-600 font-bold rounded uppercase tracking-wider">{formatLabel}</span>
            </div>
            <p className="text-[10px] text-slate-400">Select this slot to feature your product or promo banner ({sizeText})</p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <span className="px-4 py-2 border border-slate-200 hover:border-secondary text-[11px] font-bold text-slate-600 hover:text-secondary rounded-xl transition-all inline-block">
            Inquire Now
          </span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const logFrontendError = (message, error) => {
    console.error(message, error);
    fetch('/api/error-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message + (error ? `: ${error.message || error}` : ''),
        stack_trace: error ? (error.stack || '') : '',
        context: { url: window.location.href, agent: navigator.userAgent }
      })
    }).catch(() => {});
  };

  const validatePhone = (phone) => {
    const cleaned = (phone || '').replace(/\D/g, '');
    return cleaned.length >= 10;
  };

  const [toast, setToast] = useState(null);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => prev && prev.message === message ? null : prev);
    }, 4500);
  };

  const alert = (message) => {
    const msgLower = String(message).toLowerCase();
    const isSuccess = msgLower.includes('success') || msgLower.includes('complete') || msgLower.includes('updated') || msgLower.includes('save') || msgLower.includes('copied') || msgLower.includes('published') || msgLower.includes('registered') || msgLower.includes('added') || msgLower.includes('deleted');
    showNotification(message, isSuccess ? 'success' : 'error');
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Navigation View: 'home', 'checkout', 'confirmation', 'admin-login', 'admin-dashboard'
  const [view, setView] = useState(() => {
    const path = window.location.pathname;
    if (path === '/admin' || path === '/admin/') {
      return 'admin-login';
    }
    return 'home';
  });
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderId, setOrderId] = useState('');
  
  // Category filter state ('all', 'mobile', 'home_appliance')
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState(null);
  const [catBrandFilter, setCatBrandFilter] = useState('All');
  const [catSortFilter, setCatSortFilter] = useState('default');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [preloaderActive, setPreloaderActive] = useState(true);
  const [preloaderFade, setPreloaderFade] = useState(false);
  const [customerSelectedProduct, setCustomerSelectedProduct] = useState(null);
  const [orders, setOrders] = useState([]);

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

  // Advertisement Inquiry Form State
  const [promoSubTab, setPromoSubTab] = useState('banners'); // 'banners', 'offers', 'ads', 'campaigns'
  const [isAdInquiryOpen, setIsAdInquiryOpen] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState('');
  const [adInquiryForm, setAdInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    size: '728x90 Billboard',
    budget: 'Select Budget Range',
    notes: ''
  });
  const [adInquirySubmitted, setAdInquirySubmitted] = useState(false);

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

  // Default website configuration settings
  const [settings, setSettings] = useState({
    announcement: {
      enabled: true,
      text: "Festive Upgrade Sale: Get up to 10% instant discount + No-Cost EMI up to 24 months!",
      link: "#offers"
    },
    hero: {
      title: "Smart Tech.",
      highlight: "Modern Living.",
      subtitle: "Curated smartphones and premium smart appliances designed to elevate your home.",
      cta1_text: "Explore Products",
      cta1_link: "#products-section",
      cta2_text: "Contact Us",
      cta2_link: "#contact",
      bg_image_url: "/images/hero-bg.png",
      logo_url: "/images/logo.png",
      favicon_url: "/images/Icon.png",
      logo_height: 48
    },
    ticker: {
      enabled: true,
      speed: "normal",
      items: [
        "🔥 Festive Sale — Up to 40% OFF on all Smartphones",
        "💳 No-Cost EMI available on orders above ₹10,000",
        "📦 Free Home Delivery on all orders above ₹5,000",
        "🎁 Exchange your old device — Get up to ₹15,000 extra value",
        "⚡ Apple, Samsung, Sony — Authorized Premium Retailer",
        "🛡️ 100% Genuine products with full manufacturer warranty",
        "🚀 Same-day delivery available in select cities"
      ]
    },
    brands: [
      {slug: "apple", name: "Apple", bg: "#F2F2F2", iconColor: "1a1a1a"},
      {slug: "samsung", name: "Samsung", bg: "#E8EDFF", iconColor: "1428A0"},
      {slug: "sony", name: "Sony", bg: "#F0F0F0", iconColor: "000000"},
      {slug: "lg", name: "LG", bg: "#FFF0F3", iconColor: "A50034"},
      {slug: "vivo", name: "Vivo", bg: "#EEF0FF", iconColor: "415FFF"},
      {slug: "whirlpool", name: "Whirlpool", bg: "#EAF0FF", iconColor: "003087"},
      {slug: "dyson", name: "Dyson", bg: "#FFF0F0", iconColor: "C41230"},
      {slug: "oneplus", name: "OnePlus", bg: "#FFF1F1", iconColor: "F5010C"},
      {slug: "xiaomi", name: "Xiaomi", bg: "#FFF5EC", iconColor: "FF6900"},
      {slug: "bosch", name: "Bosch", bg: "#EAF5FF", iconColor: "007BC0"}
    ],
    about: {
      title: "Redefining the Electronics Shopping Experience",
      subtitle: "Certified premium retail destinations since 2012.",
      description: "At Aone Digital, we bring you genuine global brands with expert support, flexible financing, and rapid home setups."
    },
    categories: [
      { title: 'Smartphones', emoji: '📱', filterKey: 'smart_phone', brands: ['Apple', 'Samsung', 'Vivo', 'OnePlus', 'Xiaomi', 'Realme'] },
      { title: 'Smart TVs', emoji: '📺', filterKey: 'tv', brands: ['Samsung', 'LG', 'Sony', 'Mi', 'OnePlus', 'TCL'] },
      { title: 'Laptops', emoji: '💻', filterKey: 'laptop', brands: ['Apple', 'Dell', 'HP', 'Asus', 'Lenovo', 'Acer'] },
      { title: 'Refrigerators', emoji: '❄️', filterKey: 'refrigerator', brands: ['Samsung', 'LG', 'Whirlpool', 'Haier', 'Godrej'] },
      { title: 'Washing Machines', emoji: '🫧', filterKey: 'washing_machine', brands: ['Samsung', 'LG', 'Whirlpool', 'IFB', 'Bosch'] },
      { title: 'Air Conditioners', emoji: '🌬️', filterKey: 'air_conditioner', brands: ['Daikin', 'Voltas', 'LG', 'Samsung', 'Blue Star'] },
      { title: 'Kitchen Appliances', emoji: '🍳', filterKey: 'home_appliance', brands: ['Bosch', 'Philips', 'Morphy Richards', 'Prestige'] }
    ],
    footer: {
      copyright: "© 2026 Aone Digital. All rights reserved.",
      website_url: "https://aonedigital.in",
      developed_by: "Designed & Developed by Bharath Kumar",
      description: "Experience the future of retail with India's most trusted premium electronics destination.",
      email: "support@aonedigital.in",
      phone: "7975774472",
      whatsapp: "8453036381",
      address: "Luxury Square, Tech City",
      admin_email: "bharath.kumar@aonedigital.in"
    },
    theme: {
      primary: "#f9f9ff",
      onPrimary: "#141b2b",
      secondary: "#002d62",
      borderRadius: "24px",
      darkMode: false
    },
    seo: {
      title: "Aone Digital India - Premium Phones & Home Appliances",
      description: "Authorized premium smartphones, laptops, smart TVs and refrigerators with full warranty, fast shipping and easy EMI at Aone Digital.",
      keywords: "mobiles, laptops, refrigerators, smart tv, no cost emi, Bangalore, electronics store"
    },
    offers_section_title: "Exclusive Retail Offers",
    offers_section_subtitle: "Maximum benefits on every purchase you make at Aone Digital.",
    offers: [
      { icon: "credit_card", title: "No Cost EMI", desc: "Pay over 6-24 months with absolutely 0% interest on major credit cards." },
      { icon: "currency_exchange", title: "Exchange Bonus", desc: "Get up to ₹15,000 extra value when you trade in your old devices." },
      { icon: "payments", title: "Instant Cashback", desc: "Avail up to 10% instant discount on HDFC, ICICI, and SBI bank cards." },
      { icon: "school", title: "Student Offers", desc: "Extra 5% discount for students on Laptops and Tablets with valid ID." }
    ],
    featured_ads: {
      layout: "grid",
      items_per_row: 3,
      enable_sidebar_ad: true,
      sidebar_ad_title: "Partner Showcase",
      sidebar_ad_subtitle: "Advertise your brand here to reach thousands of technology buyers.",
      sidebar_ad_image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=60",
      sidebar_ad_link: "",
      sidebar_ad_cta: "Advertise With Us"
    },
    gallery: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDxBLMCShIxYItLtVpAx1-LoZjmeTkB6bIAyLfC5f_c619Ivt5O5IlEEvKDifOBEIa6VidmgDRf_Enw4ezJZooKPXQwaR4_HkVZ7-RlwoC4uWdnqH2y8n2dFwKHsgeuGPiuHghRcQyoneG3W2iR8sAb3Kr10kmc86qQEjHt0pPrjpkrfkrGEyLZOElGO1CEFkX1PmL5bjHfoznLEHm51feeP_eSG-dUhkwnjft-QYIg__ixCUEhI8Hd",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCtwS_J52DBOarBMyyvacqSs9g8Voz-XeXVExcSqfmQiCo_NKS7_zCGSbS9DQi7ZWrcOf-M7h0EcatwizoV7Y1qmQ6MBmve527Y3oiehudH91X7xBDr7m7jfF6mX0MQQUrwPw879PE963P6ObNziJkFf9-Z5QLkOvajElEKuxptZPmuC1MNLKkFg0j1Gf0GjOslt0-pNlhsmQXqSKm1OnsERnU2M4hYyANas8XhAc9WHY57GKj0rH1p",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAa20rU_vwxaI5CpLSblrqlPSxke6ZbCzQV9Rw0vY4ojFwLhfLX6JtBIfzkm36EnXSJqbTdoSabw361IuJ64qPENfUVcAZsv3sU_mpw77wknLGOKuThCre2ABc_t9lEO6I0m9CA_xbneoFeCtnhTKSXDMCdM7rZqww9cccoP2fpvfSndFqewvi-gHo4bLi_lEEKN3M5VNTBK8v-xFBJv3s0u7Ha79XesHmuQF0JvjWEd86rUVAbq7mj",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC0B78xKWopY8aq-sqkFJU-jOeMmKFFam9XEPlU3pTlx3di19VkUwyOLhI8BEDEdx3NBkOkUkIQjgRL2-k1KUXNgztL2rxoNrLE-LK0BvmlHgrz_-YvCEkezizgjNsjiqxZVV9Zt7GQdDRC6X4qU_qQvR__SiMbK5SRM_qJnOx3Wm2colNNtzJOdRsewKPfBSOTCCWXH4gOnrZ7k47nGTqhPvEFaVRyMarO86MNNwZC98xu-6E-83Bd"
    ],
    testimonials: [
      { name: "Rajesh Kumar", role: "Verified Buyer", initial: "RK", comment: "\"Bought my new S24 Ultra and an OLED TV from Aone Digital. The financing was smooth and the delivery was same-day. Truly a world-class experience.\"" },
      { name: "Sneha Patel", role: "Homeowner", initial: "SP", comment: "\"The best place for home appliances. Aone Digital helped me choose the right AC for my living room and the installation was very professional.\"" },
      { name: "Aryan Mehta", role: "Student", initial: "AM", comment: "\"Aryan Digital is my go-to for Apple products. Authentic stock, great student discounts, and excellent after-sales support.\"" }
    ],
    faqs: [
      { q: "What documents are needed for No-Cost EMI?", a: "For credit card EMI, no documents are needed. For paper-based finance (Bajaj Finserv/HDFC), you will need your Aadhaar card, PAN card, and a cancelled cheque." },
      { q: "How long does the delivery and installation take?", a: "Standard delivery from Aone Digital is within 24 hours for in-stock products. Professional installation for appliances is scheduled within 48 hours of delivery." }
    ]
  });

  const [settingsLoading, setSettingsLoading] = useState(true);

  // CMS Dashboard sub-view tab: 'overview', 'editor', 'products', 'banners', 'media', 'leads', 'theme', 'users', 'logs'
  const [cmsTab, setCmsTab] = useState('overview');
  const [adminSidebarOpen, setAdminSidebarOpen] = useState(false);

  // Admin sidebar: which nav groups are expanded (collapsible groups)
  const [expandedNavGroups, setExpandedNavGroups] = useState({ editor: false, promotions: false });
  const toggleNavGroup = (groupId) => setExpandedNavGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));

  const handleSubLinkClick = (tab, subTab = null, anchorId = null) => {
    setCmsTab(tab);
    if (subTab) {
      setPromoSubTab(subTab);
    }
    setAdminSidebarOpen(false);
    setCmsSearchQuery('');
    if (anchorId) {
      setTimeout(() => {
        const el = document.getElementById(anchorId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  };



  // ── Banners state ──────────────────────────────────────────
  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [bannerDimError, setBannerDimError] = useState('');
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    type: 'hero',
    image_url: '',
    link_url: '#',
    link_label: 'Shop Now',
    enabled: true,
    scheduled_start: '',
    scheduled_end: '',
    width: null,
    height: null,
  });

  const BANNER_SIZE_SPECS = {
    hero:   { width: 1920, height: 700,  label: 'Desktop Hero Banner',       recommended: '1920 × 700 px' },
    wide:   { width: 1600, height: 500,  label: 'Wide Promotional Banner',   recommended: '1600 × 500 px' },
    square: { width: 1080, height: 1080, label: 'Square Promotional Banner', recommended: '1080 × 1080 px' },
    tablet: { width: 1200, height: 600,  label: 'Tablet Banner',             recommended: '1200 × 600 px' },
    mobile: { width: 1080, height: 1350, label: 'Mobile Banner',             recommended: '1080 × 1350 px' },
  };

  const fetchBanners = (adminMode = false) => {
    setBannersLoading(true);
    fetch(`/api/banners${adminMode ? '?admin=1' : ''}`)
      .then(r => r.json())
      .then(data => { setBanners(data); setBannersLoading(false); })
      .catch(() => setBannersLoading(false));
  };

  const handleBannerImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBannerDimError('');
    setBannerUploading(true);

    // Validate dimensions
    const validateDims = (url) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve(null);
      img.src = url;
    });

    try {
      const base64Fallback = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => res(reader.result);
        reader.onerror = rej;
      });

      const dims = await validateDims(base64Fallback);
      const spec = BANNER_SIZE_SPECS[bannerForm.type];

      let warn = '';
      if (dims && spec) {
        if (dims.w !== spec.width || dims.h !== spec.height) {
          warn = `⚠ Recommended size for ${bannerForm.type} banners is ${spec.recommended}. Your image is ${dims.w} × ${dims.h} px. It will be scaled — consider re-exporting at the exact recommended size.`;
        }
      }
      setBannerDimError(warn);

      const publicUrl = await uploadToSupabase(file, 'banners', 'slides');
      setBannerForm(prev => ({ ...prev, image_url: publicUrl, width: dims?.w || null, height: dims?.h || null }));
    } catch {
      setBannerDimError('Could not read image file.');
    } finally {
      setBannerUploading(false);
    }
  };

  const handleBannerSubmit = (e) => {
    e.preventDefault();
    if (!bannerForm.image_url) { alert('Please upload an image first.'); return; }
    fetch('/api/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-User': adminCredentials.username || 'Admin' },
      body: JSON.stringify(bannerForm),
    })
      .then(r => {
        if (!r.ok) return r.json().then(err => { throw new Error(err.error || 'Failed to submit banner'); });
        return r.json();
      })
      .then(() => {
        setBannerForm({ title: '', subtitle: '', type: 'hero', image_url: '', link_url: '#', link_label: 'Shop Now', enabled: true, scheduled_start: '', scheduled_end: '', width: null, height: null });
        setBannerDimError('');
        fetchBanners(true);
        fetchBanners(false);
      })
      .catch(err => {
        logFrontendError('Banner creation failed', err);
        alert(err.message);
      });
  };

  const handleBannerToggle = (bannerId, currentEnabled) => {
    fetch(`/api/banners/${bannerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Admin-User': adminCredentials.username || 'Admin' },
      body: JSON.stringify({ enabled: !currentEnabled }),
    })
      .then(r => {
        if (!r.ok) return r.json().then(err => { throw new Error(err.error || 'Failed to update toggle state'); });
        return r.json();
      })
      .then(() => { fetchBanners(true); fetchBanners(false); })
      .catch(err => {
        logFrontendError('Banner toggle failed', err);
        alert(err.message);
      });
  };

  const handleBannerDelete = (bannerId, title) => {
    if (!window.confirm(`Delete banner "${title}"?`)) return;
    fetch(`/api/banners/${bannerId}`, {
      method: 'DELETE',
      headers: { 'X-Admin-User': adminCredentials.username || 'Admin' },
    })
      .then(r => {
        if (!r.ok) return r.json().then(err => { throw new Error(err.error || 'Failed to delete banner'); });
        return r.json();
      })
      .then(() => { fetchBanners(true); fetchBanners(false); })
      .catch(err => {
        logFrontendError('Banner deletion failed', err);
        alert(err.message);
      });
  };

  const handleBannerReorder = (bannerId, direction, currentOrder) => {
    const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
    fetch(`/api/banners/${bannerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Admin-User': adminCredentials.username || 'Admin' },
      body: JSON.stringify({ sort_order: newOrder }),
    })
      .then(r => {
        if (!r.ok) return r.json().then(err => { throw new Error(err.error || 'Failed to reorder banner'); });
        return r.json();
      })
      .then(() => fetchBanners(true))
      .catch(err => {
        logFrontendError('Banner reordering failed', err);
        alert(err.message);
      });
  };

  const handleBannerSchedule = (bannerId, field, value) => {
    fetch(`/api/banners/${bannerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Admin-User': adminCredentials.username || 'Admin' },
      body: JSON.stringify({ [field]: value || null }),
    })
      .then(r => {
        if (!r.ok) return r.json().then(err => { throw new Error(err.error || 'Failed to update schedule'); });
        return r.json();
      })
      .then(() => fetchBanners(true))
      .catch(err => {
        logFrontendError('Banner scheduling failed', err);
        alert(err.message);
      });
  };

  // Dashboard CMS lists
  const [leads, setLeads] = useState([]);
  const [media, setMedia] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [analytics, setAnalytics] = useState({
    visitors: 12450,
    views: 4820,
    leads_count: 0,
    total_stock: 0,
    featured_count: 0,
    recent_logs: []
  });

  // Admin users manager
  const [currentUserRole, setCurrentUserRole] = useState('Super Admin');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState({ username: '', role: 'Content Editor', email: '', status: 'active' });
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [userSubTab, setUserSubTab] = useState('members');
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [roleForm, setRoleForm] = useState({ name: '', description: '', permissions: [] });

  // Lead manager state
  const [selectedLead, setSelectedLead] = useState(null);

  // Search filter
  const [cmsSearchQuery, setCmsSearchQuery] = useState('');
  
  // Admin product creation / editing variables
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    brand: '',
    category: 'smart_phone',
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

  const fetchSettings = () => {
    setSettingsLoading(true);
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          if (data.categories) {
            const hasFridge = data.categories.some(c => c.filterKey === 'refrigerator');
            if (!hasFridge) {
              data.categories.push({
                title: "Refrigerators",
                emoji: "❄️",
                filterKey: "refrigerator",
                brands: ["Samsung", "LG", "Whirlpool", "Haier", "Godrej"]
              });
            }
          }
          if (!data.gallery) {
            data.gallery = [
              "https://lh3.googleusercontent.com/aida-public/AB6AXuDxBLMCShIxYItLtVpAx1-LoZjmeTkB6bIAyLfC5f_c619Ivt5O5IlEEvKDifOBEIa6VidmgDRf_Enw4ezJZooKPXQwaR4_HkVZ7-RlwoC4uWdnqH2y8n2dFwKHsgeuGPiuHghRcQyoneG3W2iR8sAb3Kr10kmc86qQEjHt0pPrjpkrfkrGEyLZOElGO1CEFkX1PmL5bjHfoznLEHm51feeP_eSG-dUhkwnjft-QYIg__ixCUEhI8Hd",
              "https://lh3.googleusercontent.com/aida-public/AB6AXuCtwS_J52DBOarBMyyvacqSs9g8Voz-XeXVExcSqfmQiCo_NKS7_zCGSbS9DQi7ZWrcOf-M7h0EcatwizoV7Y1qmQ6MBmve527Y3oiehudH91X7xBDr7m7jfF6mX0MQQUrwPw879PE963P6ObNziJkFf9-Z5QLkOvajElEKuxptZPmuC1MNLKkFg0j1Gf0GjOslt0-pNlhsmQXqSKm1OnsERnU2M4hYyANas8XhAc9WHY57GKj0rH1p",
              "https://lh3.googleusercontent.com/aida-public/AB6AXuAa20rU_vwxaI5CpLSblrqlPSxke6ZbCzQV9Rw0vY4ojFwLhfLX6JtBIfzkm36EnXSJqbTdoSabw361IuJ64qPENfUVcAZsv3sU_mpw77wknLGOKuThCre2ABc_t9lEO6I0m9CA_xbneoFeCtnhTKSXDMCdM7rZqww9cccoP2fpvfSndFqewvi-gHo4bLi_lEEKN3M5VNTBK8v-xFBJv3s0u7Ha79XesHmuQF0JvjWEd86rUVAbq7mj",
              "https://lh3.googleusercontent.com/aida-public/AB6AXuC0B78xKWopY8aq-sqkFJU-jOeMmKFFam9XEPlU3pTlx3di19VkUwyOLhI8BEDEdx3NBkOkUkIQjgRL2-k1KUXNgztL2rxoNrLE-LK0BvmlHgrz_-YvCEkezizgjNsjiqxZVV9Zt7GQdDRC6X4qU_qQvR__SiMbK5SRM_qJnOx3Wm2colNNtzJOdRsewKPfBSOTCCWXH4gOnrZ7k47nGTqhPvEFaVRyMarO86MNNwZC98xu-6E-83Bd"
            ];
          }
          if (!data.testimonials) {
            data.testimonials = [
              { name: "Rajesh Kumar", role: "Verified Buyer", initial: "RK", comment: "\"Bought my new S24 Ultra and an OLED TV from Aone Digital. The financing was smooth and the delivery was same-day. Truly a world-class experience.\"" },
              { name: "Sneha Patel", role: "Homeowner", initial: "SP", comment: "\"The best place for home appliances. Aone Digital helped me choose the right AC for my living room and the installation was very professional.\"" },
              { name: "Aryan Mehta", role: "Student", initial: "AM", comment: "\"Aryan Digital is my go-to for Apple products. Authentic stock, great student discounts, and excellent after-sales support.\"" }
            ];
          }
          if (!data.faqs) {
            data.faqs = [
              { q: "What documents are needed for No-Cost EMI?", a: "For credit card EMI, no documents are needed. For paper-based finance (Bajaj Finserv/HDFC), you will need your Aadhaar card, PAN card, and a cancelled cheque." },
              { q: "How long does the delivery and installation take?", a: "Standard delivery from Aone Digital is within 24 hours for in-stock products. Professional installation for appliances is scheduled within 48 hours of delivery." }
            ];
          }
        }
        setSettings(data);
        setSettingsLoading(false);
      })
      .catch((err) => {
        console.error('Settings fetch error:', err);
        setSettingsLoading(false);
      });
  };

  const fetchOrders = () => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => setOrders(data))
      .catch((err) => console.error('Orders fetch error:', err));
  };

  const fetchLeads = () => {
    fetch('/api/leads')
      .then((res) => res.json())
      .then((data) => setLeads(data))
      .catch((err) => console.error('Leads fetch error:', err));
  };

  const fetchMedia = () => {
    fetch('/api/media')
      .then((res) => res.json())
      .then((data) => setMedia(data))
      .catch((err) => console.error('Media fetch error:', err));
  };

  const fetchUsers = () => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error('Users fetch error:', err));
  };

  const fetchRoles = () => {
    fetch('/api/roles')
      .then((res) => res.json())
      .then((data) => setRoles(data))
      .catch((err) => console.error('Roles fetch error:', err));
  };

  const fetchPermissions = () => {
    fetch('/api/permissions')
      .then((res) => res.json())
      .then((data) => setPermissions(data))
      .catch((err) => console.error('Permissions fetch error:', err));
  };

  const fetchAuditLogs = () => {
    fetch('/api/audit-logs')
      .then((res) => res.json())
      .then((data) => setAuditLogs(data))
      .catch((err) => console.error('Audit logs fetch error:', err));
  };

  const fetchAnalytics = () => {
    fetch('/api/analytics')
      .then((res) => res.json())
      .then((data) => setAnalytics(data))
      .catch((err) => console.error('Analytics fetch error:', err));
  };

  // Fetch all CMS dashboard modules on load + routing match & force start from beginning on reload
  useEffect(() => {
    refreshProducts();
    fetchSettings();
    fetchBanners(false);
    
    // Disable browser scroll restoration to prevent page jump on reload
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    
    // Check initial path on load
    const path = window.location.pathname;
    if (path === '/admin' || path === '/admin/') {
      setView(isAdminLoggedIn ? 'admin-dashboard' : 'admin-login');
    } else {
      // Force storefront view to home, clear parameters, and scroll to the top Hero section
      setView('home');
      window.history.replaceState({}, '', '/');
      window.scrollTo(0, 0);
    }
  }, []);

  // Sync data when view is toggled to dashboard
  useEffect(() => {
    if (view === 'admin-dashboard') {
      fetchLeads();
      fetchOrders();
      fetchMedia();
      fetchUsers();
      fetchRoles();
      fetchPermissions();
      fetchAuditLogs();
      fetchAnalytics();
    }
  }, [view]);

  // Update address bar when view changes
  useEffect(() => {
    const path = window.location.pathname;
    if (view === 'admin-login' || view === 'admin-dashboard') {
      if (path !== '/admin') {
        window.history.pushState({}, '', '/admin');
      }
    } else if (view === 'category') {
      if (selectedCategoryKey && path !== `/category/${selectedCategoryKey}`) {
        window.history.pushState({}, '', `/category/${selectedCategoryKey}`);
      }
    } else if (view === 'home') {
      if (path !== '/') {
        window.history.pushState({}, '', '/');
      }
    }
  }, [view, selectedCategoryKey]);

  // Support browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/admin' || path === '/admin/') {
        setView(isAdminLoggedIn ? 'admin-dashboard' : 'admin-login');
      } else if (path.startsWith('/category/')) {
        const catKey = path.split('/category/')[1];
        setSelectedCategoryKey(catKey);
        setView('category');
      } else {
        setView('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAdminLoggedIn]);

  // Scroll Reveal Animations using IntersectionObserver
  useEffect(() => {
    const observerOptions = {
      threshold: 0.05,
      rootMargin: '0px 0px -40px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, observerOptions);

    // Observe elements
    const elements = document.querySelectorAll('.reveal');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [products, settings, view]);

  // Scroll Progress tracker side-effect
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      document.documentElement.style.setProperty('--scroll-y', scrolled);
      
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((scrolled / totalScroll) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle preloader fade-out transition after data load
  useEffect(() => {
    if (!loading && !settingsLoading) {
      setPreloaderFade(true);
      const timer = setTimeout(() => {
        setPreloaderActive(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [loading, settingsLoading]);

  // Look for search URL parameters on load and catalog sync
  useEffect(() => {
    if (products.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const searchName = params.get('search');
      if (searchName) {
        const found = products.find(p => p.name.toLowerCase() === decodeURIComponent(searchName).toLowerCase());
        if (found) {
          setCustomerSelectedProduct(found);
        }
      }
    }
  }, [products]);

  // Bind CSS custom variables and page title/meta updates on settings change
  useEffect(() => {
    if (settings && settings.theme) {
      const root = document.documentElement;
      root.style.setProperty('--bg-primary', settings.theme.primary || '#f9f9ff');
      root.style.setProperty('--on-background', settings.theme.onPrimary || '#141b2b');
      root.style.setProperty('--secondary', settings.theme.secondary || '#002d62');
      root.style.setProperty('--radius-3xl', settings.theme.borderRadius || '24px');
      
      if (settings.seo) {
        document.title = settings.seo.title || "Aone Digital";
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          metaDesc.setAttribute('content', settings.seo.description || '');
        }
      }

      // Dynamic Tab Favicon Update
      const faviconUrl = settings.hero?.favicon_url || "/images/Icon.png";
      let faviconLink = document.querySelector("link[rel~='icon']");
      if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(faviconLink);
      }
      faviconLink.href = faviconUrl;
    }
  }, [settings]);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminCredentials.username === 'Bharath' && adminCredentials.password === 'Bharath@123') {
      setIsAdminLoggedIn(true);
      setCurrentUserRole('Super Admin');
      setAdminLoginError(null);
      setView('admin-dashboard');
    } else {
      const match = users.find((u) => u.username === adminCredentials.username);
      if (match && adminCredentials.password === 'Bharath@123') {
        setIsAdminLoggedIn(true);
        setCurrentUserRole(match.role);
        setAdminLoginError(null);
        setView('admin-dashboard');
      } else {
        setAdminLoginError('Invalid administrator credentials.');
      }
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const uploadToSupabase = async (file, bucketName, folderPath = '') => {
    // 1. File size check (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      const msg = "File size exceeds the 5MB limit. Please upload a smaller image file.";
      alert(msg);
      throw new Error(msg);
    }

    // 2. File type check (supported images only)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      const msg = "Unsupported file format. Please upload a valid PNG, JPG, or WebP image.";
      alert(msg);
      throw new Error(msg);
    }

    try {
      if (!supabase || supabase.supabaseUrl.includes('your-supabase-project')) {
        throw new Error('Supabase client not configured');
      }
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.warn(`Supabase upload failed for bucket "${bucketName}", using local base64 fallback:`, err);
      
      // Log storage exception to backend
      fetch('/api/error-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Supabase storage upload failed: ${err.message || err}`,
          stack_trace: err.stack || '',
          context: { bucket: bucketName, fileName: file.name, fileSize: file.size }
        })
      }).catch(() => {});

      return await fileToBase64(file);
    }
  };

  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');

  const handleAddSpec = (e) => {
    e.preventDefault();
    if (!specKey || !specVal) return;
    setProductForm({
      ...productForm,
      specifications: {
        ...productForm.specifications,
        [specKey]: specVal
      }
    });
    setSpecKey('');
    setSpecVal('');
  };

  const handleRemoveSpec = (keyToRemove) => {
    const updated = { ...productForm.specifications };
    delete updated[keyToRemove];
    setProductForm({
      ...productForm,
      specifications: updated
    });
  };

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const publicUrl = await uploadToSupabase(file, 'product-images', 'products');
      setProductForm({ ...productForm, image_url: publicUrl });
    } finally {
      setUploadingImage(false);
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
          category: 'smart_phone',
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

  const handleUpdateOffer = (index, field, value) => {
    const updatedOffers = [...(settings.offers || [])];
    updatedOffers[index] = { ...updatedOffers[index], [field]: value };
    setSettings(prev => ({ ...prev, offers: updatedOffers }));
  };

  const handleAddOffer = () => {
    const currentOffers = settings.offers || [];
    if (currentOffers.length >= 8) {
      alert("Maximum of 8 retail offers allowed.");
      return;
    }
    setSettings(prev => ({
      ...prev,
      offers: [...currentOffers, { icon: 'percent', title: 'New Promotion', desc: 'Detail about this promotion offer here.' }]
    }));
  };

  const handleRemoveOffer = (index) => {
    const updatedOffers = (settings.offers || []).filter((_, i) => i !== index);
    setSettings(prev => ({ ...prev, offers: updatedOffers }));
  };

  const handleUpdateFeaturedAdField = (field, value) => {
    setSettings(prev => ({
      ...prev,
      featured_ads: {
        ...prev.featured_ads,
        [field]: value
      }
    }));
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'X-Admin-User': adminCredentials.username || 'Admin'
      },
      body: JSON.stringify(settings)
    })
      .then((res) => {
        if (!res.ok) throw new Error('Settings update failed');
        return res.json();
      })
      .then(() => {
        alert('Website settings updated and published successfully!');
        fetchSettings();
      })
      .catch((err) => alert(err.message));
  };

  const handleRoleSubmit = (e) => {
    e.preventDefault();
    const endpoint = editingRoleId ? `/api/roles/${editingRoleId}` : '/api/roles';
    const method = editingRoleId ? 'PUT' : 'POST';

    fetch(endpoint, {
      method: method,
      headers: { 
        'Content-Type': 'application/json',
        'X-Admin-User': adminCredentials.username || 'Admin'
      },
      body: JSON.stringify(roleForm)
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((err) => { throw new Error(err.error || 'Operation failed'); });
        }
        return res.json();
      })
      .then(() => {
        setIsRoleModalOpen(false);
        setEditingRoleId(null);
        setRoleForm({ name: '', description: '', permissions: [] });
        fetchRoles();
      })
      .catch((err) => alert(err.message));
  };

  const handleDeleteRole = (roleId) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    if (!window.confirm(`Are you sure you want to delete the role "${role.name}"?`)) return;

    fetch(`/api/roles/${roleId}`, {
      method: 'DELETE',
      headers: {
        'X-Admin-User': adminCredentials.username || 'Admin'
      }
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((err) => { throw new Error(err.error || 'Failed to delete role'); });
        }
        return res.json();
      })
      .then(() => {
        fetchRoles();
      })
      .catch((err) => alert(err.message));
  };

  const handleUserSubmit = (e) => {
    e.preventDefault();
    const endpoint = editingUserId ? `/api/users/${editingUserId}` : '/api/users';
    const method = editingUserId ? 'PUT' : 'POST';

    fetch(endpoint, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userForm)
    })
      .then((res) => {
        if (!res.ok) throw new Error('User submit failed');
        return res.json();
      })
      .then(() => {
        setIsUserModalOpen(false);
        setEditingUserId(null);
        setUserForm({ username: '', role: 'Content Editor', email: '', status: 'active' });
        fetchUsers();
      })
      .catch((err) => alert(err.message));
  };

  const handleToggleUserStatus = (user) => {
    if (user.username === 'Bharath') {
      alert("Super Admin 'Bharath' status cannot be updated.");
      return;
    }
    const newStatus = user.status === 'inactive' ? 'active' : 'inactive';
    fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to update user status');
        return res.json();
      })
      .then(() => fetchUsers())
      .catch((err) => alert(err.message));
  };

  const handleEditUserClick = (u) => {
    setEditingUserId(u.id);
    setUserForm({ username: u.username, role: u.role, email: u.email, status: u.status || 'active' });
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = (userId) => {
    if (!window.confirm('Are you sure you want to remove this user?')) return;
    fetch(`/api/users/${userId}`, { method: 'DELETE' })
      .then((res) => {
        if (!res.ok) throw new Error('Delete user failed');
        return res.json();
      })
      .then(() => fetchUsers())
      .catch((err) => alert(err.message));
  };

  const handleUpdateLeadStatus = (leadId, status, notes) => {
    fetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'X-Admin-User': adminCredentials.username || 'Admin'
      },
      body: JSON.stringify({ status, notes })
    })
      .then((res) => res.json())
      .then(() => {
        fetchLeads();
        setSelectedLead(null);
      })
      .catch((err) => alert(err.message));
  };

  const handleExportLeadsCSV = () => {
    const headers = ["Lead ID", "Customer Name", "Email", "Phone", "Category", "Budget", "Notes", "Status", "Created At"];
    const rows = leads.map(l => [
      l.id,
      l.name,
      l.email,
      l.phone,
      l.category,
      l.budget,
      l.notes.replace(/,/g, ' '),
      l.status,
      l.created_at
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `aone_digital_leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const publicUrl = await uploadToSupabase(file, 'media');

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          url: publicUrl,
          size: `${(file.size / 1024).toFixed(0)} KB`,
          file_type: file.type
        })
      });

      if (!response.ok) throw new Error('Failed to index file in database');
      fetchMedia();
    } catch (err) {
      console.error('Media upload error:', err);
    }
  };

  const handleDeleteMedia = (mediaId) => {
    if (!window.confirm('Delete this asset from media library?')) return;
    fetch(`/api/media/${mediaId}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then(() => fetchMedia())
      .catch((err) => alert(err.message));
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

    if (!validatePhone(inquiryForm.phone)) {
      alert('Validation Error: Please enter a valid 10-digit mobile number.');
      return;
    }

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inquiryForm.email, name: inquiryForm.name, phone: inquiryForm.phone })
    })
      .then((res) => {
        if (!res.ok) throw new Error('Submission rejected by server');
        return res.json();
      })
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
        } else {
          alert('Submission failed: ' + (data.error || 'Server rejected request'));
        }
      })
      .catch((err) => {
        logFrontendError('Connection error during inquiry submission', err);
        alert('Submission Error: Unable to submit your inquiry. Please check your network and try again.');
      });
  };

  const handleAdPlacementClick = (placementName) => {
    if (isAdminLoggedIn) {
      setView('admin-dashboard');
      setCmsTab('banners');
      setPromoSubTab('banners');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setSelectedPlacement(placementName);
      const isLeaderboard = placementName.includes("Brands") || placementName.includes("Banner") || placementName.includes("Choose") || placementName.includes("FAQ");
      const size = isLeaderboard ? '1200x200 Leaderboard' : '728x90 Billboard';
      setAdInquiryForm({
        name: '',
        email: '',
        phone: '',
        company: '',
        size: size,
        budget: 'Select Budget Range',
        notes: `Inquiry regarding placement slot: ${placementName}`
      });
      setAdInquirySubmitted(false);
      setIsAdInquiryOpen(true);
    }
  };

  const handleAdInquirySubmit = (e) => {
    e.preventDefault();
    if (!adInquiryForm.name || !adInquiryForm.email || !adInquiryForm.phone) return;

    if (!validatePhone(adInquiryForm.phone)) {
      alert('Validation Error: Please enter a valid 10-digit mobile number.');
      return;
    }

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: adInquiryForm.name,
        email: adInquiryForm.email,
        phone: adInquiryForm.phone,
        category: 'Advertisement Inquiry',
        budget: adInquiryForm.budget,
        notes: `Company: ${adInquiryForm.company || 'N/A'}\nSlot Size: ${adInquiryForm.size}\nSelected Slot: ${selectedPlacement}\nAdditional Notes: ${adInquiryForm.notes || 'None'}`
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error('Submission rejected by server');
        return res.json();
      })
      .then((data) => {
        if (data.status === 'success') {
          setAdInquirySubmitted(true);
          setTimeout(() => {
            setIsAdInquiryOpen(false);
            setAdInquirySubmitted(false);
          }, 3000);
        } else {
          alert('Submission failed: ' + (data.error || 'Server rejected request'));
        }
      })
      .catch((err) => {
        logFrontendError('Connection error during advertisement inquiry submission', err);
        alert('Submission Error: We are unable to submit your advertisement request. Please check your network.');
      });
  };

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    
    if (!validatePhone(shippingForm.phone)) {
      alert('Validation Error: Please enter a valid 10-digit mobile number.');
      return;
    }

    const orderData = {
      customer_name: shippingForm.name,
      shipping_address: `${shippingForm.address}, ${shippingForm.city}, ${shippingForm.zip}`,
      phone: shippingForm.phone,
      email: shippingForm.email,
      total_amount: cartTotal,
      items: cart.map((item) => ({
        product_id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }))
    };

    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    })
      .then((res) => {
        if (!res.ok) throw new Error('Order creation failed on server');
        return res.json();
      })
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
        logFrontendError('Connection error during order checkout submission', err);
        alert('Order Error: Unable to complete your checkout. Please check your network and try again.');
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
    if (categoryFilter === 'all') {
      return products;
    }
    return products.filter((p) => p.category === categoryFilter);
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const scrollIntoCatalog = () => {
    document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' });
  };

  const showMainNavbar = view === 'home' || view === 'checkout' || view === 'confirmation' || view === 'category';

  return (
    <ErrorBoundary>
      <div className="bg-background text-on-background font-body-md overflow-x-hidden min-h-screen flex flex-col justify-between">
      {/* Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-[3px] bg-secondary z-[60] transition-all duration-75"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Dynamic Premium Preloader */}
      {preloaderActive && (
        <div className={`fixed inset-0 z-[200] bg-[#f9f9ff] flex flex-col items-center justify-center gap-6 transition-all duration-700 ease-in-out ${
          preloaderFade ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100'
        }`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,81,213,0.06)_0%,transparent_100%)]"></div>
          <div className="relative flex items-center justify-center">
            {/* Spinning gradient ring */}
            <div className="w-20 h-20 rounded-full border-2 border-slate-200/60 border-t-secondary animate-spin"></div>
            {/* Pulsating inner icon / logo */}
            {settings.hero?.favicon_url || settings.hero?.logo_url ? (
              <img 
                src={settings.hero.favicon_url || "/images/Icon.png"} 
                alt="Aone Digital Loader" 
                className="absolute w-10 h-10 object-contain animate-pulse rounded-full" 
                onError={(e) => { e.target.src = "/images/Icon.png"; }}
              />
            ) : (
              <span className="material-symbols-outlined absolute text-3xl text-secondary animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
                grid_view
              </span>
            )}
          </div>
          <div className="relative z-10 text-center space-y-2">
            <h3 className="font-headline-md text-[#141b2b] text-lg tracking-wide font-extrabold m-0" style={{ fontFamily: 'var(--font-body)' }}>Aone Digital</h3>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest animate-pulse" style={{ fontFamily: 'var(--font-ui)' }}>Loading Premium Destination...</p>
          </div>
        </div>
      )}

      {showMainNavbar && (
        <Header 
          cartCount={cartCount} 
          onCartClick={() => setIsCartOpen(true)} 
          settings={settings}
          products={products}
          onLogoClick={() => {
            setView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {view === 'home' && (
        <>
          <Hero onExploreClick={scrollIntoCatalog} />

          {/* Brand Showcase Carousel */}
          <BrandCarousel settings={settings} />

          {/* Ad Placement 1 */}
          <AdPlacementBlock placementName="After Brands Carousel" onClick={handleAdPlacementClick} />

          {/* Shop by Category — Separate Scrollable Rows */}
          <div className="cat-rows-wrapper" id="categories">
            <div className="cat-rows-inner">
              <div className="cat-section-heading">
                <h2 className="cat-section-title">Shop by Category</h2>
                <div className="cat-section-underline"></div>
              </div>

              {(settings.categories || []).map((row) => (
                <CategoryRow
                  key={row.filterKey}
                  title={row.title}
                  emoji={row.emoji}
                  filterKey={row.filterKey}
                  brands={row.brands}
                  products={products}
                  loading={loading}
                  isAdmin={isAdminLoggedIn}
                  onAddToCart={handleAddToCart}
                  cart={cart}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteProduct}
                  onViewAll={(filter) => {
                    setSelectedCategoryKey(filter);
                    setView('category');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ))}
            </div>
          </div>

          {/* Ad Placement 2 */}
          <AdPlacementBlock placementName="After Category Rows" onClick={handleAdPlacementClick} />

          {/* ── Company Banners & Advertisements ── */}
          <BannerSection banners={banners} loading={bannersLoading} />

          {/* Ad Placement 3 */}
          <AdPlacementBlock placementName="After Banner Section" onClick={handleAdPlacementClick} />

          {/* Featured Offers Section */}
          <section className="bg-primary-container py-section-gap relative overflow-hidden" id="offers">
            <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 blur-[120px] rounded-full parallax-float-up"></div>
            <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
              <div className="text-center mb-16 reveal">
                <h2 className="font-headline-md text-white mb-4">{settings.offers_section_title || 'Exclusive Retail Offers'}</h2>
                <p className="text-on-primary-container font-ui-label-md">{settings.offers_section_subtitle || 'Maximum benefits on every purchase you make at Aone Digital.'}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(settings.offers || [
                  { icon: 'credit_card', title: 'No Cost EMI', desc: 'Pay over 6-24 months with absolutely 0% interest on major credit cards.' },
                  { icon: 'currency_exchange', title: 'Exchange Bonus', desc: 'Get up to ₹15,000 extra value when you trade in your old devices.' },
                  { icon: 'payments', title: 'Instant Cashback', desc: 'Avail up to 10% instant discount on HDFC, ICICI, and SBI bank cards.' },
                  { icon: 'school', title: 'Student Offers', desc: 'Extra 5% discount for students on Laptops and Tablets with valid ID.' }
                ]).map((offer, idx) => (
                  <div key={idx} className="p-8 bg-white/5 border border-white/10 rounded-[32px] hover:bg-white/10 transition-all group reveal animate-all duration-300" style={{ transitionDelay: `${idx * 100}ms` }}>
                    <span className="material-symbols-outlined text-4xl text-secondary mb-6 block group-hover:scale-110 transition-transform">{offer.icon}</span>
                    <h4 className="text-white font-title-sm mb-2">{offer.title}</h4>
                    <p className="text-on-primary-container text-ui-label-md text-sm">{offer.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Ad Placement 4 */}
          <AdPlacementBlock placementName="After Offers Section" onClick={handleAdPlacementClick} />

          {/* Why Choose Us Section */}
          <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-section-gap items-center">
              <div className="reveal">
                <h2 className="font-headline-md text-on-surface mb-8">{settings?.about?.title || 'Redefining the Electronics Shopping Experience'}</h2>
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
              
              <div className="grid grid-cols-2 gap-4 reveal">
                <div className="space-y-4 pt-12">
                  <div className="rounded-3xl overflow-hidden shadow-lg h-64 bg-slate-200">
                    <img alt="Aone Digital Showroom" className="w-full h-full object-cover" src={settings.gallery?.[0] || "https://lh3.googleusercontent.com/aida-public/AB6AXuDxBLMCShIxYItLtVpAx1-LoZjmeTkB6bIAyLfC5f_c619Ivt5O5IlEEvKDifOBEIa6VidmgDRf_Enw4ezJZooKPXQwaR4_HkVZ7-RlwoC4uWdnqH2y8n2dFwKHsgeuGPiuHghRcQyoneG3W2iR8sAb3Kr10kmc86qQEjHt0pPrjpkrfkrGEyLZOElGO1CEFkX1PmL5bjHfoznLEHm51feeP_eSG-dUhkwnjft-QYIg__ixCUEhI8Hd"} />
                  </div>
                  <div className="rounded-3xl overflow-hidden shadow-lg h-80 bg-slate-300">
                    <img alt="Premium Appliances Display" className="w-full h-full object-cover" src={settings.gallery?.[1] || "https://lh3.googleusercontent.com/aida-public/AB6AXuCtwS_J52DBOarBMyyvacqSs9g8Voz-XeXVExcSqfmQiCo_NKS7_zCGSbS9DQi7ZWrcOf-M7h0EcatwizoV7Y1qmQ6MBmve527Y3oiehudH91X7xBDr7m7jfF6mX0MQQUrwPw879PE963P6ObNziJkFf9-Z5QLkOvajElEKuxptZPmuC1MNLKkFg0j1Gf0GjOslt0-pNlhsmQXqSKm1OnsERnU2M4hYyANas8XhAc9WHY57GKj0rH1p"} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-3xl overflow-hidden shadow-lg h-80 bg-slate-300">
                    <img alt="Aone Digital Retail Showcase" className="w-full h-full object-cover" src={settings.gallery?.[2] || "https://lh3.googleusercontent.com/aida-public/AB6AXuAa20rU_vwxaI5CpLSblrqlPSxke6ZbCzQV9Rw0vY4ojFwLhfLX6JtBIfzkm36EnXSJqbTdoSabw361IuJ64qPENfUVcAZsv3sU_mpw77wknLGOKuThCre2ABc_t9lEO6I0m9CA_xbneoFeCtnhTKSXDMCdM7rZqww9cccoP2fpvfSndFqewvi-gHo4bLi_lEEKN3M5VNTBK8v-xFBJv3s0u7Ha79XesHmuQF0JvjWEd86rUVAbq7mj"} />
                  </div>
                  <div className="rounded-3xl overflow-hidden shadow-lg h-64 bg-slate-200">
                    <img alt="Customer Service Desk" className="w-full h-full object-cover" src={settings.gallery?.[3] || "https://lh3.googleusercontent.com/aida-public/AB6AXuC0B78xKWopY8aq-sqkFJU-jOeMmKFFam9XEPlU3pTlx3di19VkUwyOLhI8BEDEdx3NBkOkUkIQjgRL2-k1KUXNgztL2rxoNrLE-LK0BvmlHgrz_-YvCEkezizgjNsjiqxZVV9Zt7GQdDRC6X4qU_qQvR__SiMbK5SRM_qJnOx3Wm2colNNtzJOdRsewKPfBSOTCCWXH4gOnrZ7k47nGTqhPvEFaVRyMarO86MNNwZC98xu-6E-83Bd"} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Ad Placement 5 */}
          <AdPlacementBlock placementName="After Why Choose Us" onClick={handleAdPlacementClick} />

          {/* Testimonials Success Stories */}
          <section className="bg-surface-container py-16 overflow-hidden">
            <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center mb-8 reveal animate-fade-in">
              <h2 className="font-headline-md text-on-surface mb-2">Customer Success Stories</h2>
              <div className="flex justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-status-success" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                ))}
              </div>
            </div>
            <div className="flex gap-8 overflow-x-auto pb-4 snap-x px-margin-mobile hide-scrollbar">
              {(settings.testimonials || [
                { name: 'Rajesh Kumar', role: 'Verified Buyer', initial: 'RK', comment: '"Bought my new S24 Ultra and an OLED TV from Aone Digital. The financing was smooth and the delivery was same-day. Truly a world-class experience."' },
                { name: 'Sneha Patel', role: 'Homeowner', initial: 'SP', comment: '"The best place for home appliances. Aone Digital helped me choose the right AC for my living room and the installation was very professional."' },
                { name: 'Aryan Mehta', role: 'Student', initial: 'AM', comment: '"Aryan Digital is my go-to for Apple products. Authentic stock, great student discounts, and excellent after-sales support."' }
              ]).map((testi, idx) => (
                <div key={idx} className="snap-center flex-shrink-0 w-full sm:w-[400px] glass p-6 rounded-2xl reveal animate-fade-in" style={{ transitionDelay: `${idx * 100}ms` }}>
                  <p className="text-body-md text-on-surface italic mb-4 min-h-[80px] flex items-center">{testi.comment}</p>
                  <div className="flex items-center gap-4 border-t border-slate-100 pt-4">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center font-bold text-secondary text-sm">{testi.initial}</div>
                    <div>
                      <h5 className="font-ui-label-bold text-on-surface text-sm">{testi.name}</h5>
                      <p className="text-ui-caption text-text-secondary text-xs">{testi.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Ad Placement 6 */}
          <AdPlacementBlock placementName="After Testimonials" onClick={handleAdPlacementClick} />

          {/* Inquiry Form Section */}
          <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto" id="contact">
            <div className="glass p-8 md:p-16 rounded-[48px] shadow-2xl relative overflow-hidden reveal animate-fade-in">
              {/* Floating Parallax Spheres */}
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-secondary/5 blur-[80px] rounded-full parallax-float-up pointer-events-none z-0"></div>
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/5 blur-[80px] rounded-full parallax-float-down pointer-events-none z-0"></div>
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
                    <div className="text-center p-10 bg-green-50 border border-green-200 rounded-2xl animate-fade-in">
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
                            className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none font-semibold text-slate-700"
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
                            className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none font-semibold text-slate-700"
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
                      <button type="submit" className="w-full py-4 bg-secondary text-white font-ui-label-bold rounded-xl shadow-lg hover:bg-secondary-container transition-all cursor-pointer">Submit Inquiry</button>
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
              {(settings.faqs || [
                { q: 'What documents are needed for No-Cost EMI?', a: 'For credit card EMI, no documents are needed. For paper-based finance (Bajaj Finserv/HDFC), you will need your Aadhaar card, PAN card, and a cancelled cheque.' },
                { q: 'How long does the delivery and installation take?', a: 'Standard delivery from Aone Digital is within 24 hours for in-stock products. Professional installation for appliances is scheduled within 48 hours of delivery.' }
              ]).map((faq, idx) => (
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

          {/* Ad Placement 7 */}
          <AdPlacementBlock placementName="After FAQ Section" onClick={handleAdPlacementClick} />
        </>
      )}

      {/* Category Grid View Screen */}
      {view === 'category' && (() => {
        const activeCat = (settings.categories || []).find((c) => c.filterKey === selectedCategoryKey) || {
          title: 'Products Collection',
          emoji: '🛒',
          filterKey: selectedCategoryKey,
          brands: []
        };

        // Filter products by category
        let filteredProducts = products.filter((p) => p.category === selectedCategoryKey);

        // Filter by brand
        if (catBrandFilter !== 'All') {
          filteredProducts = filteredProducts.filter((p) => p.brand?.toLowerCase() === catBrandFilter.toLowerCase());
        }

        // Sort products
        if (catSortFilter === 'low-to-high') {
          filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
        } else if (catSortFilter === 'high-to-high') {
          filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
        }

        // Get unique list of brands configured in this category or present in active products
        const uniqueCategoryBrands = ['All', ...(activeCat.brands?.length ? activeCat.brands : [...new Set(products.filter(p => p.category === selectedCategoryKey).map(p => p.brand))].filter(Boolean))];

        return (
          <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop my-28 min-h-[60vh] flex flex-col gap-8 w-full animate-fade-in">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
              <span className="hover:text-secondary cursor-pointer" onClick={() => setView('home')}>Home</span>
              <span className="material-symbols-outlined text-[10px] text-slate-400">chevron_right</span>
              <span className="text-on-surface font-bold capitalize">{activeCat.title}</span>
            </div>

            {/* Category Banner Head */}
            <div className="relative overflow-hidden rounded-[32px] p-8 md:p-12 text-white bg-gradient-to-r from-secondary-container to-primary flex flex-col justify-center min-h-[160px] shadow-lg">
              <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
              <div className="relative z-10 flex flex-col gap-2">
                <span className="text-3xl md:text-4xl">{activeCat.emoji}</span>
                <h1 className="font-headline-md text-white text-3xl font-extrabold m-0 leading-none flex items-center gap-3">
                  {activeCat.title}
                </h1>
                <p className="text-xs text-slate-300 font-medium tracking-wide mt-1">
                  Discover genuine global brands &amp; premium models with easy EMI options.
                </p>
              </div>
            </div>

            {/* Top Bar Filters & Sorting */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200/50 p-4 rounded-2xl shadow-sm">
              {/* Back to Home Button */}
              <button 
                onClick={() => {
                  setView('home');
                  setCatBrandFilter('All');
                  setCatSortFilter('default');
                }}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex-shrink-0"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Storefront
              </button>

              {/* Brand Pills filter */}
              <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1.5 md:pb-0 hide-scrollbar flex-1 px-2">
                {uniqueCategoryBrands.map((brandName) => {
                  const isActive = catBrandFilter === brandName;
                  return (
                    <button
                      key={brandName}
                      onClick={() => setCatBrandFilter(brandName)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-secondary text-white shadow-sm'
                          : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {brandName}
                    </button>
                  );
                })}
              </div>

              {/* Price Sorter */}
              <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort by</label>
                <select
                  value={catSortFilter}
                  onChange={(e) => setCatSortFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
                >
                  <option value="default">Default Sort</option>
                  <option value="low-to-high">Price: Low to High</option>
                  <option value="high-to-high">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Products Grid with optional Sidebar */}
            <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
              <div className="flex-grow w-full">
                {filteredProducts.length > 0 ? (
                  <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 ${settings.featured_ads?.enable_sidebar_ad ? 'lg:grid-cols-3 xl:grid-cols-4' : 'lg:grid-cols-4 xl:grid-cols-5'} gap-6`}>
                    {filteredProducts.map((product) => {
                      const isAdded = cart.some((item) => item.id === product.id);
                      return (
                        <div key={product.id} className="flex justify-center">
                          <div className="cat-product-card group w-full">
                            {/* Admin Overlay */}
                            {isAdminLoggedIn && (
                              <div className="cat-admin-overlay">
                                <button
                                  className="cat-admin-btn edit"
                                  onClick={(e) => { e.stopPropagation(); handleEditClick(product); }}
                                  title="Edit product"
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                                </button>
                                <button
                                  className="cat-admin-btn delete"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id); }}
                                  title="Delete product"
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                                </button>
                              </div>
                            )}

                            {/* Product Image */}
                            <div className="cat-card-img-wrap">
                              <div 
                                className="cat-card-badge"
                                style={{ 
                                  backgroundColor: brandStyle(product.brand || '').bg,
                                  border: `1px solid ${brandStyle(product.brand || '').text}20`,
                                  padding: '4px 10px',
                                  borderRadius: '99px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                {getBrandLogo(product.brand || activeCat.title)}
                              </div>
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="cat-card-img"
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=300&q=60';
                                }}
                              />
                            </div>

                            {/* Info */}
                            <div className="cat-card-body">
                              <h5 className="cat-card-name" style={{ marginTop: '4px' }}>{product.name}</h5>
                              <div className="cat-card-footer">
                                <span className="cat-card-price">₹{product.price.toLocaleString('en-IN')}</span>
                                <button
                                  className={`cat-card-btn ${isAdded ? 'added' : ''}`}
                                  onClick={() => handleAddToCart(product)}
                                  aria-label="Add to cart"
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                                    {isAdded ? 'done' : 'add_shopping_cart'}
                                  </span>
                                  {isAdded ? 'Added' : 'Add'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-slate-50 border border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center gap-4">
                    <span className="material-symbols-outlined text-5xl text-slate-350">shopping_bag</span>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">No products found</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">We couldn't find any products in this brand category right now. Check back soon!</p>
                    </div>
                    <button 
                      onClick={() => setCatBrandFilter('All')}
                      className="px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl shadow-md hover:bg-secondary-container transition-all cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>

              {settings.featured_ads?.enable_sidebar_ad && (
                <div className="w-full lg:w-80 flex-shrink-0 bg-slate-50 border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm font-body">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-secondary">campaign</span>
                    <span>Sponsored ad</span>
                  </div>
                  {settings.featured_ads.sidebar_ad_image && (
                    <div className="rounded-2xl overflow-hidden h-48 bg-slate-205 border border-slate-100">
                      <img 
                        src={settings.featured_ads.sidebar_ad_image} 
                        alt="" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  )}
                  <h4 className="font-bold text-slate-800 text-sm m-0 leading-tight">
                    {settings.featured_ads.sidebar_ad_title || 'Partner Showcase'}
                  </h4>
                  <p className="text-xs text-slate-500 leading-normal">
                    {settings.featured_ads.sidebar_ad_subtitle || 'Advertise your brand here to reach thousands of technology buyers.'}
                  </p>
                  
                  <button
                    type="button"
                    onClick={() => {
                      if (settings.featured_ads.sidebar_ad_link) {
                        window.open(settings.featured_ads.sidebar_ad_link, '_blank');
                      } else {
                        handleAdPlacementClick('Category View Sidebar');
                      }
                    }}
                    className="w-full py-2.5 bg-secondary hover:bg-secondary/95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">mail</span>
                    {settings.featured_ads.sidebar_ad_cta || 'Advertise With Us'}
                  </button>
                </div>
              )}
            </div>
          </section>
        );
      })()}

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
        <section className="admin-font-override max-w-md mx-auto my-36 p-8 md:p-12 bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-[32px] shadow-2xl w-full px-margin-mobile">
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

      {/* Redesigned Enterprise-Grade CMS Dashboard */}
      {view === 'admin-dashboard' && (
        <div className="admin-panel-root min-h-screen bg-[#f9f9ff] text-[#141b2b] pb-10 z-[110] relative">
          
          {/* Dimmed backdrop overlay for mobile navigation drawer */}
          {adminSidebarOpen && (
            <div 
              className="lg:hidden fixed inset-0 bg-black/45 backdrop-blur-sm z-30 transition-opacity duration-300"
              onClick={() => setAdminSidebarOpen(false)}
            />
          )}

          {/* Sidebar Menu */}
          <aside className={`w-64 bg-white/90 backdrop-blur-xl text-slate-700 flex flex-col fixed top-4 bottom-4 z-[35] shadow-2xl border border-slate-200/50 rounded-[32px] p-5 overflow-hidden transition-all duration-300 ${adminSidebarOpen ? 'left-4' : '-left-[300px] lg:left-4'}`}>
            {/* Brand */}
            <div className="pb-5 border-b border-slate-100 flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-2xl font-bold">grid_view</span>
              <div>
                <h1 className="text-[#141b2b] text-xl tracking-tighter font-extrabold leading-none">Aone Digital</h1>
                <span className="text-[9px] text-slate-400 tracking-widest uppercase font-bold">CMS Dashboard</span>
              </div>
            </div>
            
            {/* User Profile */}
            <div className="px-3 py-3 my-4 bg-slate-50 border border-slate-100 rounded-[20px] flex items-center gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                {currentUserRole[0]}
              </div>
              <div className="overflow-hidden">
                <span className="text-[#141b2b] text-xs font-bold block truncate">{adminCredentials.username || 'Bharath'}</span>
                <span className="text-[9px] text-slate-400 block truncate font-bold uppercase tracking-wider">{currentUserRole}</span>
              </div>
            </div>

            {/* Navigation — Grouped Sections */}
            <nav className="flex-1 overflow-y-auto pr-0.5 space-y-0.5">

              {/* 1. Operational Overview */}
              <button
                onClick={() => { setCmsTab('overview'); setCmsSearchQuery(''); setExpandedNavGroups(prev => ({ ...prev })); setAdminSidebarOpen(false); }}
                className={`ap-nav-group-label ${cmsTab === 'overview' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined text-sm">dashboard</span>
                <span>Operational Overview</span>
              </button>

              <div className="ap-nav-divider" />

              {/* 2. Orders & Sales Management */}
              <button
                onClick={() => { setCmsTab('orders'); setCmsSearchQuery(''); setAdminSidebarOpen(false); }}
                className={`ap-nav-group-label ${cmsTab === 'orders' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined text-sm">receipt_long</span>
                <span>Orders & Sales</span>
              </button>

              <div className="ap-nav-divider" />

              {/* 3. Visual Page Content Builder (collapsible) */}
              <button
                onClick={() => toggleNavGroup('editor')}
                className={`ap-nav-group-label ${cmsTab === 'editor' ? 'active' : ''} ${expandedNavGroups.editor ? 'expanded' : ''}`}
              >
                <span className="material-symbols-outlined text-sm">edit_note</span>
                <span>Page Content Builder</span>
                <span className="material-symbols-outlined ap-nav-chevron">chevron_right</span>
              </button>
              <div className={`ap-nav-children ${expandedNavGroups.editor ? 'open' : ''}`}>
                {[
                  { label: 'Hero Landing Section',          tab: 'editor', anchor: 'editor-hero' },
                  { label: 'Announcement Marquee Bar',       tab: 'editor', anchor: 'editor-announcement' },
                  { label: 'Shop by Category Manager',       tab: 'editor', anchor: 'editor-categories' },
                  { label: 'Global Brand Partners Carousel', tab: 'editor', anchor: 'editor-brands' },
                  { label: '"Why Choose Us" Blocks',         tab: 'banners', subTab: 'offers', anchor: 'editor-offers' },
                  { label: 'Showroom Gallery',               tab: 'editor', anchor: 'editor-gallery' },
                  { label: 'Testimonials Manager',           tab: 'editor', anchor: 'editor-testimonials' },
                  { label: 'FAQ Manager',                    tab: 'editor', anchor: 'editor-faq' },
                ].map((sub) => (
                  <button
                    key={sub.label}
                    onClick={() => handleSubLinkClick(sub.tab, sub.subTab || null, sub.anchor)}
                    className={`ap-nav-sub-item ${cmsTab === sub.tab && (sub.subTab ? promoSubTab === sub.subTab : true) ? 'active' : ''}`}
                    title={sub.label}
                  >
                    <span className="ap-sub-dot" />
                    <span className="truncate">{sub.label}</span>
                  </button>
                ))}
              </div>

              <div className="ap-nav-divider" />

              {/* 4. Products Inventory */}
              <button
                onClick={() => { setCmsTab('products'); setCmsSearchQuery(''); setAdminSidebarOpen(false); }}
                className={`ap-nav-group-label ${cmsTab === 'products' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined text-sm">inventory_2</span>
                <span>Products Inventory</span>
              </button>

              <div className="ap-nav-divider" />

              {/* 5. Promotions & Advertisements (collapsible) */}
              <button
                onClick={() => toggleNavGroup('promotions')}
                className={`ap-nav-group-label ${(cmsTab === 'banners') ? 'active' : ''} ${expandedNavGroups.promotions ? 'expanded' : ''}`}
              >
                <span className="material-symbols-outlined text-sm">campaign</span>
                <span>Promotions & Ads</span>
                <span className="material-symbols-outlined ap-nav-chevron">chevron_right</span>
              </button>
              <div className={`ap-nav-children ${expandedNavGroups.promotions ? 'open' : ''}`}>
                {[
                  { tab: 'banners', subTab: 'banners', label: 'Promo Banners & Featured Deals' },
                  { tab: 'banners', subTab: 'ads', label: 'Ad Slot Manager' },
                  { tab: 'banners', subTab: 'offers', label: 'Offer Perks (EMI, Exchange...)' },
                ].map((sub, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSubLinkClick(sub.tab, sub.subTab)}
                    className={`ap-nav-sub-item ${cmsTab === sub.tab && promoSubTab === sub.subTab ? 'active' : ''}`}
                    title={sub.label}
                  >
                    <span className="ap-sub-dot" />
                    <span className="truncate">{sub.label}</span>
                  </button>
                ))}
              </div>

              <div className="ap-nav-divider" />

              {/* 6. Media Assets Library */}
              <button
                onClick={() => { setCmsTab('media'); setCmsSearchQuery(''); setAdminSidebarOpen(false); }}
                className={`ap-nav-group-label ${cmsTab === 'media' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined text-sm">photo_library</span>
                <span>Media Assets Library</span>
              </button>

              <div className="ap-nav-divider" />

              {/* 7. Leads Center */}
              <button
                onClick={() => { setCmsTab('leads'); setCmsSearchQuery(''); setAdminSidebarOpen(false); }}
                className={`ap-nav-group-label ${cmsTab === 'leads' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined text-sm">group</span>
                <span>Leads Center</span>
              </button>

              <div className="ap-nav-divider" />

              {/* 8. Dynamic Branding & SEO Engine */}
              <button
                onClick={() => { setCmsTab('theme'); setCmsSearchQuery(''); setAdminSidebarOpen(false); }}
                className={`ap-nav-group-label ${cmsTab === 'theme' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined text-sm">palette</span>
                <span>Branding & SEO Engine</span>
              </button>

              <div className="ap-nav-divider" />

              {/* 9. Team Roles & Permissions */}
              <button
                onClick={() => { setCmsTab('users'); setCmsSearchQuery(''); setAdminSidebarOpen(false); }}
                className={`ap-nav-group-label ${cmsTab === 'users' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                <span>Team Roles & Permissions</span>
              </button>

              <div className="ap-nav-divider" />

              {/* 10. Security Audit Trail */}
              <button
                onClick={() => { setCmsTab('logs'); setCmsSearchQuery(''); setAdminSidebarOpen(false); }}
                className={`ap-nav-group-label ${cmsTab === 'logs' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined text-sm">verified_user</span>
                <span>Security Audit Trail</span>
              </button>

            </nav>

            <div className="pt-4 border-t border-slate-100 mt-2">
              <button
                onClick={() => { setIsAdminLoggedIn(false); setView('home'); setAdminSidebarOpen(false); }}
                className="ap-logout-btn"
              >
                <span className="material-symbols-outlined text-sm">logout</span> Logout
              </button>
            </div>
          </aside>

          {/* Right Main Container */}
          <main className="flex-grow lg:pl-72 pl-0 flex flex-col min-h-screen transition-all duration-300">
            
            {/* Top Bar Header */}
            <header className="h-16 bg-white/80 backdrop-blur-xl border border-slate-200/40 shadow-[0_8px_30px_rgba(0,45,98,0.03)] rounded-3xl px-4 md:px-6 flex justify-between items-center sticky top-4 z-20 mx-4">
              <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                <button 
                  onClick={() => setAdminSidebarOpen(!adminSidebarOpen)}
                  className="lg:hidden p-1.5 hover:bg-slate-100/80 active:bg-slate-100 rounded-xl flex items-center justify-center cursor-pointer text-slate-700 transition-all"
                  aria-label="Toggle admin navigation menu"
                >
                  <span className="material-symbols-outlined text-[18px]">menu</span>
                </button>
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="hidden sm:inline hover:text-slate-800 transition-colors">Admin</span>
                  <span className="hidden sm:inline text-slate-350 select-none">/</span>
                  <span className="hover:text-slate-800 transition-colors">Dashboard</span>
                  <span className="text-slate-350 select-none">/</span>
                  <span className="text-secondary font-bold capitalize bg-secondary/5 px-2.5 py-1 rounded-lg border border-secondary/10 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {cmsTab}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setView('home')}
                  className="px-3 md:px-4 py-1.5 border border-slate-200/85 hover:bg-slate-50 hover:border-slate-300 text-slate-700 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  <span className="material-symbols-outlined text-xs">open_in_new</span> Live Website
                </button>
                <div className="h-5 w-[1px] bg-slate-200"></div>
                <div className="flex items-center gap-3 text-left">
                  <div className="hidden xs:block text-right">
                    <span className="text-xs font-bold text-slate-700 block leading-none">{adminCredentials.username || 'Bharath'}</span>
                    <span className="text-[9px] font-bold text-secondary uppercase tracking-wider block mt-0.5">{currentUserRole}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-xs shadow-sm border border-white/50 cursor-default select-none">
                    {currentUserRole[0]}
                  </div>
                </div>
              </div>
            </header>

            {/* Panel Area */}
            <div className="p-4 md:p-8 max-w-[1400px] w-full mx-auto flex-1">
              
              {/* Tab 1: OVERVIEW */}
              {cmsTab === 'overview' && (
                <div className="space-y-8 animate-fade-in">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="ap-panel-title">Operational Overview</h2>
                      <p className="ap-panel-subtitle">Live analytics metrics from the storefront portal database.</p>
                    </div>
                    <div className="text-xs font-semibold bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-500">
                      System Time: 2026-07-03
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-[32px] p-6 shadow-lg flex items-center gap-5 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                        <span className="material-symbols-outlined text-xl">trending_up</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Visitors</span>
                        <h3 className="text-2xl font-extrabold text-[#141b2b] leading-tight">12,450</h3>
                      </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-[32px] p-6 shadow-lg flex items-center gap-5 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                      <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-inner">
                        <span className="material-symbols-outlined text-xl">receipt_long</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Orders</span>
                        <h3 className="text-2xl font-extrabold text-[#141b2b] leading-tight">{orders.length}</h3>
                      </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-[32px] p-6 shadow-lg flex items-center gap-5 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                      <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
                        <span className="material-symbols-outlined text-xl">group</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Leads Received</span>
                        <h3 className="text-2xl font-extrabold text-[#141b2b] leading-tight">{leads.length}</h3>
                      </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-[32px] p-6 shadow-lg flex items-center gap-5 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                      <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                        <span className="material-symbols-outlined text-xl">inventory_2</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Catalog Size</span>
                        <h3 className="text-2xl font-extrabold text-[#141b2b] leading-tight">{products.length}</h3>
                      </div>
                    </div>
                  </div>

                  {/* Audit / Action items grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-[32px] p-6 shadow-lg">
                      <h4 className="font-bold text-sm text-slate-800 mb-4">Top Visited Categories</h4>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span>Smartphones</span>
                            <span>65% of views</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-secondary h-full rounded-full" style={{ width: '65%' }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span>Home Appliances</span>
                            <span>25% of views</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-secondary h-full rounded-full" style={{ width: '25%' }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span>Other Electronics</span>
                            <span>10% of views</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-secondary h-full rounded-full" style={{ width: '10%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-[32px] p-6 shadow-lg">
                      <h4 className="font-bold text-sm text-slate-800 mb-4">Recent Audit Actions</h4>
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {auditLogs.slice(0, 4).map((log) => (
                          <div key={log.id} className="text-xs border-b border-slate-100 pb-2 last:border-0">
                            <div className="flex justify-between text-slate-500 font-bold mb-0.5">
                              <span>{log.user}</span>
                              <span className="text-[10px] font-normal">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-slate-700 leading-tight font-medium">{log.action}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: ORDERS & SALES */}
              {cmsTab === 'orders' && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="ap-panel-title">Orders & Sales Management</h2>
                    <p className="ap-panel-subtitle">Track and manage customer product purchase orders and shipping statuses.</p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-semibold">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                            <th className="p-4">Order ID</th>
                            <th className="p-4">Customer</th>
                            <th className="p-4">Items Summary</th>
                            <th className="p-4">Total Amount</th>
                            <th className="p-4">Date Placed</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.length > 0 ? (
                            orders.map((ord) => (
                              <tr key={ord.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 font-mono text-slate-400 text-[10px]">{ord.id.slice(0, 8).toUpperCase()}...</td>
                                <td className="p-4">
                                  <div className="font-bold text-slate-800">{ord.customer_name}</div>
                                  <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">{ord.shipping_address}</div>
                                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                    Email: {ord.email} | Phone: {ord.phone}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="space-y-1">
                                    {(ord.items || []).map((item, idx) => (
                                      <div key={idx} className="text-slate-600">
                                        {item.product_name || 'Product'} <strong className="text-slate-800 font-bold">x{item.quantity}</strong>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-4 font-extrabold text-secondary">₹{ord.total_amount.toLocaleString('en-IN')}</td>
                                <td className="p-4 text-slate-500">{new Date(ord.created_at).toLocaleString()}</td>
                                <td className="p-4">
                                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide border ${
                                    ord.status === 'completed'
                                      ? 'bg-green-50 text-green-600 border-green-200'
                                      : ord.status === 'cancelled'
                                      ? 'bg-red-50 text-red-600 border-red-200'
                                      : 'bg-yellow-50 text-yellow-600 border-yellow-200'
                                  }`}>
                                    {ord.status}
                                  </span>
                                </td>
                                <td className="p-4 text-center">
                                  <select
                                    value={ord.status}
                                    onChange={(e) => {
                                      const newStatus = e.target.value;
                                      fetch(`/api/orders/${ord.id}`, {
                                        method: 'PUT',
                                        headers: { 
                                          'Content-Type': 'application/json',
                                          'X-Admin-User': adminCredentials.username || 'Admin'
                                        },
                                        body: JSON.stringify({ status: newStatus })
                                      }).then(() => fetchOrders());
                                    }}
                                    className="bg-white border border-slate-200 rounded-xl px-2 py-1 text-[10px] font-bold text-slate-600 outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="7" className="text-center py-10 text-slate-400 font-bold">
                                No orders have been placed yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: CONTENT BUILDER (Website Settings Copywriting Editor) */}
              {cmsTab === 'editor' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 animate-fade-in">
                  <div>
                    <h2 className="ap-panel-title">Visual Page Content Builder</h2>
                    <p className="ap-panel-subtitle">Edit dynamic storefront copy, banner links, and hero sliders instantly.</p>
                  </div>
                  
                  <form onSubmit={handleSaveSettings} className="space-y-8 divide-y divide-slate-100">
                    
                    {/* Announcement Section */}
                    <div id="editor-announcement" className="space-y-4 pt-4 first:pt-0">
                      <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-secondary">campaign</span> Header Announcement Bar
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">ENABLE BAR</label>
                          <select 
                            value={settings.announcement?.enabled ? "yes" : "no"} 
                            onChange={(e) => setSettings({
                              ...settings,
                              announcement: { ...settings.announcement, enabled: e.target.value === "yes" }
                            })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold"
                          >
                            <option value="yes">Visible / Active</option>
                            <option value="no">Hidden / Disabled</option>
                          </select>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">ANNOUNCEMENT TEXT</label>
                          <input 
                            type="text" 
                            value={settings.announcement?.text || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              announcement: { ...settings.announcement, text: e.target.value }
                            })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* ── Hero Bottom Ticker / Scrolling Ad Bar ── */}
                    <div id="editor-ticker" className="space-y-4 pt-6">
                      <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-secondary">rss_feed</span>
                        Hero Scrolling Advertisement Ticker
                      </h3>
                      <p className="text-[11px] text-slate-400">The auto-scrolling ad bar that appears at the very bottom of the hero section.</p>

                      {/* Enable + Speed row */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">Enable Ticker</label>
                          <select
                            value={settings.ticker?.enabled !== false ? 'yes' : 'no'}
                            onChange={(e) => setSettings({
                              ...settings,
                              ticker: { ...settings.ticker, enabled: e.target.value === 'yes' }
                            })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold"
                          >
                            <option value="yes">Visible / Active</option>
                            <option value="no">Hidden / Disabled</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">Scroll Speed</label>
                          <select
                            value={settings.ticker?.speed || 'normal'}
                            onChange={(e) => setSettings({
                              ...settings,
                              ticker: { ...settings.ticker, speed: e.target.value }
                            })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold"
                          >
                            <option value="slow">Slow (75s)</option>
                            <option value="normal">Normal (55s)</option>
                            <option value="fast">Fast (35s)</option>
                          </select>
                        </div>
                        <div className="space-y-2 flex flex-col justify-end">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">&nbsp;</label>
                          <button
                            type="button"
                            onClick={() => setSettings({
                              ...settings,
                              ticker: {
                                ...settings.ticker,
                                items: [...(settings.ticker?.items || []), '']
                              }
                            })}
                            className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-all"
                          >
                            <span className="material-symbols-outlined text-sm">add</span> Add Item
                          </button>
                        </div>
                      </div>

                      {/* Items list */}
                      <div className="space-y-2">
                        <label className="text-slate-500 text-[10px] font-bold block uppercase">
                          Ticker Items ({(settings.ticker?.items || []).length})
                        </label>
                        {(settings.ticker?.items || []).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-300 w-5 text-right flex-shrink-0">{idx + 1}</span>
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const newItems = [...(settings.ticker?.items || [])];
                                newItems[idx] = e.target.value;
                                setSettings({ ...settings, ticker: { ...settings.ticker, items: newItems } });
                              }}
                              placeholder="Enter advertisement text..."
                              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-secondary outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newItems = (settings.ticker?.items || []).filter((_, i) => i !== idx);
                                setSettings({ ...settings, ticker: { ...settings.ticker, items: newItems } });
                              }}
                              className="w-8 h-8 flex items-center justify-center bg-red-50 border border-red-200 text-red-500 rounded-lg hover:bg-red-500 hover:text-white hover:border-red-500 transition-all flex-shrink-0 cursor-pointer"
                              title="Remove item"
                            >
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          </div>
                        ))}
                        {(settings.ticker?.items || []).length === 0 && (
                          <div className="text-[11px] text-slate-400 py-3 text-center border border-dashed border-slate-200 rounded-xl">
                            No items. Click "Add Item" to create the first ad message.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Global Brand Partners Manager ── */}
                    <div id="editor-brands" className="space-y-4 pt-6">
                      <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-secondary">stars</span>
                        Global Brand Partners Carousel
                      </h3>
                      <p className="text-[11px] text-slate-400">Add, configure, or remove brands displaying in the auto-scrolling brand showcase loop.</p>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Add brand partner form */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 h-fit">
                          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-secondary">add_circle</span>
                            Add Brand Partner
                          </h4>
                          
                          <div className="space-y-2">
                            <label className="text-slate-500 text-[9px] font-bold block uppercase">Brand Name</label>
                            <input 
                              type="text" 
                              id="new-brand-name" 
                              placeholder="e.g. Apple" 
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-slate-500 text-[9px] font-bold block uppercase">
                              SimpleIcons Slug 
                              <a href="https://simpleicons.org/" target="_blank" rel="noreferrer" className="text-secondary ml-1 hover:underline">(Search Slug)</a>
                            </label>
                            <input 
                              type="text" 
                              id="new-brand-slug" 
                              placeholder="e.g. apple" 
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <label className="text-slate-500 text-[9px] font-bold block uppercase">Circle BG</label>
                              <div className="flex gap-1.5">
                                <input 
                                  type="color" 
                                  id="new-brand-bg-color" 
                                  defaultValue="#F2F2F2"
                                  className="w-8 h-8 border border-slate-200 rounded-lg cursor-pointer flex-shrink-0"
                                />
                                <input 
                                  type="text" 
                                  id="new-brand-bg-text" 
                                  defaultValue="#F2F2F2"
                                  placeholder="#F2F2F2"
                                  onChange={(e) => {
                                    const el = document.getElementById('new-brand-bg-color');
                                    if (el) el.value = e.target.value;
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2 text-[10px] font-semibold"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-slate-500 text-[9px] font-bold block uppercase">Icon Hex (No #)</label>
                              <input 
                                type="text" 
                                id="new-brand-icon-color" 
                                placeholder="e.g. 1a1a1a" 
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const nameEl = document.getElementById('new-brand-name');
                              const slugEl = document.getElementById('new-brand-slug');
                              const bgEl = document.getElementById('new-brand-bg-color');
                              const iconColorEl = document.getElementById('new-brand-icon-color');
                              
                              if (!nameEl.value || !slugEl.value) {
                                alert('Please fill in Brand Name and SimpleIcons Slug fields!');
                                return;
                              }
                              
                              const newPartner = {
                                name: nameEl.value.trim(),
                                slug: slugEl.value.trim().toLowerCase(),
                                bg: bgEl.value,
                                iconColor: iconColorEl.value.trim().replace('#', '') || '000000'
                              };
                              
                              setSettings({
                                ...settings,
                                brands: [...(settings.brands || []), newPartner]
                              });
                              
                              // Reset fields
                              nameEl.value = '';
                              slugEl.value = '';
                              iconColorEl.value = '';
                            }}
                            className="w-full py-2 bg-secondary text-white text-xs font-bold rounded-xl shadow-md hover:bg-secondary-container transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-xs">add</span> Add Partner
                          </button>
                        </div>

                        {/* List and Manage brands */}
                        <div className="lg:col-span-2 space-y-2.5 max-h-[380px] overflow-y-auto pr-2 border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">
                            Current Partners ({(settings.brands || []).length})
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {(settings.brands || []).map((brand, idx) => (
                              <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-9 h-9 rounded-full flex items-center justify-center border border-slate-100 flex-shrink-0" style={{ backgroundColor: brand.bg }}>
                                    <img 
                                      src={`https://cdn.simpleicons.org/${brand.slug}/${brand.iconColor}`} 
                                      alt={brand.name} 
                                      className="w-5.5 h-5.5 object-contain"
                                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=40&q=80'; }}
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-800 truncate leading-none">{brand.name}</p>
                                    <span className="text-[9px] text-slate-400 font-mono block mt-0.5 truncate">{brand.slug}</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const filteredBrands = (settings.brands || []).filter((_, i) => i !== idx);
                                    setSettings({
                                      ...settings,
                                      brands: filteredBrands
                                    });
                                  }}
                                  className="w-7 h-7 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white hover:border-red-500 text-red-500 transition-all flex-shrink-0 cursor-pointer"
                                  title="Remove brand partner"
                                >
                                  <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                              </div>
                            ))}
                            {(settings.brands || []).length === 0 && (
                              <div className="col-span-full text-center text-slate-400 text-xs py-8">
                                No brand partners configured. Fallbacks will show on the storefront.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Shop by Category Manager ── */}
                    <div id="editor-categories" className="space-y-4 pt-6">
                      <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-secondary">category</span>
                        Shop by Category Manager
                      </h3>
                      <p className="text-[11px] text-slate-400">Add or remove rows in the "Shop by Category" section, configuring allowed filter keys and brands.</p>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Add brand partner form */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 h-fit">
                          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-secondary">add_circle</span>
                            Add New Row Category
                          </h4>
                          
                          <div className="space-y-2">
                            <label className="text-slate-500 text-[9px] font-bold block uppercase">Category Display Title</label>
                            <input 
                              type="text" 
                              id="new-cat-title" 
                              placeholder="e.g. Tablets" 
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <label className="text-slate-500 text-[9px] font-bold block uppercase">Row Emoji</label>
                              <input 
                                type="text" 
                                id="new-cat-emoji" 
                                placeholder="e.g. 📱" 
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-center"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-slate-500 text-[9px] font-bold block uppercase">Unique Filter Key</label>
                              <input 
                                type="text" 
                                id="new-cat-key" 
                                placeholder="e.g. tablet" 
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-slate-500 text-[9px] font-bold block uppercase">Brands List (Comma-Separated)</label>
                            <textarea 
                              rows="2"
                              id="new-cat-brands" 
                              placeholder="e.g. Apple, Samsung, Lenovo" 
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold resize-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const titleEl = document.getElementById('new-cat-title');
                              const emojiEl = document.getElementById('new-cat-emoji');
                              const keyEl = document.getElementById('new-cat-key');
                              const brandsEl = document.getElementById('new-cat-brands');
                              
                              if (!titleEl.value || !keyEl.value) {
                                alert('Please enter Category Title and Unique Filter Key!');
                                return;
                              }
                              
                              const brandsList = brandsEl.value 
                                ? brandsEl.value.split(',').map(b => b.trim()).filter(Boolean) 
                                : [];
                                
                              const newCategory = {
                                title: titleEl.value.trim(),
                                emoji: emojiEl.value.trim() || '📦',
                                filterKey: keyEl.value.trim().toLowerCase().replace(/\s+/g, '_'),
                                brands: brandsList
                              };
                              
                              setSettings({
                                ...settings,
                                categories: [...(settings.categories || []), newCategory]
                              });
                              
                              // Reset fields
                              titleEl.value = '';
                              emojiEl.value = '';
                              keyEl.value = '';
                              brandsEl.value = '';
                            }}
                            className="w-full py-2 bg-secondary text-white text-xs font-bold rounded-xl shadow-md hover:bg-secondary-container transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-xs">add</span> Add Category
                          </button>
                        </div>

                        {/* List and Manage categories */}
                        <div className="lg:col-span-2 space-y-2.5 max-h-[380px] overflow-y-auto pr-2 border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">
                            Active Categories ({(settings.categories || []).length})
                          </label>
                          <div className="space-y-2">
                            {(settings.categories || []).map((cat, idx) => (
                              <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <span className="text-2xl flex-shrink-0">{cat.emoji}</span>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <p className="text-xs font-bold text-slate-800 truncate">{cat.title}</p>
                                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] text-slate-500 font-mono">{cat.filterKey}</span>
                                    </div>
                                    <p className="text-[10px] text-text-muted mt-1 truncate">
                                      <strong>Brands:</strong> {cat.brands?.join(', ') || 'Any Brand'}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const filteredCats = (settings.categories || []).filter((_, i) => i !== idx);
                                    setSettings({
                                      ...settings,
                                      categories: filteredCats
                                    });
                                  }}
                                  className="w-7 h-7 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white hover:border-red-500 text-red-500 transition-all flex-shrink-0 cursor-pointer"
                                  title="Delete category"
                                >
                                  <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                              </div>
                            ))}
                            {(settings.categories || []).length === 0 && (
                              <div className="text-center text-slate-400 text-xs py-8">
                                No categories configured. Customers won't see any products.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hero Section copy */}
                    <div id="editor-hero" className="space-y-4 pt-6">
                      <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-secondary">view_carousel</span> Hero Landing Section
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">MAIN HEADLINE PREFIX</label>
                          <input 
                            type="text" 
                            value={settings.hero?.title || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              hero: { ...settings.hero, title: e.target.value }
                            })}
                            placeholder="Enter main headline prefix (e.g., Smart Tech.)"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">HIGHLIGHTED HEADLINE (SECONDARY)</label>
                          <input 
                            type="text" 
                            value={settings.hero?.highlight || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              hero: { ...settings.hero, highlight: e.target.value }
                            })}
                            placeholder="Enter highlighted headline (e.g., Modern Living.)"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">SUBTITLE / VALUE STATEMENT</label>
                          <textarea 
                            rows="2"
                            value={settings.hero?.subtitle || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              hero: { ...settings.hero, subtitle: e.target.value }
                            })}
                            placeholder="Enter description statement (e.g., Curated smartphones and premium smart appliances...)"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold resize-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">BACKGROUND IMAGE PATH</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={settings.hero?.bg_image_url || ''}
                              onChange={(e) => setSettings({
                                ...settings,
                                hero: { ...settings.hero, bg_image_url: e.target.value }
                              })}
                              className="flex-grow bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold"
                            />
                            <label className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-secondary/90 transition-all flex-shrink-0">
                              <span className="material-symbols-outlined text-xs">upload</span>
                              Upload
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={async (e) => {
                                  const file = e.target.files[0];
                                  if (!file) return;
                                  const publicUrl = await uploadToSupabase(file, 'website-assets', 'hero');
                                  setSettings({
                                    ...settings,
                                    hero: { ...settings.hero, bg_image_url: publicUrl }
                                  });
                                }} 
                              />
                            </label>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">LOGO PATH (HEADER)</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={settings.hero?.logo_url || ''}
                              onChange={(e) => setSettings({
                                ...settings,
                                hero: { ...settings.hero, logo_url: e.target.value }
                              })}
                              placeholder="/images/logo.png"
                              className="flex-grow bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold"
                            />
                            <label className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-secondary/90 transition-all flex-shrink-0">
                              <span className="material-symbols-outlined text-xs">upload</span>
                              Upload
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={async (e) => {
                                  const file = e.target.files[0];
                                  if (!file) return;
                                  const publicUrl = await uploadToSupabase(file, 'website-assets', 'logo');
                                  setSettings({
                                    ...settings,
                                    hero: { ...settings.hero, logo_url: publicUrl }
                                  });
                                }} 
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* About Section copy */}
                    <div id="editor-about" className="space-y-4 pt-6">
                      <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-secondary">info</span> About Brand Section
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">SECTION TITLE</label>
                          <input 
                            type="text" 
                            value={settings.about?.title || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              about: { ...settings.about, title: e.target.value }
                            })}
                            placeholder="Enter section title (e.g., Redefining electronics shopping)"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">SUB-HEADING</label>
                          <input 
                            type="text" 
                            value={settings.about?.subtitle || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              about: { ...settings.about, subtitle: e.target.value }
                            })}
                            placeholder="Enter sub-heading / motto (e.g., Certified premium retail destinations since 2012.)"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">ABOUT DESCRIPTION</label>
                          <textarea 
                            rows="3"
                            value={settings.about?.description || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              about: { ...settings.about, description: e.target.value }
                            })}
                            placeholder="Enter detailed description about the store values..."
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* ── Showroom Gallery Section ── */}
                    <div id="editor-gallery" className="space-y-4 pt-6">
                      <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-secondary">photo_library</span> Showroom Gallery
                      </h3>
                      <p className="text-[11px] text-slate-400">Configure the 4 main images showcased in the gallery showroom loop.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[0, 1, 2, 3].map((idx) => (
                          <div key={idx} className="space-y-2">
                            <label className="text-slate-500 text-[10px] font-bold block uppercase">Gallery Image {idx + 1}</label>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                value={settings.gallery?.[idx] || ''}
                                onChange={(e) => {
                                  const newGallery = [...(settings.gallery || ['', '', '', ''])];
                                  newGallery[idx] = e.target.value;
                                  setSettings({ ...settings, gallery: newGallery });
                                }}
                                placeholder="Enter image URL or choose upload (e.g., https://...)"
                                className="flex-grow bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold"
                              />
                              <label className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-secondary/90 transition-all flex-shrink-0">
                                <span className="material-symbols-outlined text-xs">upload</span>
                                Upload
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    const publicUrl = await uploadToSupabase(file, 'website-assets', `gallery-${idx}`);
                                    const newGallery = [...(settings.gallery || ['', '', '', ''])];
                                    newGallery[idx] = publicUrl;
                                    setSettings({ ...settings, gallery: newGallery });
                                  }} 
                                />
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ── Testimonials Manager ── */}
                    <div id="editor-testimonials" className="space-y-4 pt-6">
                      <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-secondary">rate_review</span> Testimonials Manager
                      </h3>
                      <p className="text-[11px] text-slate-400">Edit customer success stories shown on the main page.</p>
                      <div className="space-y-4">
                        {[0, 1, 2].map((idx) => (
                          <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className="space-y-2">
                              <label className="text-slate-500 text-[9px] font-bold block uppercase">Customer Name</label>
                              <input 
                                type="text" 
                                value={settings.testimonials?.[idx]?.name || ''}
                                onChange={(e) => {
                                  const newTestis = [...(settings.testimonials || [])];
                                  if (!newTestis[idx]) newTestis[idx] = {};
                                  newTestis[idx].name = e.target.value;
                                  setSettings({ ...settings, testimonials: newTestis });
                                }}
                                placeholder="e.g., Rajesh Kumar"
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-slate-500 text-[9px] font-bold block uppercase">Role/Subtitle</label>
                              <input 
                                type="text" 
                                value={settings.testimonials?.[idx]?.role || ''}
                                onChange={(e) => {
                                  const newTestis = [...(settings.testimonials || [])];
                                  if (!newTestis[idx]) newTestis[idx] = {};
                                  newTestis[idx].role = e.target.value;
                                  setSettings({ ...settings, testimonials: newTestis });
                                }}
                                placeholder="e.g., Verified Buyer"
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-slate-500 text-[9px] font-bold block uppercase">Initial (e.g. RK)</label>
                              <input 
                                type="text" 
                                value={settings.testimonials?.[idx]?.initial || ''}
                                onChange={(e) => {
                                  const newTestis = [...(settings.testimonials || [])];
                                  if (!newTestis[idx]) newTestis[idx] = {};
                                  newTestis[idx].initial = e.target.value;
                                  setSettings({ ...settings, testimonials: newTestis });
                                }}
                                placeholder="e.g., RK"
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                              />
                            </div>
                            <div className="md:col-span-3 space-y-2">
                              <label className="text-slate-500 text-[9px] font-bold block uppercase">Comment</label>
                              <textarea 
                                rows="2"
                                value={settings.testimonials?.[idx]?.comment || ''}
                                onChange={(e) => {
                                  const newTestis = [...(settings.testimonials || [])];
                                  if (!newTestis[idx]) newTestis[idx] = {};
                                  newTestis[idx].comment = e.target.value;
                                  setSettings({ ...settings, testimonials: newTestis });
                                }}
                                placeholder="Enter custom feedback comment details..."
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold resize-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ── FAQ Manager ── */}
                    <div id="editor-faq" className="space-y-4 pt-6">
                      <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-secondary">quiz</span> FAQ Manager
                      </h3>
                      <p className="text-[11px] text-slate-400">Edit the frequently asked questions displayed in the accordion container.</p>
                      <div className="space-y-4">
                        {[0, 1].map((idx) => (
                          <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                            <div className="space-y-2">
                              <label className="text-slate-500 text-[9px] font-bold block uppercase">Question {idx + 1}</label>
                              <input 
                                type="text" 
                                value={settings.faqs?.[idx]?.q || ''}
                                onChange={(e) => {
                                  const newFaqs = [...(settings.faqs || [])];
                                  if (!newFaqs[idx]) newFaqs[idx] = {};
                                  newFaqs[idx].q = e.target.value;
                                  setSettings({ ...settings, faqs: newFaqs });
                                }}
                                placeholder="Enter frequently asked question (e.g., What documents are needed for EMI?)"
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-slate-500 text-[9px] font-bold block uppercase">Answer {idx + 1}</label>
                              <textarea 
                                rows="2"
                                value={settings.faqs?.[idx]?.a || ''}
                                onChange={(e) => {
                                  const newFaqs = [...(settings.faqs || [])];
                                  if (!newFaqs[idx]) newFaqs[idx] = {};
                                  newFaqs[idx].a = e.target.value;
                                  setSettings({ ...settings, faqs: newFaqs });
                                }}
                                placeholder="Enter corresponding answer details..."
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold resize-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 flex justify-end">
                      <button 
                        type="submit" 
                        className="px-6 py-3 bg-secondary text-white text-xs font-bold rounded-xl shadow-lg hover:bg-secondary-container hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">publish</span> Publish Live Settings
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab 3: PRODUCTS CATALOG (CRUD) */}
              {cmsTab === 'products' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="ap-panel-title">Products Inventory</h2>
                      <p className="ap-panel-subtitle">Insert, update, edit, and organize product catalogs.</p>
                    </div>
                    
                    <div className="flex gap-3 w-full md:w-auto">
                      <div className="relative flex-grow md:w-64">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">search</span>
                        <input
                          type="text"
                          placeholder="Search product catalog..."
                          value={cmsSearchQuery}
                          onChange={(e) => setCmsSearchQuery(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-secondary"
                        />
                      </div>
                      <button
                        onClick={() => {
                          setEditingProductId(null);
                          setProductForm({
                            name: '',
                            brand: '',
                            category: 'smart_phone',
                            price: '',
                            stock: '',
                            description: '',
                            image_url: '',
                            specifications: {}
                          });
                          setIsProductModalOpen(true);
                        }}
                        className="px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl shadow-md hover:bg-secondary-container flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                      >
                        <span className="material-symbols-outlined text-sm">add</span> + Add New
                      </button>
                    </div>
                  </div>

                  {/* Grid of Stock/Inventory Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {products
                      .filter(p => p.name.toLowerCase().includes(cmsSearchQuery.toLowerCase()) || p.brand.toLowerCase().includes(cmsSearchQuery.toLowerCase()))
                      .map((product) => {
                        const isLowStock = product.stock > 0 && product.stock <= 10;
                        const isOutOfStock = product.stock === 0;
                        let statusText = "In Stock";
                        let statusColor = "bg-green-50 text-green-700 border-green-200";
                        if (isLowStock) {
                          statusText = "Low Stock";
                          statusColor = "bg-amber-50 text-amber-700 border-amber-200";
                        } else if (isOutOfStock) {
                          statusText = "Out of Stock";
                          statusColor = "bg-red-50 text-red-700 border-red-200";
                        }

                        return (
                          <div key={product.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
                            <div className="flex gap-4">
                              {/* Image section */}
                              <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1.5 flex-shrink-0">
                                <img 
                                  src={product.image_url} 
                                  alt={product.name} 
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    e.target.src = "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=150&q=80";
                                  }}
                                />
                              </div>

                              {/* Details */}
                              <div className="min-w-0 flex-1">
                                <div className="flex justify-between items-start gap-1">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-none">
                                    {product.brand} • {product.category.replace('_', ' ')}
                                  </span>
                                </div>
                                <h4 className="font-bold text-slate-800 text-sm mt-1 truncate" title={product.name}>
                                  {product.name}
                                </h4>
                                <span className="text-[10px] text-slate-400 font-mono block mt-0.5 select-all">
                                  ID: {product.id}
                                </span>
                                <div className="text-slate-800 font-extrabold text-base mt-2">
                                  ₹{product.price.toLocaleString('en-IN')}
                                </div>
                              </div>
                            </div>

                            {/* Stock Indicator and actions footer */}
                            <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 mt-auto">
                              <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusColor}`}>
                                  {statusText}
                                </span>
                                <span className="text-xs font-semibold text-slate-500">
                                  {product.stock} units
                                </span>
                              </div>

                              <div className="flex gap-1">
                                <button 
                                  className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-secondary text-[11px] font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                                  onClick={() => handleEditClick(product)}
                                  title="Edit details"
                                >
                                  <span className="material-symbols-outlined text-[13px]">edit</span> Edit
                                </button>
                                {currentUserRole !== 'Content Editor' ? (
                                  <button 
                                    className="px-2.5 py-1.5 border border-red-100 hover:bg-red-50 text-red-600 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleDeleteProduct(product.id)}
                                    title="Delete product"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">delete</span> Delete
                                  </button>
                                ) : (
                                  <span className="text-[9px] text-slate-400 italic py-1 px-2 bg-slate-50 rounded-lg">Locked</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Empty state view */}
                  {products.filter(p => p.name.toLowerCase().includes(cmsSearchQuery.toLowerCase()) || p.brand.toLowerCase().includes(cmsSearchQuery.toLowerCase())).length === 0 && (
                    <div className="text-center py-16 bg-white border border-slate-200 rounded-[32px] shadow-sm">
                      <span className="material-symbols-outlined text-4xl text-slate-350 mb-3">inventory_2</span>
                      <h4 className="font-bold text-slate-700 text-sm">No products in stock</h4>
                      <p className="text-slate-400 text-xs mt-1">Add a new catalog product to display in the database & storefront.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: BANNERS & ADS */}
              {cmsTab === 'banners' && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <h2 className="ap-panel-title">Promotions & Advertisements</h2>
                    <p className="ap-panel-subtitle">Configure slide show banners, edit custom retail offers, set featured ad layout settings, and track campaign schedules.</p>
                  </div>

                  {/* Sub-tab Navigation Bar */}
                  <div className="flex border-b border-slate-200 mb-6 flex-wrap gap-2">
                    {[
                      { id: 'banners', label: 'Banners Manager', icon: 'view_carousel' },
                      { id: 'offers', label: 'Retail Offers Manager', icon: 'local_offer' },
                      { id: 'ads', label: 'Featured Ads Configuration', icon: 'campaign' },
                      { id: 'campaigns', label: 'Campaigns & Schedules', icon: 'date_range' }
                    ].map((tab) => (
                      <button
                        type="button"
                        key={tab.id}
                        onClick={() => setPromoSubTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs transition-all cursor-pointer ${
                          promoSubTab === tab.id
                            ? 'border-secondary text-secondary bg-secondary/5'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* SUB-TAB: BANNERS MANAGER */}
                  {promoSubTab === 'banners' && (
                    <div className="space-y-8 animate-fade-in">
                      {/* Size reference table */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-secondary">straighten</span>
                          Recommended Banner Sizes
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          {Object.entries(BANNER_SIZE_SPECS).map(([type, spec]) => (
                            <div key={type} className={`rounded-xl p-3 border adm-banner-size-badge adm-banner-type-${type}`} style={{ display: 'block', borderRadius: '12px', padding: '10px 12px' }}>
                              <div className="font-bold text-[11px] mb-0.5 capitalize">{type}</div>
                              <div className="text-[10px] opacity-80">{spec.recommended}</div>
                              <div className="text-[9px] opacity-60 mt-1">{spec.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Upload new banner form */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-secondary">add_photo_alternate</span>
                          Upload New Banner
                        </h3>
                        <form onSubmit={handleBannerSubmit} className="space-y-4">
                          {/* Row 1: type + title + subtitle */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase block">Banner Type</label>
                              <select
                                value={bannerForm.type}
                                onChange={e => { setBannerForm(p => ({ ...p, type: e.target.value, image_url: '', width: null, height: null })); setBannerDimError(''); }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                              >
                                {Object.entries(BANNER_SIZE_SPECS).map(([t, s]) => (
                                  <option key={t} value={t}>{s.label} — {s.recommended}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase block">Title</label>
                              <input type="text" placeholder="Banner headline..." value={bannerForm.title} onChange={e => setBannerForm(p => ({ ...p, title: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase block">Subtitle</label>
                              <input type="text" placeholder="Supporting text..." value={bannerForm.subtitle} onChange={e => setBannerForm(p => ({ ...p, subtitle: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold" />
                            </div>
                          </div>

                          {/* Row 2: link url + label + schedule */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase block">Link URL</label>
                              <input type="text" value={bannerForm.link_url} onChange={e => setBannerForm(p => ({ ...p, link_url: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase block">Button Label</label>
                              <input type="text" value={bannerForm.link_label} onChange={e => setBannerForm(p => ({ ...p, link_label: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase block">Schedule Start</label>
                              <input type="date" value={bannerForm.scheduled_start} onChange={e => setBannerForm(p => ({ ...p, scheduled_start: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase block">Schedule End</label>
                              <input type="date" value={bannerForm.scheduled_end} onChange={e => setBannerForm(p => ({ ...p, scheduled_end: e.target.value }))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold" />
                            </div>
                          </div>

                          {/* Row 3: Image upload */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase block">
                              Banner Image
                              <span className={`ml-2 adm-banner-size-badge adm-banner-type-${bannerForm.type}`}>
                                Recommended: {BANNER_SIZE_SPECS[bannerForm.type]?.recommended}
                              </span>
                            </label>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-secondary/90 transition-all">
                                <span className="material-symbols-outlined text-sm">cloud_upload</span>
                                {bannerUploading ? 'Uploading...' : 'Choose Image'}
                                <input type="file" accept="image/*" className="hidden" onChange={handleBannerImageUpload} disabled={bannerUploading} />
                              </label>
                              {bannerForm.image_url && (
                                <img src={bannerForm.image_url} alt="preview" className="h-12 w-20 object-cover rounded-lg border border-slate-200" />
                              )}
                            </div>
                            {bannerDimError && (
                              <div className="adm-banner-dim-warn">
                                <span className="material-symbols-outlined text-sm" style={{flexShrink:0}}>warning</span>
                                {bannerDimError}
                              </div>
                            )}
                          </div>

                          <button type="submit" className="px-6 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl shadow-md hover:bg-secondary/90 flex items-center gap-1.5 cursor-pointer">
                            <span className="material-symbols-outlined text-sm">add_photo_alternate</span>
                            Publish Banner
                          </button>
                        </form>
                      </div>

                      {/* Existing banners list */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-secondary">view_carousel</span>
                            All Banners ({banners.length})
                          </h3>
                          <button onClick={() => fetchBanners(true)} className="text-xs text-secondary font-bold flex items-center gap-1 hover:underline cursor-pointer">
                            <span className="material-symbols-outlined text-sm">refresh</span> Refresh
                          </button>
                        </div>

                        {banners.length === 0 ? (
                          <div className="text-center py-12 text-slate-400 text-sm">No banners yet. Upload one above.</div>
                        ) : (
                          <div className="space-y-3">
                            {banners.map((banner, idx) => (
                              <div key={banner.id} className="adm-banner-card">
                                {/* Thumbnail */}
                                <div className="adm-banner-thumb">
                                  <img src={banner.image_url} alt={banner.title} onError={e => { e.target.src = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=200&q=60'; }} />
                                </div>

                                {/* Info */}
                                <div className="adm-banner-info">
                                  <p className="adm-banner-info-title">{banner.title || '(Untitled)'}</p>
                                  <div className="adm-banner-meta">
                                    <span className={`adm-banner-size-badge adm-banner-type-${banner.type}`}>{banner.type}</span>
                                    <span className="adm-banner-size-badge">{banner.recommended_size || banner.size_spec?.recommended || '—'}</span>
                                    <span className={`adm-banner-size-badge ${banner.enabled ? 'adm-banner-type-wide' : ''}`} style={!banner.enabled ? { background: '#f1f5f9', color: '#64748b', borderColor: '#e2e8f0' } : {}}>
                                      {banner.enabled ? 'Active' : 'Disabled'}
                                    </span>
                                  </div>
                                  <p className="adm-banner-info-sub">
                                    {banner.subtitle || banner.link_url}
                                    {banner.scheduled_start && ` · From: ${banner.scheduled_start}`}
                                    {banner.scheduled_end && ` · Until: ${banner.scheduled_end}`}
                                  </p>
                                  {/* Inline schedule edit */}
                                  <div className="flex gap-3 mt-2 flex-wrap">
                                    <div className="flex items-center gap-1">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase">Start</span>
                                      <input
                                        type="date"
                                        defaultValue={banner.scheduled_start || ''}
                                        onBlur={e => handleBannerSchedule(banner.id, 'scheduled_start', e.target.value)}
                                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-[10px] font-semibold"
                                      />
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase">End</span>
                                      <input
                                        type="date"
                                        defaultValue={banner.scheduled_end || ''}
                                        onBlur={e => handleBannerSchedule(banner.id, 'scheduled_end', e.target.value)}
                                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-[10px] font-semibold"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="adm-banner-actions">
                                  {/* Enable/Disable toggle */}
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">{banner.enabled ? 'On' : 'Off'}</span>
                                    <label className="adm-toggle-switch">
                                      <input type="checkbox" checked={!!banner.enabled} onChange={() => handleBannerToggle(banner.id, banner.enabled)} />
                                      <span className="adm-toggle-track" />
                                      <span className="adm-toggle-thumb" />
                                    </label>
                                  </div>
                                  {/* Reorder */}
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleBannerReorder(banner.id, 'up', banner.sort_order)}
                                      className="w-7 h-7 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-all cursor-pointer"
                                      title="Move up"
                                    >
                                      <span className="material-symbols-outlined text-sm">arrow_upward</span>
                                    </button>
                                    <button
                                      onClick={() => handleBannerReorder(banner.id, 'down', banner.sort_order)}
                                      className="w-7 h-7 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-all cursor-pointer"
                                      title="Move down"
                                    >
                                      <span className="material-symbols-outlined text-sm">arrow_downward</span>
                                    </button>
                                  </div>
                                  {/* Delete */}
                                  <button
                                    onClick={() => handleBannerDelete(banner.id, banner.title)}
                                    className="w-7 h-7 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white hover:border-red-500 text-red-500 transition-all cursor-pointer"
                                    title="Delete banner"
                                  >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB: RETAIL OFFERS MANAGER */}
                  {promoSubTab === 'offers' && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                        <div>
                          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-secondary">local_offer</span>
                            Exclusive Retail Offers Manager
                          </h3>
                          <p className="text-[11px] text-slate-400">Configure promotional details rendered on the storefront offers section.</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddOffer}
                          className="px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl flex items-center gap-1 hover:bg-secondary/90 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">add</span> Add Offer Card
                        </button>
                      </div>

                      <form onSubmit={handleSaveSettings} className="space-y-6">
                        {/* Section titles */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Offers Section Title</label>
                            <input
                              type="text"
                              value={settings.offers_section_title || ''}
                              onChange={(e) => setSettings({ ...settings, offers_section_title: e.target.value })}
                              placeholder="Exclusive Retail Offers"
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Offers Section Subtitle</label>
                            <input
                              type="text"
                              value={settings.offers_section_subtitle || ''}
                              onChange={(e) => setSettings({ ...settings, offers_section_subtitle: e.target.value })}
                              placeholder="Maximum benefits on every purchase you make at Aone Digital."
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                            />
                          </div>
                        </div>

                        {/* Offers List */}
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">Active Offer Cards ({(settings.offers || []).length})</label>
                          
                          {(settings.offers || []).length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                              No offer cards configured. Click "Add Offer Card" to create one.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {(settings.offers || []).map((offer, index) => (
                                <div key={index} className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative space-y-3">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOffer(index)}
                                    className="absolute top-2 right-2 text-slate-400 hover:text-red-500 cursor-pointer animate-all duration-200"
                                    title="Delete Card"
                                  >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                  </button>

                                  <div className="grid grid-cols-3 gap-2">
                                    {/* Icon Select */}
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-slate-400 uppercase">Icon</label>
                                      <select
                                        value={offer.icon}
                                        onChange={(e) => handleUpdateOffer(index, 'icon', e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold"
                                      >
                                        <option value="credit_card">Credit Card 💳</option>
                                        <option value="currency_exchange">Exchange Bonus 🔄</option>
                                        <option value="payments">Cashback 💵</option>
                                        <option value="school">Student 🎓</option>
                                        <option value="percent">Percentage 🏷️</option>
                                        <option value="local_shipping">Delivery 📦</option>
                                        <option value="verified_user">Warranty 🛡️</option>
                                        <option value="handshake">Trust 🤝</option>
                                        <option value="workspace_premium">Premium 🌟</option>
                                      </select>
                                    </div>
                                    
                                    {/* Title */}
                                    <div className="col-span-2 space-y-1">
                                      <label className="text-[9px] font-bold text-slate-400 uppercase">Title</label>
                                      <input
                                        type="text"
                                        value={offer.title || ''}
                                        onChange={(e) => handleUpdateOffer(index, 'title', e.target.value)}
                                        placeholder="Card Title"
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold"
                                      />
                                    </div>
                                  </div>

                                  {/* Description */}
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase block">Description</label>
                                    <textarea
                                      value={offer.desc || ''}
                                      onChange={(e) => handleUpdateOffer(index, 'desc', e.target.value)}
                                      placeholder="Provide details about this discount, financing or exchange offer."
                                      rows={2}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold resize-none"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="border-t border-slate-100 pt-4 flex justify-end">
                          <button
                            type="submit"
                            className="px-6 py-2 bg-secondary text-white text-xs font-bold rounded-xl shadow-md hover:bg-secondary/90 transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-sm">save</span>
                            Save Offers Settings
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* SUB-TAB: FEATURED ADS CONFIGURATION */}
                  {promoSubTab === 'ads' && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
                      <div>
                        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-secondary">campaign</span>
                          Featured Ads &amp; Layout Settings
                        </h3>
                        <p className="text-[11px] text-slate-400">Configure advertisement preferences and display sidebar promotions.</p>
                      </div>

                      <form onSubmit={handleSaveSettings} className="space-y-6">
                        {/* Storefront Layout Preferences */}
                        <div className="space-y-4 border-b border-slate-100 pb-6">
                          <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wide">Layout Preferences (Home Banners)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Banner Layout Style</label>
                              <select
                                value={settings.featured_ads?.layout || 'grid'}
                                onChange={(e) => handleUpdateFeaturedAdField('layout', e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                              >
                                <option value="grid">Grid (Stacked Rows)</option>
                                <option value="slider">Slider (Hero Rotator Only)</option>
                                <option value="list">List Row (Wide Layout)</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Square Banners Items per Row</label>
                              <select
                                value={settings.featured_ads?.items_per_row || 3}
                                onChange={(e) => handleUpdateFeaturedAdField('items_per_row', parseInt(e.target.value, 10))}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                              >
                                <option value={2}>2 Columns</option>
                                <option value={3}>3 Columns</option>
                                <option value={4}>4 Columns</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Category View Sidebar Ad Settings */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wide">Category Grid View Sidebar Ad</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">{settings.featured_ads?.enable_sidebar_ad ? 'Enabled' : 'Disabled'}</span>
                              <label className="adm-toggle-switch">
                                <input
                                  type="checkbox"
                                  checked={!!settings.featured_ads?.enable_sidebar_ad}
                                  onChange={(e) => handleUpdateFeaturedAdField('enable_sidebar_ad', e.target.checked)}
                                />
                                <span className="adm-toggle-track" />
                                <span className="adm-toggle-thumb" />
                              </label>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Sidebar Ad Title</label>
                              <input
                                type="text"
                                value={settings.featured_ads?.sidebar_ad_title || ''}
                                onChange={(e) => handleUpdateFeaturedAdField('sidebar_ad_title', e.target.value)}
                                placeholder="Partner Showcase"
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Sidebar Ad Subtitle</label>
                              <input
                                type="text"
                                value={settings.featured_ads?.sidebar_ad_subtitle || ''}
                                onChange={(e) => handleUpdateFeaturedAdField('sidebar_ad_subtitle', e.target.value)}
                                placeholder="Target description..."
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Ad Image URL</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={settings.featured_ads?.sidebar_ad_image || ''}
                                  onChange={(e) => handleUpdateFeaturedAdField('sidebar_ad_image', e.target.value)}
                                  placeholder="https://..."
                                  className="flex-grow bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                                />
                                <label className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-secondary/90 transition-all flex-shrink-0">
                                  <span className="material-symbols-outlined text-xs">upload</span>
                                  Upload
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={async (e) => {
                                      const file = e.target.files[0];
                                      if (!file) return;
                                      const publicUrl = await uploadToSupabase(file, 'banners', 'sidebar-ad');
                                      handleUpdateFeaturedAdField('sidebar_ad_image', publicUrl);
                                    }} 
                                  />
                                </label>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">CTA Label</label>
                              <input
                                type="text"
                                value={settings.featured_ads?.sidebar_ad_cta || ''}
                                onChange={(e) => handleUpdateFeaturedAdField('sidebar_ad_cta', e.target.value)}
                                placeholder="Advertise With Us"
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Target Redirect Link URL (Optional)</label>
                            <input
                              type="text"
                              value={settings.featured_ads?.sidebar_ad_link || ''}
                              onChange={(e) => handleUpdateFeaturedAdField('sidebar_ad_link', e.target.value)}
                              placeholder="If left empty, clicking the ad triggers the Advertise inquiry modal"
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                            />
                          </div>
                        </div>

                        <div className="border-t border-slate-100 pt-4 flex justify-end">
                          <button
                            type="submit"
                            className="px-6 py-2 bg-secondary text-white text-xs font-bold rounded-xl shadow-md hover:bg-secondary/90 transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-sm">save</span>
                            Save Ads Settings
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* SUB-TAB: CAMPAIGNS & SCHEDULES TRACKER */}
                  {promoSubTab === 'campaigns' && (
                    <div className="space-y-6 animate-fade-in">
                      {/* Stats Overview */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {(() => {
                          const now = new Date();
                          const activeBanners = banners.filter(b => {
                            if (!b.enabled) return false;
                            if (!b.scheduled_start) return true;
                            const start = new Date(b.scheduled_start);
                            const end = b.scheduled_end ? new Date(b.scheduled_end) : null;
                            return now >= start && (!end || now <= end);
                          });
                          
                          const totalImpressions = activeBanners.reduce((sum, b) => {
                            const imp = Math.floor((b.id.charCodeAt(0) * 12345 + 5000) % 80000) + 1500;
                            return sum + imp;
                          }, 0);

                          const avgCtr = activeBanners.length
                            ? (activeBanners.reduce((sum, b) => {
                                const ctr = parseFloat((((b.id.charCodeAt(b.id.length - 1) || 0) * 7 + 1.2) % 3.8 + 0.8).toFixed(2));
                                return sum + ctr;
                              }, 0) / activeBanners.length).toFixed(2)
                            : '0.00';

                          return (
                            <>
                              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                                  <span className="material-symbols-outlined text-2xl">campaign</span>
                                </div>
                                <div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase">Active Campaigns</div>
                                  <div className="text-xl font-black text-slate-800">{activeBanners.length}</div>
                                </div>
                              </div>
                              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                  <span className="material-symbols-outlined text-2xl">visibility</span>
                                </div>
                                <div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase">Active Impressions (Est.)</div>
                                  <div className="text-xl font-black text-slate-800">{totalImpressions.toLocaleString()}</div>
                                </div>
                              </div>
                              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                  <span className="material-symbols-outlined text-2xl">leaderboard</span>
                                </div>
                                <div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase">Average Campaign CTR</div>
                                  <div className="text-xl font-black text-slate-800">{avgCtr}%</div>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Schedule list table */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-secondary">date_range</span>
                            Campaign Schedules &amp; Analytics
                          </h3>
                        </div>

                        {banners.length === 0 ? (
                          <div className="text-center py-12 text-slate-400 text-sm">No campaigns to track. Add banners first.</div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                                  <th className="py-3 px-2">Campaign</th>
                                  <th className="py-3 px-2">Format</th>
                                  <th className="py-3 px-2">Active Window</th>
                                  <th className="py-3 px-2">Duration Progress</th>
                                  <th className="py-3 px-2 text-right">Impressions</th>
                                  <th className="py-3 px-2 text-right">Clicks</th>
                                  <th className="py-3 px-2 text-right">CTR</th>
                                </tr>
                              </thead>
                              <tbody>
                                {banners.map((b) => {
                                  const now = new Date();
                                  let statusText = "Always On";
                                  let progressPercent = 100;
                                  let statusClass = "text-green-600 bg-green-50";

                                  if (b.scheduled_start) {
                                    const start = new Date(b.scheduled_start);
                                    const end = b.scheduled_end ? new Date(b.scheduled_end) : null;
                                    
                                    if (now < start) {
                                      const days = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
                                      statusText = `Upcoming (In ${days}d)`;
                                      progressPercent = 0;
                                      statusClass = "text-yellow-600 bg-yellow-50";
                                    } else if (end && now > end) {
                                      statusText = "Ended / Expired";
                                      progressPercent = 100;
                                      statusClass = "text-slate-400 bg-slate-50";
                                    } else {
                                      const daysLeft = end ? Math.ceil((end - now) / (1000 * 60 * 60 * 24)) : null;
                                      statusText = daysLeft !== null ? `${daysLeft}d left` : "Running (No End)";
                                      
                                      if (end) {
                                        const total = end - start;
                                        const elapsed = now - start;
                                        progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
                                      } else {
                                        progressPercent = 100;
                                      }
                                      statusClass = "text-blue-600 bg-blue-50";
                                    }
                                  }

                                  if (!b.enabled) {
                                    statusText = "Paused / Disabled";
                                    statusClass = "text-red-600 bg-red-50";
                                    progressPercent = 0;
                                  }

                                  const impressions = Math.floor((b.id.charCodeAt(0) * 12345 + 5000) % 80000) + 1500;
                                  const ctr = parseFloat((((b.id.charCodeAt(b.id.length - 1) || 0) * 7 + 1.2) % 3.8 + 0.8).toFixed(2));
                                  const clicks = Math.round((impressions * ctr) / 100);

                                  return (
                                    <tr key={b.id} className="border-b border-slate-50 text-xs hover:bg-slate-50/50">
                                      <td className="py-4 px-2 flex items-center gap-3">
                                        <img
                                          src={b.image_url}
                                          alt=""
                                          className="w-10 h-7 object-cover rounded border border-slate-200 flex-shrink-0"
                                          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=100&q=60'; }}
                                        />
                                        <div>
                                          <div className="font-bold text-slate-800">{b.title || '(Untitled)'}</div>
                                          <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{b.subtitle || 'No subtitle'}</div>
                                        </div>
                                      </td>
                                      <td className="py-4 px-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize adm-banner-type-${b.type}`} style={{ display: 'inline-block' }}>
                                          {b.type}
                                        </span>
                                      </td>
                                      <td className="py-4 px-2">
                                        <div className="font-semibold text-slate-700">
                                          {b.scheduled_start ? b.scheduled_start : 'Indefinite'}
                                        </div>
                                        <div className="text-[10px] text-slate-400">
                                          {b.scheduled_end ? `to ${b.scheduled_end}` : 'No end date'}
                                        </div>
                                      </td>
                                      <td className="py-4 px-2 min-w-[150px]">
                                        <div className="flex items-center gap-2">
                                          <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                            <div
                                              className={`h-full rounded-full transition-all duration-500 ${
                                                statusText.includes("Upcoming") ? 'bg-yellow-400' :
                                                statusText.includes("Ended") ? 'bg-slate-300' :
                                                statusText.includes("Paused") ? 'bg-red-400' : 'bg-secondary'
                                              }`}
                                              style={{ width: `${progressPercent}%` }}
                                            />
                                          </div>
                                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${statusClass}`}>
                                            {statusText}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="py-4 px-2 text-right font-semibold text-slate-700">
                                        {impressions.toLocaleString()}
                                      </td>
                                      <td className="py-4 px-2 text-right font-semibold text-slate-700">
                                        {clicks.toLocaleString()}
                                      </td>
                                      <td className="py-4 px-2 text-right font-bold text-slate-800">
                                        {ctr.toFixed(2)}%
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: MEDIA LIBRARY */}
              {cmsTab === 'media' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="ap-panel-title">Media Assets Library</h2>
                      <p className="ap-panel-subtitle">Upload, reuse, catalog, and query website graphics, files, and icons.</p>
                    </div>
                    
                    <label 
                      className="px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl shadow-md hover:bg-secondary-container flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">cloud_upload</span> Upload File
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleMediaUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Media Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {media.map((file) => (
                      <div key={file.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm group hover:shadow-md transition-all flex flex-col">
                        <div className="h-28 bg-slate-50 flex items-center justify-center p-3 border-b border-slate-100 relative">
                          <img 
                            src={file.url} 
                            alt={file.name} 
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              e.target.src = "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=200&q=80";
                            }}
                          />
                          <button
                            onClick={() => handleDeleteMedia(file.id)}
                            className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur text-red-600 rounded-full hover:bg-red-50 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity flex items-center cursor-pointer border border-slate-200 shadow-sm"
                            title="Delete asset"
                          >
                            <span className="material-symbols-outlined text-xs">delete</span>
                          </button>
                        </div>
                        <div className="p-3 text-xs flex-grow flex flex-col justify-between">
                          <div>
                            <span className="font-bold text-slate-850 truncate block" title={file.name}>{file.name}</span>
                            <span className="text-[10px] text-text-muted font-mono">{file.size}</span>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(file.url);
                              alert('Media URL path copied to clipboard!');
                            }}
                            className="w-full mt-2.5 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg font-bold text-[10px] hover:bg-secondary hover:text-white hover:border-secondary transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-xs">content_copy</span> Copy Link
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 5: LEADS AND CONTACT SUBMISSIONS */}
              {cmsTab === 'leads' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="ap-panel-title">Leads Center</h2>
                      <p className="ap-panel-subtitle">Track and respond to website user inquiries and newsletter subscribers.</p>
                    </div>

                    <button
                      onClick={handleExportLeadsCSV}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">download</span> Export Leads (.CSV)
                    </button>
                  </div>

                  <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-[32px] overflow-hidden shadow-lg">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                            <th className="p-5">Customer</th>
                            <th className="p-5">Contact Details</th>
                            <th className="p-5">Inquiry Type</th>
                            <th className="p-5">Follow-Up Note</th>
                            <th className="p-5 text-center">Status</th>
                            <th className="p-5 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                          {leads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-5">
                                <span className="font-bold text-slate-800 block text-sm">{lead.name}</span>
                                <span className="text-[10px] text-text-muted font-mono">{new Date(lead.created_at).toLocaleDateString()}</span>
                              </td>
                              <td className="p-5">
                                <span className="block text-slate-600">{lead.email}</span>
                                <span className="text-[10px] text-text-muted font-mono">{lead.phone}</span>
                              </td>
                              <td className="p-5 text-slate-500">
                                <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold">{lead.category}</span>
                              </td>
                              <td className="p-5 text-slate-600 max-w-xs truncate" title={lead.notes}>
                                {lead.notes || 'No follow-up notes.'}
                              </td>
                              <td className="p-5 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                                  lead.status === 'won' ? 'bg-green-50 text-green-700' :
                                  lead.status === 'contacted' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {lead.status}
                                </span>
                              </td>
                              <td className="p-5 text-center">
                                <button
                                  onClick={() => setSelectedLead(lead)}
                                  className="p-1.5 text-secondary hover:bg-secondary/10 rounded-lg transition-colors inline-flex items-center cursor-pointer"
                                  title="Manage Lead details"
                                >
                                  <span className="material-symbols-outlined text-sm">edit_note</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 6: BRANDING & SEO */}
              {cmsTab === 'theme' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 animate-fade-in">
                  <div>
                    <h2 className="ap-panel-title">Dynamic Branding & SEO Engine</h2>
                    <p className="ap-panel-subtitle">Customize color styles, margins, typography, and page headers directly.</p>
                  </div>

                  <form onSubmit={handleSaveSettings} className="space-y-8 divide-y divide-slate-100">
                    
                    {/* Colors & Custom styles */}
                    <div className="space-y-4 pt-4 first:pt-0">
                      <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-secondary">palette</span> Custom Color Palette
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">BACKGROUND COLOR</label>
                          <div className="flex gap-2">
                            <input 
                              type="color" 
                              value={settings.theme?.primary || '#f9f9ff'} 
                              onChange={(e) => setSettings({
                                ...settings,
                                theme: { ...settings.theme, primary: e.target.value }
                              })}
                              className="w-10 h-10 border border-slate-200 rounded-lg cursor-pointer"
                            />
                            <input 
                              type="text" 
                              value={settings.theme?.primary || '#f9f9ff'} 
                              onChange={(e) => setSettings({
                                ...settings,
                                theme: { ...settings.theme, primary: e.target.value }
                              })}
                              className="flex-grow bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">TEXT COLOR</label>
                          <div className="flex gap-2">
                            <input 
                              type="color" 
                              value={settings.theme?.onPrimary || '#141b2b'} 
                              onChange={(e) => setSettings({
                                ...settings,
                                theme: { ...settings.theme, onPrimary: e.target.value }
                              })}
                              className="w-10 h-10 border border-slate-200 rounded-lg cursor-pointer"
                            />
                            <input 
                              type="text" 
                              value={settings.theme?.onPrimary || '#141b2b'} 
                              onChange={(e) => setSettings({
                                ...settings,
                                theme: { ...settings.theme, onPrimary: e.target.value }
                              })}
                              className="flex-grow bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">SECONDARY ACCENT COLOR</label>
                          <div className="flex gap-2">
                            <input 
                              type="color" 
                              value={settings.theme?.secondary || '#002d62'} 
                              onChange={(e) => setSettings({
                                ...settings,
                                theme: { ...settings.theme, secondary: e.target.value }
                              })}
                              className="w-10 h-10 border border-slate-200 rounded-lg cursor-pointer"
                            />
                            <input 
                              type="text" 
                              value={settings.theme?.secondary || '#002d62'} 
                              onChange={(e) => setSettings({
                                ...settings,
                                theme: { ...settings.theme, secondary: e.target.value }
                              })}
                              className="flex-grow bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">ACCENT BORDER RADIUS</label>
                          <select 
                            value={settings.theme?.borderRadius || '24px'} 
                            onChange={(e) => setSettings({
                              ...settings,
                              theme: { ...settings.theme, borderRadius: e.target.value }
                            })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold"
                          >
                            <option value="24px">Rounded Premium (24px)</option>
                            <option value="12px">Classic Soft (12px)</option>
                            <option value="8px">Sharp Corporate (8px)</option>
                            <option value="0px">Minimal Boxed (0px)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Website Logo & Icon Assets */}
                    <div className="space-y-4 pt-6">
                      <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-secondary">image</span> Website Logo &amp; Favicon
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* 1. Website Logo */}
                        <div className="space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">Website Logo Image</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={settings.hero?.logo_url || ''} 
                              onChange={(e) => setSettings({
                                ...settings,
                                hero: { ...settings.hero, logo_url: e.target.value }
                              })}
                              placeholder="/images/logo.png"
                              className="flex-grow bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                            />
                            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-secondary/90 transition-all">
                              <span className="material-symbols-outlined text-xs">upload</span>
                              Upload
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={async (e) => {
                                  const file = e.target.files[0];
                                  if (!file) return;
                                  const publicUrl = await uploadToSupabase(file, 'website-assets', 'header');
                                  setSettings({
                                    ...settings,
                                    hero: { ...settings.hero, logo_url: publicUrl }
                                  });
                                }} 
                              />
                            </label>
                          </div>
                          {settings.hero?.logo_url && (
                            <img src={settings.hero.logo_url} alt="Logo preview" className="h-10 object-contain max-w-[200px] border border-slate-200 rounded-lg p-1 bg-slate-50 mt-1" />
                          )}
                        </div>

                        {/* 2. Logo Height sizing */}
                        <div className="space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">Website Logo Height (px)</label>
                          <div className="flex items-center gap-3 mt-3">
                            <input 
                              type="range" 
                              min="24" 
                              max="120" 
                              value={settings.hero?.logo_height || 48} 
                              onChange={(e) => setSettings({
                                ...settings,
                                hero: { ...settings.hero, logo_height: parseInt(e.target.value) }
                              })}
                              className="flex-grow h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-xs font-bold text-slate-700 w-12 text-right">{settings.hero?.logo_height || 48} px</span>
                          </div>
                          <p className="text-[9px] text-slate-400">Controls the header logo dimensions dynamically.</p>
                        </div>

                        {/* 2. Favicon / Icon */}
                        <div className="space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">Website Title Favicon (1:1 Ratio)</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={settings.hero?.favicon_url || ''} 
                              onChange={(e) => setSettings({
                                ...settings,
                                hero: { ...settings.hero, favicon_url: e.target.value }
                              })}
                              placeholder="/images/Icon.png"
                              className="flex-grow bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                            />
                            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-secondary/90 transition-all">
                              <span className="material-symbols-outlined text-xs">upload</span>
                              Upload
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={async (e) => {
                                  const file = e.target.files[0];
                                  if (!file) return;
                                  const publicUrl = await uploadToSupabase(file, 'website-assets', 'header');
                                  setSettings({
                                    ...settings,
                                    hero: { ...settings.hero, favicon_url: publicUrl }
                                  });
                                }} 
                              />
                            </label>
                          </div>
                          {settings.hero?.favicon_url && (
                            <img src={settings.hero.favicon_url} alt="Favicon preview" className="h-10 w-10 object-contain border border-slate-200 rounded-lg p-1 bg-slate-50 mt-1" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* SEO Metadata parameters */}
                    <div className="space-y-4 pt-6">
                      <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-secondary">language</span> SEO Tags &amp; Metadata
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">META TITLE TAG</label>
                          <input 
                            type="text" 
                            value={settings.seo?.title || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              seo: { ...settings.seo, title: e.target.value }
                            })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">META DESCRIPTION</label>
                          <textarea 
                            rows="2"
                            value={settings.seo?.description || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              seo: { ...settings.seo, description: e.target.value }
                            })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold resize-none"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">KEYWORDS INDEX (COMMA-SEPARATED)</label>
                          <input 
                            type="text" 
                            value={settings.seo?.keywords || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              seo: { ...settings.seo, keywords: e.target.value }
                            })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Store Footer & Contacts */}
                    <div className="space-y-4 pt-6 border-t border-slate-100">
                      <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-secondary">contact_support</span> Store Footer &amp; Contacts
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">Footer About Description</label>
                          <textarea 
                            rows="2"
                            value={settings.footer?.description || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              footer: { ...settings.footer, description: e.target.value }
                            })}
                            placeholder="Experience the future of retail..."
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold resize-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">Copyright Text</label>
                          <input 
                            type="text" 
                            value={settings.footer?.copyright || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              footer: { ...settings.footer, copyright: e.target.value }
                            })}
                            placeholder="© 2026 Aone Digital. All rights reserved."
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">Website Link URL (Navigates from copyright click)</label>
                          <input 
                            type="text" 
                            value={settings.footer?.website_url || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              footer: { ...settings.footer, website_url: e.target.value }
                            })}
                            placeholder="https://aonedigital.in"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">Designed &amp; Developed By Credits</label>
                          <input 
                            type="text" 
                            value={settings.footer?.developed_by || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              footer: { ...settings.footer, developed_by: e.target.value }
                            })}
                            placeholder="Designed & Developed by Bharath Kumar"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">Primary Contact Phone</label>
                          <input 
                            type="text" 
                            value={settings.footer?.phone || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              footer: { ...settings.footer, phone: e.target.value }
                            })}
                            placeholder="7975774472"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">WhatsApp Phone Number</label>
                          <input 
                            type="text" 
                            value={settings.footer?.whatsapp || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              footer: { ...settings.footer, whatsapp: e.target.value }
                            })}
                            placeholder="8453036381"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">Support Email Address</label>
                          <input 
                            type="email" 
                            value={settings.footer?.email || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              footer: { ...settings.footer, email: e.target.value }
                            })}
                            placeholder="support@aonedigital.in"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-slate-500 text-[10px] font-bold block uppercase">Admin Email Address</label>
                          <input 
                            type="email" 
                            value={settings.footer?.admin_email || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              footer: { ...settings.footer, admin_email: e.target.value }
                            })}
                            placeholder="bharath.kumar@aonedigital.in"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 flex justify-end">
                      <button 
                        type="submit" 
                        className="px-6 py-3 bg-secondary text-white text-xs font-bold rounded-xl shadow-lg hover:bg-secondary-container hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">save</span> Save Branding Styles
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab 7: USER MANAGEMENT */}
              {cmsTab === 'users' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="ap-panel-title">Team Roles & Permissions</h2>
                      <p className="ap-panel-subtitle">Manage administrator profiles, accounts, and CMS interface permissions.</p>
                    </div>

                    {currentUserRole === 'Super Admin' ? (
                      userSubTab === 'members' ? (
                        <button
                          onClick={() => {
                            setEditingUserId(null);
                            setUserForm({ username: '', role: roles[0]?.name || 'Content Editor', email: '', status: 'active' });
                            setIsUserModalOpen(true);
                          }}
                          className="px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl shadow-md hover:bg-secondary-container flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">person_add</span> Create User
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingRoleId(null);
                            setRoleForm({ name: '', description: '', permissions: [] });
                            setIsRoleModalOpen(true);
                          }}
                          className="px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl shadow-md hover:bg-secondary-container flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">add_moderator</span> Create Role
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-bold italic">Super Admin ONLY</span>
                    )}
                  </div>

                  {/* Sub-tab Navigation */}
                  <div className="flex border-b border-slate-200 gap-6 text-xs font-bold mb-4">
                    <button
                      onClick={() => setUserSubTab('members')}
                      className={`pb-2 border-b-2 transition-all cursor-pointer ${userSubTab === 'members' ? 'border-secondary text-secondary font-bold' : 'border-transparent text-slate-400 hover:text-slate-650'}`}
                    >
                      Team Members ({users.length})
                    </button>
                    <button
                      onClick={() => setUserSubTab('roles')}
                      className={`pb-2 border-b-2 transition-all cursor-pointer ${userSubTab === 'roles' ? 'border-secondary text-secondary font-bold' : 'border-transparent text-slate-400 hover:text-slate-650'}`}
                    >
                      Roles &amp; Permissions ({roles.length})
                    </button>
                  </div>

                  {userSubTab === 'members' ? (
                    <>
                      {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-3 bg-white/60 backdrop-blur-md border border-slate-200/50 p-4 rounded-2xl shadow-sm">
                    <div className="relative flex-grow">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                      <input 
                        type="text"
                        placeholder="Search team member by username or email..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold outline-none focus:border-secondary transition-all"
                      />
                    </div>
                    <div className="w-full sm:w-48">
                      <select
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-secondary transition-all"
                      >
                        <option value="All">All Roles</option>
                        <option value="Super Admin">Super Admin</option>
                        <option value="Store Manager">Store Manager</option>
                        <option value="Content Editor">Content Editor</option>
                      </select>
                    </div>
                  </div>

                  {/* Users Table (Desktop only) */}
                  <div className="hidden md:block bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                            <th className="p-5">Team Member</th>
                            <th className="p-5">Role & Permissions</th>
                            <th className="p-5">Email Address</th>
                            <th className="p-5 text-center">Status</th>
                            <th className="p-5">Last Active</th>
                            <th className="p-5 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                          {users
                            .filter((u) => {
                              const matchesSearch = (u.username || '').toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                                                    (u.email || '').toLowerCase().includes(userSearchQuery.toLowerCase());
                              const matchesRole = userRoleFilter === 'All' || u.role === userRoleFilter;
                              return matchesSearch && matchesRole;
                            })
                            .map((u) => (
                              <tr key={u.id} className="hover:bg-slate-50/30 transition-colors">
                                <td className="p-5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/50 flex items-center justify-center font-bold text-secondary text-[11px] uppercase">
                                      {(u.username || 'A')[0]}
                                    </div>
                                    <span className="font-bold text-slate-800 text-xs">{u.username}</span>
                                  </div>
                                </td>
                                <td className="p-5">
                                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                    u.role === 'Super Admin' ? 'bg-red-50 text-red-700 border border-red-200/30' :
                                    u.role === 'Store Manager' ? 'bg-blue-50 text-blue-700 border border-blue-200/30' : 
                                    'bg-purple-50 text-purple-700 border border-purple-200/30'
                                  }`}>
                                    {u.role}
                                  </span>
                                </td>
                                <td className="p-5 text-slate-500 font-mono text-[11px]">{u.email}</td>
                                <td className="p-5 text-center">
                                  <button
                                    onClick={() => handleToggleUserStatus(u)}
                                    disabled={currentUserRole !== 'Super Admin' || u.username === 'Bharath'}
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${
                                      (u.status || 'active') === 'active' 
                                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                    } ${
                                      (currentUserRole !== 'Super Admin' || u.username === 'Bharath') ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                                    }`}
                                    title={u.username === 'Bharath' ? 'Protected Root Account' : 'Toggle Status'}
                                  >
                                    {(u.status || 'active') === 'active' ? 'Active' : 'Inactive'}
                                  </button>
                                </td>
                                <td className="p-5 text-slate-400 font-medium text-[11px]">
                                  {u.last_login 
                                    ? new Date(u.last_login).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) 
                                    : 'Never active'}
                                </td>
                                <td className="p-5">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {currentUserRole === 'Super Admin' && u.username !== 'Bharath' ? (
                                      <>
                                        <button
                                          onClick={() => handleEditUserClick(u)}
                                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                                          title="Edit user role"
                                        >
                                          <span className="material-symbols-outlined text-sm">edit</span>
                                        </button>
                                        <button
                                          onClick={() => handleDeleteUser(u.id)}
                                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                                          title="Delete user"
                                        >
                                          <span className="material-symbols-outlined text-sm">person_remove</span>
                                        </button>
                                      </>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 italic">Protected</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Users Card Stack Layout (Mobile & Tablet) */}
                  <div className="md:hidden space-y-4">
                    {users
                      .filter((u) => {
                        const matchesSearch = (u.username || '').toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                                              (u.email || '').toLowerCase().includes(userSearchQuery.toLowerCase());
                        const matchesRole = userRoleFilter === 'All' || u.role === userRoleFilter;
                        return matchesSearch && matchesRole;
                      })
                      .map((u) => (
                        <div key={u.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4 transition-all hover:shadow-md">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200/50 flex items-center justify-center font-bold text-secondary text-xs uppercase">
                                {(u.username || 'A')[0]}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-800 text-xs">{u.username}</h4>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{u.email}</p>
                              </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              u.role === 'Super Admin' ? 'bg-red-50 text-red-700 border border-red-200/30' :
                              u.role === 'Store Manager' ? 'bg-blue-50 text-blue-700 border border-blue-200/30' : 
                              'bg-purple-50 text-purple-700 border border-purple-200/30'
                            }`}>
                              {u.role}
                            </span>
                          </div>

                          <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-[11px]">
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-slate-400 uppercase block">Status</span>
                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                disabled={currentUserRole !== 'Super Admin' || u.username === 'Bharath'}
                                className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold transition-all border ${
                                  (u.status || 'active') === 'active' 
                                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                } ${(currentUserRole !== 'Super Admin' || u.username === 'Bharath') ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                                title={u.username === 'Bharath' ? 'Protected Root Account' : 'Toggle Status'}
                              >
                                {(u.status || 'active') === 'active' ? 'Active' : 'Inactive'}
                              </button>
                            </div>
                            <div className="text-right space-y-1">
                              <span className="text-[9px] font-bold text-slate-400 uppercase block">Last Active</span>
                              <span className="text-slate-400 font-medium font-mono text-[10px]">
                                {u.last_login 
                                  ? new Date(u.last_login).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) 
                                  : 'Never active'}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                            {currentUserRole === 'Super Admin' && u.username !== 'Bharath' ? (
                              <>
                                <button
                                  onClick={() => handleEditUserClick(u)}
                                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-blue-600 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Edit user role"
                                >
                                  <span className="material-symbols-outlined text-[14px]">edit</span> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="px-3 py-1.5 border border-red-100 hover:bg-red-50 rounded-xl text-red-600 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Delete user"
                                >
                                  <span className="material-symbols-outlined text-[14px]">person_remove</span> Delete
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Account Protected</span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                    </>
                  ) : (
                    <>
                      {/* Roles Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {roles.map((role) => (
                          <div key={role.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
                            <div>
                              <div className="flex justify-between items-start">
                                <h4 className="font-bold text-slate-800 text-sm">{role.name}</h4>
                                <span className="text-[10px] font-bold bg-secondary/5 text-secondary border border-secondary/15 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                  {role.user_count} Assigned
                                </span>
                              </div>
                              <p className="text-slate-400 text-xs mt-2 leading-relaxed min-h-[36px]">
                                {role.description || "No description provided."}
                              </p>
                              
                              <div className="mt-4 space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Permissions Included</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {(role.permissions || []).map((permName) => (
                                    <span key={permName} className="text-[10px] font-semibold bg-slate-50 border border-slate-150 text-slate-600 px-2 py-0.5 rounded-md">
                                      {permName}
                                    </span>
                                  ))}
                                  {(role.permissions || []).length === 0 && (
                                    <span className="text-[10px] text-slate-400 italic">No permissions set.</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-4">
                              <button 
                                className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-secondary text-[11px] font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                                onClick={() => {
                                  setEditingRoleId(role.id);
                                  setRoleForm({
                                    name: role.name,
                                    description: role.description || '',
                                    permissions: role.permissions || []
                                  });
                                  setIsRoleModalOpen(true);
                                }}
                                title="Edit role parameters"
                              >
                                <span className="material-symbols-outlined text-[13px]">edit</span> Edit
                              </button>
                              
                              {/* Root system roles protect check */}
                              {!["Super Admin", "Store Manager", "Content Editor"].includes(role.name) ? (
                                <button 
                                  className="px-2.5 py-1.5 border border-red-100 hover:bg-red-50 text-red-650 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                                  onClick={() => handleDeleteRole(role.id)}
                                  title="Delete role"
                                >
                                  <span className="material-symbols-outlined text-[13px]">delete</span> Delete
                                </button>
                              ) : (
                                <span className="text-[9px] text-slate-400 italic py-1 px-2 bg-slate-50 rounded-lg select-none">System Protected</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Tab 8: AUDIT TRAIL LOGS */}
              {cmsTab === 'logs' && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="ap-panel-title">Security Audit Trail</h2>
                    <p className="ap-panel-subtitle">Real-time chronicle log tracing administrative database commits.</p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm space-y-4">
                    <div className="space-y-3">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="flex gap-4 items-start text-xs border-b border-slate-100 pb-3 last:border-0">
                          <span className="font-mono text-slate-400 shrink-0 select-none">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-500 font-bold shrink-0">
                            {log.user}
                          </span>
                          <p className="text-slate-800 font-semibold leading-tight">{log.action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </main>

          {/* Lead notes update popup */}
          {selectedLead && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-md w-full relative">
                <button
                  onClick={() => setSelectedLead(null)}
                  className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-full transition-colors flex items-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
                <h4 className="font-bold text-sm text-slate-800 mb-4">Update Customer Lead Details</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">LEAD STATUS</label>
                    <select
                      value={selectedLead.status}
                      onChange={(e) => setSelectedLead({ ...selectedLead, status: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                    >
                      <option value="new">New Inquire</option>
                      <option value="contacted">Contacted / Engaged</option>
                      <option value="won">Won / Success Purchase</option>
                      <option value="lost">Lost / Archived</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">FOLLOW-UP NOTES</label>
                    <textarea
                      rows="3"
                      value={selectedLead.notes}
                      onChange={(e) => setSelectedLead({ ...selectedLead, notes: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold resize-none"
                    />
                  </div>
                  <button
                    onClick={() => handleUpdateLeadStatus(selectedLead.id, selectedLead.status, selectedLead.notes)}
                    className="w-full py-3 bg-secondary text-white font-bold rounded-xl shadow-md text-xs hover:bg-secondary-container cursor-pointer"
                  >
                    Confirm Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* User management creator popup */}
          {isUserModalOpen && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <form onSubmit={handleUserSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-sm w-full relative space-y-4">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-full transition-colors flex items-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
                <h4 className="font-bold text-sm text-slate-800">
                  {editingUserId ? 'Edit Team Administrator' : 'Add Team Administrator Account'}
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">USERNAME</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Divya"
                      value={userForm.username}
                      onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">ROLE ASSIGNMENT</label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                      {roles.length === 0 && (
                        <>
                          <option value="Super Admin">Super Admin</option>
                          <option value="Store Manager">Store Manager</option>
                          <option value="Content Editor">Content Editor</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">EMAIL ADDRESS</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. divya@aonedigital.in"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                  </div>
                  {editingUserId && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">ACCOUNT STATUS</label>
                      <select
                        value={userForm.status || 'active'}
                        onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full py-3 bg-secondary text-white font-bold rounded-xl shadow-md text-xs hover:bg-secondary-container cursor-pointer animate-pulse"
                  >
                    {editingUserId ? 'Save Account Changes' : 'Register Team Member'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Roles Creator/Editor Modal */}
          {isRoleModalOpen && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
              <form onSubmit={handleRoleSubmit} className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-2xl max-w-lg w-full relative space-y-6 max-h-[90vh] overflow-y-auto my-8">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors flex items-center cursor-pointer text-slate-700"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
                
                <h3 className="font-bold text-sm text-slate-800">
                  {editingRoleId ? 'Modify Security Role Settings' : 'Register New Security Role'}
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">ROLE NAME</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Content Editor"
                      disabled={["Super Admin", "Store Manager", "Content Editor"].includes(roleForm.name) && editingRoleId}
                      value={roleForm.name}
                      onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold disabled:bg-slate-50 disabled:text-slate-400"
                    />
                    {["Super Admin", "Store Manager", "Content Editor"].includes(roleForm.name) && editingRoleId && (
                      <span className="text-[9px] text-slate-400 block italic">System core role names cannot be renamed.</span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">DESCRIPTION</label>
                    <textarea
                      rows="2"
                      placeholder="Enter clear, administrative description for this security tier..."
                      value={roleForm.description}
                      onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 block">ASSIGN PERMISSIONS</label>
                    <div className="grid grid-cols-1 gap-2.5 max-h-[220px] overflow-y-auto pr-1 bg-slate-50/50 p-3 rounded-2xl border border-slate-150">
                      {permissions.map((perm) => {
                        const isChecked = (roleForm.permissions || []).includes(perm.name);
                        return (
                          <label key={perm.id} className="flex items-start gap-3 p-2 bg-white rounded-xl border border-slate-100 hover:border-slate-200 cursor-pointer select-none transition-colors">
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                let updatedPerms = [...(roleForm.permissions || [])];
                                if (checked) {
                                  updatedPerms.push(perm.name);
                                } else {
                                  updatedPerms = updatedPerms.filter((p) => p !== perm.name);
                                }
                                setRoleForm({ ...roleForm, permissions: updatedPerms });
                              }}
                              className="mt-0.5 accent-secondary"
                            />
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-800 block leading-tight">{perm.name}</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5 leading-snug">{perm.description}</span>
                            </div>
                          </label>
                        );
                      })}
                      {permissions.length === 0 && (
                        <p className="text-[10px] text-slate-400 italic text-center py-4">No system permissions definitions found.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                  <button 
                    type="button" 
                    className="w-1/2 py-3 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-slate-700 transition-all text-xs cursor-pointer"
                    onClick={() => setIsRoleModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="w-1/2 py-3 bg-secondary text-white font-bold rounded-xl shadow-md text-xs hover:bg-secondary-container transition-all cursor-pointer"
                  >
                    Save Role Settings
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      )}

      {/* Product Add/Edit Modal */}
      {isProductModalOpen && (
        <div className="admin-font-override fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
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
                    {(settings.categories || []).map((cat) => (
                      <option key={cat.filterKey} value={cat.filterKey}>
                        {cat.emoji} {cat.title}
                      </option>
                    ))}
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

              <div className="space-y-3">
                <label className="text-ui-label-bold text-on-surface text-xs block font-bold">PRODUCT IMAGE</label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  {productForm.image_url ? (
                    <img 
                      src={productForm.image_url} 
                      alt="Preview" 
                      className="w-16 h-16 rounded-xl object-contain bg-white border border-slate-100"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined text-2xl">image</span>
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20 file:cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 font-medium">
                      {uploadingImage ? 'Uploading image to Supabase Storage...' : 'Upload PNG, JPG, or WebP. Max 5MB.'}
                    </p>
                  </div>
                </div>
                {productForm.image_url && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Image Path URL</span>
                    <input 
                      type="text" 
                      readOnly 
                      value={productForm.image_url}
                      className="w-full bg-slate-50 text-[10px] font-mono text-slate-500 border border-slate-200 rounded-xl px-3 py-1.5 outline-none select-all"
                    />
                  </div>
                )}
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

              {/* Dynamic Specifications Editor */}
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <label className="text-ui-label-bold text-on-surface text-xs block font-bold">PRODUCT SPECIFICATIONS</label>
                
                {/* Visual List of currently configured specs */}
                {Object.keys(productForm.specifications || {}).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {Object.entries(productForm.specifications).map(([key, val]) => (
                      <div key={key} className="flex justify-between items-center text-xs bg-white border border-slate-200/60 rounded-xl py-2 px-3 shadow-sm">
                        <span className="text-slate-600 font-semibold truncate max-w-[180px]">
                          <strong>{key}:</strong> {val}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSpec(key)}
                          className="text-red-500 hover:text-red-700 transition-colors flex items-center p-1 rounded-full hover:bg-red-50 cursor-pointer"
                          title="Remove specification"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 font-medium">No special features or specifications added yet.</p>
                )}

                {/* Key-Value Inputs row */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Feature / Parameter</span>
                    <input
                      type="text"
                      placeholder="e.g. Color, RAM, Display"
                      value={specKey}
                      onChange={(e) => setSpecKey(e.target.value)}
                      className="w-full bg-white border border-outline-variant rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-secondary"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Value Description</span>
                    <input
                      type="text"
                      placeholder="e.g. Natural Titanium, 8GB, 6.7 inch OLED"
                      value={specVal}
                      onChange={(e) => setSpecVal(e.target.value)}
                      className="w-full bg-white border border-outline-variant rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-secondary"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="sm:self-end px-4 py-2 border border-secondary text-secondary hover:bg-secondary hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer h-9 justify-center"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span> Add
                  </button>
                </div>
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
              <p className="max-w-xs text-on-primary-container/80 leading-relaxed">
                {settings.footer?.description || "Experience the future of retail with India's most trusted premium electronics destination."}
              </p>
              <div className="flex gap-4">
                <a 
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors" 
                  href="/"
                  title="Visit storefront home"
                >
                  <span className="material-symbols-outlined text-on-primary text-sm">public</span>
                </a>
                <button 
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors" 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'Aone Digital',
                        text: 'Checkout premium smartphones & appliances at Aone Digital!',
                        url: window.location.origin
                      }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(window.location.origin);
                      alert('Website link copied to clipboard!');
                    }
                  }}
                  title="Share website"
                >
                  <span className="material-symbols-outlined text-on-primary text-sm">share</span>
                </button>
              </div>
            </div>
            <div>
              <h4 className="text-white font-ui-label-bold mb-6">Product Categories</h4>
              <ul className="space-y-3 text-on-primary-container/80 font-body">
                {(settings.categories || []).slice(0, 4).map((cat) => (
                  <li key={cat.filterKey}>
                    <span 
                      className="hover:text-on-primary transition-colors cursor-pointer" 
                      onClick={() => { 
                        setSelectedCategoryKey(cat.filterKey); 
                        setView('category'); 
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      {cat.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-ui-label-bold mb-6">Quick Links</h4>
              <ul className="space-y-3 text-on-primary-container/80 font-body">
                <li><a className="hover:text-on-primary transition-colors" href="#categories">Store Locator</a></li>
                <li><a className="hover:text-on-primary transition-colors" href="#contact">Support</a></li>
                <li><a className="hover:text-on-primary transition-colors" href="#">Privacy Policy</a></li>
                <li><a className="hover:text-on-primary transition-colors" href="#">Terms of Service</a></li>
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
              <p className="text-ui-caption text-on-primary-container/60">
                <a 
                  href={settings.footer?.website_url || "https://aonedigital.in"} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline hover:text-white transition-colors"
                >
                  {settings.footer?.copyright || "© 2026 Aone Digital. All rights reserved."}
                </a>
              </p>
              <p className="text-ui-caption text-on-primary-container/60">{settings.footer?.developed_by || "Designed & Developed by Bharath Kumar"}</p>
              <p className="text-ui-caption text-on-primary-container/60">
                Contact:{' '}
                <a 
                  href={`tel:${settings.footer?.phone || '7975774472'}`}
                  className="hover:underline hover:text-white transition-colors"
                >
                  {settings.footer?.phone || "7975774472"}
                </a>
                , WhatsApp:{' '}
                <a 
                  href={`https://wa.me/91${settings.footer?.whatsapp || '8453036381'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline hover:text-white transition-colors"
                >
                  {settings.footer?.whatsapp || "8453036381"}
                </a>
              </p>
              <p className="text-ui-caption text-on-primary-container/60">
                Email:{' '}
                <a 
                  href={`mailto:${settings.footer?.email || 'support@aonedigital.in'}`}
                  className="hover:underline hover:text-white transition-colors"
                >
                  {settings.footer?.email || "support@aonedigital.in"}
                </a>
                {' '}| Admin:{' '}
                <a 
                  href={`mailto:${settings.footer?.admin_email || 'bharath.kumar@hreeem.com'}`}
                  className="hover:underline hover:text-white transition-colors"
                >
                  {settings.footer?.admin_email || "bharath.kumar@hreeem.com"}
                </a>
              </p>
            </div>
          </div>
        </footer>
      )}
      {/* Customer Product Details Modal */}
      {customerSelectedProduct && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-2xl max-w-lg w-full relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto admin-font-override">
            {/* Close Button */}
            <button
              onClick={() => {
                setCustomerSelectedProduct(null);
                // Clear URL parameters cleanly
                window.history.replaceState({}, '', '/');
              }}
              className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors flex items-center justify-center cursor-pointer border border-slate-200 text-slate-500"
            >
              <span className="material-symbols-outlined text-xs">close</span>
            </button>

            {/* Product details grid layout */}
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <div className="w-40 h-40 flex items-center justify-center rounded-2xl p-4 border border-slate-200/50 bg-[#f8faff] shrink-0">
                <img 
                  src={customerSelectedProduct.image_url} 
                  alt={customerSelectedProduct.name} 
                  className="w-full h-full object-contain"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=300&q=60'; }}
                />
              </div>
              <div className="flex-grow text-center sm:text-left">
                <span className="px-3 py-1 bg-secondary text-white text-[10px] font-bold tracking-widest uppercase rounded-full">
                  {customerSelectedProduct.brand}
                </span>
                <h3 className="font-headline-md text-on-surface text-xl font-extrabold mt-3 leading-tight text-[#141b2b]">
                  {customerSelectedProduct.name}
                </h3>
                <span className="text-xl font-extrabold text-secondary mt-2 block">
                  ₹{customerSelectedProduct.price.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-body">
                {customerSelectedProduct.description || "Experience top-of-the-line innovation, sleek design, and robust capabilities with this premium choice. Built to elevate your lifestyle and deliver seamless performance."}
              </p>
            </div>

            {/* Specifications */}
            {customerSelectedProduct.specifications && Object.keys(customerSelectedProduct.specifications).length > 0 && (
              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-ui">Specifications</h4>
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 border border-slate-100 p-3 rounded-xl">
                  {Object.entries(customerSelectedProduct.specifications).map(([key, val]) => (
                    <div key={key} className="flex justify-between border-b border-slate-200/50 pb-1 last:border-0 last:pb-0">
                      <span className="text-slate-400 font-bold capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="text-slate-700 font-bold">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart CTA */}
            <div className="border-t border-slate-100 pt-4 flex gap-4">
              <button
                onClick={() => {
                  handleAddToCart(customerSelectedProduct);
                  setCustomerSelectedProduct(null);
                  window.history.replaceState({}, '', '/');
                }}
                className="flex-grow py-3 bg-secondary text-white font-bold rounded-xl shadow-lg hover:bg-secondary-container transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                <span className="material-symbols-outlined text-sm">add_shopping_cart</span> Add to Shopping Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advertisement Inquiry Modal */}
      {isAdInquiryOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-outline-variant/30 rounded-[32px] p-8 md:p-10 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto relative my-8 animate-fade-in font-body">
            <button 
              className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors flex items-center cursor-pointer"
              onClick={() => setIsAdInquiryOpen(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-secondary text-2xl">campaign</span>
              <h3 className="font-headline-sm text-on-surface m-0 text-xl font-black">Advertise With Us</h3>
            </div>
            <p className="text-xs text-text-secondary mb-6">
              Promote your brand at slot <strong className="text-secondary">{selectedPlacement}</strong>. Submit your details and our growth manager will call you back.
            </p>
            
            {adInquirySubmitted ? (
              <div className="text-center py-10 bg-green-50 border border-green-200 rounded-2xl animate-fade-in">
                <span className="material-symbols-outlined text-5xl text-status-success mb-4">check_circle</span>
                <h4 className="font-title-sm text-on-surface mb-2">Inquiry Submitted!</h4>
                <p className="text-xs text-text-secondary">Thank you for your interest! We will contact you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleAdInquirySubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">FULL NAME</label>
                    <input 
                      type="text" 
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all text-slate-800" 
                      required 
                      placeholder="Your Name"
                      value={adInquiryForm.name}
                      onChange={(e) => setAdInquiryForm({ ...adInquiryForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">MOBILE NUMBER</label>
                    <input 
                      type="tel" 
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all text-slate-800" 
                      required 
                      placeholder="+91 99999 99999"
                      value={adInquiryForm.phone}
                      onChange={(e) => setAdInquiryForm({ ...adInquiryForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">EMAIL ADDRESS</label>
                    <input 
                      type="email" 
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all text-slate-800" 
                      required 
                      placeholder="you@company.com"
                      value={adInquiryForm.email}
                      onChange={(e) => setAdInquiryForm({ ...adInquiryForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">COMPANY NAME</label>
                    <input 
                      type="text" 
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all text-slate-800" 
                      placeholder="e.g. Acme Corp"
                      value={adInquiryForm.company}
                      onChange={(e) => setAdInquiryForm({ ...adInquiryForm, company: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">BANNER SIZE</label>
                    <input 
                      type="text" 
                      disabled
                      className="w-full bg-slate-50 border border-slate-200 text-slate-500 rounded-xl px-3 py-2 text-xs font-semibold cursor-not-allowed"
                      value={adInquiryForm.size}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">BUDGET RANGE</label>
                    <select 
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all cursor-pointer text-slate-700"
                      value={adInquiryForm.budget}
                      onChange={(e) => setAdInquiryForm({ ...adInquiryForm, budget: e.target.value })}
                    >
                      <option>Select Budget Range</option>
                      <option>₹5,000 - ₹15,000 / month</option>
                      <option>₹15,000 - ₹30,000 / month</option>
                      <option>₹30,000 - ₹60,000 / month</option>
                      <option>₹60,000+ / month</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">ADDITIONAL MESSAGE</label>
                  <textarea 
                    rows={3}
                    placeholder="Wants to run a campaign for our premium accessories line..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all resize-none text-slate-800" 
                    value={adInquiryForm.notes}
                    onChange={(e) => setAdInquiryForm({ ...adInquiryForm, notes: e.target.value })}
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 bg-secondary text-white font-bold rounded-xl shadow-lg hover:bg-secondary-container transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">mail</span>
                  Submit Ad Inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Premium Toast Notification System */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[200] max-w-sm w-full bg-white border border-slate-200/60 rounded-2xl shadow-xl p-4 flex items-start gap-3 animate-fade-in font-body">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            toast.type === 'success' ? 'bg-green-50 text-green-600' :
            toast.type === 'error' ? 'bg-red-50 text-red-600' :
            'bg-amber-50 text-amber-600'
          }`}>
            <span className="material-symbols-outlined text-lg">
              {toast.type === 'success' ? 'check_circle' :
               toast.type === 'error' ? 'error' :
               'warning'}
            </span>
          </div>
          <div className="flex-1 space-y-0.5 text-left">
            <span className="text-[11px] font-bold text-slate-800 block">
              {toast.type === 'success' ? 'Operation Success' :
               toast.type === 'error' ? 'Operation Failed' :
               'System Warning'}
            </span>
            <p className="text-[10px] text-slate-500 leading-snug">{toast.message}</p>
          </div>
          <button 
            onClick={() => setToast(null)}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 flex items-center shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
}
