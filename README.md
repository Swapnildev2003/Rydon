# Transport Management System

A comprehensive transport management solution with web and mobile applications.

## Project Structure

```
Transport-Management/
├── backend/              # Django REST API (Dockerized)
├── frontend/            # React Web Application
└── mobile/              # React Native Mobile App
```

---

## 🐳 Docker Setup (Recommended)

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Backend with Docker

1. **Navigate to the backend directory:**
   ```bash
   cd backend/project
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Update `.env` with your values:**

4. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

5. **Run migrations (in a new terminal):**
   ```bash
   docker-compose exec backend python manage.py migrate
   ```

6. **Create superuser (optional):**
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

### Docker Services

| Service | URL | Description |
|---------|-----|-------------|
| **Backend API** | http://localhost:8000 | Django REST API |
| **Admin Panel** | http://localhost:8000/admin | Django Admin |
| **PostgreSQL** | localhost:5432 | Database |
| **Redis** | localhost:6379 | WebSocket Channels |

### Useful Docker Commands

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v

# Rebuild after code changes
docker-compose up --build

# Shell into backend container
docker-compose exec backend bash

# Run Django commands
docker-compose exec backend python manage.py <command>
```

### Health Check

```bash
# Check if backend is running
curl http://localhost:8000/admin/

# Test API endpoint
curl -X POST http://localhost:8000/api/send-otp/ \
  -H "Content-Type: application/json" \
  -d '{"phone":"1234567890","role":"operator"}'
```

---

## 📦 Manual Setup (Without Docker)

### Backend (Django)

1. **Navigate to the backend directory:**
   ```bash
   cd backend/project
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Generate a new SECRET_KEY:
     ```bash
     python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
     ```
   - Update `.env` with your actual values

5. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Start the development server:**
   ```bash
   python manage.py runserver
   ```

### Frontend (React)

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Add your Firebase configuration values
   - Get these from Firebase Console > Project Settings > Your apps

4. **Start the development server:**
   ```bash
   npm run dev
   ```

### Mobile (React Native + Expo)

1. **Navigate to the mobile directory:**
   ```bash
   cd mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the Expo development server:**
   ```bash
   npx expo start
   ```

---

## 🔧 Environment Variables

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | `django-insecure-xxx...` |
| `DEBUG` | Debug mode | `True` or `False` |
| `ALLOWED_HOSTS` | Allowed hosts | `localhost,127.0.0.1` |
| `DB_ENGINE` | Database engine | `postgresql` |
| `DB_NAME` | Database name | `transport_db` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `your-password` |
| `DB_HOST` | Database host | `db` (Docker) or `localhost` |
| `DB_PORT` | Database port | `5432` |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | `ACxxxx...` |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | `xxxx...` |
| `TWILIO_PHONE_NUMBER` | Twilio Phone Number | `+1234567890` |
| `REDIS_HOST` | Redis host | `redis` (Docker) or `localhost` |
| `REDIS_PORT` | Redis port | `6379` |

### Frontend (.env)

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Your Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Your Firebase auth domain |
| `VITE_FIREBASE_DATABASE_URL` | Your Firebase database URL |
| `VITE_FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Your Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Your Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Your Firebase measurement ID |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose Network                    │
├─────────────────┬─────────────────┬─────────────────────────┤
│    Backend      │     Redis       │      PostgreSQL         │
│   (Daphne)      │   (Channels)    │      (Database)         │
│   Port: 8000    │   Port: 6379    │      Port: 5432         │
└─────────────────┴─────────────────┴─────────────────────────┘
         │
         │ API Calls
         ▼
┌─────────────────┐      ┌─────────────────┐
│    Frontend     │      │     Mobile      │
│  (React/Vite)   │      │  (Expo/React    │
│   Port: 5173    │      │    Native)      │
└─────────────────┘      └─────────────────┘
```

---

## 🔒 Security Notes

> ⚠️ **NEVER commit `.env` files to version control!**

- All sensitive credentials are stored in `.env` files
- `.env` is already listed in `.gitignore`
- Always use `.env.example` as a template
- Rotate credentials if they are accidentally exposed
- Set `DEBUG=False` in production
- Use strong, unique passwords for database and secret key

---

## 🧪 API Testing

### Using cURL

```bash
# Health check
curl http://localhost:8000/admin/

# Send OTP
curl -X POST http://localhost:8000/api/send-otp/ \
  -H "Content-Type: application/json" \
  -d '{"phone":"1234567890","role":"operator"}'

# Verify OTP
curl -X POST http://localhost:8000/api/verify-otp/ \
  -H "Content-Type: application/json" \
  -d '{"phone":"1234567890","otp":"123456","role":"operator"}'
```

### Using Postman

Import the following endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/` | Django Admin |
| `POST` | `/api/send-otp/` | Send OTP |
| `POST` | `/api/verify-otp/` | Verify OTP |
| `GET` | `/api/drivers/` | List Drivers |
| `GET` | `/api/vehicles/` | List Vehicles |
| `GET` | `/api/bookings/` | List Bookings |

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

---

## 📄 License

[Add your license here]
