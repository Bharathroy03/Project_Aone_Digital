from flask import Blueprint, request, jsonify
import uuid

api_bp = Blueprint("api", __name__)

import datetime

# Default Website Content Settings
DEFAULT_SETTINGS = {
    "announcement": {
        "enabled": True,
        "text": "Festive Upgrade Sale: Get up to 10% instant discount + No-Cost EMI up to 24 months!",
        "link": "#offers"
    },
    "hero": {
        "title": "Smart Tech.",
        "highlight": "Modern Living.",
        "subtitle": "Curated smartphones and premium smart appliances designed to elevate your home.",
        "cta1_text": "Explore Products",
        "cta1_link": "#products-section",
        "cta2_text": "Contact Us",
        "cta2_link": "#contact",
        "bg_image_url": "/images/hero-bg.png"
    },
    "about": {
        "title": "Redefining the Electronics Shopping Experience",
        "subtitle": "Certified premium retail destinations since 2012.",
        "description": "At Aone Digital, we bring you genuine global brands with expert support, flexible financing, and rapid home setups."
    },
    "footer": {
        "copyright": "© 2026 Aone Digital. All rights reserved.",
        "developed_by": "Designed & Developed by Bharath Kumar",
        "email": "support@aonedigital.in",
        "phone": "+91 7975774472",
        "whatsapp": "+91 8453036381",
        "address": "Luxury Square, Tech City",
        "admin_email": "bharath.kumar@aonedigital.in"
    },
    "theme": {
        "primary": "#f9f9ff",
        "onPrimary": "#141b2b",
        "secondary": "#002d62",
        "borderRadius": "24px",
        "darkMode": False
    },
    "seo": {
        "title": "Aone Digital India - Premium Phones & Home Appliances",
        "description": "Authorized premium smartphones, laptops, smart TVs and refrigerators with full warranty, fast shipping and easy EMI at Aone Digital.",
        "keywords": "mobiles, laptops, refrigerators, smart tv, no cost emi, Bangalore, electronics store"
    }
}

MOCK_LEADS = [
    {
        "id": "lead-1",
        "name": "Amit Sharma",
        "email": "amit.sharma@gmail.com",
        "phone": "+91 98765 43210",
        "category": "Smartphones",
        "budget": "₹30,000 - ₹70,000",
        "notes": "Interested in iPhone 15 Pro Max exchange offer. Wants Bajaj EMI.",
        "status": "new",
        "created_at": "2026-07-03T10:15:30Z"
    },
    {
        "id": "lead-2",
        "name": "Priyanka Sen",
        "email": "priyanka.s@yahoo.com",
        "phone": "+91 99112 23344",
        "category": "Home Appliances",
        "budget": "₹70,000 - ₹1,50,000",
        "notes": "Looking for Smart French Door Refrigerator. Scheduled demo for Saturday.",
        "status": "contacted",
        "created_at": "2026-07-02T14:30:12Z"
    },
    {
        "id": "lead-3",
        "name": "Vikram Rathore",
        "email": "vikram.rathore@outlook.com",
        "phone": "+91 88776 65544",
        "category": "Laptops",
        "budget": "₹1,50,000+",
        "notes": "Purchased MacBook Pro. Offer discount applied. Won.",
        "status": "won",
        "created_at": "2026-06-30T09:40:22Z"
    }
]

MOCK_MEDIA = [
    {
        "id": "media-1",
        "name": "logo.png",
        "url": "/images/logo.png",
        "size": "45 KB",
        "file_type": "image/png",
        "created_at": "2026-07-03T08:00:00Z"
    },
    {
        "id": "media-2",
        "name": "hero-bg.png",
        "url": "/images/hero-bg.png",
        "size": "890 KB",
        "file_type": "image/png",
        "created_at": "2026-07-03T08:05:00Z"
    },
    {
        "id": "media-3",
        "name": "Icon.png",
        "url": "/images/Icon.png",
        "size": "12 KB",
        "file_type": "image/png",
        "created_at": "2026-07-03T08:02:00Z"
    }
]

MOCK_USERS = [
    {
        "id": "user-1",
        "username": "Bharath",
        "role": "Super Admin",
        "email": "bharath.kumar@aonedigital.in"
    },
    {
        "id": "user-2",
        "username": "Ramesh",
        "role": "Store Manager",
        "email": "ramesh@aonedigital.in"
    },
    {
        "id": "user-3",
        "username": "Divya",
        "role": "Content Editor",
        "email": "divya@aonedigital.in"
    }
]

