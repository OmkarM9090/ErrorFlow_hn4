const mongoose = require('mongoose');

const githubUrlSchema = new mongoose.Schema({
  githubId: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    trim: true,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('GithubUrl', githubUrlSchema);
