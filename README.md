# ProofStamp

A secure document timestamping application using cryptographic hashing. ProofStamp allows users to timestamp files by calculating their SHA-256 hash and storing it in a database with metadata.

## Features

- 🔐 **Cryptographic Hashing**: Uses browser's SubtleCrypto API to calculate SHA-256 hashes
- 📝 **Author Attribution**: Each signature includes author information
- ✅ **Conflict Detection**: Prevents duplicate signatures with conflict warnings
- 🔍 **Verification**: Verify existing signatures by hash
- 🐳 **Dockerized**: Fully containerized with Docker Compose

## Architecture

- **Frontend**: Pure HTML/CSS/JavaScript served via Nginx
- **Backend**: Node.js/Express API with SQLite database
- **Database**: SQLite with persistent storage

## Local Development

### Prerequisites

- Docker and Docker Compose installed

### Running Locally

```bash
# Build and start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:80
# Backend API: http://localhost:5000
```

### API Endpoints

- `POST /api/sign` - Create a new signature
  - Body: `{ hash: string, author: string, metadata?: object }`
  - Returns: 201 (created) or 409 (conflict)

- `GET /api/verify/:hash` - Verify a signature by hash
  - Returns: 200 (found) or 404 (not found)

- `GET /health` - Health check endpoint

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions.

## Project Structure

```
ProofStamp/
├── client/          # Frontend application
│   ├── index.html   # Main HTML file
│   ├── styles.css   # Styles
│   ├── script.js    # JavaScript logic
│   └── Dockerfile   # Frontend Dockerfile
├── server/          # Backend API
│   ├── index.js     # Express server
│   ├── Dockerfile   # Backend Dockerfile
│   └── data/        # SQLite database storage
└── docker-compose.yml
```

## License

MIT


