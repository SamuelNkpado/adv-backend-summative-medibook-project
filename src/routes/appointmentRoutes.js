const express = require('express');
const appointmentController = require('../controllers/appointmentController');

const router = express.Router();

router.post('/', appointmentController.createAppointment);
router.get('/:id', appointmentController.getAppointment);
router.post('/:id/cancel', appointmentController.cancelAppointment);

module.exports = router;