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
  const { id: vehicleId } = req.params;

  try {
      const vehicleData = await invModel.getInventoryByInventoryId(vehicleId);
      const nav = await utilities.getNav();

      if (!vehicleData) {
          return res.status(404).render("errors/error", {
              title: "Vehicle Not Found",
              message: "The vehicle you are looking for does not exist.",
              nav,
          });
      }

      res.render("inventory/vehicleDetail", {
          title: `${vehicleData.inv_make} ${vehicleData.inv_model}`,
          vehicle: vehicleData,
          nav,
      });
  } catch (error) {
      console.error("Error fetching vehicle details:", error);
      res.status(500).render("errors/error", {
          title: "Internal Server Error",
          message: "An error occurred while fetching vehicle details.",
          nav: await utilities.getNav(),
      });
  }
};
  
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
    const nav = await utilities.getNav()
    const classifications = await utilities.buildClassificationList()

    res.render("inventory/addInventory", {
        title: "Add Vehicle",
        errors: null,
        nav,
        classifications,
    })
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
 * ************************** */
invCont.getInventoryJSON = async (req, res) => {
    const classification_id = parseInt(req.params.classification_id)
    const invData = await invModel.getInventoryByClassificationId(classification_id)
    if (invData[0].inv_id) {
      return res.json(invData)
    } else {
      next(new Error("No data returned"))
    }
  }

/* ***************************
 *  Build the edit inventory view
 *************************** */
invCont.buildEditInventory = async function (req, res) {
  const inventoryId = parseInt(req.params.inventoryId);
  
  try {
    const inventoryData = await invModel.getInventoryByInventoryId(inventoryId);
    const classifications = await utilities.buildClassificationList(); // Fetch classifications
    const nav = await utilities.getNav(); // Fetch navigation data

    if (!inventoryData) {
      return res.status(404).render("errors/error", {
        title: "Vehicle Not Found",
        message: "No vehicle found with the provided ID.",
      });
    }

    res.render("inventory/editInventory", {
      title: `Edit ${inventoryData.inv_make} ${inventoryData.inv_model}`,
      inventoryData,
      classifications, // Pass classifications to the view
      nav, // Pass nav to the view
      errors: null, // Pass null for errors initially
    });
  } catch (error) {
    console.error("Error fetching inventory data:", error);
    res.status(500).render("errors/error", {
      title: "Internal Server Error",
      message: "An error occurred while fetching the vehicle data.",
    });
  }
};

/* ***************************
 *  Update Inventory Data
 *************************** */
invCont.updateInventory = async function (req, res) {
  const nav = await utilities.getNav();
  const errors = validationResult(req); // Check for validation errors

  // Debugging: Log validation errors
  if (!errors.isEmpty()) {
    console.log("Validation Errors:", errors.array());
    const classifications = await utilities.buildClassificationList(req.body.classification_id);
    return res.render("inventory/editInventory", {
      title: `Edit Vehicle`,
      nav,
      errors: errors.array(), // Pass the validation errors
      inv_id: req.body.inv_id,
      inv_make: req.body.inv_make,
      inv_model: req.body.inv_model,
      inv_year: req.body.inv_year,
      inv_description: req.body.inv_description,
      inv_image: req.body.inv_image,
      inv_thumbnail: req.body.inv_thumbnail,
      inv_price: req.body.inv_price,
      inv_miles: req.body.inv_miles,
      inv_color: req.body.inv_color,
      classifications,
    });
  }

  const {
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
    classification_id,
  } = req.body;

  try {
    const updatedItem = await invModel.updateInventory(
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
    );

    // Debugging: Log updated item
    console.log("Updated Item:", updatedItem);

    // Check if the update was successful
    if (updatedItem) {
      const itemName = `${updatedItem.inv_make} ${updatedItem.inv_model}`;
      req.flash("notice", `The ${itemName} was successfully updated.`);
      return res.redirect("/inv/");
    }

  } catch (error) {
    console.error("Update Inventory Error:", error);
    req.flash("notice", "Sorry, the update failed. Please try again.");
    const classifications = await utilities.buildClassificationList(classification_id);

    return res.status(501).render("inventory/editInventory", {
      title: `Edit ${inv_make} ${inv_model}`,
      nav,
      errors: null,
      classifications,
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
      classification_id,
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

module.exports = invCont