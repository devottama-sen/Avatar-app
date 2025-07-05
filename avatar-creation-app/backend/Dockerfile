FROM python:3.11-slim

WORKDIR /app

# Do NOT copy the secret
# COPY /etc/secrets/google-service-account.json /app/service-account.json

# Install system packages
RUN apt-get update && apt-get install -y git

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Start the server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]


