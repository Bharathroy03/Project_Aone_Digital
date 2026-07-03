import os
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

class Config:
    SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://your-supabase-project.supabase.co")
    SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "your-supabase-anon-key")
    FLASK_ENV = os.environ.get("FLASK_ENV", "development")
    DEBUG = FLASK_ENV == "development"
    PORT = int(os.environ.get("PORT", 5000))
