const accountModel = require("../models/account-model")
const messageModel = require("../models/message-model")
const utilities = require("../utilities")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
require("dotenv").config()

/* ****************************************
 *  Process login post request
 * ************************************ */
async function accountLogin(req, res) {
  let nav = await utilities.getNav();
  const { account_email, account_password } = req.body
  
  console.log("Login attempt with:", { account_email })

  try {
    const accountData = await accountModel.getAccountByEmail(account_email)
    console.log("Account data retrieved:", accountData)
    
    if (!accountData) {
      req.flash("notice", "Invalid credentials. Please try again.");
      return res.status(400).render("account/login", { title: "Login", nav, errors: null, account_email }) //Use res.render() when you want to display a view without changing the URL
    }

    const passwordMatch = await bcrypt.compare(account_password, accountData.account_password)
    console.log("Password match:", passwordMatch);
    
    if (passwordMatch) {
      delete accountData.account_password;
      const accessToken = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      const cookieOptions = {
        httpOnly: true,
        maxAge: 3600 * 1000,
        ...(process.env.NODE_ENV !== 'development' && { secure: true })
      };
      res.cookie("jwt", accessToken, cookieOptions)
      return res.redirect("/account/account-management") //Use res.redirect() when you want to change the URL and send the user to a different route
    } else {
      req.flash("notice", "Invalid credentials. Please try again.");
      return res.status(400).render("account/login", { title: "Login", nav, errors: null, account_email })
    }
  } catch (error) {
    console.error("Error during login process:", error)
    req.flash("notice", "An error occurred during login. Please try again.")
    return res.status(500).render("account/login", { title: "Login", nav, errors: null, account_email })
  }
}

/* ****************************************
 *  Deliver login view
 * *************************************** */
async function buildLogin(req, res, next) {
  let nav = await utilities.getNav()
  res.render("account/login", {
    title: "Login",
    errors: null,
    nav,
  })
}

/* ****************************************
 *  Process account management get request
 * ************************************ */
async function buildAccountManagementView(req, res) {
  let nav = await utilities.getNav();
  const unread = await messageModel.getMessageCountById(res.locals.accountData.account_id);

  res.render("account/account-management", {  
    title: "Account Management",
    nav,
    errors: null,
    unread,
    locals: res.locals // Make sure to pass locals if used in the view
  })
}

/* ****************************************
 *  Process logout request
 * ************************************ */
async function accountLogout(req, res) {
  res.clearCookie("jwt")
  delete res.locals.accountData
  res.locals.loggedin = 0
  req.flash("notice", "Logout successful.")
  return res.redirect("/account/login") 
}

/* ****************************************
 *  Deliver registration view
 * *************************************** */
async function buildRegister(req, res) {
  let nav = await utilities.getNav()
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
  )

  if (regResult) {
    req.flash("notice", `Congratulations, you\'re registered ${account_firstname}. Please log in.`)
    return res.status(201).render("account/login", {
      title: "Login",
      errors: null,
      nav,
    })
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
  let nav = await utilities.getNav()

  const accountDetails = await accountModel.getAccountById(req.params.accountId)
  const {account_id, account_firstname, account_lastname, account_email} = accountDetails
  res.render("account/update", {
    title: "Update",
    nav,
    errors: null,
    account_id,
    account_firstname,
    account_lastname,
    account_email
  })
}

/* ****************************************
 *  Process account update post
 * *************************************** */
async function updateAccount(req, res) {
  let nav = await utilities.getNav()
  const {
    account_id,
    account_firstname,
    account_lastname,
    account_email,
    // account_password,
  } = req.body

  const regResult = await accountModel.updateAccount(
    account_id,
    account_firstname,
    account_lastname,
    account_email,
  )

  if (regResult) {
    req.flash(
      "notice",
      `Congratulations, you've updated ${account_firstname}.`
    )

    //Update the cookie accountData
    const accountData = await accountModel.getAccountById(account_id) 
    delete accountData.account_password;
    res.locals.accountData.account_firstname = accountData.account_firstname // So it displays correctly
    utilities.updateCookie(accountData, res) // Remake the cookie with new data

    res.status(201).render("account/account-management", {
      title: "Management",
      errors: null,
      nav,
    })
  } else {
    req.flash("notice", "Sorry, the update failed.")
    res.status(501).render("account/update", {
      title: "Update",
      errors: null,
      account_id,
      account_firstname,
      account_lastname,
      account_email,
      nav,
    })
  }
}

/* ****************************************
 *  Process account password update post
 * *************************************** */
async function updatePassword(req, res) {
  let nav = await utilities.getNav()

  const { account_id, account_password } = req.body

  // Hash the password before storing.
  let hashedPassword
  try {
    // regular password and cost (salt is generated automatically)
    hashedPassword = await bcrypt.hashSync(account_password, 10)
  } catch (error) {
    req.flash(
      "notice",
      "Sorry, there was an error processing the password update."
    );
    res.status(500).render("account/update", {
      title: "Update",
      nav,
      errors: null,
    })
  }

  const regResult = await accountModel.updatePassword(account_id, hashedPassword)

  if (regResult) {
    req.flash(
      "notice",
      `Congratulations, you've updated the password.`
    );
    res.status(201).render("account/account-management", {
      title: "Manage",
      errors: null,
      nav,
    })
  } else {
    req.flash("notice", "Sorry, the password update failed.")
    res.status(501).render("account/update", {
      title: "Update",
      errors: null,
      nav,
    })
  }
}

module.exports = { 
  accountLogin, 
  buildAccountManagementView, 
  buildLogin, 
  accountLogout, 
  buildRegister, 
  registerAccount,
  buildUpdate,
  updateAccount,
  updatePassword 
}