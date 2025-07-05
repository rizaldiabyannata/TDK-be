const express = require("express");
const router = express.Router();

const {
  submitContactForm,
  getAllContactForms,
} = require("../controllers/contactFormController");

const { protect } = require("../middleware/authMiddleware");

router.post("/", submitContactForm);
router.get("/", protect, getAllContactForms);

module.exports = router;
