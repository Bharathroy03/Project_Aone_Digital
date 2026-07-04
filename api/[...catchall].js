const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const uuid = require('uuid');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Initialize Supabase Client
const getEnvUrl = () => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (url && url !== 'undefined' && url !== 'null' && url.trim() !== '') {
    return url;
  }
  return 'https://zyqxiuoyrytsobuuqcwic.supabase.co';
};

const getEnvKey = () => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (key && key !== 'undefined' && key !== 'null' && key.trim() !== '') {
    return key;
  }
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5cXhpdW95cnl0c2J1dXFjd2ljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzA0Nzk0NCwiZXhwIjoyMDk4NjIzOTQ0fQ.jDZqG3SVdYqR1OjRC5b0sWftLM52sXUV269GPs-ncto';
};

const supabaseUrl = getEnvUrl();
const supabaseKey = getEnvKey();
const ws = require('ws');
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

// --- Defaults and Mock Data Fallbacks ---
const DEFAULT_SETTINGS = {
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
    { slug: "apple", name: "Apple", bg: "#F2F2F2", iconColor: "1a1a1a" },
    { slug: "samsung", name: "Samsung", bg: "#E8EDFF", iconColor: "1428A0" },
    { slug: "sony", name: "Sony", bg: "#F0F0F0", iconColor: "000000" },
    { slug: "lg", name: "LG", bg: "#FFF0F3", iconColor: "A50034" },
    { slug: "vivo", name: "Vivo", bg: "#EEF0FF", iconColor: "415FFF" },
    { slug: "whirlpool", name: "Whirlpool", bg: "#EAF0FF", iconColor: "003087" },
    { slug: "dyson", name: "Dyson", bg: "#FFF0F0", iconColor: "C41230" },
    { slug: "oneplus", name: "OnePlus", bg: "#FFF1F1", iconColor: "F5010C" },
    { slug: "xiaomi", name: "Xiaomi", bg: "#FFF5EC", iconColor: "FF6900" },
    { slug: "bosch", name: "Bosch", bg: "#EAF5FF", iconColor: "007BC0" }
  ],
  about: {
    title: "Redefining the Electronics Shopping Experience",
    subtitle: "Certified premium retail destinations since 2012.",
    description: "At Aone Digital, we bring you genuine global brands with expert support, flexible financing, and rapid home setups."
  },
  categories: [
    { title: "Smartphones", emoji: "📱", filterKey: "smart_phone", brands: ["Apple", "Samsung", "Vivo", "OnePlus", "Xiaomi", "Realme"] },
    { title: "Smart TVs", emoji: "📺", filterKey: "tv", brands: ["Samsung", "LG", "Sony", "Mi", "OnePlus", "TCL"] },
    { title: "Laptops", emoji: "💻", filterKey: "laptop", brands: ["Apple", "Dell", "HP", "Asus", "Lenovo", "Acer"] },
    { title: "Refrigerators", emoji: "❄️", filterKey: "refrigerator", brands: ["Samsung", "LG", "Whirlpool", "Haier", "Godrej"] },
    { title: "Washing Machines", emoji: "🫧", filterKey: "washing_machine", brands: ["Samsung", "LG", "Whirlpool", "IFB", "Bosch"] },
    { title: "Air Conditioners", emoji: "🌬️", filterKey: "air_conditioner", brands: ["Daikin", "Voltas", "LG", "Samsung", "Blue Star"] },
    { title: "Kitchen Appliances", emoji: "🍳", filterKey: "home_appliance", brands: ["Bosch", "Philips", "Morphy Richards", "Prestige"] }
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
    admin_email: "bharath.kumar@hreeem.com"
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
};

