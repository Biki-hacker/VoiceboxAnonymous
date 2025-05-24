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
// Middleware to initialize reactions before saving a comment
const initializeReactions = function(next) {
  // Only initialize if this is a new comment or reactions are not set
  if (this.isNew || !this.reactions) {
    this.reactions = {
      like: { count: 0, users: [] },
      love: { count: 0, users: [] },
      laugh: { count: 0, users: [] },
      angry: { count: 0, users: [] }
    };
  }
  next();
};

const commentSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId()
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  reactions: {
    type: Map,
    of: reactionDetailSchema,
    default: () => ({
      like: { count: 0, users: [] },
      love: { count: 0, users: [] },
      laugh: { count: 0, users: [] },
      angry: { count: 0, users: [] }
    })
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Add pre-save middleware to initialize reactions
commentSchema.pre('save', initializeReactions);

// Add a method to safely add a reaction to a comment
commentSchema.methods.addReaction = async function(userId, reactionType) {
  // Convert to string if it's an ObjectId
  const userIdStr = userId.toString();
  
  // Initialize reactions if they don't exist
  if (!this.reactions) {
    this.reactions = new Map([
      ['like', { count: 0, users: [] }],
      ['love', { count: 0, users: [] }],
      ['laugh', { count: 0, users: [] }],
      ['angry', { count: 0, users: [] }]
    ]);
  }

  // Ensure the reaction type exists
  if (!this.reactions.has(reactionType)) {
    throw new Error(`Invalid reaction type: ${reactionType}`);
  }

  const reaction = this.reactions.get(reactionType);
  
  // Check if user already reacted
  const userIndex = reaction.users.findIndex(id => id.toString() === userIdStr);
  
  if (userIndex === -1) {
    // Add reaction
    reaction.users.push(userId);
    reaction.count += 1;
  } else {
    // Remove reaction
    reaction.users.splice(userIndex, 1);
    reaction.count = Math.max(0, reaction.count - 1);
  }

  // Update the reactions map
  this.reactions.set(reactionType, reaction);
  
  // Mark the reactions map as modified
  this.markModified('reactions');
  
  // Don't save the subdocument directly, let the parent handle it
  return this;
};

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
