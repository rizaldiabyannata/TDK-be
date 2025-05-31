const express = require("express");
const router = express.Router();

const {
  submitContactForm,
  getAllContactForms,
} = require("../controllers/contactFormController");

const { authenticate } = require("../middleware/authMiddleware");

router.post("/", submitContactForm);
router.get("/", authenticate, getAllContactForms);

module.exports = router;
