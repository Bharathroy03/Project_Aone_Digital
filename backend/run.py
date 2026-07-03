from app import create_app
import os

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    # Bind to 0.0.0.0 to enable local network access if required
    app.run(host="0.0.0.0", port=port, debug=app.config["DEBUG"])
