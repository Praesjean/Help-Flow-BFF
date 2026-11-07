const axios = require('axios');

function createHttpClient(baseURL) {
	return axios.create({
		baseURL,
		timeout: 10000,
		headers: {
			'Content-Type': 'application/json'
		}
	});
}

const chamadosClient = createHttpClient(
  	process.env.CHAMADOS_SERVICE_URL || 'http://localhost:3001'
);

const usuariosClient = createHttpClient(
  	process.env.USUARIOS_SERVICE_URL || 'http://localhost:3002'
);

module.exports = {
	chamadosClient,
	usuariosClient
};