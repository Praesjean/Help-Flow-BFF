const express = require('express');

const {
    encaminharAuth
} = require('../../application/features/auth/authProxy');

const router = express.Router();

router.post('/login', encaminharAuth);
router.post('/register', encaminharAuth);

module.exports = router;