const express=require('express');
const pool=require('./database');
const authenticateToken=require('./authentication');

const productroute=express.Router();

// ✅ Get All Products
productroute.get("/api/products", authenticateToken, async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM products");
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Failed to fetch products" });
    }
  });
  
  // ✅ Add a Product
  productroute.post("/products/add", async (req, res) => {
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
  productroute.put("/api/products/:id", authenticateToken, async (req, res) => {
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
  productroute.delete("/api/products/:id", authenticateToken, async (req, res) => {
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
  
  module.exports=productroute;