import ContactForm, { find } from "../models/ContactFormModel.js";
import { warn, info, error as _error } from "../utils/logger.js";

const submitContactForm = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    warn("❌ Form submission failed: Missing required fields.");
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newContactForm = new ContactForm({
      name,
      email,
      message,
    });

    await newContactForm.save();

    info(`✅ New contact form submitted by: ${name}, Email: ${email}`);

    return res.status(201).json({
      message: "Your message has been received. We'll get back to you soon!",
    });
  } catch (error) {
    _error(`❌ Error submitting contact form: ${error.message}`);
    return res
      .status(500)
      .json({ message: "An internal server error occurred." });
  }
};

const getAllContactForms = async (req, res) => {
  try {
    const contactForms = await find().sort({ createdAt: -1 });

    info("✅ Retrieved all contact forms");

    return res.status(200).json(contactForms);
  } catch (error) {
    _error(`❌ Error fetching contact forms: ${error.message}`);
    return res
      .status(500)
      .json({ message: "An internal server error occurred." });
  }
};

export default { submitContactForm, getAllContactForms };
