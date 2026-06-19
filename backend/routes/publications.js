const express = require('express');
const router = express.Router();
const Publication = require('../models/Publication');
const Song = require('../models/Song');
const { auth } = require('../middleware/auth');
const validateInput = require('../middleware/validation');
const { emitNewPublication, emitNewLike, emitNewComment } = require('../socket');

// @POST /api/publications - Create publication
router.post('/', auth, validateInput, async (req, res) => {
  try {
    const { title, description, songId } = req.body;

    if (!title || !songId) {
      return res.status(400).json({ message: 'Title and song are required' });
    }

    const song = await Song.findById(songId);
    if (!song) return res.status(404).json({ message: 'Song not found' });

    if (song.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only publish your own songs' });
    }

    const publication = new Publication({
      title,
      description: description || '',
      song: songId,
      author: req.user._id
    });

    await publication.save();
    await publication.populate([
      { path: 'author', select: 'username profilePic' },
      { path: 'song', populate: { path: 'owner', select: 'username' } }
    ]);

    // Emit real-time event for new publication
    emitNewPublication(publication);

    res.status(201).json(publication);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @GET /api/publications - Get all publications (feed)
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const publications = await Publication.find()
      .populate('author', 'username profilePic')
      .populate({ path: 'song', populate: { path: 'owner', select: 'username' } })
      .populate('comments.user', 'username profilePic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Publication.countDocuments();
    res.json({ publications, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @GET /api/publications/my - Get my publications
router.get('/my', auth, async (req, res) => {
  try {
    const publications = await Publication.find({ author: req.user._id })
      .populate('author', 'username profilePic')
      .populate({ path: 'song', populate: { path: 'owner', select: 'username' } })
      .sort({ createdAt: -1 });
    res.json(publications);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @POST /api/publications/:id/like - Toggle like
router.post('/:id/like', auth, async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) return res.status(404).json({ message: 'Publication not found' });

    const userId = req.user._id.toString();
    const liked = publication.likes.map(l => l.toString()).includes(userId);

    if (liked) {
      publication.likes = publication.likes.filter(l => l.toString() !== userId);
    } else {
      publication.likes.push(req.user._id);
    }

    await publication.save();
    
    // Emit real-time event for like
    emitNewLike(publication._id, publication.likes.length, req.user.username);
    
    res.json({ liked: !liked, likesCount: publication.likes.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @POST /api/publications/:id/comment
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Comment text is required' });

    const publication = await Publication.findById(req.params.id);
    if (!publication) return res.status(404).json({ message: 'Publication not found' });

    publication.comments.push({ user: req.user._id, text });
    await publication.save();
    await publication.populate('comments.user', 'username profilePic');

    const newComment = publication.comments[publication.comments.length - 1];
    
    // Emit real-time event for comment
    emitNewComment(publication._id, newComment);
    
    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @DELETE /api/publications/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) return res.status(404).json({ message: 'Publication not found' });

    if (publication.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await publication.deleteOne();
    res.json({ message: 'Publication deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
