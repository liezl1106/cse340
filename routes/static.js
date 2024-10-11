const express = require('express')
const router = express.Router()

/* ***********************
 * Server static files from the "public" directory
 *************************/
router.use(express.static("public"))

module.exports = router