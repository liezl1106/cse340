const pool = require("../database/");

/* ***************************
 *  Get all classification data
 * ************************** */
async function getClassifications() {
  try {
    return await pool.query(
      "SELECT * FROM public.classification ORDER BY classification_name"
    );
  } catch (error) {
    console.error("Error fetching classifications:", error)
    throw error
  }
}

async function addClassification(classification_name) {
  const sql = `INSERT INTO public.classification (classification_name) VALUES ($1)`

  try {
    return await pool.query(sql, [classification_name])
  } catch (error) {
    console.error("Error adding classification:", error)
    throw error; // Propagate error
  }
}

/* ***************************
 *  Get inventory items by classification_id
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
    return data.rows; // This could be empty if no data is found
  } catch (error) {
    console.error("Error fetching inventory by classification ID:", error)
    throw error 
  }
}

/* ***************************
 *  Get a single inventory item by id
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
      return data.rows[0] || null; // Return the first item or null if not found
  } catch (error) {
      console.error("getInventoryByInventoryId error:", error);
      throw error; // Ensure this error can be caught in the controller
  }
}

/*******************************
 * Add a single inventory item
 *******************************/
async function addInventory(
  inv_make,
  inv_model,
  inv_year,
  inv_description,
  inv_image,
  inv_thumbnail,
  inv_price,
  inv_miles,
  inv_color,
  classification_id
) {
  const sql = `INSERT INTO public.inventory 
    (inv_make, inv_model, inv_year, inv_description, inv_image, inv_thumbnail, inv_price, inv_miles, inv_color, classification_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;

  try {
    return await pool.query(sql, [
      inv_make,
      inv_model,
      inv_year,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_miles,
      inv_color,
      classification_id,
    ]);
  } catch (error) {
    console.error("Error adding inventory item:", error)
    throw error; // Propagate error
  }
}

/*******************************
 * Update Inventory Data
 *******************************/
async function updateInventory(
  inv_id,
  inv_make,
  inv_model,
  inv_year,
  inv_description,
  inv_image,
  inv_thumbnail,
  inv_price,
  inv_miles,
  inv_color,
  classification_id
) {
  const sql = `UPDATE public.inventory 
               SET inv_make = $1, 
                   inv_model = $2, 
                   inv_year = $3, 
                   inv_description = $4, 
                   inv_image = $5, 
                   inv_thumbnail = $6, 
                   inv_price = $7, 
                   inv_miles = $8, 
                   inv_color = $9, 
                   classification_id = $10 
               WHERE inv_id = $11 
               RETURNING *`;

  try {
    const result = await pool.query(sql, [
      inv_make,
      inv_model,
      inv_year,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_miles,
      inv_color,
      classification_id,
      inv_id,
    ]);

    return result.rows[0] || null // Return updated row or null if not found
  } catch (error) {
    console.error("Error updating inventory item:", error)
    throw error 
  }
}

/*******************************
 * Delete Inventory Data
 *******************************/
async function deleteInventory(inv_id) {
  const sql = "DELETE FROM inventory WHERE inv_id = $1"
  try {
    return await pool.query(sql, [inv_id])
  } catch (error) {
    console.error("Error deleting inventory item:", error)
    throw error; // Propagate error
  }
}

module.exports = {
  getClassifications,
  getInventoryByClassificationId,
  getInventoryByInventoryId,
  addClassification,
  addInventory,
  updateInventory,
  deleteInventory,
}