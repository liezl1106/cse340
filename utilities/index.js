const invModel = require("../models/inventory-model")
const jwt = require("jsonwebtoken")
require("dotenv").config()
const Util = {}

/* ************************
 * Constructs the nav HTML unordered list
 ************************** */
Util.getNav = async function () {
  let data = await invModel.getClassifications();
  let list = "<ul>";
  list += '<li><a href="/" title="Home page">Home</a></li>';
  data.rows.forEach((row) => {
    list += `<li>
      <a href="/inv/type/${row.classification_id}" title="See our inventory of ${row.classification_name} vehicles">
        ${row.classification_name}
      </a>
    </li>`
  })
  list += "</ul>"
  return list
}

/* **************************************
 * Build the classification view HTML
 ************************************** */
Util.buildClassificationGrid = async function (data) {
  if (!data || data.length === 0) {
    return '<p class="notice">Sorry, no matching vehicles could be found.</p>'
  }

  let grid = '<ul id="inv-display">'
  data.forEach((vehicle) => {
    grid += `<li>
      <a href="../../inv/detail/${vehicle.inv_id}" title="View ${vehicle.inv_make} ${vehicle.inv_model} details">
        <img src="${vehicle.inv_thumbnail}" alt="Image of ${vehicle.inv_make} ${vehicle.inv_model} on CSE Motors" />
      </a>
      <div class="namePrice">
        <hr />
        <h2>
          <a href="../../inv/detail/${vehicle.inv_id}" title="View ${vehicle.inv_make} ${vehicle.inv_model} details">
            ${vehicle.inv_make} ${vehicle.inv_model}
          </a>
        </h2>
        <span>$${new Intl.NumberFormat("en-US").format(vehicle.inv_price)}</span>
      </div>
    </li>`
  })
  grid += "</ul>"
  return grid
}

/* ****************************************
 * Build a single listing element from data
 **************************************** */
Util.buildItemListing = async function (data) {
  if (!data) {
    return '<p>Sorry, no matching vehicles could be found.</p>'
  }

  return `
    <section class="car-listing">
      <img src="${data.inv_image}" alt="${data.inv_make} ${data.inv_model}">
      <div class="car-information">
        <div>
          <h2>${data.inv_year} ${data.inv_make} ${data.inv_model}</h2>
        </div>
        <div>
          ${Number.parseFloat(data.inv_price).toLocaleString("en-US", { style: "currency", currency: "USD" })}
        </div>
        <div class="description">
          <p>${data.inv_description}</p>
          <dl>
            <dt>MILEAGE</dt>
            <dd>${data.inv_miles.toLocaleString("en-US")}</dd>
            <dt>COLOR</dt>
            <dd>${data.inv_color}</dd>
            <dt>CLASS</dt>
            <dd>${data.classification_name}</dd>
          </dl>
        </div>
      </div>
    </section>
  `
}

/* ****************************************
 * Build an HTML select element with classification data
 **************************************** */
Util.buildClassificationList = async function (classification_id = null) {
  let data = await invModel.getClassifications();
  let classificationList = '<select name="classification_id" id="classificationList" required>'
  classificationList += "<option value=''>Choose a Classification</option>"
  data.rows.forEach((row) => {
    classificationList += `<option value="${row.classification_id}" ${classification_id === row.classification_id ? 'selected' : ''}>${row.classification_name}</option>`
  });
  classificationList += "</select>"
  return classificationList
}

/* ****************************************
 * Middleware For Handling Errors
 **************************************** */
Util.handleErrors = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

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

/* ****************************************
 * Middleware to check token validity
 **************************************** */
Util.checkJWTToken = (req, res, next) => {
  if (req.cookies.jwt) {
    jwt.verify(req.cookies.jwt, process.env.ACCESS_TOKEN_SECRET, (err, accountData) => {
      if (err) {
        req.flash("Please log in");
        res.clearCookie("jwt");
        return res.redirect("/account/login")
      }
      res.locals.accountData = accountData
      res.locals.loggedin = 1
      next()
    })
  } else {
    next()
  }
}

/* ****************************************
 * Function to update the browser cookie
 **************************************** */
Util.updateCookie = (accountData, res) => {
  const accessToken = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 })
  const cookieOptions = {
    httpOnly: true,
    maxAge: 3600 * 1000,
  };
  if (process.env.NODE_ENV === "development") {
    res.cookie("jwt", accessToken, { httpOnly: true, maxAge: 3600 * 1000 })
  } else {
    res.cookie("jwt", accessToken, {
      httpOnly: true,
      secure: true,
      maxAge: 3600 * 1000,
    })
  }
}

/* ****************************************
 * Build Inbox HTML Table from Messages
 **************************************** */
Util.buildInbox = (messages) => {
  if (!messages || messages.length === 0) {
    return '<p>No messages found.</p>'
  }

  let inboxHTML = '<table class="inbox"><tr><th>Subject</th><th>From</th><th>Received</th></tr>'
  
  messages.forEach(message => {
    inboxHTML += `<tr>
      <td><a href="/message/view/${message.message_id}">${message.message_subject}</a></td>
      <td>${message.account_firstname} ${message.account_lastname}</td>
      <td>${new Date(message.message_created).toLocaleString()}</td>
    </tr>`
  })

  inboxHTML += '</table>'
  return inboxHTML
}

/* ****************************************
 * Check Login
 **************************************** */
Util.checkLogin = (req, res, next) => {
  if (res.locals.loggedin) {
    next()
  } else {
    req.flash("notice", "Please log in.")
    return res.redirect("/account/login")
  }
}

/* ****************************************
 * Build RecipientList
 **************************************** */
Util.buildRecipientList = (recipientData, selectedRecipientId = null) => {
  let recipientList = '<select name="message_to" required>'
  recipientList += '<option value="">Choose a Recipient</option>'
  
  recipientData.forEach(recipient => {
    recipientList += `
      <option value="${recipient.account_id}" 
        ${selectedRecipientId && recipient.account_id == selectedRecipientId ? 'selected' : ''}>
        ${recipient.account_firstname} ${recipient.account_lastname}
      </option>`
  })

  recipientList += '</select>'
  return recipientList
}

/* ****************************************
 *  Check authorization
 * ************************************ */
Util.checkAuthorizationManager = (req, res, next) => {
  if (req.cookies.jwt) {
    jwt.verify(
      req.cookies.jwt,
      process.env.ACCESS_TOKEN_SECRET,
      function (err, accountData) {
        if (err) {
          req.flash("Please log in")
          res.clearCookie("jwt")
          return res.redirect("/account/login")
        }
        if (
          accountData.account_type == "Employee" ||
          accountData.account_type == "Admin"
        ) {
          next()
        } else {
          req.flash("notice", "You are not authorized to modify inventory.")
          return res.redirect("/account/login")
        }
      }
    )
  } else {
    req.flash("notice", "You are not authorized to modify inventory.")
    return res.redirect("/account/login")
  }
}


module.exports = Util