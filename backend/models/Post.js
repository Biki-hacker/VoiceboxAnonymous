// models/Post.js
const mongoose = require('mongoose');
const { encryptContent } = require('../utils/cryptoUtils');

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
    type: mongoose.Schema.Types.Mixed,
    required: true
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
  createdByRole: {
    type: String,
    required: true
  },
  isPinned: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Add pre-save middleware to initialize reactions
commentSchema.pre('save', initializeReactions);
// Add pre-save middleware to encrypt comment text
commentSchema.pre('save', encryptContent);

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

// Poll option sub-schema
const pollOptionSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId()
  },
  text: {
    type: mongoose.Schema.Types.Mixed, // encrypted string
    required: true
  },
  voteCount: {
    type: Number,
    default: 0
  }
}, { _id: false });

// Poll vote sub-schema
const pollVoteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  optionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
}, { _id: false });

// Main Post schema
const postSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    postType: {
      type: String,
      enum: ['feedback', 'complaint', 'suggestion', 'public', 'poll'],
      required: true
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: function() { return !this.isPoll; }
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
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdByRole: {
      type: String,
      required: true
    },
    isAnonymous: {
      type: Boolean,
      default: true
    },
    comments: [commentSchema],
    reactions: {
      like: reactionDetailSchema,
      love: reactionDetailSchema,
      laugh: reactionDetailSchema,
      angry: reactionDetailSchema
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    // Poll fields
    isPoll: {
      type: Boolean,
      default: false
    },
    pollQuestion: {
      type: mongoose.Schema.Types.Mixed // encrypted string
    },
    pollOptions: {
      type: [pollOptionSchema],
      default: undefined // only present if isPoll is true
    },
    pollStatus: {
      type: String,
      enum: ['active', 'stopped'],
      default: 'active'
    },
    pollVotes: {
      type: [pollVoteSchema],
      default: undefined // only present if isPoll is true
    },
    pollStoppedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

// Add pre-save middleware to encrypt post content
postSchema.pre('save', encryptContent);

// Add pre-save middleware to encrypt poll question and options
postSchema.pre('save', async function(next) {
  // Encrypt poll question
  if (this.isPoll && this.isModified('pollQuestion') && this.pollQuestion && typeof this.pollQuestion === 'string') {
    try {
      const { encrypt } = require('../utils/cryptoUtils');
      this.pollQuestion = await encrypt(this.pollQuestion);
    } catch (error) {
      return next(error);
    }
  }
  // Encrypt poll options
  if (this.isPoll && Array.isArray(this.pollOptions)) {
    const { encrypt } = require('../utils/cryptoUtils');
    for (let i = 0; i < this.pollOptions.length; i++) {
      if (this.pollOptions[i].text && typeof this.pollOptions[i].text === 'string') {
        this.pollOptions[i].text = await encrypt(this.pollOptions[i].text);
      }
    }
  }
  next();
});

// Add post-find middleware to decrypt content
postSchema.post('find', async function(docs) {
  if (Array.isArray(docs)) {
    for (let doc of docs) {
      if (doc && typeof doc.decryptContent === 'function') {
        await doc.decryptContent();
      }
    }
  } else if (docs && typeof docs.decryptContent === 'function') {
    await docs.decryptContent();
  }
  return docs;
});

postSchema.post('findOne', async function(doc) {
  if (doc && typeof doc.decryptContent === 'function') {
    await doc.decryptContent();
  }
  return doc;
});

// Add instance method to decrypt content
postSchema.methods.decryptContent = async function() {
  const { decrypt } = require('../utils/cryptoUtils');
  
  // Decrypt post content
  if (this.content && typeof this.content === 'object' && this.content.isEncrypted) {
    this.content = await decrypt(this.content);
  }
  
  // Decrypt comments (fix: use 'text' instead of 'content')
  if (this.comments && Array.isArray(this.comments)) {
    for (let comment of this.comments) {
      if (comment.text && typeof comment.text === 'object' && comment.text.isEncrypted) {
        comment.text = await decrypt(comment.text);
      }
    }
  }
  
  return this;
};

// Add instance method to decrypt poll question and options
postSchema.methods.decryptPoll = async function() {
  const { decrypt } = require('../utils/cryptoUtils');
  if (this.isPoll) {
    if (this.pollQuestion && typeof this.pollQuestion === 'object' && this.pollQuestion.isEncrypted) {
      this.pollQuestion = await decrypt(this.pollQuestion);
    }
    if (Array.isArray(this.pollOptions)) {
      for (let i = 0; i < this.pollOptions.length; i++) {
        if (this.pollOptions[i].text && typeof this.pollOptions[i].text === 'object' && this.pollOptions[i].text.isEncrypted) {
          this.pollOptions[i].text = await decrypt(this.pollOptions[i].text);
        }
      }
    }
  }
  return this;
};

module.exports = mongoose.model('Post', postSchema);
