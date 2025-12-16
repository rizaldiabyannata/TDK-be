import * as sponsorshipService from "../services/sponsorshipService.js";

export const createSponsorship = async (req, res, next) => {
  try {
    const sponsorship = await sponsorshipService.createSponsorship(
      req.body,
      req.fileUrl
    );
    res.status(201).json(sponsorship);
  } catch (error) {
    next(error);
  }
};

export const getAllSponsorships = async (req, res, next) => {
  try {
    const list = await sponsorshipService.getAllSponsorships();
    res.status(200).json(list);
  } catch (error) {
    next(error);
  }
};

export const getSponsorshipById = async (req, res, next) => {
  try {
    const item = await sponsorshipService.getSponsorshipById(req.params.id);
    if (!item)
      return res.status(404).json({ message: "Sponsorship not found" });
    res.status(200).json(item);
  } catch (error) {
    next(error);
  }
};

export const updateSponsorship = async (req, res, next) => {
  try {
    const updated = await sponsorshipService.updateSponsorship(
      req.params.id,
      req.body,
      req.fileUrl
    );
    if (!updated)
      return res.status(404).json({ message: "Sponsorship not found" });
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteSponsorship = async (req, res, next) => {
  try {
    const deleted = await sponsorshipService.deleteSponsorship(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Sponsorship not found" });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
