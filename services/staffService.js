import Staff from "../models/StaffModel.js";
import { deleteFile } from "./imageService.js";

/**
 * Membuat staf baru.
 * @param {object} staffData - Data untuk staf baru.
 * @param {string} photoUrl - URL foto staf yang diunggah.
 * @returns {Promise<object>} Staf yang baru dibuat.
 */
export const createStaff = async (staffData, photoUrl) => {
  const staff = new Staff({ ...staffData, photoUrl });
  return await staff.save();
};

/**
 * Mendapatkan semua staf.
 * @returns {Promise<Array<object>>} Daftar semua staf.
 */
export const getAllStaff = async () => {
  return await Staff.find({ parent: null }).populate({
    path: "children",
    populate: {
      path: "children",
      populate: {
        path: "children",
      },
    },
  });
};

/**
 * Mendapatkan satu staf berdasarkan ID.
 * @param {string} id - ID staf.
 * @returns {Promise<object>} Staf yang ditemukan.
 */
export const getStaffById = async (id) => {
  return await Staff.findById(id).populate("children");
};

/**
 * Memperbarui staf berdasarkan ID.
 * @param {string} id - ID staf yang akan diperbarui.
 * @param {object} staffData - Data baru untuk staf.
 * @param {string} [photoUrl] - URL foto baru (opsional).
 * @returns {Promise<object>} Staf yang telah diperbarui.
 */
export const updateStaff = async (id, staffData, photoUrl) => {
  const staffToUpdate = await Staff.findById(id);
  if (!staffToUpdate) {
    throw new Error("Staff tidak ditemukan");
  }

  if (photoUrl) {
    if (staffToUpdate.photoUrl) {
      await deleteFile(staffToUpdate.photoUrl);
    }
    staffData.photoUrl = photoUrl;
  }

  return await Staff.findByIdAndUpdate(id, staffData, { new: true });
};

/**
 * Menghapus staf berdasarkan ID.
 * @param {string} id - ID staf yang akan dihapus.
 * @returns {Promise<object>} Staf yang telah dihapus.
 */
export const deleteStaff = async (id) => {
  const staff = await Staff.findById(id);
  if (!staff) {
    throw new Error("Staff tidak ditemukan");
  }

  if (staff.photoUrl) {
    await deleteFile(staff.photoUrl);
  }

  return await Staff.findByIdAndDelete(id);
};
