const express = require('express');
const feedbackController = require('../controllers/feedbackController');

const router = express.Router();

router.get('/', feedbackController.showFeedbackPage);
router.post('/', express.urlencoded({ extended: false }), feedbackController.submitFeedback);

module.exports = router;