const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Absolute path to emails.json (IMPORTANT for Render)
const EMAIL_FILE = path.join(__dirname, "emails.json");

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Get next unused email (GLOBAL – never repeats)
app.get("/email", (req, res) => {
  const { category } = req.query;

  if (!category) {
    return res.json({ message: "Category missing" });
  }

  // Read email data
  if (!fs.existsSync(EMAIL_FILE)) {
    return res.json({ message: "emails.json not found" });
  }

  const data = JSON.parse(fs.readFileSync(EMAIL_FILE, "utf8"));

  if (!data[category]) {
    return res.json({ message: "Invalid category" });
  }

  // Find unused email
  const nextEmail = data[category].find(item => item.used === false);

  if (!nextEmail) {
    return res.json({ message: "No emails left for this category" });
  }

  // Mark as used
  nextEmail.used = true;

  // Save updated file
  fs.writeFileSync(EMAIL_FILE, JSON.stringify(data, null, 2));

  // Send email to frontend
  res.json({ email: nextEmail.email });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