MOCK_AUDIT_LOGS = [
    {
        "id": "log-1",
        "user": "Bharath",
        "action": "Updated hero section headline to 'Smart Tech. Modern Living.'",
        "timestamp": "2026-07-03T13:40:00Z"
    },
    {
        "id": "log-2",
        "user": "Ramesh",
        "action": "Updated stock count of iPhone 15 Pro Max to 25 units",
        "timestamp": "2026-07-03T12:30:15Z"
    },
    {
        "id": "log-3",
        "user": "Divya",
        "action": "Added Dyson Cyclonic Robot Vacuum to catalog",
        "timestamp": "2026-07-03T11:15:42Z"
    }
]

# Fallback Mock Data in case Supabase is not yet configured or populated
MOCK_PRODUCTS = [
    {
        "id": "mock-iphone-15",
        "name": "iPhone 15 Pro Max",
        "category": "mobile",
        "brand": "Apple",
        "price": 139900.00,
        "description": "Experience Titanium finish, Action Button, A17 Pro Chip, and 5x Telephoto Zoom Camera.",
        "image_url": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80",
        "stock": 25,
        "specifications": {"Storage": "256GB", "RAM": "8GB", "Display": "6.7 inch OLED", "Color": "Natural Titanium"},
        "featured": True
    },
    {
        "id": "mock-s24-ultra",
        "name": "Galaxy S24 Ultra",
        "category": "mobile",
        "brand": "Samsung",
        "price": 129900.00,
        "description": "Welcome to the era of mobile AI. Galaxy S24 Ultra with titanium frame, S Pen, and 200MP camera.",
        "image_url": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80",
        "stock": 30,
        "specifications": {"Storage": "512GB", "RAM": "12GB", "Display": "6.8 inch AMOLED 120Hz", "Color": "Titanium Gray"},
        "featured": True
    },
    {
        "id": "mock-pixel-8",
        "name": "Pixel 8 Pro",
        "category": "mobile",
        "brand": "Google",
        "price": 99999.00,
        "description": "The all-pro phone engineered by Google. It has the best of Google AI and a state-of-the-art camera.",
        "image_url": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80",
        "stock": 15,
        "specifications": {"Storage": "128GB", "RAM": "12GB", "Display": "6.7 inch Super Actua", "Color": "Bay Blue"},
        "featured": False
    },
    {
        "id": "mock-fridge",
        "name": "Smart French Door Refrigerator",
        "category": "home_appliance",
        "brand": "Samsung",
        "price": 189900.00,
        "description": "Keep foods fresh with adjustable temperatures, Family Hub screen, and integrated dual ice maker.",
        "image_url": "https://images.unsplash.com/photo-1571175432247-5c91a5a2371a?auto=format&fit=crop&w=600&q=80",
        "stock": 8,
        "specifications": {"Capacity": "28 cu. ft.", "Energy Rating": "5 Star", "Color": "Stainless Steel", "Smart Integration": "SmartThings"},
        "featured": True
    },
    {
        "id": "mock-washer",
        "name": "Front Load Smart Washer & Dryer Combo",
        "category": "home_appliance",
        "brand": "LG",
        "price": 74990.00,
        "description": "AI powered washing cycles and high efficiency smart steam drying in a single space-saving unit.",
        "image_url": "https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?auto=format&fit=crop&w=600&q=80",
        "stock": 12,
        "specifications": {"Capacity": "4.5 cu. ft.", "Connectivity": "WiFi ThinQ", "Color": "Graphite Steel"},
        "featured": True
    },
    {
        "id": "mock-dyson",
        "name": "Cyclonic Robot Vacuum Cleaner",
        "category": "home_appliance",
        "brand": "Dyson",
        "price": 54900.00,
        "description": "Intelligent routing map navigation with heavy-duty cyclonic suction for premium deep cleaning.",
        "image_url": "https://images.unsplash.com/photo-1563161404-e5352c3c6f62?auto=format&fit=crop&w=600&q=80",
        "stock": 20,
        "specifications": {"Battery Life": "120 mins", "Bin Capacity": "0.5L", "Weight": "3.2 kg"},
        "featured": False
    }
]

@api_bp.route("/products", methods=["GET"])
def get_products():
    from app import supabase_client
    
    # Try fetching from Supabase if configured and URL contains valid placeholder changes
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            response = supabase_client.table("products").select("*").execute()
            if response.data:
                return jsonify(response.data), 200
        except Exception as e:
            # Silently log error and return mock data fallback
            print(f"Supabase fetch error: {e}")
            
    # Return mock data if Supabase isn't reachable/configured
    return jsonify(MOCK_PRODUCTS), 200

