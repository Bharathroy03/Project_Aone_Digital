from flask import Blueprint, request, jsonify
import uuid
import datetime
import traceback

api_bp = Blueprint("api", __name__)

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
        "bg_image_url": "/images/hero-bg.png",
        "logo_url": "/images/logo.png",
        "favicon_url": "/images/Icon.png",
        "logo_height": 48
    },
    "ticker": {
        "enabled": True,
        "speed": "normal",
        "items": [
            "🔥 Festive Sale — Up to 40% OFF on all Smartphones",
            "💳 No-Cost EMI available on orders above ₹10,000",
            "📦 Free Home Delivery on all orders above ₹5,000",
            "🎁 Exchange your old device — Get up to ₹15,000 extra value",
            "⚡ Apple, Samsung, Sony — Authorized Premium Retailer",
            "🛡️ 100% Genuine products with full manufacturer warranty",
            "🚀 Same-day delivery available in select cities"
        ]
    },
    "brands": [
        {"slug": "apple", "name": "Apple", "bg": "#F2F2F2", "iconColor": "1a1a1a"},
        {"slug": "samsung", "name": "Samsung", "bg": "#E8EDFF", "iconColor": "1428A0"},
        {"slug": "sony", "name": "Sony", "bg": "#F0F0F0", "iconColor": "000000"},
        {"slug": "lg", "name": "LG", "bg": "#FFF0F3", "iconColor": "A50034"},
        {"slug": "vivo", "name": "Vivo", "bg": "#EEF0FF", "iconColor": "415FFF"},
        {"slug": "whirlpool", "name": "Whirlpool", "bg": "#EAF0FF", "iconColor": "003087"},
        {"slug": "dyson", "name": "Dyson", "bg": "#FFF0F0", "iconColor": "C41230"},
        {"slug": "oneplus", "name": "OnePlus", "bg": "#FFF1F1", "iconColor": "F5010C"},
        {"slug": "xiaomi", "name": "Xiaomi", "bg": "#FFF5EC", "iconColor": "FF6900"},
        {"slug": "bosch", "name": "Bosch", "bg": "#EAF5FF", "iconColor": "007BC0"}
    ],
    "about": {
        "title": "Redefining the Electronics Shopping Experience",
        "subtitle": "Certified premium retail destinations since 2012.",
        "description": "At Aone Digital, we bring you genuine global brands with expert support, flexible financing, and rapid home setups."
    },
    "categories": [
        {
            "title": "Smartphones",
            "emoji": "📱",
            "filterKey": "smart_phone",
            "brands": ["Apple", "Samsung", "Vivo", "OnePlus", "Xiaomi", "Realme"]
        },
        {
            "title": "Smart TVs",
            "emoji": "📺",
            "filterKey": "tv",
            "brands": ["Samsung", "LG", "Sony", "Mi", "OnePlus", "TCL"]
        },
        {
            "title": "Laptops",
            "emoji": "💻",
            "filterKey": "laptop",
            "brands": ["Apple", "Dell", "HP", "Asus", "Lenovo", "Acer"]
        },
        {
            "title": "Refrigerators",
            "emoji": "❄️",
            "filterKey": "refrigerator",
            "brands": ["Samsung", "LG", "Whirlpool", "Haier", "Godrej"]
        },
        {
            "title": "Washing Machines",
            "emoji": "🫧",
            "filterKey": "washing_machine",
            "brands": ["Samsung", "LG", "Whirlpool", "IFB", "Bosch"]
        },
        {
            "title": "Air Conditioners",
            "emoji": "🌬️",
            "filterKey": "air_conditioner",
            "brands": ["Daikin", "Voltas", "LG", "Samsung", "Blue Star"]
        },
        {
            "title": "Kitchen Appliances",
            "emoji": "🍳",
            "filterKey": "home_appliance",
            "brands": ["Bosch", "Philips", "Morphy Richards", "Prestige"]
        }
    ],
    "footer": {
        "copyright": "© 2026 Aone Digital. All rights reserved.",
        "website_url": "https://aonedigital.in",
        "developed_by": "Designed & Developed by Bharath Kumar",
        "description": "Experience the future of retail with India's most trusted premium electronics destination.",
        "email": "support@aonedigital.in",
        "phone": "7975774472",
        "whatsapp": "8453036381",
        "address": "Luxury Square, Tech City",
        "admin_email": "bharath.kumar@hreeem.com"
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
    },
    "offers_section_title": "Exclusive Retail Offers",
    "offers_section_subtitle": "Maximum benefits on every purchase you make at Aone Digital.",
    "offers": [
        { "icon": "credit_card", "title": "No Cost EMI", "desc": "Pay over 6-24 months with absolutely 0% interest on major credit cards." },
        { "icon": "currency_exchange", "title": "Exchange Bonus", "desc": "Get up to ₹15,000 extra value when you trade in your old devices." },
        { "icon": "payments", "title": "Instant Cashback", "desc": "Avail up to 10% instant discount on HDFC, ICICI, and SBI bank cards." },
        { "icon": "school", "title": "Student Offers", "desc": "Extra 5% discount for students on Laptops and Tablets with valid ID." }
    ],
    "featured_ads": {
        "layout": "grid",
        "items_per_row": 3,
        "enable_sidebar_ad": True,
        "sidebar_ad_title": "Partner Showcase",
        "sidebar_ad_subtitle": "Advertise your brand here to reach thousands of technology buyers.",
        "sidebar_ad_image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=60",
        "sidebar_ad_link": "",
        "sidebar_ad_cta": "Advertise With Us"
    },
    "gallery": [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDxBLMCShIxYItLtVpAx1-LoZjmeTkB6bIAyLfC5f_c619Ivt5O5IlEEvKDifOBEIa6VidmgDRf_Enw4ezJZooKPXQwaR4_HkVZ7-RlwoC4uWdnqH2y8n2dFwKHsgeuGPiuHghRcQyoneG3W2iR8sAb3Kr10kmc86qQEjHt0pPrjpkrfkrGEyLZOElGO1CEFkX1PmL5bjHfoznLEHm51feeP_eSG-dUhkwnjft-QYIg__ixCUEhI8Hd",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCtwS_J52DBOarBMyyvacqSs9g8Voz-XeXVExcSqfmQiCo_NKS7_zCGSbS9DQi7ZWrcOf-M7h0EcatwizoV7Y1qmQ6MBmve527Y3oiehudH91X7xBDr7m7jfF6mX0MQQUrwPw879PE963P6ObNziJkFf9-Z5QLkOvajElEKuxptZPmuC1MNLKkFg0j1Gf0GjOslt0-pNlhsmQXqSKm1OnsERnU2M4hYyANas8XhAc9WHY57GKj0rH1p",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAa20rU_vwxaI5CpLSblrqlPSxke6ZbCzQV9Rw0vY4ojFwLhfLX6JtBIfzkm36EnXSJqbTdoSabw361IuJ64qPENfUVcAZsv3sU_mpw77wknLGOKuThCre2ABc_t9lEO6I0m9CA_xbneoFeCtnhTKSXDMCdM7rZqww9cccoP2fpvfSndFqewvi-gHo4bLi_lEEKN3M5VNTBK8v-xFBJv3s0u7Ha79XesHmuQF0JvjWEd86rUVAbq7mj",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC0B78xKWopY8aq-sqkFJU-jOeMmKFFam9XEPlU3pTlx3di19VkUwyOLhI8BEDEdx3NBkOkUkIQjgRL2-k1KUXNgztL2rxoNrLE-LK0BvmlHgrz_-YvCEkezizgjNsjiqxZVV9Zt7GQdDRC6X4qU_qQvR__SiMbK5SRM_qJnOx3Wm2colNNtzJOdRsewKPfBSOTCCWXH4gOnrZ7k47nGTqhPvEFaVRyMarO86MNNwZC98xu-6E-83Bd"
    ],
    "testimonials": [
        { "name": "Rajesh Kumar", "role": "Verified Buyer", "initial": "RK", "comment": "\"Bought my new S24 Ultra and an OLED TV from Aone Digital. The financing was smooth and the delivery was same-day. Truly a world-class experience.\"" },
        { "name": "Sneha Patel", "role": "Homeowner", "initial": "SP", "comment": "\"The best place for home appliances. Aone Digital helped me choose the right AC for my living room and the installation was very professional.\"" },
        { "name": "Aryan Mehta", "role": "Student", "initial": "AM", "comment": "\"Aryan Digital is my go-to for Apple products. Authentic stock, great student discounts, and excellent after-sales support.\"" }
    ],
    "faqs": [
        { "q": "What documents are needed for No-Cost EMI?", "a": "For credit card EMI, no documents are needed. For paper-based finance (Bajaj Finserv/HDFC), you will need your Aadhaar card, PAN card, and a cancelled cheque." },
        { "q": "How long does the delivery and installation take?", "a": "Standard delivery from Aone Digital is within 24 hours for in-stock products. Professional installation for appliances is scheduled within 48 hours of delivery." }
    ]
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
        "email": "bharath.kumar@hreeem.com",
        "status": "active",
        "last_login": "2026-07-04T10:24:47Z"
    },
    {
        "id": "user-2",
        "username": "Ramesh",
        "role": "Store Manager",
        "email": "ramesh@aonedigital.in",
        "status": "active",
        "last_login": "2026-07-04T09:12:05Z"
    },
    {
        "id": "user-3",
        "username": "Divya",
        "role": "Content Editor",
        "email": "divya@aonedigital.in",
        "status": "inactive",
        "last_login": "2026-07-03T16:04:44Z"
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

def log_action(user, action):
    from app import supabase_client
    new_log = {
        "id": f"log-{uuid.uuid4()}",
        "user_name": user or "Admin",
        "action": action,
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
    }
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            supabase_client.table("audit_logs").insert(new_log).execute()
            return
        except Exception as e:
            print(f"Supabase log action error: {e}")
    
    fallback_log = {
        "id": new_log["id"],
        "user": new_log["user_name"],
        "action": new_log["action"],
        "timestamp": new_log["timestamp"]
    }
    MOCK_AUDIT_LOGS.insert(0, fallback_log)


MOCK_ERROR_LOGS = []

def log_exception(source, message, stack_trace=None, context=None):
    from app import supabase_client
    new_err = {
        "id": f"err-{uuid.uuid4()}",
        "source": source,
        "message": str(message),
        "stack_trace": str(stack_trace or ""),
        "context": context or {},
        "created_at": datetime.datetime.utcnow().isoformat() + "Z"
    }
    
    # Print to console securely
    print(f"[{source.upper()} ERROR] {message}\nContext: {context}")
    
    # Sync to Supabase logs table
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            supabase_client.table("error_logs").insert(new_err).execute()
            return
        except Exception as e:
            print(f"Supabase write error log failure: {e}")
            
    MOCK_ERROR_LOGS.insert(0, new_err)

@api_bp.route("/error-logs", methods=["POST"])
def write_frontend_error_log():
    data = request.json or {}
    message = data.get("message", "Unknown frontend error")
    stack_trace = data.get("stack_trace", "")
    context = data.get("context", {})
    
    log_exception("frontend", message, stack_trace, context)
    return jsonify({"status": "success", "message": "Frontend error logged"}), 201

@api_bp.errorhandler(Exception)
def handle_backend_exception(e):
    log_exception("backend", str(e), traceback.format_exc(), {
        "path": request.path,
        "method": request.method
    })
    response = jsonify({
        "error": "A server error occurred. Please contact the administrator.",
        "status": "error"
    })
    response.status_code = 500
    return response


# Fallback Mock Data in case Supabase is not yet configured or populated
MOCK_PRODUCTS = []

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

# --- Global Mock Orders Database ---
MOCK_ORDERS = [
    {
        "id": "order-1",
        "customer_name": "Rohan Deshmukh",
        "shipping_address": "Flat 402, Elite Heights, Mumbai, Maharashtra - 400001",
        "phone": "9876543210",
        "email": "rohan.deshmukh@gmail.com",
        "total_amount": 149900.0,
        "status": "pending",
        "created_at": "2026-07-04T09:12:00Z",
        "items": [
            {"product_id": "prod-1", "product_name": "iPhone 15 Pro Max", "quantity": 1, "price": 149900.0}
        ]
    },
    {
        "id": "order-2",
        "customer_name": "Karan Johar",
        "shipping_address": "Villa 12, Palm Meadows, Bangalore, Karnataka - 560066",
        "phone": "8877665544",
        "email": "karan@dharmaprod.com",
        "total_amount": 89900.0,
        "status": "completed",
        "created_at": "2026-07-03T18:24:00Z",
        "items": [
            {"product_id": "prod-2", "product_name": "Sony Bravia XR 65\" 4K OLED", "quantity": 1, "price": 89900.0}
        ]
    }
]

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
    phone = data.get("phone", "N/A")
    email = data.get("email", "N/A")
    
    if not customer_name or not shipping_address or not total_amount or not items:
        return jsonify({"error": "Missing required fields"}), 400

    order_id = str(uuid.uuid4())
    
    # Save locally to dynamic mock database
    new_order = {
        "id": order_id,
        "customer_name": customer_name,
        "shipping_address": shipping_address,
        "phone": phone,
        "email": email,
        "total_amount": float(total_amount),
        "status": "pending",
        "created_at": datetime.datetime.utcnow().isoformat() + "Z",
        "items": [
            {
                "product_id": item.get("product_id"),
                "product_name": item.get("name", "Product"),
                "quantity": int(item.get("quantity", 1)),
                "price": float(item.get("price", 0.0))
            } for item in items
        ]
    }
    MOCK_ORDERS.insert(0, new_order)

    # Print email simulation in stdout terminal logs
    admin_email = DEFAULT_SETTINGS["footer"].get("admin_email", "bharath.kumar@hreeem.com")
    support_email = DEFAULT_SETTINGS["footer"].get("email", "support@aonedigital.in")
    print(f"\n================ [EMAIL NOTIFICATION] ================")
    print(f"To: {support_email}, {admin_email}")
    print(f"Subject: Aone Digital — New Order Placed #{order_id[:8].upper()}")
    print(f"Body:\nHello Administrator,\n\nA new customer order has been registered on Aone Digital.")
    print(f"Customer Details:\n- Name: {customer_name}\n- Contact Phone: {phone}\n- Contact Email: {email}\n- Shipping Address: {shipping_address}")
    print(f"Summary:\n- Total Amount: INR {float(total_amount):,.2f}\n- Total Unique Items: {len(items)}")
    print(f"\nPlease log in to the CMS Dashboard at /admin to manage shipment details.\n======================================================\n")

    # Record in audit trail logs
    log_action("System", f"Dispatched new order placed email notification to {admin_email} for Order ID: {order_id[:8].upper()}")

    # Try creating order in Supabase
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            order_data = {
                "id": order_id,
                "customer_name": customer_name,
                "shipping_address": shipping_address,
                "phone": phone,
                "email": email,
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
                "message": "Order created successfully in Supabase & local DB",
                "order_id": order_id,
                "status": "success"
            }), 201
        except Exception as e:
            print(f"Supabase order creation error: {e}")
            
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

