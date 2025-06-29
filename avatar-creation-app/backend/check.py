from pymongo import MongoClient
import base64

client = MongoClient("mongodb://localhost:27017")
db = client["avatarDB"]
collection = db["users"]

doc = collection.find_one()  # Get any one document
if doc and "image_binary" in doc:
    img_data = doc["image_binary"]
    img_base64 = base64.b64encode(img_data).decode("utf-8")

    with open("output_image.png", "wb") as f:
        f.write(base64.b64decode(img_base64))

    print("Image saved as output_image.png")
else:
    print("No image found.")
