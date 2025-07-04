os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "service-account.json"
import os
from dotenv import load_dotenv
load_dotenv()

import google.generativeai as genai
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))  # ✅ Global configuration

from pymongo import MongoClient
import base64
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from datetime import datetime
import uvicorn


MONGO_URI = os.getenv("MONGO_URI","mongodb://localhost:27017/")
SECRET_KEY = os.getenv("SECRET_KEY")
DEBUG = os.getenv("DEBUG", "False") == "True"

# MongoDB Setup
client = MongoClient(MONGO_URI)
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
    uvicorn.run("main:app", host="0.0.0.0", port=8000, log_level="info")
