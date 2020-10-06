const AdminController = require('../../controllers/admin/adminController');
const auth = require('../../middlewares/auth');
var express = require('express');
var router = express.Router();


/*  @route     POST api/admins/register
    @desc      Register a new admin to the system
    @access    Public
 */

router.post('/register', AdminController.admin_registration);

/*  @route     POST api/admins/login
    @desc      Login a admin to the system
    @access    Public
 */
router.post('/login', AdminController.admin_login);

/*  @route     POST api/users/changePassword
    @desc      Admin change password
    @access    Private
 */
router.put('/changePassword/:id', auth, AdminController.admin_change_password);

/*  @route     POST api/users/resetPassword
    @desc      Admin Forgot password (sending a reset link)
    @access    Private
 */
router.post('/resetPassword', AdminController.admin_reset_password);

/*  @route     POST api/admins/new-password
    @desc      Update a admin password from a link sent
    @access    Private
 */
router.put('/new-password', AdminController.new_password);


/*  @route     POST api/admins/all
    @desc      Get all booking
    @access    Private
 */
router.get('/all', auth, AdminController.all_booking);

/*  @route     POST api/admins/users
    @desc      Get all users
    @access    Private
 */
router.get('/users', auth, AdminController.all_users);

/*  @route     POST api/admins/photographer
    @desc      Get all photographer
    @access    Private
 */
router.get('/photographer', auth, AdminController.all_photographer);





module.exports = router;
