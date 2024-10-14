const { validationResult } = require('express-validator');
const invModel = require("../models/inventory-model");
const utilities = require("../utilities");

const invCont = {};

/* ***************************
 *  Build inventory by classification view
 *************************** */
invCont.buildByClassificationId = async (req, res) => {
  const { classificationId } = req.params;

  try {
    const data = await invModel.getInventoryByClassificationId(classificationId);
    const nav = await utilities.getNav();

    const grid = data.length 
      ? await utilities.buildClassificationGrid(data) 
      : "";
    const className = data.length ? data[0].classification_name : "No vehicles found";

    res.render("inventory/classification", {
      title: `${className} vehicles`,
      nav,
      grid,
    });
  } catch (error) {
    console.error("Error fetching classification data:", error);
    res.status(500).render("errors/error", {
      title: "Internal Server Error",
      message: "An error occurred while fetching data.",
      nav: await utilities.getNav(),
    });
  }
};

/* ***************************
 *  Get vehicle detail by ID
 *************************** */
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
  const nav = await utilities.getNav();
  const classificationSelect = await utilities.buildClassificationList();

  res.render("inventory/management", {
    title: "Vehicle Management",
    errors: null,
    nav,
    classificationSelect,
  });
};

/* ***************************
 *  Build the add classification view
 *************************** */
invCont.buildAddClassification = async (req, res) => {
  const nav = await utilities.getNav();

  res.render("inventory/addClassification", {
    title: "Add New Classification",
    nav,
    errors: null,
  });
};

/* ***************************
 *  Handle post request to add a vehicle classification
 *************************** */
invCont.addClassification = async function (req, res, next) {
  const { classification_name } = req.body;

  const response = await invModel.addClassification(classification_name); // ...to a function within the inventory model...
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
    req.flash("notice", `Failed to add ${classification_name}`);
    res.render("inventory/addClassification", {
      title: "Add New Classification",
      errors: null,
      nav,
      classification_name,
    });
  }
};

/* ***************************
 *  Build the add inventory view
 *************************** */
invCont.buildAddInventory = async function (req, res, next) {
  const nav = await utilities.getNav();
  let classifications = await utilities.buildClassificationList();

  res.render("inventory/addInventory", {
    title: "Add Vehicle",
    errors: null,
    nav,
    classifications,
  });
};

/* ***************************
 *  Handle post request to add a vehicle to the inventory
 *************************** */
invCont.addInventory = async function (req, res, next) {
  const nav = await utilities.getNav();

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
    const classificationSelect = await utilities.buildClassificationList(classification_id);
    res.render("inventory/management", {
      title: "Vehicle Management",
      nav,
      classificationSelect,
      errors: null,
    });
  } else {
    // This seems to never get called. Is this just for DB errors?
    req.flash("notice", "There was a problem.");
    res.render("inventory/addInventory", {
      title: "Add Vehicle",
      nav,
      errors: null,
    });
  }
};

module.exports = invCont;