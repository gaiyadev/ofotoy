const mongoose = require('mongoose');
require('../../database/db');
const { ObjectId } = mongoose.Schema.Types;

const CommentSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        maxlength: 255,
        lowercase: true
    },
    rating: [
        {
            type: ObjectId,
            ref: "User"
        }
    ],
    rate_date: {
        type: Date,
        default: Date.now
    }
});

const Comment = mongoose.model('Comment', CommentSchema);
module.exports = Comment;

module.exports.newComment = async (newComment, callback) => {
    if (err) throw err;
    newComment.save(callback);

}