@api_bp.route("/orders", methods=["GET"])
def get_orders():
    # Return Supabase orders if supabase client is active
    from app import supabase_client
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            response = supabase_client.table("orders").select("*").order("created_at", desc=True).execute()
            if response.data:
                return jsonify(response.data), 200
        except Exception as e:
            print(f"Supabase fetch orders error: {e}")
    return jsonify(MOCK_ORDERS), 200

@api_bp.route("/orders/<order_id>", methods=["PUT"])
def update_order(order_id):
    from app import supabase_client
    data = request.json
    if not data or not data.get("status"):
        return jsonify({"error": "Status is required"}), 400
        
    status = data.get("status")
    
    # Audit log
    user_header = request.headers.get("X-Admin-User", "System")
    log_action(user_header, f"Updated status of Order ID: {order_id[:8].upper()} to '{status}'")

    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            supabase_client.table("orders").update({"status": status}).eq("id", order_id).execute()
            return jsonify({"message": "Order status updated in Supabase", "status": "success"}), 200
        except Exception as e:
            print(f"Supabase order update error: {e}")
            
    order = next((o for o in MOCK_ORDERS if o["id"] == order_id), None)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    order["status"] = status
    return jsonify({"message": "Order status updated locally", "status": "success", "order": order}), 200

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

    from app import supabase_client
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            supabase_client.table("leads").insert(new_lead).execute()
        except Exception as e:
            print(f"Supabase lead insertion error: {e}")
    
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
    log_action(user_header, f"Added product: '{new_product['name']}' to catalog")

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
    log_action(user_header, f"Updated catalog item: ID {product_id}")

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
    log_action(user_header, f"Deleted catalog item: ID {product_id}")

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
    log_action(user_header, "Updated website configuration settings")

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
    log_action(user_header, f"Updated lead status/notes for ID: {lead_id}")

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
    log_action(user_header, f"Deleted lead entry ID: {lead_id}")

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
    from app import supabase_client
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            response = supabase_client.table("media").select("*").order("created_at", desc=True).execute()
            return jsonify(response.data), 200
        except Exception as e:
            print(f"Supabase fetch media error: {e}")
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

    from app import supabase_client
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            supabase_client.table("media").insert(new_file).execute()
            return jsonify(new_file), 201
        except Exception as e:
            print(f"Supabase upload media error: {e}")

    MOCK_MEDIA.insert(0, new_file)
    return jsonify(new_file), 201

