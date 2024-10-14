const utilities = require("../utilities")
const invModel = require("../models/inventory-model")
const { body, validationResult } = require("express-validator")
const validate = {}

/* **********************************
 *  Add classification Data Validation Rules
 * ********************************* */
validate.classificationRules = () => {
  return [
    body("classification_name")
      .trim()
      .escape()
      .notEmpty()
      .isAlphanumeric()
      .withMessage("Please provide a valid classification name."),
  ]
}

/* ******************************
 * Check classification data
 * ***************************** */
validate.checkClassificationData = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const nav = await utilities.getNav();
    return res.render("inventory/addClassification", {
      errors: errors.array(),
      title: "Add Classification",
      nav,
      classification_name: req.body.classification_name,
    })
  }
  next()
}

/* **********************************
 *  Add inventory Data Validation Rules
 * ********************************* */
validate.inventoryRules = () => {
  return [
    body("inv_make").trim().escape().notEmpty().withMessage("Make value is missing."),
    body("inv_model").trim().escape().notEmpty().withMessage("Please provide a model."),
    body("inv_year").trim().escape().isNumeric().withMessage("Year must be a number."),
    body("inv_description").trim().escape().notEmpty().withMessage("Please provide a description."),
    body("inv_image").trim().escape().notEmpty().withMessage("Please provide an image."),
    body("inv_thumbnail").trim().escape().notEmpty().withMessage("Please provide a thumbnail."),
    body("inv_price").trim().escape().isNumeric().withMessage("Price must be a number."),
    body("inv_miles").trim().escape().isNumeric().withMessage("Miles must be a number."),
    body("inv_color").trim().escape().notEmpty().withMessage("Please provide a color."),
    body("classification_id").trim().escape().isInt().withMessage("Please provide a valid classification ID."),
  ]
}

/* ******************************
 * Check inventory data
 * ***************************** */
validate.checkInventoryData = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const nav = await utilities.getNav();
    return res.render("inventory/addInventory", {
      errors: errors.array(),
      title: "Add Vehicle",
      nav,
      classifications: await utilities.buildClassificationList(),
    })
  }
  next()
}

module.exports = validate