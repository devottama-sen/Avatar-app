import os
import base64
from datetime import datetime
from io import BytesIO
import json
import httpx # Ensure httpx is imported for the fetch function

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
import uvicorn

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

# Helper function to make HTTP requests
async def fetch(url: str, method: str, headers: dict, body: str = None): # body is now optional
    async with httpx.AsyncClient() as client:
        try:
            if method == 'POST':
                res = await client.post(url, headers=headers, content=body)
            else:
                res = await client.get(url, headers=headers)
            res.raise_for_status() # Raise an exception for HTTP errors (4xx or 5xx)
            return res.text # Return the response text
        except httpx.HTTPStatusError as e:
            # Log the full error response from the API
            print(f"HTTP Error during fetch: {e.response.status_code} - {e.response.text}")
            raise HTTPException(status_code=e.response.status_code, detail=f"External API error: {e.response.text}")
        except httpx.RequestError as e:
            # Log network-related errors
            print(f"Network Error during fetch: {e}")
            raise HTTPException(status_code=503, detail=f"Network error connecting to external API: {e}")


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
        payload = {
            "instances": {"prompt": image_prompt_text},
            "parameters": {"sampleCount": 1}
        }

        # Get API key from environment variables
        api_key = os.getenv("GOOGLE_API_KEY", "")
        if not api_key:
            print("Warning: GOOGLE_API_KEY environment variable is not set.")
            raise HTTPException(status_code=500, detail="Server configuration error: Google API Key is missing.")

        # Construct the API URL for imagen-3.0-generate-002
        api_url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key={api_key}"

        print(f"Making Imagen API call to: {api_url}")
        print(f"Payload: {json.dumps(payload)}")

        # Make the API call
        response_text = await fetch(
            api_url,
            method='POST',
            headers={'Content-Type': 'application/json'},
            body=json.dumps(payload)
        )
        
        # Parse the JSON response
        result = json.loads(response_text)
        print(f"Imagen API Raw Response: {response_text}")

        # Extract the base64 encoded image data
        if result.get("predictions") and len(result["predictions"]) > 0 and result["predictions"][0].get("bytesBase64Encoded"):
            # The image data is base64 encoded, decode it to bytes
            return base64.b64decode(result["predictions"][0]["bytesBase64Encoded"])
        else:
            # If no image data is found but no HTTP error occurred, it's an unexpected response structure
            print(f"Imagen API response did not contain expected image data: {result}")
            raise RuntimeError("No image data found in Imagen API response or unexpected response structure.")

    except HTTPException as e:
        # Re-raise HTTPException directly as it's already a controlled error
        raise e
    except Exception as e:
        # Catch any other unexpected errors and log them
        print(f"An unexpected error occurred in generate_avatar_bytes: {str(e)}")
        # Check for specific error messages related to quota or limits
        error_message = str(e).lower()
        if "quota" in error_message or "limit" in error_message or "resource exhausted" in error_message:
            raise HTTPException(status_code=429, detail="API quota exceeded. Please try again later.")
        raise HTTPException(status_code=500, detail=f"Internal Server Error during avatar generation: {str(e)}")


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
        print(f"Error getting avatar count: {str(e)}")
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
        # Re-raise HTTPExceptions directly
        raise e
    except Exception as e:
        print(f"An unexpected error occurred in store_user_avatar: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to store user avatar: {str(e)}")

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
                print(f"Warning: image_binary missing or not bytes for user_id: {user_id}, doc_id: {doc.get('_id')}")
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
        print(f"Error retrieving avatars for user_id {user_id}: {str(e)}")
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
        print("Error: test.png file not found for /test-insert endpoint.")
        return {"error": "test.png file not found. Please ensure 'test.png' exists for this endpoint to work."}
    except Exception as e:
        print(f"An unexpected error occurred in test-insert: {str(e)}")
        return {"error": str(e)}

@app.get("/diagnose-network")
async def diagnose_network():
    """
    Attempts to connect to an external well-known URL to diagnose network connectivity issues.
    """
    test_url = "https://www.google.com"
    try:
        print(f"Attempting to reach {test_url} for network diagnosis...")
        async with httpx.AsyncClient() as client:
            response = await client.get(test_url, timeout=10) # Add a timeout
            response.raise_for_status()
        print(f"Successfully connected to {test_url}. Status: {response.status_code}")
        return {"status": "success", "message": f"Successfully connected to {test_url}"}
    except httpx.HTTPStatusError as e:
        print(f"Network diagnostic failed (HTTP error): {e.response.status_code} - {e.response.text}")
        return {"status": "error", "message": f"Failed to connect to {test_url} (HTTP error): {e.response.status_code} - {e.response.text}"}
    except httpx.RequestError as e:
        print(f"Network diagnostic failed (Request error): {e}")
        return {"status": "error", "message": f"Failed to connect to {test_url} (Network error): {e}"}
    except Exception as e:
        print(f"Network diagnostic failed (Unexpected error): {str(e)}")
        return {"status": "error", "message": f"Failed to connect to {test_url} (Unexpected error): {str(e)}"}

@app.get("/diagnose-google-api")
async def diagnose_google_api():
    """
    Attempts to connect to a different Google API endpoint (Google Public DNS)
    to diagnose connectivity issues specifically with Google's API infrastructure.
    """
    test_google_api_url = "https://dns.google/resolve?name=google.com"
    try:
        print(f"Attempting to reach Google Public DNS API at {test_google_api_url}...")
        async with httpx.AsyncClient() as client:
            response = await client.get(test_google_api_url, timeout=10)
            response.raise_for_status()
        print(f"Successfully connected to Google Public DNS API. Status: {response.status_code}")
        return {"status": "success", "message": f"Successfully connected to {test_google_api_url}", "response_snippet": response.text[:200]}
    except httpx.HTTPStatusError as e:
        print(f"Google API diagnostic failed (HTTP error): {e.response.status_code} - {e.response.text}")
        return {"status": "error", "message": f"Failed to connect to Google Public DNS API (HTTP error): {e.response.status_code} - {e.response.text}"}
    except httpx.RequestError as e:
        print(f"Google API diagnostic failed (Request error): {e}")
        return {"status": "error", "message": f"Failed to connect to Google Public DNS API (Network error): {e}"}
    except Exception as e:
        print(f"Google API diagnostic failed (Unexpected error): {str(e)}")
        return {"status": "error", "message": f"Failed to connect to Google Public DNS API (Unexpected error): {str(e)}"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), log_level="info")

