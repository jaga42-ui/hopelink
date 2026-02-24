const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // CRITICAL FIX: Stop the request if the token is literally "undefined" or "null"
      if (token === 'undefined' || token === 'null' || !token) {
        res.status(401);
        throw new Error('Not authorized, token is missing or corrupted');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user no longer exists');
      }

      next();
    } catch (error) {
      res.status(401);
      throw new Error('Not authorized, token failed verification');
    }
  } else {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }
});

module.exports = { protect };