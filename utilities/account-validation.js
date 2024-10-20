const utilities = require("../utilities");
const accountModel = require("../models/account-model");
const { body, validationResult } = require("express-validator");
const validate = {};

// Common error handling function
const handleValidationErrors = async (req, res, next, view, title, additionalData = {}) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const nav = await utilities.getNav();
    res.render(view, {
      errors: errors.array(),
      title,
      nav,
      ...additionalData,
    });
    return;
  }
  next();
};

/* Registration Data Validation Rules */
validate.registrationRules = () => {
  return [
    body("account_firstname")
      .trim()
      .escape()
      .notEmpty()
      .withMessage("Please provide a first name."),
    body("account_lastname")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 2 })
      .withMessage("Please provide a last name."),
    body("account_email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("A valid email is required.")
      .custom(async (account_email) => {
        const emailExists = await accountModel.checkExistingEmail(account_email);
        if (emailExists) {
          throw new Error("Email exists. Please log in or use a different email");
        }
      }),
    body("account_password")
      .trim()
      .notEmpty()
      .isStrongPassword({
        minLength: 12,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      .withMessage("Password does not meet requirements."),
  ];
};

validate.checkRegData = (req, res, next) => {
  handleValidationErrors(req, res, next, "account/register", "Registration", {
    account_firstname: req.body.account_firstname,
    account_lastname: req.body.account_lastname,
    account_email: req.body.account_email,
  });
};

/* Update Data Validation Rules */
validate.updateRules = () => {
  return [
    body("account_firstname")
      .trim()
      .escape()
      .notEmpty()
      .withMessage("Please provide a first name."),
    body("account_lastname")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 2 })
      .withMessage("Please provide a last name."),
    body("account_email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("A valid email is required.")
      .custom(async (account_email, { req }) => {
        const emailExists = await accountModel.checkExistingEmail(account_email, req.body.old_email);
        if (emailExists) {
          throw new Error("Email exists. Please log in or use a different email");
        }
      }),
  ];
};

validate.checkUpdateData = (req, res, next) => {
  handleValidationErrors(req, res, next, "account/update", "Update", {
    account_id: req.body.account_id,
    account_firstname: req.body.account_firstname,
    account_lastname: req.body.account_lastname,
    account_email: req.body.account_email,
  });
};

/* Login Data Validation Rules */
validate.loginRules = () => {
  return [
    body("account_email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("A valid email is required."),
    body("account_password")
      .trim()
      .notEmpty()
      .withMessage("Password cannot be empty."), // Optionally enforce strong password here
  ];
};

validate.checkLoginData = (req, res, next) => {
  handleValidationErrors(req, res, next, "account/login", "Login", {
    account_email: req.body.account_email,
  });
};

/* Update Password Data Validation Rules */
validate.updatePasswordRules = () => {
  return [
    body("account_password")
      .trim()
      .notEmpty()
      .isStrongPassword({
        minLength: 12,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      .withMessage("Password does not meet requirements."),
  ];
};

validate.checkUpdatePasswordData = (req, res, next) => {
  handleValidationErrors(req, res, next, "account/update", "Update Password");
};

module.exports = validate;