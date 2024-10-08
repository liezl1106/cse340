const express = require("express")
const router = express.Router()
const invController = require("../controllers/invController")
const utilities = require("../utilities")

// Route to build inventory by classification view
router.get("/type/:classificationId", invController.buildByClassificationId)

// Route for specific vehicle detail view
router.get("/detail/:id", utilities.handleErrors(invController.getVehicleDetail))

// Intentional error route
router.get("/ierror", (req, res, next) => {
    // Intentionally throw an error
    const error = new Error("This is a 500 error!")
    error.status = 500;
    next(error); // Pass the error to the next middleware
})

module.exports = router