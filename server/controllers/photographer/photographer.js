const Photographer = require('../../models/photographer/photographer');
const Post = require('../../models/photographer/post');
const User = require('../../models/user/user');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require("fs");


/** ===============================================================================================
 * FETCH ALL PHOTOGRAPHER'S BOOKINGS
 * ================================================================================================= *
 */
exports.all_photographer_bookings = async (req, res) => {

}

/** ===============================================================================================
 * POST A PICTURE (10 only)
 * ================================================================================================= *
 */


// file upload code

const storage2 = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, './public/photographer/')
    },
    limits: {
        fileSize: 5000000
    },
    filename: function (req, file, cb) {
        let datetimestamp = Date.now();
        let pic = file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1];
        cb(null, pic);
    },
    fileFilter: (req, file, cb) => {
        // allow images only
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            console.log('Only image are allowed.');
        }
        cb(null, true);
    },
});

const uploadSingle2 = multer({
    storage: storage2
}).single('profile_image');

exports.post_picture = async (req, res) => {
    const { id } = req.user._id;
    const { description, picture } = req.body;

    const schema = Joi.object({
        description: Joi.string().required(),
    });
    const { error } = schema.validate({
        description: description,
        picture: picture
    });
    if (error) {
        return res.status(400).json({
            error: error.details[0].message,
        });
    }
    //
    await User.findOne({ _id: id, userType: "Photographer" }).then(user => {
        if (!user) return res.status(400).json({ error: " No User found" });
        const newPost = new Post({
            description: description,
            picture: picture,
            postedBy: user._id,
        });
        Post.BookPhotography(newPost, (err, post) => {
            if (err) return err;
            return res.status(200).json({
                status: "Post created successfully",
                post
            });

        });
    }).catch(() => {
        return res.status(400).json({
            error: " No User found"
        });
    })
}

/** ===============================================================================================
 * FETCH All PICTURE (10 only)
 * ================================================================================================= *
 */
exports.fetch_all_post = async (req, res) => {
    const { id } = req.user._id;
    await Post.findOne({ _id: id, userType: "Photographer", postedBy: id }).then(post => {
        return res.status(200).json({
            status: "Successful",
            post
        });
    }).catch(err => {
        return res.status(200).json({
            status: "fail",
            error: err
        });
    });
}

/** ===============================================================================================
 * DELETE A PICTURE 
 * ================================================================================================= *
 */
exports.delete_post = async (req, res) => {
    const id = req.params.id;
    await Post.findOneAndDelete({ postedBy: id, userType: "Photographer" }).then(post => {
        if (!post) {
            return res.json({
                message: "Post not found",
            });
        }
        return res.json({
            message: "Post deleted successfully",
            post
        });
    }).catch(err => {
        return res.json({
            message: "Booking not found",
            error: err,
        });
    })
}

/** ===============================================================================================
 * FETCH A SINGLE PICTURE 
 * ================================================================================================= *
 */

exports.get_single_picture = async (req, res) => {
    const id = req.params.id;
    await Post.findOne({ postedBy: id, userType: "Photographer" }).then(post => {
        if (!post) return res.status(400).json({ message: "No post found" });
        return res.json({
            status: true,
            post
        });
    }).catch(err => {
        return res.json({
            error: err,
        });
    });
}

/** ===============================================================================================
 * UPDATE A SINGLE PICTURE
 * ================================================================================================= *
 */
exports.update_picture = async (req, res) => {
    const userId = req.params.id;
    const { id } = req.user._id;
    const { description, picture } = req.body;

    const schema = Joi.object({
        description: Joi.string().required(),
        picture: Joi.string(),
    });

    const { error } = schema.validate({
        description: description,
        picture: picture
    });
    if (error) {
        return res.status(400).json({
            error: error.details[0].message,
        });
    }
    //
    await Post.findOneAndUpdate({ postedBy: userId, userType: "Photographer" }).then(post => {
        if (!post) {
            return res.status(400).json({
                error: "Booking not found",
            });
        }
        post.description = description;
        post.picture = picture
        post.save();
        return res.json({
            message: "Post updated successfully",
            post
        });
    }).catch(err => {
        return res.status(400).json({
            error: err,
        });
    });
}