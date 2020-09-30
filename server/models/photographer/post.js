const mongoose = require('mongoose');
require('../../database/db');
const { ObjectId } = mongoose.Schema.Types;

const PostSchema = new mongoose.Schema({
    description: {
        type: String,
        maxlength: 255,
        minlength: 4,
    },
    postedBy: {
        type: ObjectId,
        ref: "Photographer"
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

const Post = mongoose.model('Post', PostSchema);
module.exports = Post;

module.exports.post = async (newPost, callback) => {
    await newPost.save(callback); //create New Booking
}
