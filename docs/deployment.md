# Production Deployment Guide
## Internal SIH College Management & Intelligence Platform

This document describes the Docker setup, environment variables, Nginx configurations, and deployment steps.

---

## 1. Environment Configurations

In production, create a `.env` file in the root folder with the following variables. Ensure `DEBUG` is set to `False` and all default secrets are changed:

```env
# Application Settings
DEBUG=False
SECRET_KEY=ChangeMeToAVeryLongRandomSecureStringForProduction
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Database Configuration (PostgreSQL example)
DATABASE_URL=postgresql://sih_user:SecureDBPassword@db:5432/sih_db

# External API Integrations
GEMINI_API_KEY=AIzaSyYourProductionGeminiKeyHere
AI_ENABLED=True

# CORS Configuration
CORS_ORIGINS=["https://sih.college.edu"]
```

---

## 2. Docker Architecture & Configurations

The platform is containerized using Docker, split into two services:
1. **backend**: Serves the FastAPI ASGI application on port `8000`.
2. **frontend**: Compiles static assets using Vite and serves them through Nginx on port `80`.

### 2.1. Backend Dockerfile (`backend/Dockerfile`)
```dockerfile
FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2.2. Frontend Dockerfile (`frontend/Dockerfile`)
```dockerfile
# Build stage
FROM node:18-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production serve stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## 3. Docker Compose Specification (`docker-compose.yml`)

Use `docker-compose.yml` to launch the database, backend API, and frontend server:

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: sih_db
    environment:
      POSTGRES_USER: sih_user
      POSTGRES_PASSWORD: SecureDBPassword
      POSTGRES_DB: sih_db
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: always
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    container_name: sih_backend
    environment:
      - DATABASE_URL=postgresql://sih_user:SecureDBPassword@db:5432/sih_db
      - SECRET_KEY=ChangeMeToAVeryLongRandomSecureStringForProduction
      - DEBUG=False
      - GEMINI_API_KEY=AIzaSyYourProductionGeminiKeyHere
      - AI_ENABLED=True
    depends_on:
      - db
    restart: always
    ports:
      - "8000:8000"

  frontend:
    build: ./frontend
    container_name: sih_frontend
    depends_on:
      - backend
    restart: always
    ports:
      - "80:80"

volumes:
  pgdata:
```

---

## 4. SSL & HTTPS Configurations

Always serve the application over HTTPS in production. Configure Nginx to proxy requests to the backend container:

```nginx
server {
    listen 80;
    server_name sih.college.edu;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name sih.college.edu;

    ssl_certificate /etc/letsencrypt/live/sih.college.edu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sih.college.edu/privkey.pem;

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
