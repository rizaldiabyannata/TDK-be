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

export const deleteStaff = async (req, res, next) => {
  try {
    const staff = await staffService.deleteStaff(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }
    res.status(204).send();
  } catch (error) {
    logger.error(`Error deleting staff: ${error.message}`);
    next(error);
  }
};
