import os
import base64
from datetime import datetime
from io import BytesIO

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
import uvicorn

from google.generativeai import configure, GenerativeModel

# Load environment variables
load_dotenv()

# MongoDB setup
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client["avatarDB"]
users_collection = db["users"]

# Gemini setup
configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = GenerativeModel("gemini-2.0-flash-preview-image-generation")

# FastAPI app
app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://avatar-app-mu.vercel.app",
        "https://avatar-pi584x5sc-devottama-sens-projects.vercel.app",
        "http://localhost:3000",
        "http://0.0.0.0:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic model for request body
class UserAvatarRequest(BaseModel):
    user_id: str
    country: str
    prompt: str
    
def generate_avatar_bytes(prompt: str) -> bytes:
    try:
        image_prompt = (
            f"Generate a high-quality 3D-style avatar: {prompt}. "
            f"The avatar should be well-lit, have a clean background, "
            f"and resemble a professional profile picture."
        )

        response = model.generate_content(
            image_prompt,
            generation_config=None,  # Optional
        )

        # Only IMAGE is returned — grab the inline image data
        for part in response.candidates[0].content.parts:
            if hasattr(part, "inline_data") and part.inline_data:
                return part.inline_data.data

        raise RuntimeError("No image data found in Gemini response.")

    except Exception as e:
        if "quota" in str(e).lower() or "limit" in str(e).lower():
            raise HTTPException(status_code=429, detail="API quota exceeded. Please try again later.")
        raise HTTPException(status_code=500, detail=f"Gemini API Error: {str(e)}")


# Routes
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
        existing_count = users_collection.count_documents({"user_id": req.user_id})
        if existing_count >= 10:
            raise HTTPException(status_code=403, detail="Avatar generation limit (10) reached.")

        img_bytes = generate_avatar_bytes(req.prompt)
        if not img_bytes:
            raise HTTPException(status_code=500, detail="No image data returned from Gemini.")

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
        cursor = users_collection.find({"user_id": user_id}).sort("timestamp", -1)
        avatars = []

        for doc in cursor:
            avatars.append({
                "user_id": doc.get("user_id", ""),
                "country": doc.get("country", ""),
                "prompt": doc.get("prompt", ""),
                "timestamp": doc.get("timestamp", ""),
                "image": base64.b64encode(doc["image_binary"]).decode("utf-8")
            })

        return {"avatars": avatars}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/test-insert")
def insert_test_image():
    try:
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
        return {"error": "test.png file not found"}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), log_level="info")
