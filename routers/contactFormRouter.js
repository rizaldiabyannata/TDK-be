const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const {
  submitContactForm,
  getAllContactForms,
} = require("../controllers/contactFormController");

const { protect } = require("../middleware/authMiddleware");

// Create a rate limiter to prevent spam on the contact form
const contactFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 submissions per window
  message: { message: "Too many submissions from this IP, please try again after 15 minutes." },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply the rate limiter to the POST route for submitting the form
router.post("/", contactFormLimiter, submitContactForm);

// Protect the GET route to only allow admins to view submissions
router.get("/", protect, getAllContactForms);

module.exports = router;
