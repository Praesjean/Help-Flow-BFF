const { usuariosClient } = require('../../../infrastructure/clients/httpClients');

async function encaminharAuth(req, res) {
    try {
        const caminho = req.originalUrl.replace(/^\/api\/auth/, '');

        const response = await usuariosClient.request({
            method: req.method,
            url: `/api/auth${caminho}`,
            data: req.body,
            validateStatus: () => true
        });

        return res.status(response.status).send(response.data);
    } catch (error) {
        console.error(
            'Erro ao comunicar com o serviço de autenticação:',
            error.message
        );

        return res.status(502).json({
            message: 'Não foi possível comunicar com o serviço de autenticação'
        });
    }
}

module.exports = {
    encaminharAuth
};