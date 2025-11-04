import { Router } from 'express';
import multer from 'multer';
import * as serviceController from '../controllers/serviceController.js';
import { createServiceValidator, updateServiceValidator } from '../validators/serviceValidator.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('image'), createServiceValidator, serviceController.createService);
router.get('/', serviceController.getAllServices);
router.get('/:id', serviceController.getServiceById);
router.put('/:id', upload.single('image'), updateServiceValidator, serviceController.updateService);
router.delete('/:id', serviceController.deleteService);

export default router;
