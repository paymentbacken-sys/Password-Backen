const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 In-memory lock (per server instance)
const issuedUsers = new Set();

// Absolute path for Render
const EMAIL_FILE = path.join(__dirname, "emails.json");

// Root test route
app.get("/", (req, res) => {
  res.send("SERVER IS RUNNING");
});

// 🔐 EMAIL API (ONE EMAIL PER STUDENT)
app.get("/email", (req, res) => {
  const category = req.query.category;

  if (!category) {
    return res.status(400).json({ message: "Category missing" });
  }

  // 🔑 Unique student fingerprint
  const userKey =
    req.ip + "|" + req.headers["user-agent"];

  // ❌ Already received an email
  if (issuedUsers.has(userKey)) {
    return res.status(403).json({
      message: "You are permitted for only ONE registered email."
    });
  }

  // ❌ Email store missing
  if (!fs.existsSync(EMAIL_FILE)) {
    return res.status(500).json({ message: "emails.json not found" });
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(EMAIL_FILE, "utf8"));
  } catch (err) {
    return res.status(500).json({ message: "Invalid JSON format" });
  }

  // ❌ Invalid category
  if (!data[category]) {
    return res.status(404).json({ message: "Invalid category" });
  }

  // ✅ Find unused email
  const nextEmail = data[category].find(e => !e.used);

  if (!nextEmail) {
    return res.json({
      message: "No emails left for this category"
    });
  }

  // ✅ Mark email as used
  nextEmail.used = true;
  fs.writeFileSync(
    EMAIL_FILE,
    JSON.stringify(data, null, 2)
  );

  // 🔒 Lock student permanently
  issuedUsers.add(userKey);

  // ✅ Send email
  res.json({ email: nextEmail.email });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
