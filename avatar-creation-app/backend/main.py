import os
import base64
from datetime import datetime
from io import BytesIO
import json # Import json for parsing the API response

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
import uvicorn

# No direct import for google.generativeai.GenerativeModel for imagen-3.0-generate-002
# We will use direct fetch for imagen-3.0-generate-002 as per instructions.

# Load environment variables
load_dotenv()

# MongoDB setup
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client["avatarDB"]
users_collection = db["users"]

# FastAPI app
app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://avatar-app.vercel.app",   # ✅ Production domain
        "https://avatar-app-mu.vercel.app",
        "https://avatar-pi584x5sc-devottama-sens-projects.vercel.app",
        "http://localhost:3000",
        "http://0.0.0.0:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model
class UserAvatarRequest(BaseModel):
    user_id: str
    country: str
    prompt: str

# Avatar generation using imagen-3.0-generate-002
async def generate_avatar_bytes(prompt: str) -> bytes:
    try:
        # Construct the prompt for image generation
        image_prompt_text = (
            f"Generate a high-quality 3D-style avatar: {prompt}. "
            f"The avatar should be well-lit, have a clean background, "
            f"and resemble a professional profile picture."
        )

        # Prepare the payload for the imagen-3.0-generate-002 API call
        # As per instructions, use 'instances' for the prompt and 'parameters' for sampleCount
        payload = {
            "instances": {"prompt": image_prompt_text},
            "parameters": {"sampleCount": 1}
        }

        # Get API key from environment variables
        api_key = os.getenv("GOOGLE_API_KEY", "") # Ensure API key is loaded

        # Construct the API URL for imagen-3.0-generate-002
        api_url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key={api_key}"

        # Make the API call
        response = await fetch(
            api_url,
            method='POST',
            headers={'Content-Type': 'application/json'},
            body=json.dumps(payload) # Convert payload to JSON string
        )
        
        # Parse the JSON response
        result = json.loads(response)

        # Extract the base64 encoded image data
        if result.get("predictions") and len(result["predictions"]) > 0 and result["predictions"][0].get("bytesBase64Encoded"):
            # The image data is base64 encoded, decode it to bytes
            return base64.b64decode(result["predictions"][0]["bytesBase64Encoded"])
        else:
            raise RuntimeError("No image data found in Imagen API response.")

    except Exception as e:
        # Check for specific error messages related to quota or limits
        error_message = str(e).lower()
        if "quota" in error_message or "limit" in error_message or "resource exhausted" in error_message:
            raise HTTPException(status_code=429, detail="API quota exceeded. Please try again later.")
        raise HTTPException(status_code=500, detail=f"Imagen API Error: {str(e)}")

# Helper function to simulate fetch in Python (for demonstration/testing purposes)
# In a real FastAPI app, you'd use a library like `httpx` or `requests` for external API calls.
# For the purpose of this response, I'm providing a placeholder for `fetch`.
# You would replace this with actual HTTP client code.
async def fetch(url: str, method: str, headers: dict, body: str):
    import httpx # Using httpx for async HTTP requests

    async with httpx.AsyncClient() as client:
        if method == 'POST':
            res = await client.post(url, headers=headers, content=body)
        else:
            res = await client.get(url, headers=headers)
        res.raise_for_status() # Raise an exception for HTTP errors
        return res.text # Return the response text

# API routes
@app.get("/")
def read_root():
    return {"message": "Avatar API is running"}

@app.get("/avatar-count")
async def get_avatar_count(user_id: str = Query(..., alias="userId")):
    try:
        count = users_collection.count_documents({"user_id": user_id})
        return {"count": count, "remaining": max(0, 10 - count)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/store-user-avatar")
async def store_user_avatar(req: UserAvatarRequest):
    try:
        if users_collection.count_documents({"user_id": req.user_id}) >= 10:
            raise HTTPException(status_code=403, detail="Avatar generation limit (10) reached.")

        # Call the async image generation function
        img_bytes = await generate_avatar_bytes(req.prompt)
        if not img_bytes:
            raise HTTPException(status_code=500, detail="No image data returned from Imagen.")

        user_doc = {
            "user_id": req.user_id,
            "country": req.country,
            "prompt": req.prompt,
            "image_binary": img_bytes,
            "timestamp": datetime.utcnow()
        }
        users_collection.insert_one(user_doc)

        return {
            "message": "User and avatar details stored successfully!",
            "prompt": req.prompt,
            "image": base64.b64encode(img_bytes).decode("utf-8")
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/avatars")
async def get_avatars(user_id: str = Query(..., alias="userId")):
    try:
        avatars = []
        cursor = users_collection.find({"user_id": user_id}).sort("timestamp", -1)

        for doc in cursor:
            # Ensure 'image_binary' exists and is bytes before encoding
            image_data = doc.get("image_binary")
            if isinstance(image_data, bytes):
                encoded_image = base64.b64encode(image_data).decode("utf-8")
            else:
                # Handle cases where image_binary might be missing or not bytes
                encoded_image = "" # Or a placeholder base64 string

            avatars.append({
                "user_id": doc.get("user_id", ""),
                "country": doc.get("country", ""),
                "prompt": doc.get("prompt", ""),
                "timestamp": doc.get("timestamp", ""),
                "image": encoded_image
            })

        return {"avatars": avatars}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/test-insert")
def insert_test_image():
    try:
        # This endpoint is for testing local file insertion, not related to Gemini/Imagen API
        # It assumes 'test.png' exists in the same directory as main.py
        with open("test.png", "rb") as f:
            img = f.read()
        users_collection.insert_one({
            "user_id": "test_user",
            "country": "Nowhere",
            "prompt": "Test insert",
            "image_binary": img,
            "timestamp": datetime.utcnow()
        })
        return {"message": "Test image inserted"}
    except FileNotFoundError:
        return {"error": "test.png file not found. Please ensure 'test.png' exists for this endpoint to work."}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    # Ensure httpx is installed: pip install httpx
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), log_level="info")


