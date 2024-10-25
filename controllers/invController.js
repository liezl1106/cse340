const { validationResult } = require('express-validator')
const invModel = require("../models/inventory-model")
const utilities = require("../utilities")

const invCont = {}

/* ***************************
 *  Build inventory by classification view
 *************************** */
invCont.buildByClassificationId = async function (req, res) {
    const classification_id = req.params.classificationId
    const data = await invModel.getInventoryByClassificationId(classification_id)

    let grid
    let className
    if (data.length) {
        grid = await utilities.buildClassificationGrid(data)
        className = data[0].classification_name
    } else {
        grid = ""
        className = "No"
    }
    
    let nav = await utilities.getNav()
    res.render("inventory/classification", {
        title: `${className} vehicles`,
        nav,
        grid,
    })
}

/* ***************************
 *  Build the view to display a single vehicle
 *************************** */
invCont.buildByInventoryId = async function (req, res) {
    const inventoryId = req.params.inventoryId
    const data = await invModel.getInventoryByInventoryId(inventoryId)
    const listing = await utilities.buildItemListing(data[0])
    let nav = await utilities.getNav()
    const itemName = `${data[0].inv_make} ${data[0].inv_model}`

    res.render("inventory/listing", {
        title: itemName,
        nav,
        listing,
    })
}

/* ***************************
 *  Get vehicle detail by ID
 * ************************** */
invCont.getVehicleDetail = async (req, res) => {
  const { id: vehicleId } = req.params

  try {
      console.log("Fetching vehicle details for ID:", vehicleId)
      const vehicleData = await invModel.getInventoryByInventoryId(vehicleId)
      console.log("Fetched vehicle data:", vehicleData);

      const nav = await utilities.getNav()

      if (!vehicleData) {
          console.error("No vehicle found for ID:", vehicleId)
          return res.status(404).render("errors/error", {
              title: "Vehicle Not Found",
              message: "The vehicle you are looking for does not exist.",
              nav,
          })
      }

      res.render("inventory/vehicleDetail", {
          title: `${vehicleData.inv_make} ${vehicleData.inv_model}`,
          vehicle: vehicleData,
          nav,
      })
  } catch (error) {
      console.error("Error fetching vehicle details:", error)
      res.status(500).render("errors/error", {
          title: "Internal Server Error",
          message: "An error occurred while fetching vehicle details.",
          nav: await utilities.getNav(),
      })
  }
}
  
/* ***************************
 *  Build the main vehicle management view
 *************************** */
invCont.buildManagementView = async (req, res) => {
    const nav = await utilities.getNav()
    const classificationSelect = await utilities.buildClassificationList()

    res.render("inventory/management", {
        title: "Vehicle Management",
        nav,
        errors: null,
        classificationSelect,
    })
}

/* ***************************
 *  Build the add classification view
 *************************** */
invCont.buildAddClassification = async (req, res) => {
    const nav = await utilities.getNav();

    res.render("inventory/addClassification", {
        title: "Add New Classification",
        nav,
        errors: null,
    })
}

/* ***************************
 *  Handle post request to add a vehicle classification
 *************************** */
invCont.addClassification = async function (req, res) {
    const { classification_name } = req.body

    const response = await invModel.addClassification(classification_name)
    let nav = await utilities.getNav() // After query, so it shows new classification
    if (response) {
        req.flash(
            "notice",
            `The "${classification_name}" classification was successfully added.`
        );
        res.render("inventory/management", {
            title: "Vehicle Management",
            errors: null,
            nav,
            classification_name,
        });
    } else {
        req.flash("notice", `Failed to add ${classification_name}`)
        res.render("inventory/addClassification", {
            title: "Add New Classification",
            errors: null,
            nav,
            classification_name,
        })
    }
}

/* ***************************
 *  Build the add inventory view
 *************************** */
invCont.buildAddInventory = async function (req, res) {
  try {
      const nav = await utilities.getNav()
      const classifications = await utilities.buildClassificationList()

      res.render("inventory/addInventory", {
          title: "Add Vehicle",
          errors: null,
          nav,
          classifications,
      })
  } catch (error) {
      console.error("Error building add inventory view:", error)
      res.status(500).render("errors/error", {
          title: "Internal Server Error",
          message: "An error occurred while building the add inventory view.",
          nav: await utilities.getNav(),
      })
  }
}

