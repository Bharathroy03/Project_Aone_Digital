# Supabase PostgreSQL Database Setup Guide

This guide contains the SQL queries to set up the database tables in Supabase for the Mobile and Home Appliances eCommerce application.

To run these queries, navigate to your **Supabase Dashboard** -> **SQL Editor** -> **New Query**, paste the code below, and click **Run**.

---

## 1. SQL Schema Creation Script

```sql
-- Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('mobile', 'home_appliance')),
    brand TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    description TEXT,
    image_url TEXT,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    address TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders ON DELETE CASCADE,
    product_id UUID REFERENCES public.products ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Set Up Public Read Policies
CREATE POLICY "Allow public read access to products" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Allow users to read their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow users to read their own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL); -- Allow guest checkout access

CREATE POLICY "Allow public inserts for orders" ON public.orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public inserts for order items" ON public.order_items
    FOR INSERT WITH CHECK (true);

-- Enable profile creation trigger on User Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 2. Seed Data Script
Run this script in the SQL Editor to insert initial mobile phones and home appliances:

```sql
INSERT INTO public.products (name, category, brand, price, description, image_url, stock, specifications, featured)
VALUES
-- Mobiles
('iPhone 15 Pro Max', 'mobile', 'Apple', 139900.00, 'Experience Titanium finish, Action Button, A17 Pro Chip, and 5x Telephoto Zoom Camera.', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80', 25, '{"Storage": "256GB", "RAM": "8GB", "Display": "6.7 inch OLED", "Color": "Natural Titanium"}', true),
('Galaxy S24 Ultra', 'mobile', 'Samsung', 129900.00, 'Welcome to the era of mobile AI. Galaxy S24 Ultra with titanium frame, S Pen, and 200MP camera.', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80', 30, '{"Storage": "512GB", "RAM": "12GB", "Display": "6.8 inch AMOLED 120Hz", "Color": "Titanium Gray"}', true),
('Pixel 8 Pro', 'mobile', 'Google', 99999.00, 'The all-pro phone engineered by Google. It has the best of Google AI and a state-of-the-art camera.', 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80', 15, '{"Storage": "128GB", "RAM": "12GB", "Display": "6.7 inch Super Actua", "Color": "Bay Blue"}', false),

-- Home Appliances
('Smart French Door Refrigerator', 'home_appliance', 'Samsung', 189900.00, 'Keep foods fresh with adjustable temperatures, Family Hub screen, and integrated dual ice maker.', 'https://images.unsplash.com/photo-1571175432247-5c91a5a2371a?auto=format&fit=crop&w=600&q=80', 8, '{"Capacity": "28 cu. ft.", "Energy Rating": "5 Star", "Color": "Stainless Steel", "Smart Integration": "SmartThings"}', true),
('Front Load Smart Washer & Dryer Combo', 'home_appliance', 'LG', 74990.00, 'AI powered washing cycles and high efficiency smart steam drying in a single space-saving unit.', 'https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?auto=format&fit=crop&w=600&q=80', 12, '{"Capacity": "4.5 cu. ft.", "Connectivity": "WiFi ThinQ", "Color": "Graphite Steel"}', true),
('Cyclonic Robot Vacuum Cleaner', 'home_appliance', 'Dyson', 54900.00, 'Intelligent routing map navigation with heavy-duty cyclonic suction for premium deep cleaning.', 'https://images.unsplash.com/photo-1563161404-e5352c3c6f62?auto=format&fit=crop&w=600&q=80', 20, '{"Battery Life": "120 mins", "Bin Capacity": "0.5L", "Weight": "3.2 kg"}', false);
```
