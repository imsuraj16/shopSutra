const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const { getAddresses, addAddress } = require('../controllers/address.controller');
const router = express.Router();

//for getting all addresses of logged in user
router.get('/',authMiddleware, getAddresses);

//for adding a new address for the logged in user
router.post('/', authMiddleware, addAddress);

module.exports = router;