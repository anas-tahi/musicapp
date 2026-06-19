const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Song = require('../models/Song');
const Publication = require('../models/Publication');
const Feedback = require('../models/Feedback');
const { adminAuth } = require('../middleware/auth');
const fs = require('fs');

// @GET /api/admin/stats - Dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [users, songs, publications, feedbacks, unreadFeedback] = await Promise.all([
      User.countDocuments(),
      Song.countDocuments(),
      Publication.countDocuments(),
      Feedback.countDocuments(),
      Feedback.countDocuments({ read: false })
    ]);

    res.json({ users, songs, publications, feedbacks, unreadFeedback });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @GET /api/admin/users - Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @DELETE /api/admin/users/:id - Delete user and all their content
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin user' });
    }

    // Delete user's songs (and files)
    const songs = await Song.find({ owner: req.params.id });
    for (const song of songs) {
      const audioPath = '.' + song.audioFile;
      const imagePath = song.coverImage ? '.' + song.coverImage : null;
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      if (imagePath && fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    await Song.deleteMany({ owner: req.params.id });

    // Delete user's publications
    await Publication.deleteMany({ author: req.params.id });

    // Delete user's feedback
    await Feedback.deleteMany({ user: req.params.id });

    await user.deleteOne();
    res.json({ message: 'User and all associated content deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @PATCH /api/admin/users/:id/role - Change user role
router.patch('/users/:id/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @GET /api/admin/songs - Get all songs
router.get('/songs', adminAuth, async (req, res) => {
  try {
    const songs = await Song.find()
      .populate('owner', 'username email')
      .sort({ createdAt: -1 });
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @DELETE /api/admin/songs/:id
router.delete('/songs/:id', adminAuth, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ message: 'Song not found' });

    const audioPath = '.' + song.audioFile;
    const imagePath = song.coverImage ? '.' + song.coverImage : null;
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    if (imagePath && fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

    await song.deleteOne();
    res.json({ message: 'Song deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @GET /api/admin/publications - Get all publications
router.get('/publications', adminAuth, async (req, res) => {
  try {
    const publications = await Publication.find()
      .populate('author', 'username email')
      .populate('song', 'title')
      .sort({ createdAt: -1 });
    res.json(publications);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @DELETE /api/admin/publications/:id
router.delete('/publications/:id', adminAuth, async (req, res) => {
  try {
    const pub = await Publication.findByIdAndDelete(req.params.id);
    if (!pub) return res.status(404).json({ message: 'Publication not found' });
    res.json({ message: 'Publication deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Seed admin user route (only works once, for setup)
router.post('/seed-admin', async (req, res) => {
  try {
    const existing = await User.findOne({ role: 'admin' });
    if (existing) {
      return res.status(400).json({ message: 'Admin already exists' });
    }
    const { username, email, password } = req.body;
    const admin = new User({ username, email, password, role: 'admin' });
    await admin.save();
    res.status(201).json({ message: 'Admin created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
