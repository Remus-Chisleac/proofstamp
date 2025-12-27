const express = require("express");
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:80";

// Ensure data directory exists
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize SQLite database
const dbPath = path.join(dataDir, "proofstamp.db");
const db = new Database(dbPath);

// Create signatures table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS signatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash TEXT UNIQUE NOT NULL,
    timestamp INTEGER NOT NULL,
    metadata TEXT,
    author TEXT
  )
`);

// Add author column to existing tables (if it doesn't exist)
try {
  db.exec(`ALTER TABLE signatures ADD COLUMN author TEXT`);
} catch (error) {
  // Column already exists, ignore error
  if (error.code !== "SQLITE_ERROR" || !error.message.includes("duplicate column")) {
    console.warn("Warning: Could not add author column:", error.message);
  }
}

// Prepare statements for better performance
const getSignatureByHash = db.prepare("SELECT * FROM signatures WHERE hash = ?");
const insertSignature = db.prepare("INSERT INTO signatures (hash, timestamp, metadata, author) VALUES (?, ?, ?, ?)");

// Middleware
app.use(express.json());

// CORS configuration - allow requests from client container
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "proofstamp-server" });
});

// API routes
app.get("/api", (req, res) => {
  res.json({ message: "ProofStamp API" });
});

// POST /api/sign - Create or retrieve signature
app.post("/api/sign", (req, res) => {
  try {
    const { hash, metadata, author } = req.body;

    // Validate input
    if (!hash || typeof hash !== "string") {
      return res.status(400).json({ error: "Hash is required and must be a string" });
    }

    // Check if hash already exists
    const existing = getSignatureByHash.get(hash);

    if (existing) {
      // Return 409 Conflict with existing record
      return res.status(409).json({
        id: existing.id,
        hash: existing.hash,
        timestamp: existing.timestamp,
        author: existing.author || null,
        metadata: existing.metadata ? JSON.parse(existing.metadata) : null,
      });
    }

    // Create new signature
    const timestamp = Date.now();
    const metadataStr = metadata ? JSON.stringify(metadata) : null;

    const result = insertSignature.run(hash, timestamp, metadataStr, author || null);

    res.status(201).json({
      id: result.lastInsertRowid,
      hash: hash,
      timestamp: timestamp,
      author: author || null,
      metadata: metadata || null,
    });
  } catch (error) {
    // Handle unique constraint violation (race condition)
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      const existing = getSignatureByHash.get(req.body.hash);
      return res.status(409).json({
        id: existing.id,
        hash: existing.hash,
        timestamp: existing.timestamp,
        author: existing.author || null,
        metadata: existing.metadata ? JSON.parse(existing.metadata) : null,
      });
    }

    console.error("Error in /api/sign:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/verify/:hash - Verify signature by hash
app.get("/api/verify/:hash", (req, res) => {
  try {
    const { hash } = req.params;

    const signature = getSignatureByHash.get(hash);

    if (!signature) {
      return res.status(404).json({ error: "Signature not found" });
    }

    res.json({
      id: signature.id,
      hash: signature.hash,
      timestamp: signature.timestamp,
      author: signature.author || null,
      metadata: signature.metadata ? JSON.parse(signature.metadata) : null,
    });
  } catch (error) {
    console.error("Error in /api/verify:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database initialized at ${dbPath}`);
  console.log(`CORS enabled for ${CLIENT_URL}`);
});
