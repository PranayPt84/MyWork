const express=require('express');
const bcrypt = require("bcryptjs");
// const bodyParser=require('body-parser');
const signuproute=express.Router();
const pool=require('./database.js');


signuproute.post("/api/signup", async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
  
    try {
      const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      if (userExists.rows.length > 0) {
        return res.status(400).json({ success: false, message: "Email already exists" });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING userid, name, email",
        [username, email, hashedPassword]
      );
  
      res.status(201).json({ success: true, message: "User registered successfully", user: result.rows[0] });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ success: false, message: "Error registering user", error: error.message });
    }
  });



module.exports=signuproute;