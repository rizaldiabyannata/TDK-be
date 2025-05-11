// Simple middleware untuk validasi input pada body request
const simpleMiddleware = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Name, email, and password are required" });
  }

  // Menambahkan logika validasi tambahan jika diperlukan
  next(); // Lanjutkan ke controller berikutnya
};

module.exports = simpleMiddleware;
