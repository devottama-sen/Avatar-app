from dotenv import load_dotenv
load_dotenv()
from pymongo import MongoClient
import base64
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from google import genai
from google.genai import types
from datetime import datetime
import uvicorn
import os

MONGO_URI = os.getenv("MONGO_URI")
SECRET_KEY = os.getenv("SECRET_KEY")
DEBUG = os.getenv("DEBUG", "False") == "True"

# MongoDB Setup
client = MongoClient("mongodb+srv://devottama_30:Pisuke3012sen@cluster0.fb2hmak.mongodb.net/avatarDB?retryWrites=true&w=majority&appName=Cluster0")
db = client["avatarDB"]
users_collection = db["users"]

# FastAPI app
app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Model
class UserAvatarRequest(BaseModel):
    user_id: str
    country: str
    prompt: str

# Gemini Image Generator
def generate_avatar_bytes(prompt: str) -> bytes:
    API_KEY = os.getenv("GOOGLE_API_KEY")
    client = genai.Client(api_key=API_KEY)
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash-preview-image-generation",
            contents=prompt,
            config=types.GenerateContentConfig(response_modalities=['TEXT', 'IMAGE'])
        )

        if not response.candidates:
            raise RuntimeError("Gemini API returned no candidates")

        for part in response.candidates[0].content.parts:
            if part.inline_data:
                return part.inline_data.data

        raise RuntimeError("No image data found in Gemini response")
    except Exception as e:
        raise RuntimeError(f"Gemini API Error: {str(e)}")

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
async def get_avatars(user_id: str | None = Query(default=None, alias="userId")):
    try:
        query_filter = {"user_id": user_id} if user_id else {}
        docs = users_collection.find(query_filter)
        result = []

        for doc in docs:
            user_id = doc.get("user_id", "")
            prompt = doc.get("prompt", "")
            country = doc.get("country", "")
            timestamp = doc.get("timestamp")
            raw_bytes = doc.get("image_binary", b"")

            try:
                image_base64 = base64.b64encode(raw_bytes).decode("utf-8")
            except Exception:
                image_base64 = ""

            result.append({
                "user_id": user_id,
                "prompt": prompt,
                "country": country,
                "timestamp": timestamp,
                "image_base64": image_base64
            })

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve avatars: {str(e)}")

@app.get("/avatar-count")
async def get_avatar_count(user_id: str = Query(..., alias="userId")):
    try:
        count = users_collection.count_documents({"user_id": user_id})
        return {"count": count, "remaining": max(0, 10 - count)}
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

@app.get("/")
def read_root():
    return {"message": "Avatar API is running"}

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, log_level="info")