@api_bp.route("/products/<product_id>", methods=["GET"])
def get_product(product_id):
    from app import supabase_client
    
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            response = supabase_client.table("products").select("*").eq("id", product_id).execute()
            if response.data:
                return jsonify(response.data[0]), 200
        except Exception as e:
            print(f"Supabase fetch single error: {e}")
            
    # Fallback search in mock data
    product = next((p for p in MOCK_PRODUCTS if p["id"] == product_id), None)
    if product:
        return jsonify(product), 200
        
    return jsonify({"error": "Product not found"}), 404

@api_bp.route("/orders", methods=["POST"])
def create_order():
    from app import supabase_client
    data = request.json
    
    if not data:
        return jsonify({"error": "No order data provided"}), 400
        
    customer_name = data.get("customer_name")
    shipping_address = data.get("shipping_address")
    total_amount = data.get("total_amount")
    items = data.get("items", [])
    
    if not customer_name or not shipping_address or not total_amount or not items:
        return jsonify({"error": "Missing required fields"}), 400

    order_id = str(uuid.uuid4())
    
    # Try creating order in Supabase
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            order_data = {
                "id": order_id,
                "customer_name": customer_name,
                "shipping_address": shipping_address,
                "total_amount": total_amount,
                "status": "pending"
            }
            order_response = supabase_client.table("orders").insert(order_data).execute()
            
            # Insert items
            order_items_data = []
            for item in items:
                order_items_data.append({
                    "order_id": order_id,
                    "product_id": item.get("product_id"),
                    "quantity": item.get("quantity"),
                    "price": item.get("price")
                })
            if order_items_data:
                supabase_client.table("order_items").insert(order_items_data).execute()
                
            return jsonify({
                "message": "Order created successfully in Supabase",
                "order_id": order_id,
                "status": "success"
            }), 201
        except Exception as e:
            print(f"Supabase order creation error: {e}")
            # Flow falls through to mock successful order response if Supabase fails
            
    # Fallback successful response for local mock demonstration
    return jsonify({
        "message": "Order processed successfully (Local Mock Mode)",
        "order_id": order_id,
        "status": "success",
        "details": {
            "customer_name": customer_name,
            "total_amount": total_amount,
            "items_count": len(items)
        }
    }), 201

@api_bp.route("/contact", methods=["POST"])
def contact():
    data = request.json
    if not data or not data.get("email"):
        return jsonify({"error": "Email is required"}), 400
        
    new_lead = {
        "id": f"lead-{uuid.uuid4()}",
        "name": data.get("name") or "Anonymous Subscriber",
        "email": data.get("email"),
        "phone": data.get("phone") or "N/A",
        "category": data.get("category") or "Newsletter Signup",
        "budget": data.get("budget") or "N/A",
        "notes": "Submitted contact/lead request from storefront portal.",
        "status": "new",
        "created_at": datetime.datetime.utcnow().isoformat() + "Z"
    }
    MOCK_LEADS.insert(0, new_lead)
    
    return jsonify({
        "message": f"Thank you for reaching out! We will reply to {data.get('email')} soon.",
        "status": "success",
        "lead_id": new_lead["id"]
    }), 200

@api_bp.route("/products", methods=["POST"])
def add_product():
    from app import supabase_client
    data = request.json
    if not data or not data.get("name") or not data.get("price"):
        return jsonify({"error": "Missing name or price"}), 400
    
    new_product = {
        "id": data.get("id") or str(uuid.uuid4()),
        "name": data.get("name"),
        "category": data.get("category", "mobile"),
        "brand": data.get("brand", "Generic"),
        "price": float(data.get("price")),
        "description": data.get("description", ""),
        "image_url": data.get("image_url", ""),
        "stock": int(data.get("stock", 10)),
        "specifications": data.get("specifications", {}),
        "featured": bool(data.get("featured", False))
    }

    # Add audit log entry
    user_header = request.headers.get("X-Admin-User", "System")
    MOCK_AUDIT_LOGS.insert(0, {
        "id": f"log-{uuid.uuid4()}",
        "user": user_header,
        "action": f"Added product: '{new_product['name']}' to catalog",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
    })

    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            response = supabase_client.table("products").insert(new_product).execute()
            if response.data:
                return jsonify(response.data[0]), 201
        except Exception as e:
            print(f"Supabase insert error: {e}")

    # Fallback to local session update
    MOCK_PRODUCTS.append(new_product)
    return jsonify(new_product), 201

