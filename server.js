const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// serve public folder
app.use(express.static(path.join(__dirname, "public")));

const EMAIL_FILE = path.join(__dirname, "emails.json");

// serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// email API
app.get("/email", (req, res) => {
  const category = req.query.category;

  if (!category) {
    return res.status(400).json({ message: "Category missing" });
  }

  if (!fs.existsSync(EMAIL_FILE)) {
    return res.status(500).json({ message: "emails.json not found" });
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(EMAIL_FILE, "utf8"));
  } catch {
    return res.status(500).json({ message: "Invalid JSON format" });
  }

  if (!data[category]) {
    return res.status(404).json({ message: "Invalid category" });
  }

  const nextEmail = data[category].find(e => !e.used);

  if (!nextEmail) {
    return res.json({ message: "No emails left for this category" });
  }

  nextEmail.used = true;
  fs.writeFileSync(EMAIL_FILE, JSON.stringify(data, null, 2));

  res.json({ email: nextEmail.email });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
