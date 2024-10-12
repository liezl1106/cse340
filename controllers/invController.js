const { validationResult } = require('express-validator')
const invModel = require("../models/inventory-model")
const utilities = require("../utilities")

const invCont = {}

/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async (req, res) => {
  const { classificationId } = req.params

  try {
    const data = await invModel.getInventoryByClassificationId(classificationId)
    const nav = await utilities.getNav()

    const grid = data.length 
      ? await utilities.buildClassificationGrid(data) 
      : ""
    const className = data.length ? data[0].classification_name : "No vehicles found"

    res.render("inventory/classification", {
      title: `${className} vehicles`,
      nav,
      grid,
    })
  } catch (error) {
    console.error("Error fetching classification data:", error)
    res.status(500).render("errors/error", {
      title: "Internal Server Error",
      message: "An error occurred while fetching data.",
      nav: await utilities.getNav(),
    })
  }
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
 *  Manage Inventory
 * ************************** */
invCont.manageInventory = async (req, res) => {
  try {
    const classifications = await invModel.getClassifications()
    const inventoryItems = await invModel.getAllInventory();
    const classificationSelect = await utilities.buildClassificationSelect(classifications)
    const nav = await utilities.getNav()

    res.render("inventory/manage-inventory", {
      title: "Inventory Management",
      classifications,
      inventoryItems,
      classificationSelect,
      nav,
      messages: req.flash("info"),
      errors: req.flash("errors"),
    });
  } catch (error) {
    console.error("Error fetching inventory management data:", error)
    res.status(500).render("errors/error", {
      title: "Internal Server Error",
      message: "An error occurred while fetching inventory management data.",
      nav: await utilities.getNav(),
    })
  }
}

/* ***************************
 *  Add a new classification
 * ************************** */
invCont.addClassification = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash("errors", errors.array())
    return res.redirect("/inv/add-classification")
  }

  try {
    await invModel.addClassification(req.body.classification_name)
    req.flash("info", "Classification added successfully!")
    res.redirect("/inv/manage-inventory")
  } catch (error) {
    console.error("Error adding classification:", error)
    req.flash("errors", [{ msg: "Error adding classification. Please try again." }])
    res.redirect("/inv/add-classification")
  }
}

/* ***************************
 *  Add a new inventory item
 * ************************** */
invCont.addInventory = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    // If there are validation errors, render the form again with errors and the submitted data
    req.flash("errors", errors.array())
    const classifications = await invModel.getClassifications()  // Get classifications for the dropdown
    return res.render("inventory/add-inventory", {
      title: "Add Vehicle",
      inv_make: req.body.inv_make,
      inv_model: req.body.inv_model,
      inv_year: req.body.inv_year,
      inv_description: req.body.inv_description,
      inv_image: req.body.inv_image,
      inv_thumbnail: req.body.inv_thumbnail,
      inv_price: req.body.inv_price,
      inv_miles: req.body.inv_miles,
      inv_color: req.body.inv_color,
      classification_id: req.body.classification_id,  // Preserve the classification
      classifications,
      messages: req.flash("info"),
      errors: req.flash("errors"),
    })
  }

  try {
    await invModel.addInventory(req.body)
    req.flash("info", "Vehicle added successfully!")
    res.redirect("/inv/manage-inventory")
  } catch (error) {
    console.error("Error adding vehicle:", error)
    req.flash("errors", [{ msg: "Error adding vehicle. Please try again." }])
    res.redirect("/inv/add-inventory")
  }
}

module.exports = invCont