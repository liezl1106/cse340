const express = require("express")
const router = express.Router()
const invController = require("../controllers/invController")
const utilities = require("../utilities")
const validate = require("../utilities/account-validation")

// Route to build inventory by classification view
router.get("/type/:classificationId", invController.buildByClassificationId)

// Route for specific vehicle detail view
router.get("/detail/:id", utilities.handleErrors(invController.getVehicleDetail))

// Route to view the inventory management page
router.get('/inv', invController.manageInventory);

// Route to render the page to add a new classification
router.get('/add-classification', (req, res) => {
  res.render("inventory/add-classification", {
    title: "Add Classification",
    nav: utilities.getNav(),
    messages: req.flash("info"),
    errors: req.flash("errors"),
  })
})

// Route to handle the form submission for adding a new classification
router.post('/add-classification', validate.registationRules(), validate.checkRegData, invController.addClassification)

// Route to render the page to add a new inventory item
router.get('/add-inventory', async (req, res) => {
  const classifications = await invController.getClassifications(); // Retrieve classifications for the dropdown
  const nav = await utilities.getNav(); // Await this call to get the correct result
  res.render("inventory/add-inventory", {
    title: "Add Inventory",
    nav,
    classifications,
    messages: req.flash("info"),
    errors: req.flash("errors"),
  })
})

// Route to handle the form submission for adding a new inventory item
router.post('/add-inventory',
  validate.updateRules(),
  validate.checkUpdateData,
  invController.addInventory
)

module.exports = router