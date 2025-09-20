const express = require('express');
const { register, login } = require('../controllers/auth.controller');
const { registerUserValidator, loginUserValidator } = require('../middlewares/validator.middleware');

const router = express.Router();

router.post('/register', registerUserValidator, register);
router.post('/login', loginUserValidator, login);

module.exports = router;
