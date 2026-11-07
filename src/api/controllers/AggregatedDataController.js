const GetAggregatedDataUseCase = require('../../application/features/aggregatedData/GetAggregatedDataUseCase');

const getAggregatedDataUseCase = new GetAggregatedDataUseCase();

class AggregatedDataController {
    async obterDados(req, res) {
        try {
            const resultado = await getAggregatedDataUseCase.executar(
                req.headers.authorization
            );

            return res.status(200).json(resultado);
        } catch (error) {
            console.error('Erro ao agregar dados:', error.message);

            const status = [401, 403, 502].includes(error.status)
                ? error.status
                : 500;

            return res.status(status).json({
                message:
                    status === 500
                        ? 'Erro interno ao agregar dados.'
                        : error.message
            });
        }
    }
}

module.exports = new AggregatedDataController();