const express = require("express")
const router = express.Router()

// Define your message routes here
router.get("/", (req, res) => {
  res.send("Message Route")
})

module.exports = router