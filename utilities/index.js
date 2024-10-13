const invModel = require("../models/inventory-model")
const Util = {}

/* ************************
 * Constructs the nav HTML unordered list
 ************************** */
Util.getNav = async function () {
  try {
    const data = await invModel.getClassifications();
    let list = "<ul>"
    list += '<li><a href="/" title="Home page">Home</a></li>'

    if (data && data.rows.length > 0) {
      data.rows.forEach((row) => {
        list += `
          <li>
            <a href="/inv/type/${row.classification_id}" title="See our inventory of ${row.classification_name} vehicles">
              ${row.classification_name}
            </a>
          </li>`
      })
    } else {
      list += '<li>No classifications available</li>'
    }

    list += "</ul>"
    return list
  } catch (error) {
    console.error("Error fetching classifications:", error);
    return "<ul><li>Error fetching classifications</li></ul>"
  }
};

/* **************************************
 * Build the classification view HTML
 ************************************** */
Util.buildClassificationGrid = async function (data) {
  if (data.length > 0) {
    let grid = '<ul id="inv-display">'
    
    data.forEach((vehicle) => {
      const { inv_id, inv_make, inv_model, inv_thumbnail, inv_price } = vehicle
      grid += `
        <li>
          <a href="/inv/detail/${inv_id}" title="View ${inv_make} ${inv_model} details">
            <img src="${inv_thumbnail}" alt="Image of ${inv_make} ${inv_model} on CSE Motors" />
          </a>
          <div class="namePrice">
            <hr />
            <h2>
              <a href="/inv/detail/${inv_id}" title="View ${inv_make} ${inv_model} details">
                ${inv_make} ${inv_model}
              </a>
            </h2>
            <span>$${new Intl.NumberFormat('en-US').format(inv_price)}</span>
          </div>
        </li>`;
    })
    grid += "</ul>"
    return grid;
  } else {
    return '<p class="notice">Sorry, no matching vehicles could be found.</p>'
  }
}

/* ****************************************
 * Middleware For Handling Errors
 * Wrap other function in this for 
 * General Error Handling
 **************************************** */
Util.handleErrors = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

/* **************************************
 * Format vehicle info for detail view
 ************************************** */
Util.formatVehicleInfo = function (vehicle) {
  return {
    make: vehicle.inv_make,
    model: vehicle.inv_model,
    year: vehicle.inv_year,
    price: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(vehicle.inv_price),
    mileage: new Intl.NumberFormat('en-US').format(vehicle.inv_miles),
    description: vehicle.inv_description,
    image: vehicle.inv_image,
  }
}

/* **************************************
 * Build the classification dropdown list
 ************************************** */
Util.buildClassificationSelect = async function (selectedClassificationId = null) {
  const classifications = await invModel.getClassifications();
  let classificationSelect = '<select name="classification_id" id="classificationList" required>'
  classificationSelect += "<option value=''>Choose a Classification</option>";  // Placeholder
  
  classifications.rows.forEach((classification) => {
    classificationSelect += `
      <option value="${classification.classification_id}" 
        ${selectedClassificationId && classification.classification_id == selectedClassificationId ? 'selected' : ''}>
        ${classification.classification_name}
      </option>`;
  });
  
  classificationSelect += "</select>"
  return classificationSelect;
}

module.exports = Util