import * as staffService from "../services/staffService.js";
import logger from "../utils/logger.js";

export const createStaff = async (req, res, next) => {
  try {
    const staff = await staffService.createStaff(req.body, req.fileUrl);
    res.status(201).json(staff);
  } catch (error) {
    logger.error(`Error creating staff: ${error.message}`);
    next(error);
  }
};

export const getAllStaff = async (req, res, next) => {
  try {
    const staff = await staffService.getAllStaff();
    res.status(200).json(staff);
  } catch (error) {
    logger.error(`Error getting all staff: ${error.message}`);
    next(error);
  }
};

export const getStaffById = async (req, res, next) => {
  try {
    const staff = await staffService.getStaffById(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }
    res.status(200).json(staff);
  } catch (error) {
    logger.error(`Error getting staff by id: ${error.message}`);
    next(error);
  }
};

export const updateStaff = async (req, res, next) => {
  try {
    const staff = await staffService.updateStaff(
      req.params.id,
      req.body,
      req.fileUrl
    );
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }
    res.status(200).json(staff);
  } catch (error) {
    logger.error(`Error updating staff: ${error.message}`);
    next(error);
  }
};

export const getOrganizationalStructure = async (req, res, next) => {
  try {
    const staff = await staffService.getOrganizationalStructure();
    res.status(200).json({
      success: true,
      data: staff,
      count: staff.length,
    });
  } catch (error) {
    logger.error(`Error getting organizational structure: ${error.message}`);
    next(error);
  }
};

export const getStaffByLevel = async (req, res, next) => {
  try {
    const { level } = req.params;
    const staff = await staffService.getStaffByLevel(parseInt(level));
    res.status(200).json({
      success: true,
      data: staff,
      count: staff.length,
    });
  } catch (error) {
    logger.error(`Error getting staff by level: ${error.message}`);
    next(error);
  }
};

export const getStaffChildren = async (req, res, next) => {
  try {
    const { parentId } = req.params;
    const children = await staffService.getStaffChildren(parentId);
    res.status(200).json({
      success: true,
      data: children,
      count: children.length,
    });
  } catch (error) {
    logger.error(`Error getting staff children: ${error.message}`);
    next(error);
  }
};

export const moveStaff = async (req, res, next) => {
  try {
    const { staffId } = req.params;
    const { newParentId } = req.body;
    const staff = await staffService.moveStaff(staffId, newParentId);
    res.status(200).json({
      success: true,
      message: "Staff berhasil dipindahkan",
      data: staff,
    });
  } catch (error) {
    logger.error(`Error moving staff: ${error.message}`);
    next(error);
  }
};

export const toggleStaffStatus = async (req, res, next) => {
  try {
    const { staffId } = req.params;
    const { isActive } = req.body;
    const staff = await staffService.toggleStaffStatus(staffId, isActive);
    res.status(200).json({
      success: true,
      message: `Staff ${isActive ? "diaktifkan" : "dinonaktifkan"}`,
      data: staff,
    });
  } catch (error) {
    logger.error(`Error toggling staff status: ${error.message}`);
    next(error);
  }
};
