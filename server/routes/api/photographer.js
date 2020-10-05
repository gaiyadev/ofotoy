const PhotographerController = require('../../controllers/photographer/photographer');
const auth = require('../../middlewares/auth');
var express = require('express');
var router = express.Router();



/*  @route     POST api/photographers/book
    @desc      Fetch all bookings base on a photographer
    @access    Private
 */
router.post('/book', auth, PhotographerController.all_photographer_bookings);

/*  @route     POST api/photographers/post
    @desc      Post picture a photographer
    @access    Private
 */
router.post('/post', auth, PhotographerController.post_picture)

/*  @route     POST api/photographers/post/id
    @desc      DELETE picture a photographer
    @access    Private
 */
router.delete('/post/:id', auth, PhotographerController.delete_post)

/*  @route     POST api/photographers/post/id
    @desc      GET picture a photographer
    @access    Private
 */
router.get('/post/:id', auth, PhotographerController.get_single_picture)

module.exports = router;