const MOCK_LEADS = [];
const MOCK_MEDIA = [];
const MOCK_USERS = [
  { id: "user-1", username: "Bharath", role: "Super Admin", email: "bharath.kumar@hreeem.com", status: "active", last_login: new Date().toISOString() }
];
const MOCK_AUDIT_LOGS = [];
const MOCK_ERROR_LOGS = [];
const MOCK_PRODUCTS = [];
const MOCK_ORDERS = [];
const MOCK_BANNERS = [];
const MOCK_ROLES = [
  { id: "role-1", name: "Super Admin", description: "Full system access to all inventory, media, users, and audit trail configurations.", permissions: ["all_access", "edit_inventory", "manage_users", "view_audit_logs"] }
];

// Helper log routines
const logAction = async (user, action) => {
  const newLog = {
    id: `log-${uuid.v4()}`,
    user_name: user || 'Admin',
    action,
    timestamp: new Date().toISOString()
  };
  try {
    if (!supabaseUrl.includes('your-supabase-project')) {
      await supabase.from('audit_logs').insert(newLog);
      return;
    }
  } catch (e) {
    console.error('Supabase logging failed:', e);
  }
  MOCK_AUDIT_LOGS.unshift({
    id: newLog.id,
    user: newLog.user_name,
    action: newLog.action,
    timestamp: newLog.timestamp
  });
};

const logException = async (source, message, stackTrace = '', context = {}) => {
  const newErr = {
    id: `err-${uuid.v4()}`,
    source,
    message: String(message),
    stack_trace: String(stackTrace),
    context,
    created_at: new Date().toISOString()
  };
  console.error(`[${source.toUpperCase()} ERROR]`, message, context);
  try {
    if (!supabaseUrl.includes('your-supabase-project')) {
      await supabase.from('error_logs').insert(newErr);
      return;
    }
  } catch (e) {
    console.error('Supabase write error log failure:', e);
  }
  MOCK_ERROR_LOGS.unshift(newErr);
};

// Error logging handler route
app.post('/api/error-logs', async (req, res, next) => {
  try {
    const { message, stack_trace, context } = req.body || {};
    await logException('frontend', message || 'Unknown frontend error', stack_trace, context);
    res.status(201).json({ status: 'success', message: 'Frontend error logged' });
  } catch (err) {
    next(err);
  }
});

// Settings CRUD
app.get('/api/settings', async (req, res, next) => {
  try {
    if (!supabaseUrl.includes('your-supabase-project')) {
      const { data, error } = await supabase.from('website_settings').select('*');
      if (!error && data && data.length > 0) {
        return res.status(200).json(data[0].config || DEFAULT_SETTINGS);
      }
      if (error) console.error('Supabase fetch website_settings failed:', error.message || error);
    }
    res.status(200).json(DEFAULT_SETTINGS);
  } catch (err) {
    console.error('GET settings fallback error:', err);
    res.status(200).json(DEFAULT_SETTINGS);
  }
});

app.put('/api/settings', async (req, res, next) => {
  try {
    const data = req.body;
    const userHeader = req.headers['x-admin-user'] || 'System';
    await logAction(userHeader, 'Updated website configuration settings');

    if (!supabaseUrl.includes('your-supabase-project')) {
      const { error } = await supabase.from('website_settings').upsert({ id: 1, config: data });
      if (error) throw error;
      return res.status(200).json({ status: 'success', message: 'Settings updated successfully' });
    }
    Object.assign(DEFAULT_SETTINGS, data);
    res.status(200).json({ status: 'success', message: 'Settings updated successfully' });
  } catch (err) {
    next(err);
  }
});

// Products CRUD
app.get('/api/products', async (req, res, next) => {
  try {
    if (!supabaseUrl.includes('your-supabase-project')) {
      const { data, error } = await supabase.from('products').select('*');
      if (!error && data) return res.status(200).json(data);
      if (error) console.error('Supabase fetch products failed:', error.message || error);
    }
    res.status(200).json(MOCK_PRODUCTS);
  } catch (err) {
    console.error('GET products fallback error:', err);
    res.status(200).json(MOCK_PRODUCTS);
  }
});

