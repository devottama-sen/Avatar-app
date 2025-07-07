import os
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "google-service-account.json"

from dotenv import load_dotenv
load_dotenv()

import google.generativeai as genai
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

from pymongo import MongoClient
import base64
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from datetime import datetime
import uvicorn

# Environment variables
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
SECRET_KEY = os.getenv("SECRET_KEY")
DEBUG = os.getenv("DEBUG", "False") == "True"

# MongoDB setup
client = MongoClient(MONGO_URI)
db = client["avatarDB"]
users_collection = db["users"]

# FastAPI app
app = FastAPI()

# ✅ CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://avatar-app-mu.vercel.app",
        "https://avatar-pi584x5sc-devottama-sens-projects.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic model
class UserAvatarRequest(BaseModel):
    user_id: str
    country: str
    prompt: str

# ✅ Avatar generation logic
def generate_avatar_bytes(prompt: str) -> bytes:
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)

        if not response.parts:
            raise RuntimeError("Gemini API returned no content")

        for part in response.parts:
            if hasattr(part, "inline_data"):
                return part.inline_data.data
            elif hasattr(part, "data"):
                return part.data

        raise RuntimeError("No image data found in Gemini response")
    except Exception as e:
        raise RuntimeError(f"Gemini API Error: {str(e)}")

# ✅ Routes
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
            raise HTTPException(
                status_code=403,
                detail="Avatar generation limit (10) reached for this user."
            )

        img_bytes = generate_avatar_bytes(req.prompt)

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
            "image_base64": base64.b64encode(img_bytes).decode("utf-8")
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
                "prompt": doc.get("prompt", ""),
                "timestamp": doc.get("timestamp", ""),
                "image_base64": base64.b64encode(doc["image_binary"]).decode("utf-8")  # ✅ FIXED KEY
            })
        return {"avatars": avatars}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/test-insert")
def insert_test_image():
    try:
        with open("test.png", "rb") as f:
            img = f.read()
        doc = {
            "user_id": "test_user",
            "country": "Nowhere",
            "prompt": "Test insert",
            "image_binary": img,
            "timestamp": datetime.utcnow()
        }
        users_collection.insert_one(doc)
        return {"message": "Test image inserted"}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, log_level="info")
