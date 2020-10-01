const PhotographerController = require('../../controllers/photographer/photographer');
const auth = require('../../middlewares/auth');
var express = require('express');
var router = express.Router();


/*  @route     POST api/photographers/register
    @desc      Register a  new photographer to the system
    @access    Public
 */

router.post('/register', PhotographerController.photographer_registration);

/*  @route     POST api/photographers/login
    @desc      Login a photographer to the system
    @access    Public
 */
router.post('/login', PhotographerController.photographer_login);

/*  @route     POST api/photographers/changePassword
    @desc      Photographer change password
    @access    Private
 */
router.put('/changePassword/:id', auth, PhotographerController.photographer_change_password);

/*  @route     POST api/photographers/resetPassword
    @desc      Photographer Forgot password (sending a reset link)
    @access    Private
 */
router.post('/resetPassword/', PhotographerController.photographer_reset_password);

/*  @route     POST api/photographers/new-password
    @desc      Update a photographer password from a link sent
    @access    Private
 */
router.put('/new-password', PhotographerController.photographer_new_password);

/*  @route     POST api/photographers/user-profile
    @desc      Complete user registration
    @access    Private
 */
router.post('/user-profile/:photographerId', auth, PhotographerController.complete_user_registration);

/*  @route     POST api/photographers/update-profile
    @desc      Update user profile
    @access    Private
 */
router.put('/update-profile/:photographerId', auth, PhotographerController.update_user_profile);

/*  @route     POST api/photographers/book
    @desc      Fetch all bookings base on a photographer
    @access    Private
 */
router.post('/book', auth, PhotographerController.photographer_bookings);

/*  @route     POST api/photographers/post
    @desc      Post picture a photographer
    @access    Private
 */
router.post('/post', auth, PhotographerController.post_picture)

module.exports = router;
