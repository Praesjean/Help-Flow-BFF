const express = require('express');

const aggregatedDataController = require(
    '../controllers/AggregatedDataController'
);

const autenticar = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', autenticar, (req, res) => {
    return aggregatedDataController.obterDados(req, res);
});

module.exports = router;