const ContactForm = require("../models/ContactFormModel");
const logger = require("../utils/logger");

const submitContactForm = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    logger.warn("❌ Form submission failed: Missing required fields.");
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newContactForm = new ContactForm({
      name,
      email,
      message,
    });

    // Simpan data ke database
    await newContactForm.save();

    // Log info jika berhasil
    logger.info(`✅ New contact form submitted by: ${name}, Email: ${email}`);

    // Kirimkan respons sukses
    return res.status(201).json({
      message: "Your message has been received. We'll get back to you soon!",
    });
  } catch (error) {
    // Log kesalahan jika ada error saat menyimpan ke database
    logger.error(`❌ Error submitting contact form: ${error.message}`);
    return res
      .status(500)
      .json({ message: "Something went wrong, please try again." });
  }
};

// Fungsi untuk membaca data form kontak (Read)
const getAllContactForms = async (req, res) => {
  try {
    // Ambil semua data form kontak
    const contactForms = await ContactForm.find().sort({ createdAt: -1 });

    // Log info untuk pembacaan data
    logger.info("✅ Retrieved all contact forms");

    // Kirimkan respons dengan data form
    return res.status(200).json(contactForms);
  } catch (error) {
    // Log kesalahan jika ada error saat mengambil data
    logger.error(`❌ Error fetching contact forms: ${error.message}`);
    return res.status(500).json({ message: "Unable to fetch contact forms." });
  }
};

module.exports = { submitContactForm, getAllContactForms };
