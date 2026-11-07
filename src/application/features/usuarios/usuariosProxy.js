const { usuariosClient } = require('../../../infrastructure/clients/httpClients');

async function encaminharUsuarios(req, res) {
	try {
		const caminho = req.originalUrl.replace(/^\/api\/usuarios/, '');

		const response = await usuariosClient.request({
			method: req.method,
			url: `/api/usuarios${caminho}`,
			data: req.body,
			headers: req.headers.authorization
				? { Authorization: req.headers.authorization }
				: {},
			validateStatus: () => true
		});

		return res.status(response.status).send(response.data);
	} catch (error) {
		console.error(
			'Erro ao comunicar com o microserviço de Usuários:',
			error.message
		);

		return res.status(502).json({
			message: 'Não foi possível comunicar com o microserviço de Usuários'
		});
	}
}

module.exports = {
  	encaminharUsuarios
};