/* ***************************
 *  Handle post request to add a vehicle to the inventory
 *************************** */
invCont.addInventory = async function (req, res) {
    const nav = await utilities.getNav()

    const {
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
    } = req.body;

    const response = await invModel.addInventory(
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
    );

    if (response) {
        req.flash(
            "notice",
            `The ${inv_year} ${inv_make} ${inv_model} successfully added.`
        );
        const classificationSelect = await utilities.buildClassificationList(classification_id)
        res.render("inventory/management", {
            title: "Vehicle Management",
            nav,
            classificationSelect,
            errors: null,
        })
    } else {
        req.flash("notice", "There was a problem.")
        res.render("inventory/addInventory", {
            title: "Add Vehicle",
            nav,
            errors: null,
        })
    }
}

/* ***************************
 *  Return Inventory by Classification As JSON
 *************************** */
invCont.getInventoryJSON = async (req, res) => {
  const classification_id = parseInt(req.params.classification_id)
  
  try {
      const invData = await invModel.getInventoryByClassificationId(classification_id)

      if (invData.length === 0) {
          return res.status(404).json({ message: "No inventory found." })
      }

      return res.json(invData)
  } catch (error) {
      console.error("Error fetching inventory data:", error)
      return res.status(500).json({ message: "An error occurred while fetching inventory data." })
  }
}

/* ***************************
 *  Build edit inventory view
 * ************************** */
invCont.editInventoryView = async function (req, res, next) {
    const inv_id = parseInt(req.params.inv_id)
    let nav = await utilities.getNav()
    const itemData = await invModel.getInventoryById(inv_id)
    const classificationSelect = await utilities.buildClassificationList(itemData.classification_id)
    const itemName = `${itemData.inv_make} ${itemData.inv_model}`
    res.render("./inventory/edit-inventory", {
      title: "Edit " + itemName,
      nav,
      classificationSelect: classificationSelect,
      errors: null,
      inv_id: itemData.inv_id,
      inv_make: itemData.inv_make,
      inv_model: itemData.inv_model,
      inv_year: itemData.inv_year,
      inv_description: itemData.inv_description,
      inv_image: itemData.inv_image,
      inv_thumbnail: itemData.inv_thumbnail,
      inv_price: itemData.inv_price,
      inv_miles: itemData.inv_miles,
      inv_color: itemData.inv_color,
      classification_id: itemData.classification_id
    })
}

/* ***************************
 *  Update Inventory Data
 *************************** */
invCont.updateInventory = async function (req, res, next) {
    let nav = await utilities.getNav();
    const {
        inv_id,
        inv_make,
        inv_model,
        inv_description,
        inv_image,
        inv_thumbnail,
        inv_price,
        inv_year,
        inv_miles,
        inv_color,
        classification_id,
    } = req.body;

    try {
        // Update the inventory item
        const updateResult = await invModel.updateInventory(
            inv_id,  
            inv_make,
            inv_model,
            inv_description,
            inv_image,
            inv_thumbnail,
            inv_price,
            inv_year,
            inv_miles,
            inv_color,
            classification_id
        );

        // Check if the update was successful
        if (updateResult) {
            const itemName = `${inv_make} ${inv_model}`;
            req.flash("notice", `The ${itemName} was successfully updated.`);
            res.redirect("/inv/management"); // Redirect to the management page
        } else {
            throw new Error("Update failed"); // Explicitly throw an error
        }
    } catch (error) {
        console.error("Error updating inventory:", error.message);

        // Build classification list for the form
        const classifications = await invModel.getClassifications(); // Get all classifications
        const classificationSelect = await utilities.buildClassificationList(classification_id);

        // Set an error flash message
        req.flash("notice", "Sorry, the update failed. Please try again.");

        // Render the edit view with current data and error message
        res.status(400).render("inventory/editInventory", {
            title: "Edit " + itemName,
            nav,
            classifications, // Pass classifications to the view
            classificationSelect,
            errors: null, // Adjust as necessary for actual validation errors
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
        });
    }
};