@api_bp.route("/products/<product_id>", methods=["PUT"])
def update_product(product_id):
    from app import supabase_client
    data = request.json
    if not data:
        return jsonify({"error": "No update data provided"}), 400
    
    # Add audit log entry
    user_header = request.headers.get("X-Admin-User", "System")
    MOCK_AUDIT_LOGS.insert(0, {
        "id": f"log-{uuid.uuid4()}",
        "user": user_header,
        "action": f"Updated catalog item: ID {product_id}",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
    })

    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            response = supabase_client.table("products").update(data).eq("id", product_id).execute()
            if response.data:
                return jsonify(response.data[0]), 200
        except Exception as e:
            print(f"Supabase update error: {e}")

    # Fallback to local session update
    product = next((p for p in MOCK_PRODUCTS if p["id"] == product_id), None)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    
    for key, value in data.items():
        if key != "id":
            if key == "price":
                product[key] = float(value)
            elif key == "stock":
                product[key] = int(value)
            else:
                product[key] = value
    return jsonify(product), 200

@api_bp.route("/products/<product_id>", methods=["DELETE"])
def delete_product(product_id):
    from app import supabase_client
    
    # Add audit log entry
    user_header = request.headers.get("X-Admin-User", "System")
    MOCK_AUDIT_LOGS.insert(0, {
        "id": f"log-{uuid.uuid4()}",
        "user": user_header,
        "action": f"Deleted catalog item: ID {product_id}",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
    })

    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            supabase_client.table("products").delete().eq("id", product_id).execute()
            return jsonify({"message": "Product deleted successfully", "status": "success"}), 200
        except Exception as e:
            print(f"Supabase delete error: {e}")

    # Fallback to local session update
    global MOCK_PRODUCTS
    product = next((p for p in MOCK_PRODUCTS if p["id"] == product_id), None)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    MOCK_PRODUCTS.remove(product)
    return jsonify({"message": "Product deleted successfully", "status": "success"}), 200

# --- CMS Settings Endpoints ---
@api_bp.route("/settings", methods=["GET"])
def get_settings():
    from app import supabase_client
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            response = supabase_client.table("website_settings").select("*").execute()
            if response.data:
                # Merge DB settings dynamically
                db_settings = response.data[0].get("config", {})
                return jsonify(db_settings), 200
        except Exception as e:
            print(f"Supabase settings fetch error: {e}")
    return jsonify(DEFAULT_SETTINGS), 200

@api_bp.route("/settings", methods=["PUT"])
def update_settings():
    from app import supabase_client
    data = request.json
    if not data:
        return jsonify({"error": "No settings data provided"}), 400
    
    user_header = request.headers.get("X-Admin-User", "System")
    MOCK_AUDIT_LOGS.insert(0, {
        "id": f"log-{uuid.uuid4()}",
        "user": user_header,
        "action": f"Updated website configuration settings",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
    })

    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            supabase_client.table("website_settings").upsert({"id": 1, "config": data}).execute()
            return jsonify({"message": "Settings updated successfully", "status": "success"}), 200
        except Exception as e:
            print(f"Supabase settings update error: {e}")

    global DEFAULT_SETTINGS
    DEFAULT_SETTINGS.update(data)
    return jsonify({"message": "Settings updated locally", "status": "success", "settings": DEFAULT_SETTINGS}), 200

# --- CMS Leads Endpoints ---
@api_bp.route("/leads", methods=["GET"])
def get_leads():
    from app import supabase_client
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            response = supabase_client.table("leads").select("*").order("created_at", desc=True).execute()
            if response.data:
                return jsonify(response.data), 200
        except Exception as e:
            print(f"Supabase leads fetch error: {e}")
    return jsonify(MOCK_LEADS), 200

@api_bp.route("/leads/<lead_id>", methods=["PUT"])
def update_lead(lead_id):
    from app import supabase_client
    data = request.json
    if not data:
        return jsonify({"error": "No update data provided"}), 400
    
    user_header = request.headers.get("X-Admin-User", "System")
    MOCK_AUDIT_LOGS.insert(0, {
        "id": f"log-{uuid.uuid4()}",
        "user": user_header,
        "action": f"Updated lead status/notes for ID: {lead_id}",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
    })

    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            response = supabase_client.table("leads").update(data).eq("id", lead_id).execute()
            if response.data:
                return jsonify(response.data[0]), 200
        except Exception as e:
            print(f"Supabase lead update error: {e}")

    lead = next((l for l in MOCK_LEADS if l["id"] == lead_id), None)
    if not lead:
        return jsonify({"error": "Lead not found"}), 404
    
    for key, value in data.items():
        if key != "id":
            lead[key] = value
    return jsonify(lead), 200

