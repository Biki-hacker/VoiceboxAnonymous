// utils/session.js
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');

exports.createSession = async (userId) => {
  const sessionToken = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  await User.findByIdAndUpdate(userId, {
    $push: {
      sessions: {
        token: sessionToken,
        expiresAt: expiresAt
      }
    }
  });

  return { sessionToken, expiresAt };
};

exports.clearExpiredSessions = async () => {
  await User.updateMany(
    { 'sessions.expiresAt': { $lt: new Date() } },
    { $pull: { sessions: { expiresAt: { $lt: new Date() } } } }
  );
};