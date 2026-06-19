const validateInput = (req, res, next) => {
  const { body, params } = req;
  
  // Sanitize and validate common inputs
  if (body.title && typeof body.title === 'string') {
    body.title = body.title.trim().substring(0, 100); // Max 100 chars
  }
  
  if (body.description && typeof body.description === 'string') {
    body.description = body.description.trim().substring(0, 500); // Max 500 chars
  }
  
  if (body.username && typeof body.username === 'string') {
    body.username = body.username.trim().substring(0, 30); // Max 30 chars
  }
  
  if (body.email && typeof body.email === 'string') {
    body.email = body.email.trim().toLowerCase();
  }
  
  if (body.password && typeof body.password === 'string') {
    // Basic password strength validation
    if (body.password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
  }
  
  // Validate MongoDB ObjectId format for params
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (params.id && !objectIdRegex.test(params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  
  next();
};

module.exports = validateInput;
