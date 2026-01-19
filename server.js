const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());

const EMAIL_FILE = "./emails.json";

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
app.listen(PORT, () => console.log("Server running"));
