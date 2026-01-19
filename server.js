const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static("public"));

const EMAIL_FILE = path.join(__dirname, "emails.json");

// Root route (loads index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API route
app.get("/email", (req, res) => {
  let emails = JSON.parse(fs.readFileSync(EMAIL_FILE, "utf8"));

  const nextEmail = emails.find(e => e.used === false);

  if (!nextEmail) {
    return res.json({ message: "All emails are already used" });
  }

  nextEmail.used = true;
  fs.writeFileSync(EMAIL_FILE, JSON.stringify(emails, null, 2));

  res.json({ email: nextEmail.email });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
