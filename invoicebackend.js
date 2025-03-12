const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = 5003;
const SECRET_KEY = "your_secret_key"; // Change this to a secure key
// Handle Preflight request (OPTIONS method)
app.options("/api/signup", cors());//ye mene joda h

app.use(bodyParser.json());
app.use(  
  cors({
    origin: [ "http://localhost:3000"], // ✅ Add both frontend URLs
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
    credentials: true, // Allow credentials like cookies or auth tokens
  })
);


// PostgreSQL database connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "Customer_Module",
  password: "12345",
  port: 5432,
});



pool
  .connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => console.error("Connection error", err.stack));

/* ========== User Authentication ========== */

// ✅ Signup (Register)
app.post("/api/signup", async (req, res) => {
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

// ✅ Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.rows[0].id }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ success: true, message: "Login successful", token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Error logging in" });
  }
});

// ✅ Middleware to protect routes
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) {
    return res.status(401).json({ success: false, message: "Access denied" });
  }

  try {
    const verified = jwt.verify(token.replace("Bearer ", ""), SECRET_KEY);
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ success: false, message: "Invalid token" });
  }
};

/* ========== Customer Management (Protected Routes) ========== */

// ✅ Get All Customers (Protected)
app.get("/api/customers", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT customer_id, first_name, last_name, email, company_name, phone FROM customers"
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch customers" });
  }
});

// ✅ Add a Customer (Protected)
app.post("/api/customers", authenticateToken, async (req, res) => {
  const {
    email, company_name, first_name, last_name, phone, mobile, address1, address2, city, state, zip_code, country, tax_id, fax, currency, language, is_active,billing_address1,billing_address2,billing_city,billing_state,billing_zip,billing_country
  } = req.body;

  if (!email || !company_name || !first_name || !last_name || !phone) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO customers (email, company_name, first_name, last_name, phone, mobile_no, address1, address2, city, state, zip_code, country , tax_id, fax, currency, language, is_active,billing_address1,billing_address2,billing_city,billing_state,billing_zip,billing_country) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23) RETURNING customer_id`,
      [email, company_name, first_name, last_name, phone, mobile, address1, address2, city, state, zip_code, country, tax_id, fax, currency, language, is_active,billing_address1,billing_address2,billing_city,billing_state,billing_zip,billing_country]
    );

    res.status(201).json({ success: true, message: "Customer added successfully", id: result.rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to add customer" });
  }
});

// ✅ Update Customer (Protected)
app.put("/api/customers/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { company_name, first_name, last_name, email, phone } = req.body;

  try {
    const result = await pool.query(
      "UPDATE customers SET company_name = $1, first_name = $2, last_name = $3, email = $4, phone = $5 WHERE id = $6 RETURNING *",
      [company_name, first_name, last_name, email, phone, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    res.json({ success: true, message: "Customer updated successfully", customer: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update customer" });
  }
});

// ✅ Delete Customer (Protected)
app.delete("/api/customers/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM customers WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    res.json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete customer" });
  }
});

/* ========== Product Management ========== */

// ✅ Get All Products
app.get("/api/products", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
});

// ✅ Add a Product
app.post("/products/add", async (req, res) => {
  try { 
    const { product_name,  product_code, hsn_sac_code, product_description, product_type, unit_price, tax_rate, currency } = req.body;
    
    const newProduct = await pool.query(
      "INSERT INTO products (product_name, product_code, product_hsn_code, product_description, product_type, unit_price, tax_rate, currency) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [product_name, product_code, hsn_sac_code, product_description, product_type, unit_price, tax_rate, currency]
    );

    res.json(newProduct.rows[0]);
  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).send("Server error");
  }
});

// ✅ Update a Product
app.put("/api/products/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    product_name, product_code, hsn_sac_code, product_description, 
    product_type, unit_price, tax_rate, currency
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE products SET 
       product_name = $1, product_code = $2, hsn_sac_code = $3, product_description = $4, 
       product_type = $5, unit_price = $6, tax_rate = $7, currency = $8 
       WHERE id = $9 RETURNING *`,
      [product_name, product_code, hsn_sac_code, product_description, 
       product_type, unit_price, tax_rate, currency, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Product updated successfully", product: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update product" });
  }
});

