
const { chamadosClient } = require('../../../infrastructure/clients/httpClients');

async function encaminharChamados(req, res) {
	try {
		const caminho = req.originalUrl.replace(/^\/api\/chamados/, '');

		const response = await chamadosClient.request({
			method: req.method,
			url: `/api/chamados${caminho}`,
			data: req.body,
			headers: req.headers.authorization
				? { Authorization: req.headers.authorization }
				: {},
			validateStatus: () => true
		});

		return res.status(response.status).send(response.data);
	} catch (error) {
		console.error(
			'Erro ao comunicar com o microserviço de Chamados:',
			error.message
		);

		return res.status(502).json({
			message: 'Não foi possível comunicar com o microserviço de Chamados'
		});
	}
}

module.exports = {
  	encaminharChamados
};