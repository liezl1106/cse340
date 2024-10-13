const pool = require("../database/");

/* ***************************
 *  Get all classification data
 * ************************** */
async function getClassifications() {
  try {
    const result = await pool.query(
      "SELECT * FROM public.classification ORDER BY classification_name"
    );
    return result.rows; // Return the rows directly
  } catch (error) {
    console.error("Database query error in getClassifications:", error.message); // Log the error message
    console.error("Full error object:", error); // Log the full error object
    throw error; // Re-throw the error for handling in the controller
  }
}

/* ***************************
 *  Add a new classification
 * ************************** */
async function addClassification(classification_name) {
  const sql = `INSERT INTO public.classification (classification_name) 
    VALUES ($1) RETURNING classification_id`;

  try {
    const result = await pool.query(sql, [classification_name])
    return result.rows[0].classification_id; // Return the new classification ID
  } catch (error) {
    console.error("addClassification error: " + error)
    throw error; // Re-throw the error for handling in the controller
  }
}

/* ***************************
 *  Get all inventory items and classification_name by classification_id
 * ************************** */
async function getInventoryByClassificationId(classification_id) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory AS i 
      JOIN public.classification AS c 
      ON i.classification_id = c.classification_id 
      WHERE i.classification_id = $1`,
      [classification_id]
    );
    return data.rows
  } catch (error) {
    console.error("getInventoryByClassificationId error: " + error)
    throw error; // Re-throw the error for handling in the controller
  }
}

/* ***************************
 *  Get a single inventory vehicle by ID
 * ************************** */
async function getInventoryByInventoryId(inventoryId) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory
        INNER JOIN public.classification
        ON public.inventory.classification_id = public.classification.classification_id
        WHERE inv_id = $1`,
      [inventoryId]
    );
    return data.rows[0] // Return the first row or null if not found
  } catch (error) {
    console.error("getInventoryByInventoryId error: " + error)
    throw error; // Re-throw the error for handling in the controller
  }
}

/* ***************************
 *  Add a single inventory item
 * ************************** */
async function addInventory(item) {
  const sql = `INSERT INTO public.inventory 
    (inv_make, inv_model, inv_year, inv_description, 
    inv_image, inv_thumbnail, inv_price, inv_miles, 
    inv_color, classification_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`

  try {
    await pool.query(sql, [
      item.inv_make,
      item.inv_model,
      item.inv_year,
      item.inv_description,
      item.inv_image,
      item.inv_thumbnail,
      item.inv_price,
      item.inv_miles,
      item.inv_color,
      item.classification_id,
    ])
  } catch (error) {
    console.error("addInventory error: " + error)
    throw error; // Re-throw the error for handling in the controller
  }
}

module.exports = {
  getClassifications,
  addClassification,
  getInventoryByClassificationId,
  getInventoryByInventoryId,
  addInventory,
}