# Web Application Requirements: eCommerce for Mobiles & Home Appliances

This document defines the product requirements, system architecture, database design, and folder structure for the eCommerce platform.

---

## 1. Product Scope & Objectives
The goal of this project is to build a modern, high-performance, and visually stunning eCommerce web application dedicated to selling Mobiles and Home Appliances. The platform features an interactive catalog, dynamic cart system, custom glassmorphic aesthetics, and seamless integration with a backend and relational database.

### Core Features
- **Landing & Discovery:** Hero section with CTA, category showcase, and trending products.
- **Dynamic Catalog:** Filtering by category (Mobile/Home Appliances), brand, price range, and search.
- **Product Details:** High-quality image showcase, features breakdown, specs, and price/stock indicator.
- **Shopping Cart Drawer:** Sliding drawer side-panel showing total items, prices, and quantities.
- **Simulated Checkout:** Shipping address form, order review, payment mock, and confirmation.
- **Admin Panel Mock:** Interface for adding and updating products (synced with Supabase).

---

## 2. Technology Stack

### Frontend
- **Framework:** ReactJS (bootstrapped with Vite)
- **Styling:** CSS3 (Premium custom style sheets - styling tokens, variable colors, dark mode support, custom animations)
- **Icons:** Lucide-React
- **Database Client:** `@supabase/supabase-js`

### Backend
- **Framework:** Python Flask
- **Extension:** Flask-CORS (Cross-Origin Resource Sharing)
- **Client:** `supabase` Python library
- **Environment Management:** `python-dotenv`

### Database
- **Provider:** Supabase (Relational PostgreSQL)

---

## 3. Visual Assets Location
To ensure a clean and professional appearance, place all required visual assets in the paths below:

1. **Logo Image:**
   - **Path:** `frontend/public/images/logo.png`
   - **Specification:** Transparent background PNG, ideally landscape format, recommended size $250 \times 80$ px.
2. **Hero Banner Background Image:**
   - **Path:** `frontend/public/images/hero-bg.jpg`
   - **Specification:** High-resolution JPG (e.g., $1920 \times 1080$ px) featuring clean workspace/appliances.

---

## 4. Database Schema Design (Supabase PostgreSQL)

### `profiles` (Users)
Stores user authentication details and shipping profiles.
- `id` (uuid, primary key, references auth.users)
- `email` (text)
- `full_name` (text)
- `address` (text)
- `phone` (text)
- `created_at` (timestamp)

### `products`
Stores appliance and mobile listings.
- `id` (uuid, primary key)
- `name` (text)
- `category` (text) — `'mobile'` or `'home_appliance'`
- `brand` (text)
- `price` (numeric)
- `description` (text)
- `image_url` (text)
- `stock` (integer)
- `specifications` (jsonb) — key-value specifications (e.g. `{"RAM": "8GB", "Storage": "256GB"}`)
- `featured` (boolean)
- `created_at` (timestamp)

### `orders`
Stores order headers.
- `id` (uuid, primary key)
- `user_id` (uuid, nullable, references auth.users)
- `customer_name` (text)
- `shipping_address` (text)
- `total_amount` (numeric)
- `status` (text) — `'pending'`, `'processing'`, `'shipped'`, `'delivered'`
- `created_at` (timestamp)

### `order_items`
Stores products within each order.
- `id` (uuid, primary key)
- `order_id` (uuid, references orders)
- `product_id` (uuid, references products)
- `quantity` (integer)
- `price` (numeric)

---

## 5. Directory & Folder Structure

```
Project_Aone_Digital/
├── docs/                               # System and requirements documentation
│   ├── web_application_requirements.md # This document
│   └── supabase_setup.md               # Database schema instructions
├── backend/                            # Flask API service
│   ├── app/
│   │   ├── __init__.py                 # Flask App Factory
│   │   └── routes.py                   # API routes for checkout & products
│   ├── config.py                       # Configuration environments
│   ├── requirements.txt                # Python backend dependencies
│   └── run.py                          # Startup server script
└── frontend/                           # React frontend
    ├── public/
    │   └── images/                     # Asset folder for logo.png & hero-bg.jpg
    ├── src/
    │   ├── components/                 # UI components
    │   │   ├── Header.jsx              # Navigation and Logo
    │   │   ├── Hero.jsx                # Landing hero layout
    │   │   ├── ProductCard.jsx         # Individual catalog product
    │   │   └── CartDrawer.jsx          # Shopping cart panel
    │   ├── App.jsx                     # Application state and pages
    │   ├── index.css                   # Main stylesheets & global tokens
    │   ├── main.jsx                    # Vite index bootstrap
    │   └── supabaseClient.js           # Supabase connection service
    ├── index.html                      # DOM Entry Point
    ├── package.json                    # Node dependencies configuration
    └── vite.config.js                  # Vite configuration settings
```
