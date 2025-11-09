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
 * Mendapatkan semua staf yang aktif, dikelompokkan berdasarkan level.
 * @returns {Promise<Array<object>>} Daftar semua staf diurutkan berdasarkan level dan order.
 */
export const getAllStaff = async () => {
  return await Staff.find({ isActive: true }).sort({ level: 1, order: 1 });
};

/**
 * Mendapatkan semua staf yang aktif, dikelompokkan berdasarkan level.
 * @returns {Promise<object>} Object dengan key level dan value array staf pada level tersebut.
 */
export const getOrganizationalStructure = async () => {
  const allStaff = await Staff.find({ isActive: true }).sort({
    level: 1,
    order: 1,
  });

  // Kelompokkan staf berdasarkan level
  const staffByLevel = {};
  allStaff.forEach((staff) => {
    if (!staffByLevel[staff.level]) {
      staffByLevel[staff.level] = [];
    }
    staffByLevel[staff.level].push(staff);
  });

  return staffByLevel;
};

/**
 * Mendapatkan staf berdasarkan level.
 * @param {number} level - Level staf yang ingin didapatkan.
 * @returns {Promise<Array<object>>} Daftar staf pada level tertentu.
 */
export const getStaffByLevel = async (level) => {
  return await Staff.find({ level, isActive: true }).sort({ order: 1 });
};

/**
 * Mendapatkan satu staf berdasarkan ID.
 * @param {string} id - ID staf.
 * @returns {Promise<object>} Staf yang ditemukan.
 */
export const getStaffById = async (id) => {
  return await Staff.findById(id);
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
 * Mengaktifkan/nonaktifkan staf.
 * @param {string} staffId - ID staf.
 * @param {boolean} isActive - Status aktif.
 * @returns {Promise<object>} Staf yang telah diperbarui.
 */
export const toggleStaffStatus = async (staffId, isActive) => {
  const staff = await Staff.findByIdAndUpdate(
    staffId,
    { isActive },
    { new: true }
  );

  if (!staff) {
    throw new Error("Staff tidak ditemukan");
  }

  return staff;
};

/**
 * Menghapus staf berdasarkan ID.
 * @param {string} staffId - ID staf yang akan dihapus.
 * @returns {Promise<object>} Staf yang telah dihapus.
 */
export const deleteStaff = async (staffId) => {
  const staff = await Staff.findById(staffId);

  if (!staff) {
    throw new Error("Staff tidak ditemukan");
  }

  // Hapus foto jika ada
  if (staff.photoUrl) {
    await deleteFile(staff.photoUrl);
  }

  // Hapus staf dari database
  await Staff.findByIdAndDelete(staffId);

  return staff;
};