app.get('/api/products/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!supabaseUrl.includes('your-supabase-project')) {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (!error && data) return res.status(200).json(data);
      if (error && error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Product not found' });
      }
      if (error) console.error('Supabase fetch single product failed:', error.message || error);
    }
    const match = MOCK_PRODUCTS.find(p => p.id === id);
    if (match) return res.status(200).json(match);
    res.status(404).json({ error: 'Product not found' });
  } catch (err) {
    console.error('GET product single fallback error:', err);
    res.status(404).json({ error: 'Product not found' });
  }
});

app.post('/api/products', async (req, res, next) => {
  try {
    const { name, price, category, brand, description, image_url, stock, specifications, featured } = req.body;
    if (!name || !price) {
      return res.status(400).json({ error: 'Missing name or price' });
    }
    const newProduct = {
      id: uuid.v4(),
      name,
      category: category || 'mobile',
      brand: brand || 'Generic',
      price: parseFloat(price),
      description: description || '',
      image_url: image_url || '',
      stock: parseInt(stock) || 10,
      specifications: specifications || {},
      featured: !!featured
    };

    const userHeader = req.headers['x-admin-user'] || 'System';
    await logAction(userHeader, `Added product: '${newProduct.name}' to catalog`);

    if (!supabaseUrl.includes('your-supabase-project')) {
      const { data, error } = await supabase.from('products').insert(newProduct).select();
      if (error) throw error;
      return res.status(201).json(data[0]);
    }
    MOCK_PRODUCTS.unshift(newProduct);
    res.status(201).json(newProduct);
  } catch (err) {
    next(err);
  }
});

app.put('/api/products/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body || {};
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.stock) updateData.stock = parseInt(updateData.stock);

    const userHeader = req.headers['x-admin-user'] || 'System';
    await logAction(userHeader, `Updated product ID: ${id}`);

    if (!supabaseUrl.includes('your-supabase-project')) {
      const { data, error } = await supabase.from('products').update(updateData).eq('id', id).select();
      if (error) throw error;
      return res.status(200).json(data[0]);
    }
    const idx = MOCK_PRODUCTS.findIndex(p => p.id === id);
    if (idx !== -1) {
      MOCK_PRODUCTS[idx] = { ...MOCK_PRODUCTS[idx], ...updateData };
      return res.status(200).json(MOCK_PRODUCTS[idx]);
    }
    res.status(404).json({ error: 'Product not found' });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/products/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userHeader = req.headers['x-admin-user'] || 'System';
    await logAction(userHeader, `Deleted product ID: ${id}`);

    if (!supabaseUrl.includes('your-supabase-project')) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ message: 'Product deleted successfully' });
    }
    const idx = MOCK_PRODUCTS.findIndex(p => p.id === id);
    if (idx !== -1) {
      MOCK_PRODUCTS.splice(idx, 1);
      return res.status(200).json({ message: 'Product deleted successfully' });
    }
    res.status(404).json({ error: 'Product not found' });
  } catch (err) {
    next(err);
  }
});

// Orders & Checkout CRUD
app.get('/api/orders', async (req, res, next) => {
  try {
    if (!supabaseUrl.includes('your-supabase-project')) {
      const { data, error } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
      if (error) throw error;

      const formatted = (data || []).map(order => ({
        id: order.id,
        customer_name: order.customer_name,
        shipping_address: order.shipping_address,
        phone: order.phone,
        email: order.email,
        total_amount: parseFloat(order.total_amount),
        status: order.status,
        created_at: order.created_at,
        items: (order.order_items || []).map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: parseFloat(item.price)
        }))
      }));
      return res.status(200).json(formatted);
    }
    res.status(200).json(MOCK_ORDERS);
  } catch (err) {
    next(err);
  }
});

