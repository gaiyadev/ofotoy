const UserController = require('../../controllers/user/user');
const auth = require('../../middlewares/auth');
var express = require('express');
var router = express.Router();


/*  @route     POST api/users/register
    @desc      Register a  new user to the system
    @access    Public
 */

router.post('/register', UserController.user_registration);

/*  @route     POST api/users/login
    @desc      Login a user to the system
    @access    Public
 */
router.post('/login', UserController.user_login);

/*  @route     POST api/users/changePassword
    @desc      User change password
    @access    Private
 */
router.put('/changePassword/:id', auth, UserController.user_change_password);

/*  @route     POST api/users/resetPassword
    @desc      User Forgot password (sending a reset link)
    @access    Private
 */
router.post('/resetPassword', UserController.user_reset_password);

/*  @route     POST api/users/new-password
    @desc      Update a user password from a link sent
    @access    Private
 */
router.put('/new-password', UserController.new_password);

/*  @route     POST api/users/user-profile
    @desc      Complete user registration
    @access    Private
 */
router.post('/user-profile/:userId', auth, UserController.complete_user_registration);

/*  @route     POST api/users/update-profile
    @desc      Update user registration data
    @access    Private
 */
router.put('/update-profile/:userId', auth, UserController.update_user_profile);

/*  @route     POST api/users/book
    @desc      Complete user registration
    @access    Private
 */
router.post('/book/:userId', auth, UserController.book_photographer);

module.exports = router;
