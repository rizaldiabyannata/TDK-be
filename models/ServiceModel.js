import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  list: {
    type: [String],
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const Service = mongoose.model('Service', serviceSchema);

export default Service;
