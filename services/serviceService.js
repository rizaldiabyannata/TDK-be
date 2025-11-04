import Service from '../models/ServiceModel.js';

export const createService = async (serviceData, file) => {
  if (file) {
    serviceData.image = file.path;
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

export const updateService = async (id, serviceData, file) => {
  if (file) {
    serviceData.image = file.path;
  }
  return await Service.findByIdAndUpdate(id, serviceData, { new: true });
};

export const deleteService = async (id) => {
  return await Service.findByIdAndDelete(id);
};
