import sys
import os

# Add backend directory to path so it can resolve Config and App imports
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app import create_app

# Instantiate the Flask app which Vercel runtime automatically binds to
app = create_app()