app.post('/api/orders', async (req, res, next) => {
  try {
    const { customer_name, shipping_address, total_amount, items, phone, email } = req.body || {};
    if (!customer_name || !shipping_address || !total_amount || !items || !items.length) {
      return res.status(400).json({ error: 'Missing required order fields' });
    }
    const orderId = `ord-${uuid.v4()}`;
    const newOrder = {
      id: orderId,
      customer_name,
      shipping_address,
      phone: phone || 'N/A',
      email: email || 'N/A',
      total_amount: parseFloat(total_amount),
      status: 'pending',
      created_at: new Date().toISOString(),
      items: items.map(item => ({
        product_id: item.product_id,
        product_name: item.name || 'Product',
        quantity: parseInt(item.quantity) || 1,
        price: parseFloat(item.price) || 0
      }))
    };

    console.log(`\n================ [EMAIL NOTIFICATION] ================`);
    console.log(`To: support@aonedigital.in, bharath.kumar@hreeem.com`);
    console.log(`Subject: Aone Digital — New Order Placed #${orderId.substring(0, 8).toUpperCase()}`);
    console.log(`Body: Hello Admin, customer ${customer_name} placed an order.`);
    console.log(`======================================================\n`);

    await logAction('System', `Dispatched new order placed email notification to bharath.kumar@hreeem.com for Order ID: ${orderId.substring(0, 8).toUpperCase()}`);

    if (!supabaseUrl.includes('your-supabase-project')) {
      const { error: orderErr } = await supabase.from('orders').insert({
        id: orderId,
        customer_name,
        shipping_address,
        phone: newOrder.phone,
        email: newOrder.email,
        total_amount: newOrder.total_amount,
        status: 'pending'
      });
      if (orderErr) throw orderErr;

      const orderItems = items.map(item => ({
        order_id: orderId,
        product_id: item.product_id,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price)
      }));
      const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
      if (itemsErr) throw itemsErr;

      return res.status(201).json({ message: 'Order created successfully', order_id: orderId, status: 'success' });
    }

    MOCK_ORDERS.unshift(newOrder);
    res.status(201).json({ message: 'Order created successfully', order_id: orderId, status: 'success' });
  } catch (err) {
    next(err);
  }
});

app.put('/api/orders/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userHeader = req.headers['x-admin-user'] || 'System';
    await logAction(userHeader, `Updated Order status ID: ${id} to ${status}`);

    if (!supabaseUrl.includes('your-supabase-project')) {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) throw error;
      return res.status(200).json({ status: 'success', message: 'Order status updated' });
    }

    const match = MOCK_ORDERS.find(o => o.id === id);
    if (match) {
      match.status = status;
      return res.status(200).json({ status: 'success', message: 'Order status updated' });
    }
    res.status(404).json({ error: 'Order not found' });
  } catch (err) {
    next(err);
  }
});

