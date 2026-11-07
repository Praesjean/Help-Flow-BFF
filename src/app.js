const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./api/swagger/swagger');

const chamadosRoutes = require('./api/routes/chamadosRoutes');
const usuariosRoutes = require('./api/routes/usuariosRoutes');
const authRoutes = require('./api/routes/authRoutes');
const aggregatedDataRoutes = require('./api/routes/aggregatedDataRoutes');

const errorHandler = require('./api/middlewares/errorHandler');

const app = express();

app.disable('x-powered-by');

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:'],
            fontSrc: ["'self'", 'data:']
        }
    }
}));

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument)
);

app.get('/api-docs.json', (req, res) => {
    return res.status(200).json(swaggerDocument);
});

app.get('/health', (req, res) => {
    return res.status(200).json({
        status: 'UP',
        service: 'help-flow-bff',
        timestamp: new Date().toISOString()
    });
});

app.use('/api/auth', authRoutes);

app.use('/api/chamados', chamadosRoutes);

app.use('/api/usuarios', usuariosRoutes);

app.use('/aggregated-data', aggregatedDataRoutes);

app.use((req, res) => {
    return res.status(404).json({
        message: 'Rota não encontrada'
    });
});

app.use(errorHandler);

module.exports = app;