@api_bp.route("/media/<media_id>", methods=["DELETE"])
def delete_media(media_id):
    from app import supabase_client
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            supabase_client.table("media").delete().eq("id", media_id).execute()
            return jsonify({"message": "Media file removed", "status": "success"}), 200
        except Exception as e:
            print(f"Supabase delete media error: {e}")

    media = next((m for m in MOCK_MEDIA if m["id"] == media_id), None)
    if not media:
        return jsonify({"error": "Media file not found"}), 404
    MOCK_MEDIA.remove(media)
    return jsonify({"message": "Media file removed", "status": "success"}), 200

# --- Users Endpoints ---
@api_bp.route("/users", methods=["GET"])
def get_users():
    from app import supabase_client
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            response = supabase_client.table("users").select("*").execute()
            return jsonify(response.data), 200
        except Exception as e:
            print(f"Supabase fetch users error: {e}")
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
        "email": data.get("email") or f"{data.get('username').lower()}@aonedigital.in",
        "status": data.get("status", "active"),
        "last_login": data.get("last_login", None)
    }

    from app import supabase_client
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            supabase_client.table("users").insert(new_user).execute()
            return jsonify(new_user), 201
        except Exception as e:
            print(f"Supabase create user error: {e}")

    MOCK_USERS.append(new_user)
    return jsonify(new_user), 201

