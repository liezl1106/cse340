const invModel = require("../models/inventory-model")
const utilities = require("../utilities")

const invCont = {}

/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async (req, res) => {
  const { classificationId } = req.params

  try {
    const data = await invModel.getInventoryByClassificationId(classificationId);
    const nav = await utilities.getNav()

    const grid = data.length 
      ? await utilities.buildClassificationGrid(data) 
      : ""
    const className = data.length ? data[0].classification_name : "No vehicles found"

    res.render("inventory/classification", {
      title: `${className} vehicles`,
      nav,
      grid,
    });
  } catch (error) {
    console.error("Error fetching classification data:", error)
    res.status(500).render("errors/error", {
      title: "Internal Server Error",
      message: "An error occurred while fetching data.",
      nav: await utilities.getNav(),
    });
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
      });
    }

    res.render("inventory/vehicleDetail", {
      title: `${vehicleData.inv_make} ${vehicleData.inv_model}`,
      vehicle: vehicleData,
      nav,
    });
  } catch (error) {
    console.error("Error fetching vehicle details:", error)
    res.status(500).render("errors/error", {
      title: "Internal Server Error",
      message: "An error occurred while fetching vehicle details.",
      nav: await utilities.getNav(),
    });
  }
}

module.exports = invCont