import Sponsorship from "../models/SponsorshipModel.js";
import * as imageService from "./imageService.js";

export const createSponsorship = async (data, logoUrl) => {
  const payload = {
    name: data.name,
    websiteLink: data.websiteLink,
    logoUrl: logoUrl,
  };
  const sponsorship = await Sponsorship.create(payload);
  return sponsorship;
};

export const getAllSponsorships = async () => {
  return await Sponsorship.find().sort({ createdAt: -1 });
};

export const getSponsorshipById = async (id) => {
  return await Sponsorship.findById(id);
};

export const updateSponsorship = async (id, data, logoUrl) => {
  const sponsorship = await Sponsorship.findById(id);
  if (!sponsorship) return null;

  // If new logo uploaded, delete old one and set new URL
  if (logoUrl) {
    await imageService.deleteFile(sponsorship.logoUrl);
    sponsorship.logoUrl = logoUrl;
  }

  sponsorship.name = data.name ?? sponsorship.name;
  sponsorship.websiteLink = data.websiteLink ?? sponsorship.websiteLink;

  await sponsorship.save();
  return sponsorship;
};

export const deleteSponsorship = async (id) => {
  const sponsorship = await Sponsorship.findById(id);
  if (!sponsorship) return null;
  await imageService.deleteFile(sponsorship.logoUrl);
  await sponsorship.deleteOne();
  return sponsorship;
};
