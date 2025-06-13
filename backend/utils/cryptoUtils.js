const crypto = require('crypto');
const { promisify } = require('util');
const pbkdf2 = promisify(crypto.pbkdf2);

// In a production environment, these should come from environment variables
const SALT = process.env.ENCRYPTION_SALT || 'default-salt-value';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key';

// Generate a random encryption key and IV
const generateKeyAndIV = async (password, salt) => {
  const keyMaterial = await pbkdf2(password, salt, 100000, 48, 'sha512');
  return {
    key: keyMaterial.slice(0, 32), // 32 bytes for AES-256
    iv: keyMaterial.slice(32, 48)   // 16 bytes for IV
  };
};

// Encrypt text
const encrypt = async (text, password = ENCRYPTION_KEY) => {
  try {
    if (!text) return text;
    
    const { key, iv } = await generateKeyAndIV(password, SALT);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      iv: iv.toString('hex'),
      content: encrypted,
      version: '1.0.0',
      isEncrypted: true
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

// Decrypt text
const decrypt = async (encryptedData, password = ENCRYPTION_KEY) => {
  try {
    // If it's not an object or doesn't have the encrypted structure, return as is
    if (!encryptedData || typeof encryptedData !== 'object' || !encryptedData.iv || !encryptedData.content) {
      return encryptedData;
    }
    
    const { key } = await generateKeyAndIV(password, SALT);
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedData.content, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    // Return the original data if decryption fails
    return encryptedData;
  }
};

// Middleware to encrypt post/comment content before saving
const encryptContent = async function(next) {
  if (this.isModified('content') && this.content && typeof this.content === 'string') {
    try {
      this.content = await encrypt(this.content);
    } catch (error) {
      return next(error);
    }
  }
  next();
};

// Helper to decrypt post/comment content after query
const decryptContent = async (doc) => {
  if (!doc) return doc;
  
  // Handle single document
  if (doc.content && typeof doc.content === 'object' && doc.content.isEncrypted) {
    doc.content = await decrypt(doc.content);
  }
  
  // Handle array of documents
  if (Array.isArray(doc)) {
    for (let item of doc) {
      if (item.content && typeof item.content === 'object' && item.content.isEncrypted) {
        item.content = await decrypt(item.content);
      }
    }
  }
  
  return doc;
};

module.exports = {
  encrypt,
  decrypt,
  encryptContent,
  decryptContent
};