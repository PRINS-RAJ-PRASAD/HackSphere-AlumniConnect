import requests
import os
from dotenv import load_dotenv

# Load variables from the .env file
load_dotenv()

# Pull the API key from the environment vault
API_KEY = os.getenv("GEMINI_API_KEY")

# This calls the API to list all models available to your key
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"

response = requests.get(url)
if response.status_code == 200:
    models = response.json().get('models', [])
    for model in models:
        print(f"✅ Available Model: {model['name']}")
else:
    print(f"❌ Error: {response.text}")