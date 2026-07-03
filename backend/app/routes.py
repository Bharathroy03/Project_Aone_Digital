from flask import Blueprint, request, jsonify
import uuid

api_bp = Blueprint("api", __name__)

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
        
    return jsonify({
        "message": f"Thank you for reaching out! We will reply to {data.get('email')} soon.",
        "status": "success"
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