/* ***************************
 *  Build the Delete Inventory View
 *************************** */
invCont.buildDeleteInventory = async function (req, res) {
  const inventoryId = parseInt(req.params.inventoryId);
  const nav = await utilities.getNav();

  try {
    const inventoryData = await invModel.getInventoryByInventoryId(inventoryId);

    if (!inventoryData) {
      return res.status(404).render("errors/error", {
        title: "Vehicle Not Found",
        message: "No vehicle found with the provided ID.",
        nav,
      });
    }

    const name = `${inventoryData.inv_make} ${inventoryData.inv_model}`;

    res.render("inventory/delete-confirm", {
      title: "Delete " + name,
      errors: null,
      nav,
      inv_id: inventoryData.inv_id,
      inv_make: inventoryData.inv_make,
      inv_model: inventoryData.inv_model,
      inv_year: inventoryData.inv_year,
      inv_price: inventoryData.inv_price,
    });
  } catch (error) {
    console.error("Error fetching inventory data:", error);
    res.status(500).render("errors/error", {
      title: "Internal Server Error",
      message: "An error occurred while fetching the vehicle data.",
      nav,
    });
  }
};

/* ***************************
 *  Delete Inventory Data
 *************************** */
invCont.deleteInventory = async function (req, res) {
  const nav = await utilities.getNav();
  const inventoryId = parseInt(req.body.inv_id)
  const {
    inv_id,
    inv_make,
    inv_model,
    inv_year,
    inv_price,
  } = req.body

  const queryResponse = await invModel.deleteInventory(inventoryId)
  const itemName = `${inv_make} ${inv_model}`

  if (queryResponse) {
    req.flash("notice", `The ${itemName} was successfully deleted.`)
    res.redirect("/inv/")
  } else {

    req.flash("notice", "Sorry, the update failed.")
    res.status(501).render("inventory/delete-confirm", {
      title: "Delete " + itemName,
      nav,
      errors: null,
      inv_id,
      inv_make,
      inv_model,
      inv_year,
      inv_price,
    })
  }
}

/* ***************************
 *  Build Inventory Data
 *************************** */
invCont.buildEditInventory = async function (req, res, next) {
    const inventoryId = parseInt(req.params.inventoryId);
    let nav = await utilities.getNav();

    try {
        // Fetch item data based on inventoryId
        const itemData = await invModel.getInventoryByInventoryId(inventoryId);
        console.log("Item Data:", itemData);

        // Check if itemData is returned and has classification_id
        if (!itemData || !itemData.classification_id) {
            console.error("Item not found or classification_id missing for ID:", inventoryId);
            return res.status(404).render("errors/error", {
                title: "Item Not Found",
                message: "The item you are trying to edit does not exist.",
                nav,
            });
        }

        // Fetch classifications for the dropdown
        const classifications = await invModel.getClassifications(); // Adjust this to your actual function

        // Build classification select options
        const classificationSelect = await utilities.buildClassificationList(itemData.classification_id);
        const itemName = `${itemData.inv_make} ${itemData.inv_model}`;

        // Render the edit inventory view
        res.render("inventory/editInventory", {
            title: "Edit " + itemName,
            nav,
            classifications, // Pass classifications to the view
            classificationSelect,
            errors: null,
            inv_id: itemData.inv_id,
            inv_make: itemData.inv_make,
            inv_model: itemData.inv_model,
            inv_year: itemData.inv_year,
            inv_description: itemData.inv_description,
            inv_image: itemData.inv_image,
            inv_thumbnail: itemData.inv_thumbnail,
            inv_price: itemData.inv_price,
            inv_miles: itemData.inv_miles,
            inv_color: itemData.inv_color,
            classification_id: itemData.classification_id
        });
    } catch (error) {
        console.error("Error fetching inventory data:", JSON.stringify(error));
        res.status(500).render("errors/error", {
            title: "Internal Server Error",
            message: "An error occurred while trying to fetch the inventory item.",
            nav,
        })
    }
}

module.exports = invCont