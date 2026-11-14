// routes/reviews.js
const express = require('express');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const validator = require('../middleware/validator');
const {
  getReviewsByEvent,
  createReview,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');

const router = express.Router();

// Public: get reviews for an event
router.get('/event/:eventId', getReviewsByEvent);

// Protected routes
router.post(
  '/',
  protect,
  [
    body('eventId').notEmpty().withMessage('Event ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
  ],
  validator,
  createReview
);

router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
