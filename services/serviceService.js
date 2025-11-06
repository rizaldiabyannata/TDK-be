import Service from "../models/ServiceModel.js";

export const createService = async (serviceData, fileUrl) => {
  if (fileUrl) {
    serviceData.image = fileUrl;
  }
  const service = new Service(serviceData);
  return await service.save();
};

export const getAllServices = async () => {
  return await Service.find();
};

export const getServiceById = async (id) => {
  return await Service.findById(id);
};

export const updateService = async (id, serviceData, fileUrl) => {
  if (fileUrl) {
    serviceData.image = fileUrl;
  }
  return await Service.findByIdAndUpdate(id, serviceData, { new: true });
};

export const deleteService = async (id) => {
  return await Service.findByIdAndDelete(id);
};
