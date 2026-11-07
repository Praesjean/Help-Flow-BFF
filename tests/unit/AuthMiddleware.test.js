const jwt = require('jsonwebtoken');

const autenticar = require(
    '../../src/api/middlewares/authMiddleware'
);

describe('BFF - Middleware de autenticação JWT', () => {
    let req;
    let res;
    let next;

    const jwtSecretAnterior = process.env.JWT_SECRET;

    const gerarToken = (perfil = 'ADMIN', id = '2') => {
        return jwt.sign(
            { perfil },
            process.env.JWT_SECRET,
            {
                subject: id,
                algorithm: 'HS256',
                expiresIn: '1h'
            }
        );
    };

    beforeEach(() => {
        process.env.JWT_SECRET =
            'segredo-exclusivo-para-testes-do-bff-123456789';

        req = {
            headers: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        next = jest.fn();
    });

    afterAll(() => {
        if (jwtSecretAnterior === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = jwtSecretAnterior;
        }
    });

    test('deve rejeitar requisição sem token', () => {
        autenticar(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('deve rejeitar cabeçalho inválido', () => {
        req.headers.authorization = 'Token invalido';

        autenticar(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('deve rejeitar token inválido', () => {
        req.headers.authorization = 'Bearer token-invalido';

        autenticar(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('deve autenticar ADMIN com token válido', () => {
        const token = gerarToken('ADMIN');

        req.headers.authorization = `Bearer ${token}`;

        autenticar(req, res, next);

        expect(req.usuario).toEqual({
            id: '2',
            perfil: 'ADMIN'
        });

        expect(next).toHaveBeenCalledTimes(1);
    });

    test('deve autenticar ATENDENTE com token válido', () => {
        const token = gerarToken('ATENDENTE');

        req.headers.authorization = `Bearer ${token}`;

        autenticar(req, res, next);

        expect(req.usuario.perfil).toBe('ATENDENTE');
        expect(next).toHaveBeenCalledTimes(1);
    });

    test('deve autenticar CLIENTE com token válido', () => {
        const token = gerarToken('CLIENTE', '3');

        req.headers.authorization = `Bearer ${token}`;

        autenticar(req, res, next);

        expect(req.usuario).toEqual({
            id: '3',
            perfil: 'CLIENTE'
        });

        expect(next).toHaveBeenCalledTimes(1);
    });

    test('deve rejeitar perfil desconhecido', () => {
        const token = gerarToken('GERENTE');

        req.headers.authorization = `Bearer ${token}`;

        autenticar(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('deve rejeitar token expirado', () => {
        const token = jwt.sign(
            { perfil: 'ADMIN' },
            process.env.JWT_SECRET,
            {
                subject: '2',
                algorithm: 'HS256',
                expiresIn: -10
            }
        );

        req.headers.authorization = `Bearer ${token}`;

        autenticar(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('deve retornar 500 quando JWT_SECRET não estiver configurado', () => {
        delete process.env.JWT_SECRET;

        req.headers.authorization = 'Bearer token-teste';

        autenticar(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(next).not.toHaveBeenCalled();
    });
});