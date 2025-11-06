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
 * Mendapatkan semua staf dalam struktur organisasi.
 * @returns {Promise<Array<object>>} Daftar semua staf dengan struktur hierarki.
 */
export const getAllStaff = async () => {
  return await Staff.find({ parent: null, isActive: true })
    .sort({ level: 1, order: 1 })
    .populate({
      path: "children",
      match: { isActive: true },
      options: { sort: { order: 1 } },
      populate: {
        path: "children",
        match: { isActive: true },
        options: { sort: { order: 1 } },
        populate: {
          path: "children",
          match: { isActive: true },
          options: { sort: { order: 1 } },
        },
      },
    });
};

/**
 * Mendapatkan struktur organisasi lengkap dalam format flat.
 * @returns {Promise<Array<object>>} Daftar semua staf dalam format flat dengan informasi hierarki.
 */
export const getOrganizationalStructure = async () => {
  return await Staff.find({ isActive: true })
    .sort({ level: 1, order: 1 })
    .populate("parent", "name position level");
};

/**
 * Mendapatkan staf berdasarkan level.
 * @param {number} level - Level staf yang ingin didapatkan.
 * @returns {Promise<Array<object>>} Daftar staf pada level tertentu.
 */
export const getStaffByLevel = async (level) => {
  return await Staff.find({ level, isActive: true })
    .sort({ order: 1 })
    .populate("parent", "name position");
};

/**
 * Mendapatkan children langsung dari staf tertentu.
 * @param {string} parentId - ID staf parent.
 * @returns {Promise<Array<object>>} Daftar children dari staf tertentu.
 */
export const getStaffChildren = async (parentId) => {
  return await Staff.find({ parent: parentId, isActive: true }).sort({
    order: 1,
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
 * Memindahkan staf ke parent baru dan memperbarui level secara rekursif.
 * @param {string} staffId - ID staf yang akan dipindahkan.
 * @param {string|null} newParentId - ID parent baru (null untuk root level).
 * @returns {Promise<object>} Staf yang telah dipindahkan.
 */
export const moveStaff = async (staffId, newParentId) => {
  const staff = await Staff.findById(staffId);
  if (!staff) {
    throw new Error("Staff tidak ditemukan");
  }

  // Cek circular reference
  if (newParentId) {
    let currentParent = newParentId;
    while (currentParent) {
      if (currentParent === staffId) {
        throw new Error(
          "Tidak dapat memindahkan staf ke bawah dirinya sendiri"
        );
      }
      const parent = await Staff.findById(currentParent);
      currentParent = parent?.parent;
    }
  }

  staff.parent = newParentId;
  await staff.save(); // Level akan dihitung otomatis oleh pre-save middleware

  // Update level semua children secara rekursif
  await updateChildrenLevels(staffId);

  return await Staff.findById(staffId).populate(
    "parent",
    "name position level"
  );
};

/**
 * Helper function untuk update level children secara rekursif.
 * @param {string} parentId - ID parent.
 */
const updateChildrenLevels = async (parentId) => {
  const children = await Staff.find({ parent: parentId });

  for (const child of children) {
    await child.calculateLevel();
    await child.save();
    await updateChildrenLevels(child._id);
  }
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
