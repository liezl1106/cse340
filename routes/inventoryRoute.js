const express = require("express")
const router = new express.Router()
const invController = require("../controllers/invController")
const utilities = require("../utilities")
const invValidate = require("../utilities/inventory-validation")

// Route to build inventory by classification view
router.get("/type/:classificationId", utilities.handleErrors(invController.buildByClassificationId))

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

// Build edit/update inventory views
router.get("/edit/:inventoryId", utilities.handleErrors(invController.buildEditInventory))
router.post("/update/", invValidate.inventoryRules(), invValidate.checkUpdateData, utilities.handleErrors(invController.updateInventory))

// Delete vehicle information routes
router.get("/delete/:inventoryId", utilities.handleErrors(invController.buildDeleteInventory));
router.post("/delete/", utilities.handleErrors(invController.deleteInventory)); 

// AJAX inventory api call route
router.get("/getInventory/:classification_id", utilities.handleErrors(invController.getInventoryJSON))

module.exports = router