@api_bp.route("/users/<user_id>", methods=["PUT"])
def update_user(user_id):
    data = request.json
    from app import supabase_client
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            update_data = {k: v for k, v in data.items() if k != "id"}
            response = supabase_client.table("users").update(update_data).eq("id", user_id).execute()
            if response.data:
                return jsonify(response.data[0]), 200
        except Exception as e:
            print(f"Supabase update user error: {e}")

    user = next((u for u in MOCK_USERS if u["id"] == user_id), None)
    if not user:
        return jsonify({"error": "User not found"}), 404
    for key, val in data.items():
        if key != "id":
            user[key] = val
    return jsonify(user), 200

@api_bp.route("/users/<user_id>", methods=["DELETE"])
def delete_user(user_id):
    from app import supabase_client
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            supabase_client.table("users").delete().eq("id", user_id).execute()
            return jsonify({"message": "User deleted successfully"}), 200
        except Exception as e:
            print(f"Supabase delete user error: {e}")

    user = next((u for u in MOCK_USERS if u["id"] == user_id), None)
    if not user:
        return jsonify({"error": "User not found"}), 404
    MOCK_USERS.remove(user)
    return jsonify({"message": "User deleted successfully"}), 200

# --- Audit Logs ---
@api_bp.route("/audit-logs", methods=["GET"])
def get_audit_logs():
    from app import supabase_client
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            response = supabase_client.table("audit_logs").select("*").order("timestamp", desc=True).execute()
            mapped_logs = []
            for row in (response.data or []):
                mapped_logs.append({
                    "id": row.get("id"),
                    "user": row.get("user_name"),
                    "action": row.get("action"),
                    "timestamp": row.get("timestamp")
                })
            return jsonify(mapped_logs), 200
        except Exception as e:
            print(f"Supabase fetch audit logs error: {e}")
    return jsonify(MOCK_AUDIT_LOGS), 200

