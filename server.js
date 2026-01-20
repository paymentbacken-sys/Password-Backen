const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// In-memory map: studentKey -> timestamp of last email
const issuedUsers = new Map();

// Absolute path to emails.json
const EMAIL_FILE = path.join(__dirname, "emails.json");

// Serve frontend
app.use(express.static("public"));

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Email API
app.get("/email", (req, res) => {
  const category = req.query.category;
  if (!category) return res.status(400).json({ message: "Category missing" });

  // Unique student key: IP + User-Agent
  const userKey = req.ip + "|" + req.headers["user-agent"];
  const now = Date.now();

  const lockTime = 5 * 60 * 1000; // 5 minutes in ms

  // Check if student requested email within last 5 minutes
  if (issuedUsers.has(userKey)) {
    const lastTime = issuedUsers.get(userKey);
    if (now - lastTime < lockTime) {
      return res.status(403).json({
        message: "You are paid for only one registered email."
      });
    }
  }

  // Read email data
  if (!fs.existsSync(EMAIL_FILE)) {
    return res.status(500).json({ message: "emails.json not found" });
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(EMAIL_FILE, "utf8"));
  } catch {
    return res.status(500).json({ message: "Invalid JSON format" });
  }

  if (!data[category]) return res.status(404).json({ message: "Invalid category" });

  const nextEmail = data[category].find(e => !e.used);
  if (!nextEmail) return res.json({ message: "No emails left for this category" });

  // Mark email as used
  nextEmail.used = true;
  fs.writeFileSync(EMAIL_FILE, JSON.stringify(data, null, 2));

  // Update timestamp
  issuedUsers.set(userKey, now);

  res.json({ email: nextEmail.email });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