// Banners CRUD
app.get('/api/banners', async (req, res, next) => {
  try {
    if (!supabaseUrl.includes('your-supabase-project')) {
      const query = supabase.from('banners').select('*').order('type').order('sort_order');
      if (!req.query.admin) {
        query.eq('enabled', true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    res.status(200).json(MOCK_BANNERS);
  } catch (err) {
    next(err);
  }
});

app.post('/api/banners', async (req, res, next) => {
  try {
    const data = req.body || {};
    if (!data.image_url) {
      return res.status(400).json({ error: 'Missing image_url' });
    }

    let sortOrder = data.sort_order;
    if (!sortOrder) {
      if (!supabaseUrl.includes('your-supabase-project')) {
        const { data: banners } = await supabase.from('banners').select('sort_order').eq('type', data.type || 'hero');
        sortOrder = (banners ? banners.length : 0) + 1;
      } else {
        sortOrder = MOCK_BANNERS.length + 1;
      }
    }

    const newBanner = {
      id: uuid.v4(),
      title: data.title || '',
      subtitle: data.subtitle || '',
      type: data.type || 'hero',
      image_url: data.image_url,
      link_url: data.link_url || '#',
      link_label: data.link_label || 'Shop Now',
      enabled: data.enabled !== false,
      sort_order: sortOrder,
      scheduled_start: data.scheduled_start || null,
      scheduled_end: data.scheduled_end || null,
      width: parseInt(data.width) || null,
      height: parseInt(data.height) || null,
      created_at: new Date().toISOString()
    };

    const userHeader = req.headers['x-admin-user'] || 'System';
    await logAction(userHeader, `Created new banner: '${newBanner.title}'`);

    if (!supabaseUrl.includes('your-supabase-project')) {
      const { data: inserted, error } = await supabase.from('banners').insert(newBanner).select();
      if (error) throw error;
      return res.status(201).json(inserted[0]);
    }
    MOCK_BANNERS.push(newBanner);
    res.status(201).json(newBanner);
  } catch (err) {
    next(err);
  }
});

app.put('/api/banners/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body || {};
    const userHeader = req.headers['x-admin-user'] || 'System';
    await logAction(userHeader, `Updated banner ID: ${id}`);

    if (!supabaseUrl.includes('your-supabase-project')) {
      const { data, error } = await supabase.from('banners').update(updateData).eq('id', id).select();
      if (error) throw error;
      return res.status(200).json(data[0]);
    }
    const idx = MOCK_BANNERS.findIndex(b => b.id === id);
    if (idx !== -1) {
      MOCK_BANNERS[idx] = { ...MOCK_BANNERS[idx], ...updateData };
      return res.status(200).json(MOCK_BANNERS[idx]);
    }
    res.status(404).json({ error: 'Banner not found' });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/banners/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userHeader = req.headers['x-admin-user'] || 'System';
    await logAction(userHeader, `Deleted banner ID: ${id}`);

    if (!supabaseUrl.includes('your-supabase-project')) {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ message: 'Banner deleted successfully' });
    }
    const idx = MOCK_BANNERS.findIndex(b => b.id === id);
    if (idx !== -1) {
      MOCK_BANNERS.splice(idx, 1);
      return res.status(200).json({ message: 'Banner deleted successfully' });
    }
    res.status(404).json({ error: 'Banner not found' });
  } catch (err) {
    next(err);
  }
});

// Contact Leads Submission
app.post('/api/contact', async (req, res, next) => {
  try {
    const { name, email, phone, category, budget, notes } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const leadId = `lead-${uuid.v4()}`;
    const newLead = {
      id: leadId,
      name: name || 'Anonymous Ticker Subscriber',
      email,
      phone: phone || 'N/A',
      category: category || 'General Inquiry',
      budget: budget || 'N/A',
      notes: notes || 'None',
      status: 'new',
      created_at: new Date().toISOString()
    };

    console.log(`\n================ [EMAIL NOTIFICATION] ================`);
    console.log(`To: support@aonedigital.in`);
    console.log(`Subject: New customer lead registered: ${newLead.name}`);
    console.log(`Body: ${notes}`);
    console.log(`======================================================\n`);

    if (!supabaseUrl.includes('your-supabase-project')) {
      const { error } = await supabase.from('leads').insert(newLead);
      if (error) throw error;
      return res.status(201).json({ status: 'success', message: 'Lead recorded' });
    }
    MOCK_LEADS.push(newLead);
    res.status(201).json({ status: 'success', message: 'Lead recorded' });
  } catch (err) {
    next(err);
  }
});