# --- Analytics ---
@api_bp.route("/analytics", methods=["GET"])
def get_analytics():
    from app import supabase_client
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            prod_resp = supabase_client.table("products").select("stock, featured").execute()
            leads_resp = supabase_client.table("leads").select("id").execute()
            logs_resp = supabase_client.table("audit_logs").select("*").order("timestamp", desc=True).limit(5).execute()
            
            products_data = prod_resp.data or []
            total_stock = sum(p.get("stock", 0) for p in products_data)
            featured_count = sum(1 for p in products_data if p.get("featured"))
            leads_count = len(leads_resp.data) if leads_resp.data else 0
            
            recent_logs = []
            for row in (logs_resp.data or []):
                recent_logs.append({
                    "id": row.get("id"),
                    "user": row.get("user_name"),
                    "action": row.get("action"),
                    "timestamp": row.get("timestamp")
                })
            
            return jsonify({
                "visitors": 12450,
                "views": 4820,
                "leads_count": leads_count,
                "total_stock": total_stock,
                "featured_count": featured_count,
                "recent_logs": recent_logs
            }), 200
        except Exception as e:
            print(f"Supabase fetch analytics error: {e}")

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


# ─────────────────────────────────────────────────────────────────────────────
# BANNERS & ADVERTISEMENTS
# ─────────────────────────────────────────────────────────────────────────────

MOCK_BANNERS = [
    {
        "id": "banner-1",
        "title": "Festive Season Sale — Up to 40% Off",
        "subtitle": "Shop the biggest electronics sale of the year",
        "type": "hero",
        "image_url": "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1920&q=80",
        "link_url": "#categories",
        "link_label": "Shop Now",
        "enabled": True,
        "sort_order": 1,
        "scheduled_start": None,
        "scheduled_end": None,
        "recommended_size": "1920 × 700 px",
        "width": 1920,
        "height": 700,
        "created_at": "2026-07-01T00:00:00Z"
    },
    {
        "id": "banner-2",
        "title": "No-Cost EMI on Every Purchase",
        "subtitle": "0% interest for up to 24 months on all major cards",
        "type": "hero",
        "image_url": "https://images.unsplash.com/photo-1556742031-c6961e8560b0?auto=format&fit=crop&w=1920&q=80",
        "link_url": "#offers",
        "link_label": "View Offers",
        "enabled": True,
        "sort_order": 2,
        "scheduled_start": None,
        "scheduled_end": None,
        "recommended_size": "1920 × 700 px",
        "width": 1920,
        "height": 700,
        "created_at": "2026-07-01T01:00:00Z"
    },
    {
        "id": "banner-3",
        "title": "Premium Appliances — Wide Promo",
        "subtitle": "Exclusive showroom deals on smart home appliances",
        "type": "wide",
        "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1600&q=80",
        "link_url": "#categories",
        "link_label": "Explore",
        "enabled": True,
        "sort_order": 1,
        "scheduled_start": None,
        "scheduled_end": None,
        "recommended_size": "1600 × 500 px",
        "width": 1600,
        "height": 500,
        "created_at": "2026-07-01T02:00:00Z"
    },
    {
        "id": "banner-4",
        "title": "Apple iPhone 15 Pro",
        "subtitle": "Now available in store",
        "type": "square",
        "image_url": "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80",
        "link_url": "#categories",
        "link_label": "Buy Now",
        "enabled": True,
        "sort_order": 1,
        "scheduled_start": None,
        "scheduled_end": None,
        "recommended_size": "1080 × 1080 px",
        "width": 1080,
        "height": 1080,
        "created_at": "2026-07-01T03:00:00Z"
    },
    {
        "id": "banner-5",
        "title": "Samsung Galaxy S24 Ultra",
        "subtitle": "Next-gen AI camera flagship",
        "type": "square",
        "image_url": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80",
        "link_url": "#categories",
        "link_label": "Explore",
        "enabled": True,
        "sort_order": 2,
        "scheduled_start": None,
        "scheduled_end": None,
        "recommended_size": "1080 × 1080 px",
        "width": 1080,
        "height": 1080,
        "created_at": "2026-07-01T04:00:00Z"
    },
    {
        "id": "banner-6",
        "title": "Smart Home Bundles",
        "subtitle": "TV + AC + Fridge combo deals",
        "type": "square",
        "image_url": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80",
        "link_url": "#categories",
        "link_label": "View Bundles",
        "enabled": True,
        "sort_order": 3,
        "scheduled_start": None,
        "scheduled_end": None,
        "recommended_size": "1080 × 1080 px",
        "width": 1080,
        "height": 1080,
        "created_at": "2026-07-01T05:00:00Z"
    }
]

