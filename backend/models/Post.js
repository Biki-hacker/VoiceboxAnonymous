// models/Post.js
const mongoose = require('mongoose');

// Sub-schema for reactions including user tracking
const reactionDetailSchema = new mongoose.Schema({
  count: {
    type: Number,
    default: 0,
    min: 0  // Ensure count never goes below 0
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true  // Add index for faster lookups
  }]
}, { _id: false });  // Prevent automatic _id for subdocuments

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
    like: reactionDetailSchema,
    love: reactionDetailSchema,
    laugh: reactionDetailSchema,
    angry: reactionDetailSchema
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
    // Updated reactions schema to include user tracking
    reactions: {
      like: reactionDetailSchema,
      love: reactionDetailSchema,
      laugh: reactionDetailSchema,
      angry: reactionDetailSchema
    },
    comments: [commentSchema]
  },
  { timestamps: true } // Adds createdAt and updatedAt
);

// Middleware to handle removing the post from referenced documents if needed (optional)
// postSchema.pre('remove', async function(next) {
//   // Example: Remove post references from users or organizations if any
//   next();
// });

module.exports = mongoose.model('Post', postSchema);
