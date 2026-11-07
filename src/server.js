require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Help Flow BFF iniciado na porta ${PORT}`);
    console.log(`Health: http://localhost:${PORT}/health`);
});