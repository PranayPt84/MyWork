const express=require('express');
const pool=require('./database');
const authenticateToken=require('./authentication');

const customerroute=express.Router();

customerroute.get("/api/customers",  authenticateToken, async (req, res) => {
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
  customerroute.post("/api/customers",  authenticateToken, async (req, res) => {
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
  customerroute.put("/api/customers/:id", authenticateToken, async (req, res) => {
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
  customerroute.delete("/api/customers/:id", authenticateToken, async (req, res) => {
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
  
  module.exports=customerroute;