app.get('/api/leads', async (req, res, next) => {
  try {
    if (!supabaseUrl.includes('your-supabase-project')) {
      const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    res.status(200).json(MOCK_LEADS);
  } catch (err) {
    next(err);
  }
});

app.put('/api/leads/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body || {};
    const userHeader = req.headers['x-admin-user'] || 'System';
    await logAction(userHeader, `Updated lead status ID: ${id}`);

    if (!supabaseUrl.includes('your-supabase-project')) {
      const { data, error } = await supabase.from('leads').update(updateData).eq('id', id).select();
      if (error) throw error;
      return res.status(200).json(data[0]);
    }
    const idx = MOCK_LEADS.findIndex(l => l.id === id);
    if (idx !== -1) {
      MOCK_LEADS[idx] = { ...MOCK_LEADS[idx], ...updateData };
      return res.status(200).json(MOCK_LEADS[idx]);
    }
    res.status(404).json({ error: 'Lead not found' });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/leads/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userHeader = req.headers['x-admin-user'] || 'System';
    await logAction(userHeader, `Deleted lead ID: ${id}`);

    if (!supabaseUrl.includes('your-supabase-project')) {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ message: 'Lead deleted successfully' });
    }
    const idx = MOCK_LEADS.findIndex(l => l.id === id);
    if (idx !== -1) {
      MOCK_LEADS.splice(idx, 1);
      return res.status(200).json({ message: 'Lead deleted successfully' });
    }
    res.status(404).json({ error: 'Lead not found' });
  } catch (err) {
    next(err);
  }
});

// Media CRUD
app.get('/api/media', async (req, res, next) => {
  try {
    if (!supabaseUrl.includes('your-supabase-project')) {
      const { data, error } = await supabase.from('media').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    res.status(200).json(MOCK_MEDIA);
  } catch (err) {
    next(err);
  }
});

app.post('/api/media', async (req, res, next) => {
  try {
    const { name, url, size, file_type } = req.body || {};
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const newFile = {
      id: `media-${uuid.v4()}`,
      name: name || 'file',
      url,
      size: size || 'N/A',
      file_type: file_type || 'image/png',
      created_at: new Date().toISOString()
    };

    const userHeader = req.headers['x-admin-user'] || 'System';
    await logAction(userHeader, `Uploaded media asset: '${newFile.name}'`);

    if (!supabaseUrl.includes('your-supabase-project')) {
      const { data, error } = await supabase.from('media').insert(newFile).select();
      if (error) throw error;
      return res.status(201).json(data[0]);
    }
    MOCK_MEDIA.unshift(newFile);
    res.status(201).json(newFile);
  } catch (err) {
    next(err);
  }
});

app.post('/api/media/upload', async (req, res, next) => {
  try {
    const { file, name, type, bucket, folder } = req.body || {};
    if (!file || !bucket) {
      return res.status(400).json({ error: 'Missing file data or bucket name' });
    }

    const bucketName = bucket;
    const folderPath = folder || '';

    // Ensure bucket exists on-the-fly
    if (!supabaseUrl.includes('your-supabase-project')) {
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        const exists = (buckets || []).some(b => b.name === bucketName);
        if (!exists) {
          await supabase.storage.createBucket(bucketName, { public: true });
        }
      } catch (bucketErr) {
        console.error('Check/create bucket failed:', bucketErr.message || bucketErr);
      }
    }

    const fileExt = name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

    const fileBuffer = Buffer.from(file, 'base64');

    if (!supabaseUrl.includes('your-supabase-project')) {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, fileBuffer, {
          contentType: type || 'image/png',
          cacheControl: '3600',
          upsert: true
        });
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return res.status(200).json({ publicUrl });
    }

    res.status(200).json({ publicUrl: `https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80` });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/media/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userHeader = req.headers['x-admin-user'] || 'System';
    await logAction(userHeader, `Deleted media asset ID: ${id}`);

    if (!supabaseUrl.includes('your-supabase-project')) {
      const { error } = await supabase.from('media').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ message: 'Media asset deleted successfully' });
    }
    const idx = MOCK_MEDIA.findIndex(m => m.id === id);
    if (idx !== -1) {
      MOCK_MEDIA.splice(idx, 1);
      return res.status(200).json({ message: 'Media deleted successfully' });
    }
    res.status(404).json({ error: 'Media not found' });
  } catch (err) {
    next(err);
  }
});