// ✅ Delete a Product
app.delete("/api/products/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM products WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete product" });
  }
});

//providing customer details for invoice 
app.get('/api/invoices/:customerNumber',authenticateToken, async(req,res)=>{
  const customerNumber=req.params.customerNumber;
    if(!customerNumber){
    res.status(401).json({success:false,message:"Field required"});
  }
  try{
     const customerdetails= await pool.query(`select * from customers where mobile_no =$1`,[customerNumber]);
     if(customerdetails.rowCount===0){
      console.log('Customer is not available');
     }
     res.json(customerdetails.rows);
  }
  catch(error){
   console.log(error);
   res.status(501).json({success:false,message:"server error for  customer"});
  }
});

// providing all products name for invoice
app.get('/api/productdetail/productName',authenticateToken, async(req,res)=>{
  try{
   const productName= await pool.query("select product_name from products");
   if(productName.rowCount===0){
    console.log('No Products available');
   }
   res.json(productName.rows);
  }
  catch(error){
    console.log(error);
    res.status(502).json({success:false,message:"server error for product"})
  }
}) ;
 
//providing products details according to productName
app.get('/api/productdetail/all/:productName',authenticateToken, async(req,res)=>{
 const productName=req.params.productName;
 if(!productName){
  res.status(401).json({success:false,message:"Field required"});
}
 try{
    const productdetails=await pool.query(`select * from products where product_name=$1`,[productName]);
    if(productdetails.rowCount===0){
      console.log("Product is not available");
    }
    res.json(productdetails.rows);
 }
 catch(error){
  console.log("Error adding invoice",error);
  res.status(503).json({success:false,message:" server error"});
 }
});

// invoice details submited and save to database
app.post('/api/invoices/submit', authenticateToken, async (req, res) => {
  const {
      invoiceDate,
      customerNumber,
      billing_address,
      shipping_address,
      references,
      subTotal,
      totalAmount,
      invoiceNotes,
      signature_box,
      productdetail
  } = req.body;

  const tax_amount = totalAmount - subTotal;

  try {
      const newInvoice = await pool.query(`
          INSERT INTO invoices (
              invoice_date,customer_id,mob_number,billing_address,shipping_address,reference,sub_total,total_amount,tax_amount,invoicenotes,signature_box)
             VALUES ( $1,(SELECT customer_id FROM customers WHERE mobile_no = $2),$2,$3,$4,$5,$6,$7,$8,$9,$10)
           RETURNING invoice_id`
     , [invoiceDate,customerNumber,billing_address,shipping_address, references, subTotal,totalAmount,tax_amount,invoiceNotes,signature_box]);
        const invoice_id=newInvoice.rows[0].invoice_id;
    
        for(const item of productdetail){
          const{productName,hsnCode,gstRate,unitPrice,quantity,total}=item;
          console.log(item);
      
      const newinvoice_item = await pool.query(`
        INSERT INTO invoice_item (invoice_id, product_id,  product_name,  product_hsn_code,  unit_price,  tax_rate,  quantity,  total_price)
         VALUES (  $1, (SELECT product_id FROM products WHERE product_hsn_code = $2 LIMIT 1),$3,$2,$4,$5,$6,$7)`,
     [invoice_id, hsnCode, productName, unitPrice, gstRate, quantity, total]);
        }
      res.status(201).json({ success: true, message: "Invoice added successfully"});
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server error" });
  }
});

// providing customer details for challan 
// app.get('/api/challan/:customerNumber',authenticateToken,async(req,res)=>{
//   const customerNumber=req.params.customerNumber;
//   if(!customerNumber){
//     res.status(401).json({success:false,message:"Field required"});
//   }
//   try{
//   const customerdetails= await pool.query(`select * from customers where mobile_no=$1`,[customerNumber]);
//   if(customerdetails.rowCount===0){
//     res.status(402).json({success:false,message:"Customer not available"})
//   }
//   res.json(customerdetails.rows);
//   }
//   catch(error){
//     console.log(error);
//     res.status(402).json({success:false,message:"server error"})
//   }
// }) ;
 
