const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");




//local file includes
const signuproute=require('./signup');
const login=require('./login');
const customerroute=require('./customer');
const productroute=require('./product');
const invoiceroute=require('./invoice');

const app = express();
const PORT = 5003;
const SECRET_KEY = "your_secret_key"; // Change this to a secure key
// Handle Preflight request (OPTIONS method)
app.options("/api/signup", cors());

app.use(bodyParser.json());
app.use(  
  cors({
    origin: [ "http://localhost:5003"], // ✅ Add both frontend URLs
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"], 
    credentials: true, // Allow credentials like cookies or auth tokens
  })
);


app.use(signuproute);
app.use(login);
app.use(customerroute);
app.use(productroute);
app.use(invoiceroute);


 
// Start the server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
