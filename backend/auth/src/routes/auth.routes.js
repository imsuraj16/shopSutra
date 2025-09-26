const express = require('express');
const { register, login, currentUser, logout } = require('../controllers/auth.controller');
const { registerUserValidator, loginUserValidator } = require('../middlewares/validator.middleware');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// POST /api/auth/register
router.post('/register', registerUserValidator, register);

// POST /api/auth/login
router.post('/login', loginUserValidator, login);

//GET /api/auth/me
router.get('/me', authMiddleware,currentUser);

// POST /api/auth/logout
// Logout should be idempotent and not require auth; it just clears the cookie
router.post('/logout', logout);




module.exports = router;
