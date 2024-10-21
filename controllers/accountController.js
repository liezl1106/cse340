const accountModel = require("../models/account-model")
const messageModel = require("../models/message-model")
const utilities = require("../utilities")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
require("dotenv").config()

/* ****************************************
 *  Build Account Management View
 * ************************************ */
async function buildAccountManagementView(req, res) {
  let nav = await utilities.getNav();
  const unread = await messageModel.getMessageCountById(req.session.accountData.account_id); // Use session data

  res.render("account/account-management", {
    title: "Account Management",
    nav,
    errors: null,
    unread, 
    accountData: req.session.accountData, // Make sure to pass account data if needed
    loggedin: true
  });
}

/* ****************************************
 *  Deliver login view
 * *************************************** */
async function buildLogin(req, res, next) {
  let nav = await utilities.getNav();
  res.render("account/login", {
    title: "Login",
    errors: null,
    nav,
  });
}

/* ****************************************
 *  Process login request
 * ************************************ */
async function accountLogin(req, res, next) {
  const { account_email, account_password } = req.body;
  const accountData = await accountModel.getAccountByEmail(account_email);

  if (!accountData) {
    req.flash("notice", "Please check your credentials and try again.");
    return res.status(400).render("account/login", {
      title: "Login",
      errors: null,
      account_email,
    });
  }

  try {
    const isMatch = await bcrypt.compare(account_password, accountData.account_password);
    
    if (isMatch) {
      delete accountData.account_password; // Remove password
      utilities.updateCookie(accountData, res); // Set session or cookie

      // Redirect to account management view
      return res.redirect("/account/account-management"); // Redirect instead of render
    } else {
      req.flash("notice", "Invalid credentials. Please try again.");
      return res.redirect("/account/login");
    }
  } catch (error) {
    console.error("Login error:", error);
    return next(error);
  }
}

/* ****************************************
 *  Process logout request
 * ************************************ */
async function accountLogout(req, res) {
  res.clearCookie("jwt")
  delete res.locals.accountData
  res.locals.loggedin = 0
  req.flash("notice", "Logout successful.")
  res.redirect("/")
}

/* ****************************************
 *  Deliver registration view
 * *************************************** */
async function buildRegister(req, res, next) {
  let nav = await utilities.getNav();
  res.render("account/register", {
    title: "Register",
    nav,
    errors: null,
  })
}

/* ****************************************
 *  Process Registration
 * *************************************** */
async function registerAccount(req, res) {
  let nav = await utilities.getNav()
  const {
    account_firstname,
    account_lastname,
    account_email,
    account_password,
  } = req.body

  let hashedPassword
  try {
    hashedPassword = await bcrypt.hashSync(account_password, 10);
  } catch (error) {
    req.flash("notice", "Sorry, there was an error processing the registration.")
    return res.status(500).render("account/register", {
      title: "Registration",
      nav,
      errors: null,
    })
  }

  const regResult = await accountModel.registerAccount(
    account_firstname,
    account_lastname,
    account_email,
    hashedPassword
  );

  if (regResult) {
    req.flash("notice", `Congratulations, you\'re registered ${account_firstname}. Please log in.`)
    return res.status(201).render("account/login", {
      title: "Login",
      errors: null,
      nav,
    });
  } else {
    req.flash("notice", "Sorry, the registration failed.")
    return res.status(501).render("account/register", {
      title: "Registration",
      errors: null,
      nav,
    })
  }
}

/* ****************************************
 *  Deliver account update view get
 * *************************************** */
async function buildUpdate(req, res, next) {
  let nav = await utilities.getNav();

  const accountDetails = await accountModel.getAccountById(req.params.accountId);
  const {account_id, account_firstname, account_lastname, account_email} = accountDetails;
  res.render("account/update", {
    title: "Update",
    nav,
    errors: null,
    account_id,
    account_firstname,
    account_lastname,
    account_email
  });
}

/* ****************************************
 *  Process account update post
 * *************************************** */
async function updateAccount(req, res) {
  let nav = await utilities.getNav();
  const {
    account_id,
    account_firstname,
    account_lastname,
    account_email,
    // account_password,
  } = req.body;

  const regResult = await accountModel.updateAccount(
    account_id,
    account_firstname,
    account_lastname,
    account_email,
  );

  if (regResult) {
    req.flash(
      "notice",
      `Congratulations, you've updated ${account_firstname}.`
    );

    //Update the cookie accountData
    // TODO: Better way to do this?

    const accountData = await accountModel.getAccountById(account_id); // Get it from db so we can remake the cookie
    delete accountData.account_password;
    res.locals.accountData.account_firstname = accountData.account_firstname; // So it displays correctly
    utilities.updateCookie(accountData, res); // Remake the cookie with new data

    res.status(201).render("account/account-management", {
      title: "Management",
      errors: null,
      nav,
    });
  } else {
    req.flash("notice", "Sorry, the update failed.");
    res.status(501).render("account/update", {
      title: "Update",
      errors: null,
      account_id,
      account_firstname,
      account_lastname,
      account_email,
      nav,
    });
  }
}

/* ****************************************
 *  Process account password update post
 * *************************************** */
async function updatePassword(req, res) {
  let nav = await utilities.getNav();

  const { account_id, account_password } = req.body;

  // Hash the password before storing.
  let hashedPassword;
  try {
    // regular password and cost (salt is generated automatically)
    hashedPassword = await bcrypt.hashSync(account_password, 10);
  } catch (error) {
    req.flash(
      "notice",
      "Sorry, there was an error processing the password update."
    );
    res.status(500).render("account/update", {
      title: "Update",
      nav,
      errors: null,
    });
  }

  const regResult = await accountModel.updatePassword(account_id, hashedPassword);

  if (regResult) {
    req.flash(
      "notice",
      `Congratulations, you've updated the password.`
    );
    res.status(201).render("account/account-management", {
      title: "Manage",
      errors: null,
      nav,
    });
  } else {
    req.flash("notice", "Sorry, the password update failed.");
    res.status(501).render("account/update", {
      title: "Update",
      errors: null,
      nav,
    });
  }
}

module.exports = { 
  buildAccountManagementView, 
  buildLogin, 
  accountLogin, 
  accountLogout, 
  buildRegister, 
  registerAccount,
  buildUpdate,
  updateAccount,
  updatePassword 
}