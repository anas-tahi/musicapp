const express = require('express');
const router = express.Router();
const Song = require('../models/Song');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validateInput = require('../middleware/validation');
const fs = require('fs');
const path = require('path');
const mm = require('music-metadata');

// @POST /api/songs - Upload a song
router.post('/', auth, validateInput, upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) return res.status(400).json({ message: 'Title is required' });
    if (!req.files?.audio) return res.status(400).json({ message: 'Audio file is required' });

    // Extract audio metadata
    const audioPath = path.join(__dirname, 'uploads/audio', req.files.audio[0].filename);
    let metadata = { duration: 0, bitrate: 0 };
    
    try {
      metadata = await mm.parseFile(audioPath);
    } catch (err) {
      console.warn('Could not extract audio metadata:', err.message);
    }

    const song = new Song({
      title,
      description: description || '',
      audioFile: `/uploads/audio/${req.files.audio[0].filename}`,
      coverImage: req.files?.cover ? `/uploads/images/${req.files.cover[0].filename}` : null,
      owner: req.user._id,
      duration: Math.round(metadata.format.duration || 0),
      fileSize: req.files.audio[0].size,
      bitrate: metadata.format.bitrate || 0
    });

    await song.save();
    await song.populate('owner', 'username profilePic');
    res.status(201).json(song);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @GET /api/songs - Get user's songs
router.get('/', auth, async (req, res) => {
  try {
    const songs = await Song.find({ owner: req.user._id })
      .populate('owner', 'username profilePic')
      .sort({ createdAt: -1 });
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @GET /api/songs/all - Get all songs (for publishing)
router.get('/all', auth, async (req, res) => {
  try {
    const songs = await Song.find({ owner: req.user._id })
      .populate('owner', 'username profilePic')
      .sort({ createdAt: -1 });
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @GET /api/songs/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id).populate('owner', 'username profilePic');
    if (!song) return res.status(404).json({ message: 'Song not found' });
    res.json(song);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @DELETE /api/songs/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ message: 'Song not found' });

    if (song.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete files
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

module.exports = router;