//provide productName for challan
// app.get('/api/challan/productdetails/productName',authenticateToken, async(req,res)=>{
//   try{
//    const productName= await pool.query("select product_name from products");
//    if(productName.rowCount===0){
//     console.log('No Products available');
//    }
//    res.json(productName.rows);
//   }
//   catch(error){
//     console.log(error);
//     res.status(502).json({success:false,message:"server error for product"})
//   }
// }) ;

//provide ProductDetails for challan 
app.get('/api/challan/productdetail/:productName',authenticateToken,async(req,res)=>{
  const productName=req.params.productName;
  try{
     const productdetails=await pool.query(`select * from Products where product_name=$1`,[productName]);
     if(productdetails.rowCount===0){
      console.log("Product not available");
      res.status(405).json({success:false,message:"Product not available"});
     }
     res.json(productdetails.rows);
  }
  catch(error){
    console.log(error);
    res.status(405).json({success:false ,message:"server error"});
  }

}) ;
//challan submition to database
app.post('/api/challan/submit', authenticateToken, async (req, res) => {
  const {
      challandate,
      customerNumber,
      billing_address,
      shipping_address,
      references,
      subTotal,
      totalAmount,
      challanNotes,
      signature_box,
      productdetail
  } = req.body;

  const tax_amount = totalAmount - subTotal;

  try {
      const newchallan = await pool.query(`
          INSERT INTO challan (
              challan_date,customer_id,mob_number,billing_address,shipping_address,reference,sub_total,total_amount,tax_amount,challannotes,signature_box)
             VALUES ( $1,(SELECT customer_id FROM customers WHERE mobile_no = $2),$2,$3,$4,$5,$6,$7,$8,$9,$10)
           RETURNING challan_id`
     , [challandate,customerNumber,billing_address,shipping_address, references, subTotal,totalAmount,tax_amount,challanNotes,signature_box]);
        const challan_id=newchallan.rows[0].challan_id;
    
        for(const item of productdetail){
          const{productName,hsnCode,gstRate,unitPrice,quantity,total}=item;
          // console.log(item);
      
      const newinvoice_item = await pool.query(`
        INSERT INTO challan_item (challan_id, product_id,  product_name,  product_hsn_code,  unit_price,  tax_rate,  quantity,  total_price)
         VALUES (  $1, (SELECT product_id FROM products WHERE product_name = $3 LIMIT 1),$3,$2,$4,$5,$6,$7)`,
     [challan_id, hsnCode, productName, unitPrice, gstRate, quantity, total]);
        }
      res.status(201).json({ success: true, message: "challan added successfully"});
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server error" });
  }
});

//get challan details of a customer from customer number
app.get('/api/challandetails/provideing/:customerNumber',authenticateToken,async(req,res)=>{
const customerNumber=req.params.customerNumber;
try{
  if(!customerNumber){
    res.status(401).json({message:"required customerNumber "})
  }
 const challandetails=await pool.query(`SELECT 
    c.challan_id,
    c.challan_date,
    c.mob_number ,
    c.billing_address,
    c.shipping_address,
    c.sub_total,
    c.tax_amount,
    c.total_amount,
    c.reference,
    c.challannotes,
    c.signature_box
FROM 
    public.challan c
JOIN 
    public.customers cu ON c.customer_id = cu.customer_id
WHERE 
    cu.mobile_no =$1;`,[customerNumber]);
    if(challandetails.rowCount===0){
      res.status(401).json({success:false,message:"challan not available"})
    }
    console.log(challandetails.rows)
   res.json(challandetails.rows); 
}
catch(error){
  console.log(error);
  res.status(401).json({success:false ,message:"server Error"})
}
});

//server start 
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));