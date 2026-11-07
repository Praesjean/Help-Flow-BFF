function errorHandler(err, req, res, next) {
    console.error('Erro no BFF:', err.message);

    if (err.status === 400 && err.type === 'entity.parse.failed') {
        return res.status(400).json({
            message: 'JSON inválido'
        });
    }

    const status = Number.isInteger(err.status) &&
        err.status >= 400 &&
        err.status < 600
        ? err.status
        : 500;

    return res.status(status).json({
        message:
            status === 500
                ? 'Erro interno do servidor'
                : err.message
    });
}

module.exports = errorHandler;