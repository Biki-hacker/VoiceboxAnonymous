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

// Main schema for posts
const postSchema = new mongoose.Schema(
  {
    orgId: {
      type: String,
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
    mediaUrl: {
      type: String
    },
    likes: {
      type: Number,
      default: 0
    },
    comments: [commentSchema]
  },
  { timestamps: true } // adds createdAt and updatedAt to the post
);

module.exports = mongoose.model('Post', postSchema);
