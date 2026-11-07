const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {
    const authorization = req.headers.authorization;

    if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) {
        return res.status(401).json({
            message: 'Token de autenticação não informado.'
        });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({
            message: 'Erro interno de configuração da autenticação.'
        });
    }

    const token = authorization.replace(/^Bearer\s+/i, '');

    try {
        const payload = jwt.verify(
            token,
            process.env.JWT_SECRET,
            {
                algorithms: ['HS256']
            }
        );

        if (
            !payload.sub ||
            !['ADMIN', 'ATENDENTE', 'CLIENTE'].includes(payload.perfil)
        ) {
            return res.status(401).json({
                message: 'Token com informações inválidas.'
            });
        }

        req.usuario = {
            id: String(payload.sub),
            perfil: payload.perfil
        };

        return next();
    } catch (error) {
        return res.status(401).json({
            message: 'Token inválido ou expirado.'
        });
    }
}

module.exports = autenticar;