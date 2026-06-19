const fs = require('fs');
const path = require('path');

const range = (req, res, next) => {
  const filePath = path.join(__dirname, '..', req.path);
  
  if (!fs.existsSync(filePath)) {
    return next();
  }

  const stat = fs.statSync(filePath);
  const { range: rangeHeader } = req.headers;

  if (!rangeHeader) {
    // No range header requested, send entire file
    return next();
  }

  // Parse range header
  const parts = rangeHeader.replace(/bytes=/, '').split('-');
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
  const chunksize = (end - start) + 1;

  // Validate range
  if (start >= stat.size || end >= stat.size || start > end) {
    return res.status(416).send('Requested range not satisfiable');
  }

  // Set headers for partial content
  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${stat.size}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunksize,
    'Content-Type': 'audio/mpeg',
  });

  // Create read stream for the specified range
  const stream = fs.createReadStream(filePath, { start, end });
  
  stream.on('open', () => {
    stream.pipe(res);
  });

  stream.on('error', (err) => {
    next(err);
  });
};

module.exports = range;
