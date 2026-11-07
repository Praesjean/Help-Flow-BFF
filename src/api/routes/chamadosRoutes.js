const express = require('express');
const { encaminharChamados } = require('../../application/features/chamados/chamadosProxy');

const router = express.Router();

router.use(encaminharChamados);

module.exports = router;