# Banner size definitions (for validation reference)
BANNER_SIZE_SPECS = {
    "hero":   {"width": 1920, "height": 700,  "label": "Desktop Hero Banner",       "recommended": "1920 × 700 px"},
    "wide":   {"width": 1600, "height": 500,  "label": "Wide Promotional Banner",   "recommended": "1600 × 500 px"},
    "square": {"width": 1080, "height": 1080, "label": "Square Promotional Banner", "recommended": "1080 × 1080 px"},
    "tablet": {"width": 1200, "height": 600,  "label": "Tablet Banner",             "recommended": "1200 × 600 px"},
    "mobile": {"width": 1080, "height": 1350, "label": "Mobile Banner",             "recommended": "1080 × 1350 px"},
}

@api_bp.route("/banners", methods=["GET"])
def get_banners():
    """
    Public endpoint: returns all banners.
    Admin mode (?admin=1) returns all; otherwise filters enabled + scheduled.
    """
    admin_mode = request.args.get("admin") == "1"
    now = datetime.datetime.utcnow()

    from app import supabase_client
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            if admin_mode:
                response = supabase_client.table("banners").select("*").order("type").order("sort_order").execute()
            else:
                response = supabase_client.table("banners").select("*").eq("enabled", True).order("type").order("sort_order").execute()
            
            if response.data:
                # Client-side filtering of scheduled banners (if any)
                banners_list = response.data
                result = []
                for b in banners_list:
                    if admin_mode:
                        result.append(b)
                        continue
                    
                    # Schedule check
                    active = True
                    start = b.get("scheduled_start")
                    end   = b.get("scheduled_end")
                    if start:
                        try:
                            if now < datetime.datetime.fromisoformat(start.rstrip("Z")):
                                active = False
                        except Exception:
                            pass
                    if end:
                        try:
                            if now > datetime.datetime.fromisoformat(end.rstrip("Z")):
                                active = False
                        except Exception:
                            pass
                    if active:
                        result.append(b)
                
                # Attach size specs
                for b in result:
                    b["size_spec"] = BANNER_SIZE_SPECS.get(b["type"], {})
                
                return jsonify(result), 200
        except Exception as e:
            print(f"Supabase fetch banners error: {e}")

    def is_active(b):
        if not b.get("enabled"):
            return False
        start = b.get("scheduled_start")
        end   = b.get("scheduled_end")
        if start:
            try:
                if now < datetime.datetime.fromisoformat(start.rstrip("Z")):
                    return False
            except Exception:
                pass
        if end:
            try:
                if now > datetime.datetime.fromisoformat(end.rstrip("Z")):
                    return False
            except Exception:
                pass
        return True

    if admin_mode:
        result = sorted(MOCK_BANNERS, key=lambda b: (b["type"], b.get("sort_order", 99)))
    else:
        result = sorted(
            [b for b in MOCK_BANNERS if is_active(b)],
            key=lambda b: (b["type"], b.get("sort_order", 99))
        )

    for b in result:
        b["size_spec"] = BANNER_SIZE_SPECS.get(b["type"], {})

    return jsonify(result), 200


@api_bp.route("/banners", methods=["POST"])
def create_banner():
    data = request.json
    if not data or not data.get("image_url") or not data.get("type"):
        return jsonify({"error": "image_url and type are required"}), 400

    banner_type = data.get("type")
    if banner_type not in BANNER_SIZE_SPECS:
        return jsonify({"error": f"Invalid type. Valid types: {list(BANNER_SIZE_SPECS.keys())}"}), 400

    spec = BANNER_SIZE_SPECS[banner_type]

    # Calculate next sort_order
    from app import supabase_client
    next_order = 1
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            resp = supabase_client.table("banners").select("sort_order").eq("type", banner_type).execute()
            if resp.data:
                next_order = max((b.get("sort_order", 0) for b in resp.data), default=0) + 1
        except Exception as e:
            print(f"Supabase calculate banner sort order error: {e}")
    else:
        same_type = [b for b in MOCK_BANNERS if b["type"] == banner_type]
        next_order = max((b.get("sort_order", 0) for b in same_type), default=0) + 1

    new_banner = {
        "id": f"banner-{uuid.uuid4()}",
        "title": data.get("title", ""),
        "subtitle": data.get("subtitle", ""),
        "type": banner_type,
        "image_url": data.get("image_url"),
        "link_url": data.get("link_url", "#"),
        "link_label": data.get("link_label", "Shop Now"),
        "enabled": bool(data.get("enabled", True)),
        "sort_order": next_order,
        "scheduled_start": data.get("scheduled_start"),
        "scheduled_end": data.get("scheduled_end"),
        "recommended_size": spec["recommended"],
        "width": data.get("width"),
        "height": data.get("height"),
        "created_at": datetime.datetime.utcnow().isoformat() + "Z"
    }

    user_header = request.headers.get("X-Admin-User", "Admin")
    log_action(user_header, f"Created banner: '{new_banner['title']}' (type: {banner_type})")

    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            supabase_client.table("banners").insert(new_banner).execute()
            return jsonify(new_banner), 201
        except Exception as e:
            print(f"Supabase create banner error: {e}")

    MOCK_BANNERS.append(new_banner)
    return jsonify(new_banner), 201


