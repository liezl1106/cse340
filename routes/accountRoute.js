const express = require("express")
const router = new express.Router()
const accountController = require("../controllers/accountController")
const utilities = require("../utilities")
const regValidate = require('../utilities/account-validation')

// Middleware for parsing JSON and URL-encoded data
router.use(express.json())
router.use(express.urlencoded({ extended: true }))

// Account Management Route
router.get("/account", utilities.checkLogin, utilities.handleErrors(accountController.buildAccountManagementView))

// Login Routes
router.get("/login", utilities.handleErrors(accountController.buildLogin))
// Process the login request
router.post(
  "/login",
  regValidate.loginRules(),
  regValidate.checkLoginData,
  utilities.handleErrors(accountController.accountLogin)
)

// Logout Route
router.get("/logout", utilities.handleErrors(accountController.accountLogout))

// Registration Handlers
router.get("/register", utilities.handleErrors(accountController.buildRegister))
router.post(
  "/register",
  regValidate.registrationRules(),
  regValidate.checkRegData,
  utilities.handleErrors(accountController.registerAccount)
)

// Update Account Handlers
router.get("/update/:accountId", utilities.handleErrors(accountController.buildUpdate))
router.post(
  "/update",
  regValidate.updateRules(),
  regValidate.checkUpdateData,
  utilities.handleErrors(accountController.updateAccount)
)
router.post(
  "/update-password",
  regValidate.updatePasswordRules(),
  regValidate.checkUpdatePasswordData,
  utilities.handleErrors(accountController.updatePassword)
)

module.exports = router