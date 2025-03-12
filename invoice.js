const express=require('express');
const authenticateToken=require('./authentication');
const pool=require('./database');

const invoiceroute=express.Router();

invoiceroute.get('/api/invoices/:customerNumber',authenticateToken, async(req,res)=>{
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
  invoiceroute.get('/api/productdetail/productName',authenticateToken, async(req,res)=>{
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
  invoiceroute.get('/api/productdetail/all/:productName',authenticateToken, async(req,res)=>{
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
    console.log(error);
    res.status(503).json({success:false,message:" server error"});
   }
  });
  // invoice details submited and save to database
  invoiceroute.post('/api/invoices/submit', authenticateToken, async (req, res) => {
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

module.exports=invoiceroute;