// Users CRUD
app.get('/api/users', async (req, res, next) => {
  try {
    if (!supabaseUrl.includes('your-supabase-project')) {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    res.status(200).json(MOCK_USERS);
  } catch (err) {
    next(err);
  }
});

app.post('/api/users', async (req, res, next) => {
  try {
    const { username, role, email, status } = req.body || {};
    if (!username || !role) {
      return res.status(400).json({ error: 'Missing username or role' });
    }
    const newUser = {
      id: uuid.v4(),
      username,
      role,
      email: email || '',
      status: status || 'active',
      last_login: null
    };

    const userHeader = req.headers['x-admin-user'] || 'System';
    await logAction(userHeader, `Registered new user profile: '${username}'`);

    if (!supabaseUrl.includes('your-supabase-project')) {
      const { data, error } = await supabase.from('users').insert(newUser).select();
      if (error) throw error;
      return res.status(201).json(data[0]);
    }
    MOCK_USERS.unshift(newUser);
    res.status(201).json(newUser);
  } catch (err) {
    next(err);
  }
});

app.put('/api/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body || {};
    const userHeader = req.headers['x-admin-user'] || 'System';
    await logAction(userHeader, `Updated administrator profile ID: ${id}`);

    if (!supabaseUrl.includes('your-supabase-project')) {
      const { data, error } = await supabase.from('users').update(updateData).eq('id', id).select();
      if (error) throw error;
      return res.status(200).json(data[0]);
    }
    const idx = MOCK_USERS.findIndex(u => u.id === id);
    if (idx !== -1) {
      MOCK_USERS[idx] = { ...MOCK_USERS[idx], ...updateData };
      return res.status(200).json(MOCK_USERS[idx]);
    }
    res.status(404).json({ error: 'User not found' });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userHeader = req.headers['x-admin-user'] || 'System';
    await logAction(userHeader, `Removed administrator ID: ${id}`);

    if (!supabaseUrl.includes('your-supabase-project')) {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ message: 'User deleted' });
    }
    const idx = MOCK_USERS.findIndex(u => u.id === id);
    if (idx !== -1) {
      MOCK_USERS.splice(idx, 1);
      return res.status(200).json({ message: 'User deleted' });
    }
    res.status(404).json({ error: 'User not found' });
  } catch (err) {
    next(err);
  }
});

// Roles CRUD
app.get('/api/roles', async (req, res, next) => {
  try {
    if (!supabaseUrl.includes('your-supabase-project')) {
      const { data, error } = await supabase.from('roles').select('*');
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    res.status(200).json(MOCK_ROLES);
  } catch (err) {
    next(err);
  }
});

app.post('/api/roles', async (req, res, next) => {
  try {
    const { name, description, permissions } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Role name is required' });

    const newRole = {
      id: uuid.v4(),
      name,
      description: description || '',
      permissions: permissions || [],
      created_at: new Date().toISOString()
    };

    const userHeader = req.headers['x-admin-user'] || 'System';
    await logAction(userHeader, `Created security role: '${name}'`);

    if (!supabaseUrl.includes('your-supabase-project')) {
      const { data, error } = await supabase.from('roles').insert(newRole).select();
      if (error) throw error;
      return res.status(201).json(data[0]);
    }
    MOCK_ROLES.unshift(newRole);
    res.status(201).json(newRole);
  } catch (err) {
    next(err);
  }
});

app.put('/api/roles/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body || {};
    const userHeader = req.headers['x-admin-user'] || 'System';
    await logAction(userHeader, `Modified security role ID: ${id}`);

    if (!supabaseUrl.includes('your-supabase-project')) {
      const { data, error } = await supabase.from('roles').update(updateData).eq('id', id).select();
      if (error) throw error;
      return res.status(200).json(data[0]);
    }
    const idx = MOCK_ROLES.findIndex(r => r.id === id);
    if (idx !== -1) {
      MOCK_ROLES[idx] = { ...MOCK_ROLES[idx], ...updateData };
      return res.status(200).json(MOCK_ROLES[idx]);
    }
    res.status(404).json({ error: 'Role not found' });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/roles/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userHeader = req.headers['x-admin-user'] || 'System';
    await logAction(userHeader, `Deleted security role ID: ${id}`);

    if (!supabaseUrl.includes('your-supabase-project')) {
      const { data: roleData } = await supabase.from('roles').select('name').eq('id', id).single();
      if (roleData) {
        const { data: usersWithRole } = await supabase.from('users').select('id').eq('role', roleData.name);
        if (usersWithRole && usersWithRole.length > 0) {
          return res.status(400).json({ error: 'Cannot delete role because administrators are currently assigned to it.' });
        }
      }
      const { error } = await supabase.from('roles').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ message: 'Role deleted' });
    }

    const idx = MOCK_ROLES.findIndex(r => r.id === id);
    if (idx !== -1) {
      const roleName = MOCK_ROLES[idx].name;
      const assigned = MOCK_USERS.some(u => u.role === roleName);
      if (assigned) {
        return res.status(400).json({ error: 'Cannot delete role because administrators are currently assigned to it.' });
      }
      MOCK_ROLES.splice(idx, 1);
      return res.status(200).json({ message: 'Role deleted' });
    }
    res.status(404).json({ error: 'Role not found' });
  } catch (err) {
    next(err);
  }
});

