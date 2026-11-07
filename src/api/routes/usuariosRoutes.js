const express = require('express');
const {
    encaminharUsuarios
} = require('../../application/features/usuarios/usuariosProxy');

const router = express.Router();

router.use(encaminharUsuarios);

module.exports = router;