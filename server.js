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
  const { category } = req.query;

  if (!category) {
    return res.json({ message: "Category missing" });
  }

  const data = JSON.parse(fs.readFileSync("emails.json", "utf8"));

  if (!data[category]) {
    return res.json({ message: "Invalid category" });
  }

  const nextEmail = data[category].find(e => !e.used);

  if (!nextEmail) {
    return res.json({ message: "No emails left for this category" });
  }

  nextEmail.used = true;
  fs.writeFileSync("emails.json", JSON.stringify(data, null, 2));

  res.json({ email: nextEmail.email });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