@api_bp.route("/banners/<banner_id>", methods=["PUT"])
def update_banner(banner_id):
    data = request.json
    user_header = request.headers.get("X-Admin-User", "Admin")
    log_action(user_header, f"Updated banner ID: {banner_id}")

    from app import supabase_client
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            allowed = ["title", "subtitle", "image_url", "link_url", "link_label",
                       "enabled", "sort_order", "scheduled_start", "scheduled_end", "width", "height"]
            update_data = {k: v for k, v in data.items() if k in allowed}
            response = supabase_client.table("banners").update(update_data).eq("id", banner_id).execute()
            if response.data:
                return jsonify(response.data[0]), 200
        except Exception as e:
            print(f"Supabase update banner error: {e}")

    banner = next((b for b in MOCK_BANNERS if b["id"] == banner_id), None)
    if not banner:
        return jsonify({"error": "Banner not found"}), 404

    allowed = ["title", "subtitle", "image_url", "link_url", "link_label",
               "enabled", "sort_order", "scheduled_start", "scheduled_end", "width", "height"]
    for key in allowed:
        if key in data:
            banner[key] = data[key]

    return jsonify(banner), 200


@api_bp.route("/banners/<banner_id>", methods=["DELETE"])
def delete_banner(banner_id):
    from app import supabase_client
    banner_title = banner_id
    
    # Try fetching title for log
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            resp = supabase_client.table("banners").select("title").eq("id", banner_id).execute()
            if resp.data:
                banner_title = resp.data[0].get("title", banner_id)
        except Exception:
            pass
    else:
        banner = next((b for b in MOCK_BANNERS if b["id"] == banner_id), None)
        if banner:
            banner_title = banner.get("title", banner_id)

    user_header = request.headers.get("X-Admin-User", "Admin")
    log_action(user_header, f"Deleted banner: '{banner_title}'")

    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            supabase_client.table("banners").delete().eq("id", banner_id).execute()
            return jsonify({"message": "Banner deleted", "status": "success"}), 200
        except Exception as e:
            print(f"Supabase delete banner error: {e}")

    banner = next((b for b in MOCK_BANNERS if b["id"] == banner_id), None)
    if not banner:
        return jsonify({"error": "Banner not found"}), 404
    MOCK_BANNERS.remove(banner)
    return jsonify({"message": "Banner deleted", "status": "success"}), 200


@api_bp.route("/banners/specs", methods=["GET"])
def get_banner_specs():
    """Returns the recommended size specs for each banner type."""
    return jsonify(BANNER_SIZE_SPECS), 200

# --- Roles & Permissions CRUD ---

MOCK_ROLES = [
    {
        "id": "role-super-admin",
        "name": "Super Admin",
        "description": "Full system access to all inventory, media, users, and audit trail configurations.",
        "permissions": ["all_access", "edit_inventory", "manage_users", "view_audit_logs"]
    },
    {
        "id": "role-store-manager",
        "name": "Store Manager",
        "description": "Access to view orders, update stocks, edit catalog items, and view leads.",
        "permissions": ["edit_inventory", "view_orders", "view_leads"]
    },
    {
        "id": "role-content-editor",
        "name": "Content Editor",
        "description": "Read-only access to catalogs, allowed to edit branding, banners, and copywriting copy.",
        "permissions": ["edit_branding", "edit_copywriting"]
    }
]

MOCK_PERMISSIONS = [
    { "id": "perm-all", "name": "all_access", "description": "Unrestricted administrative rights." },
    { "id": "perm-inventory", "name": "edit_inventory", "description": "Add, edit, and delete products from the catalog." },
    { "id": "perm-users", "name": "manage_users", "description": "Create, alter, and toggle administrator profiles." },
    { "id": "perm-logs", "name": "view_audit_logs", "description": "Browse security action trail commits." },
    { "id": "perm-orders", "name": "view_orders", "description": "Track custom purchase tickets." },
    { "id": "perm-leads", "name": "view_leads", "description": "View and export lead inquiry contacts." },
    { "id": "perm-branding", "name": "edit_branding", "description": "Customize site colors, logo, and favicon." },
    { "id": "perm-copywriting", "name": "edit_copywriting", "description": "Update hero, announcement, and gallery text." }
]

