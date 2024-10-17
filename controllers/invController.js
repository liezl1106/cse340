const { validationResult } = require('express-validator')
const invModel = require("../models/inventory-model")
const utilities = require("../utilities")

const invCont = {}

/* ***************************
 *  Build inventory by classification view
 *************************** */
invCont.buildByClassificationId = async function (req, res, next) {
    const classification_id = req.params.classificationId
    const data = await invModel.getInventoryByClassificationId(classification_id)

    let grid
    let className
    if (data.length) {
        grid = await utilities.buildClassificationGrid(data);
        className = data[0].classification_name;
    } else {
        grid = "";
        className = "No"
    }
    
    let nav = await utilities.getNav();
    res.render("inventory/classification", {
        title: `${className} vehicles`,
        nav,
        grid,
    })
}

/* ***************************
 *  Build the view to display a single vehicle
 *************************** */
invCont.buildByInventoryId = async function (req, res, next) {
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
      const vehicleData = await invModel.getInventoryByInventoryId(vehicleId)
      const nav = await utilities.getNav()
  
      if (!vehicleData) {
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
invCont.addClassification = async function (req, res, next) {
    const { classification_name } = req.body

    const response = await invModel.addClassification(classification_name);
    let nav = await utilities.getNav(); // After query, so it shows new classification
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
invCont.buildAddInventory = async function (req, res, next) {
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
invCont.addInventory = async function (req, res, next) {
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
invCont.getInventoryJSON = async (req, res, next) => {
    const classification_id = parseInt(req.params.classification_id)
    const invData = await invModel.getInventoryByClassificationId(classification_id)
    if (invData[0].inv_id) {
      return res.json(invData)
    } else {
      next(new Error("No data returned"))
    }
  }

  invCont.buildEditInventory = async function (req, res, next) {
    const inventoryId = req.params.inventoryId; // Ensure this matches the route
    let nav = await utilities.getNav();
    
    try {
        const itemData = await invModel.getInventoryByInventoryId(inventoryId); // Fetch item
        if (!itemData || itemData.length === 0) { // Check if data is returned
            console.error("Item not found for ID:", inventoryId);
            return res.status(404).render("errors/error", {
                title: "Item Not Found",
                message: "The item you are trying to edit does not exist.",
                nav,
            });
        }

        const classificationSelect = await utilities.buildClassificationList(itemData[0].classification_id); // Corrected to access the first item
        const itemName = `${itemData[0].inv_make} ${itemData[0].inv_model}`;
        
        res.render("inventory/editInventory", {
            title: "Edit " + itemName,
            nav,
            classificationSelect,
            errors: null,
            inv_id: itemData[0].inv_id,
            inv_make: itemData[0].inv_make,
            inv_model: itemData[0].inv_model,
            inv_year: itemData[0].inv_year,
            inv_description: itemData[0].inv_description,
            inv_image: itemData[0].inv_image,
            inv_thumbnail: itemData[0].inv_thumbnail,
            inv_price: itemData[0].inv_price,
            inv_miles: itemData[0].inv_miles,
            inv_color: itemData[0].inv_color,
            classification_id: itemData[0].classification_id
        });
    } catch (error) {
        console.error("Error fetching inventory data:", error);
        res.status(500).render("errors/error", {
            title: "Internal Server Error",
            message: "An error occurred while trying to fetch the inventory item.",
            nav,
        });
    }
};

module.exports = invCont