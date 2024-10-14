const express = require("express")
const router = new express.Router()
const invController = require("../controllers/invController")
const utilities = require("../utilities")
const invValidate = require("../utilities/inventory-validation")

// Route for specific vehicle detail view
router.get("/detail/:id", utilities.handleErrors(invController.getVehicleDetail))

// Route to view the inventory management page
router.get("/management", utilities.handleErrors(invController.buildManagementView))

// Classification management routes
router.get("/add-classification", utilities.handleErrors(invController.buildAddClassification))
router.post("/add-classification", 
  invValidate.classificationRules(), 
  invValidate.checkClassificationData, 
  utilities.handleErrors(invController.addClassification)
)

// Inventory management routes
router.get("/add-inventory", utilities.handleErrors(invController.buildAddInventory))
router.post("/add-inventory", 
  invValidate.inventoryRules(), 
  invValidate.checkInventoryData, 
  utilities.handleErrors(invController.addInventory)
)

module.exports = router