const UserController = require('../../controllers/user');
var express = require('express');
var router = express.Router();


/*  @route     POST api/users/register
    @desc      Sign up a user
    @access    Public
 */

router.post('/register', UserController.user_registration);

/*  @route     POST api/users/login
    @desc      Login a user
    @access    Public
 */
router.post('/login', UserController.user_login);

module.exports = router;
