const { Pool } = require("pg");
require("dotenv").config();

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


  module.exports=pool;