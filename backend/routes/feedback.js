const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const { auth, adminAuth } = require('../middleware/auth');

// @POST /api/feedback - Submit feedback
router.post('/', auth, async (req, res) => {
  try {
    const { message, rating } = req.body;

    if (!message) return res.status(400).json({ message: 'Feedback message is required' });

    const feedback = new Feedback({
      user: req.user._id,
      email: req.user.email,
      message,
      rating: rating || null
    });

    await feedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @GET /api/feedback - Admin: get all feedback
router.get('/', adminAuth, async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate('user', 'username email')
      .sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @PATCH /api/feedback/:id/read - Mark as read
router.patch('/:id/read', adminAuth, async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @DELETE /api/feedback/:id
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    res.json({ message: 'Feedback deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
