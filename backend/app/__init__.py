from flask import Flask
from flask_cors import CORS
from config import Config
from supabase import create_client, Client

# Global supabase client variable
supabase_client: Client = None

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize CORS for communication with React frontend
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize Supabase client
    global supabase_client
    try:
        supabase_client = create_client(
            app.config["SUPABASE_URL"],
            app.config["SUPABASE_KEY"]
        )
    except Exception as e:
        app.logger.warning(f"Supabase client could not be initialized: {e}")

    # Register blueprints/routes
    from app.routes import api_bp
    app.register_blueprint(api_bp, url_prefix="/api")

    @app.route("/health", methods=["GET"])
    def health_check():
        return {"status": "healthy", "supabase_connected": supabase_client is not None}, 200

    return app