@api_bp.route("/leads/<lead_id>", methods=["DELETE"])
def delete_lead(lead_id):
    from app import supabase_client
    user_header = request.headers.get("X-Admin-User", "System")
    MOCK_AUDIT_LOGS.insert(0, {
        "id": f"log-{uuid.uuid4()}",
        "user": user_header,
        "action": f"Deleted lead entry ID: {lead_id}",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
    })

    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            supabase_client.table("leads").delete().eq("id", lead_id).execute()
            return jsonify({"message": "Lead deleted successfully", "status": "success"}), 200
        except Exception as e:
            print(f"Supabase lead deletion error: {e}")

    lead = next((l for l in MOCK_LEADS if l["id"] == lead_id), None)
    if not lead:
        return jsonify({"error": "Lead not found"}), 404
    MOCK_LEADS.remove(lead)
    return jsonify({"message": "Lead deleted successfully", "status": "success"}), 200

# --- Media Library Endpoints ---
@api_bp.route("/media", methods=["GET"])
def get_media():
    return jsonify(MOCK_MEDIA), 200

@api_bp.route("/media/upload", methods=["POST"])
def upload_media():
    data = request.json
    if not data or not data.get("name"):
        return jsonify({"error": "Name is required"}), 400
    
    new_file = {
        "id": f"media-{uuid.uuid4()}",
        "name": data.get("name"),
        "url": data.get("url") or "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80",
        "size": data.get("size") or "120 KB",
        "file_type": data.get("file_type") or "image/png",
        "created_at": datetime.datetime.utcnow().isoformat() + "Z"
    }
    MOCK_MEDIA.insert(0, new_file)
    return jsonify(new_file), 201

@api_bp.route("/media/<media_id>", methods=["DELETE"])
def delete_media(media_id):
    media = next((m for m in MOCK_MEDIA if m["id"] == media_id), None)
    if not media:
        return jsonify({"error": "Media file not found"}), 404
    MOCK_MEDIA.remove(media)
    return jsonify({"message": "Media file removed", "status": "success"}), 200

# --- Users Endpoints ---
@api_bp.route("/users", methods=["GET"])
def get_users():
    return jsonify(MOCK_USERS), 200

@api_bp.route("/users", methods=["POST"])
def create_user():
    data = request.json
    if not data or not data.get("username") or not data.get("role"):
        return jsonify({"error": "Username and role are required"}), 400
    
    new_user = {
        "id": f"user-{uuid.uuid4()}",
        "username": data.get("username"),
        "role": data.get("role"),
        "email": data.get("email") or f"{data.get('username').lower()}@aonedigital.in"
    }
    MOCK_USERS.append(new_user)
    return jsonify(new_user), 201

@api_bp.route("/users/<user_id>", methods=["PUT"])
def update_user(user_id):
    data = request.json
    user = next((u for u in MOCK_USERS if u["id"] == user_id), None)
    if not user:
        return jsonify({"error": "User not found"}), 404
    for key, val in data.items():
        if key != "id":
            user[key] = val
    return jsonify(user), 200

@api_bp.route("/users/<user_id>", methods=["DELETE"])
def delete_user(user_id):
    user = next((u for u in MOCK_USERS if u["id"] == user_id), None)
    if not user:
        return jsonify({"error": "User not found"}), 404
    MOCK_USERS.remove(user)
    return jsonify({"message": "User deleted successfully"}), 200

# --- Audit Logs ---
@api_bp.route("/audit-logs", methods=["GET"])
def get_audit_logs():
    return jsonify(MOCK_AUDIT_LOGS), 200

# --- Analytics ---
@api_bp.route("/analytics", methods=["GET"])
def get_analytics():
    total_stock = sum(p.get("stock", 0) for p in MOCK_PRODUCTS)
    featured_count = sum(1 for p in MOCK_PRODUCTS if p.get("featured"))
    
    analytics_data = {
        "visitors": 12450,
        "views": 4820,
        "leads_count": len(MOCK_LEADS),
        "total_stock": total_stock,
        "featured_count": featured_count,
        "recent_logs": MOCK_AUDIT_LOGS[:5]
    }
    return jsonify(analytics_data), 200
