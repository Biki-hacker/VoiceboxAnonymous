// models/Post.js
const mongoose = require('mongoose');

// Sub-schema for a comment
const commentSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId()
  },
  text: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  },
  reactions: {
    like: { type: Number, default: 0 },
    love: { type: Number, default: 0 },
    laugh: { type: Number, default: 0 },
    angry: { type: Number, default: 0 }
  }
});

// Main Post schema
const postSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true
    },
    postType: {
      type: String,
      enum: ['feedback', 'complaint', 'suggestion', 'public'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    mediaUrls: {
      type: [String],
      default: []
    },
    region: {
      type: String
    },
    department: {
      type: String
    },
    isAnonymous: {
      type: Boolean,
      default: true
    },
    likes: {
      type: Number,
      default: 0
    },
    comments: [commentSchema]
  },
  { timestamps: true } // Adds createdAt and updatedAt
);

module.exports = mongoose.model('Post', postSchema);