@api_bp.route("/roles", methods=["GET"])
def get_roles():
    from app import supabase_client
    
    # Fetch roles
    roles_list = []
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            res = supabase_client.table("roles").select("*").execute()
            if res.data:
                roles_list = res.data
        except Exception as e:
            print(f"Supabase roles fetch error: {e}")
            roles_list = MOCK_ROLES.copy()
    else:
        roles_list = MOCK_ROLES.copy()

    # Fetch users to count assignments
    users_list = []
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            res = supabase_client.table("users").select("role").execute()
            if res.data:
                users_list = res.data
        except Exception:
            users_list = MOCK_USERS
    else:
        users_list = MOCK_USERS

    # Map user count per role name
    for r in roles_list:
        r_name = r.get("name", "")
        count = sum(1 for u in users_list if str(u.get("role", "")).strip().lower() == r_name.strip().lower())
        r["user_count"] = count

    return jsonify(roles_list), 200


@api_bp.route("/roles", methods=["POST"])
def create_role():
    data = request.json
    if not data or not data.get("name"):
        return jsonify({"error": "Role name is required"}), 400

    new_role = {
        "id": f"role-{uuid.uuid4()}",
        "name": data.get("name"),
        "description": data.get("description", ""),
        "permissions": data.get("permissions", [])
    }

    # Add audit log entry
    user_header = request.headers.get("X-Admin-User", "Admin")
    log_action(user_header, f"Created new security role: '{new_role['name']}'")

    from app import supabase_client
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            supabase_client.table("roles").insert(new_role).execute()
            new_role["user_count"] = 0
            return jsonify(new_role), 201
        except Exception as e:
            print(f"Supabase create role error: {e}")

    MOCK_ROLES.append(new_role)
    new_role["user_count"] = 0
    return jsonify(new_role), 201


@api_bp.route("/roles/<role_id>", methods=["PUT"])
def update_role(role_id):
    data = request.json
    if not data:
        return jsonify({"error": "No update details provided"}), 400

    # Add audit log entry
    user_header = request.headers.get("X-Admin-User", "Admin")
    role_name = data.get("name", role_id)
    log_action(user_header, f"Updated security role properties for: '{role_name}'")

    from app import supabase_client
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            update_data = {k: v for k, v in data.items() if k not in ["id", "user_count"]}
            res = supabase_client.table("roles").update(update_data).eq("id", role_id).execute()
            if res.data:
                return jsonify(res.data[0]), 200
        except Exception as e:
            print(f"Supabase update role error: {e}")

    role = next((r for r in MOCK_ROLES if r["id"] == role_id), None)
    if not role:
        return jsonify({"error": "Role not found"}), 404

    for key in ["name", "description", "permissions"]:
        if key in data:
            role[key] = data[key]

    return jsonify(role), 200


@api_bp.route("/roles/<role_id>", methods=["DELETE"])
def delete_role(role_id):
    from app import supabase_client
    
    # 1. Retrieve role details first to obtain its name
    role_name = ""
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            res = supabase_client.table("roles").select("name").eq("id", role_id).execute()
            if res.data:
                role_name = res.data[0].get("name", "")
        except Exception:
            pass
    
    if not role_name:
        role = next((r for r in MOCK_ROLES if r["id"] == role_id), None)
        if role:
            role_name = role.get("name", "")

    if not role_name:
        return jsonify({"error": "Role not found"}), 404

    # 2. Check if any user is currently assigned to this role name
    users_list = []
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            res = supabase_client.table("users").select("role").execute()
            if res.data:
                users_list = res.data
        except Exception:
            users_list = MOCK_USERS
    else:
        users_list = MOCK_USERS

    assigned_users_count = sum(1 for u in users_list if str(u.get("role", "")).strip().lower() == role_name.strip().lower())
    if assigned_users_count > 0:
        return jsonify({"error": f"Cannot delete role '{role_name}' because {assigned_users_count} users are currently assigned to it."}), 400

    # Add audit log entry
    user_header = request.headers.get("X-Admin-User", "Admin")
    log_action(user_header, f"Deleted security role: '{role_name}'")

    # 3. Proceed with deletion
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            supabase_client.table("roles").delete().eq("id", role_id).execute()
            return jsonify({"message": "Role deleted successfully", "status": "success"}), 200
        except Exception as e:
            print(f"Supabase delete role error: {e}")

    role_obj = next((r for r in MOCK_ROLES if r["id"] == role_id), None)
    if role_obj:
        MOCK_ROLES.remove(role_obj)
    return jsonify({"message": "Role deleted successfully", "status": "success"}), 200


@api_bp.route("/permissions", methods=["GET"])
def get_permissions():
    from app import supabase_client
    if supabase_client and "your-supabase" not in supabase_client.supabase_url:
        try:
            res = supabase_client.table("permissions").select("*").execute()
            if res.data:
                return jsonify(res.data), 200
        except Exception as e:
            print(f"Supabase permissions fetch error: {e}")
    return jsonify(MOCK_PERMISSIONS), 200