// System Permissions & Audit Logs
app.get('/api/permissions', async (req, res, next) => {
  try {
    if (!supabaseUrl.includes('your-supabase-project')) {
      const { data, error } = await supabase.from('permissions').select('*');
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    res.status(200).json([]);
  } catch (err) {
    next(err);
  }
});

app.get('/api/audit-logs', async (req, res, next) => {
  try {
    if (!supabaseUrl.includes('your-supabase-project')) {
      const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    res.status(200).json(MOCK_AUDIT_LOGS);
  } catch (err) {
    next(err);
  }
});

// Dashboard Analytics Helper
app.get('/api/analytics', async (req, res, next) => {
  try {
    let totalProducts = 0;
    let featuredProducts = 0;
    let outOfStock = 0;
    let lowStock = 0;
    let totalLeads = 0;
    let activeBanners = 0;
    let recentLogs = [];

    if (!supabaseUrl.includes('your-supabase-project')) {
      const { data: prodData } = await supabase.from('products').select('stock, featured');
      const { data: leadsData } = await supabase.from('leads').select('id');
      const { data: bannerData } = await supabase.from('banners').select('id').eq('enabled', true);
      const { data: logsData } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(5);

      (prodData || []).forEach(p => {
        totalProducts++;
        if (p.featured) featuredProducts++;
        if (p.stock === 0) outOfStock++;
        else if (p.stock <= 10) lowStock++;
      });
      totalLeads = (leadsData || []).length;
      activeBanners = (bannerData || []).length;
      recentLogs = logsData || [];
    } else {
      totalProducts = MOCK_PRODUCTS.length;
      featuredProducts = MOCK_PRODUCTS.filter(p => p.featured).length;
      outOfStock = MOCK_PRODUCTS.filter(p => p.stock === 0).length;
      lowStock = MOCK_PRODUCTS.filter(p => p.stock > 0 && p.stock <= 10).length;
      totalLeads = MOCK_LEADS.length;
      activeBanners = MOCK_BANNERS.filter(b => b.enabled).length;
      recentLogs = MOCK_AUDIT_LOGS.slice(0, 5);
    }

    res.status(200).json({
      total_products: totalProducts,
      featured_products: featuredProducts,
      out_of_stock: outOfStock,
      low_stock: lowStock,
      total_leads: totalLeads,
      active_banners: activeBanners,
      audit_trail: recentLogs
    });
  } catch (err) {
    next(err);
  }
});

// Global Fallback Error Handler middleware
app.use((err, req, res, next) => {
  logException('backend', err.message || err, err.stack || '', {
    path: req.path,
    method: req.method
  });
  res.status(500).json({
    error: 'A server error occurred. Please contact the administrator.',
    status: 'error'
  });
});

module.exports = app;
