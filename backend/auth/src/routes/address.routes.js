const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const { addressIdParamValidator } = require('../middlewares/validator.middleware');
const { getAddresses, addAddress, deleteaddress } = require('../controllers/address.controller');
const router = express.Router();

//for getting all addresses of logged in user
router.get('/',authMiddleware, getAddresses);

//for adding a new address for the logged in user
router.post('/', authMiddleware, addAddress);

//for deleting an address of the logged in user
router.delete('/:addressId', authMiddleware, addressIdParamValidator, deleteaddress);

module.exports = router;