# 1. Use a lightweight base image
FROM python:3.10-slim

# 2. Set work directory
WORKDIR /app

# 3. Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 4. CRITICAL: Install CPU-only PyTorch
# This is much smaller and tailored for standard servers
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# 5. Install the rest of your requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Add this in your Dockerfile to be safe
COPY models/ ./models/

# 6. Copy your project code
COPY . .

# 7. Start the server using Gunicorn
EXPOSE 7860
CMD ["gunicorn", "-w", "1", "-b", "0.0.0.0:7860", "app:app"]
