const express = require("express")
const router = new express.Router()
const accountController = require("../controllers/accountController")
const utilities = require("../utilities")
const regValidate = require('../utilities/account-validation')

// Middleware for parsing JSON and URL-encoded data
router.use(express.json())
router.use(express.urlencoded({ extended: true }))

router.get("/", utilities.checkLogin, utilities.handleErrors(accountController.buildAccountManagementView))

/* ***********************
 * Build Login View
 * ************************/
router.get("/login", utilities.handleErrors(accountController.buildLogin))
router.post(
  "/login",
  regValidate.loginRules(),
  regValidate.checkLoginData,
  utilities.handleErrors(accountController.accountLogin)
);

/* ***********************
 * Route to logout
 * ************************/
router.get("/logout", utilities.handleErrors(accountController.accountLogout))

/* ***********************
 * Registration Handlers
 * ************************/
router.get("/register", utilities.handleErrors(accountController.buildRegister))
router.post(
  "/register",
  regValidate.registrationRules(),
  regValidate.checkRegData,
  utilities.handleErrors(accountController.registerAccount)
)

// Update account handlers
router.get("/update/:accountId", utilities.handleErrors(accountController.buildUpdate));
router.post(
  "/update",
  regValidate.updateRules(), // TODO: This needs to have a separate rule set, without existing email check..unless...oh complex
  regValidate.checkUpdateData,
  utilities.handleErrors(accountController.updateAccount)
  );
router.post(
  "/update-password",
  regValidate.updatePasswordRules(),
  regValidate.checkUpdatePasswordData,
  utilities.handleErrors(accountController.updatePassword)
);

module.exports = router