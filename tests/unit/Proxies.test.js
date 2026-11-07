jest.mock('../../src/infrastructure/clients/httpClients', () => ({
    chamadosClient: {
        request: jest.fn()
    },
    usuariosClient: {
        request: jest.fn()
    }
}));

const {
    chamadosClient,
    usuariosClient
} = require('../../src/infrastructure/clients/httpClients');

const {
    encaminharAuth
} = require('../../src/application/features/auth/authProxy');

const {
    encaminharChamados
} = require('../../src/application/features/chamados/chamadosProxy');

const {
    encaminharUsuarios
} = require('../../src/application/features/usuarios/usuariosProxy');

describe('BFF - Proxies dos microserviços', () => {
    let res;
    let consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();

        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    describe('Proxy de autenticação', () => {
        test('deve encaminhar login ao microserviço de Usuários', async () => {
            const req = {
                method: 'POST',
                originalUrl: '/api/auth/login',
                body: {
                    email: 'teste@exemplo.com',
                    senha: 'senha-de-teste'
                }
            };

            usuariosClient.request.mockResolvedValue({
                status: 200,
                data: {
                    token: 'jwt-simulado'
                }
            });

            await encaminharAuth(req, res);

            expect(usuariosClient.request).toHaveBeenCalledWith({
                method: 'POST',
                url: '/api/auth/login',
                data: req.body,
                validateStatus: expect.any(Function)
            });

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                token: 'jwt-simulado'
            });
        });

        test('deve preservar erro 401 do login', async () => {
            const req = {
                method: 'POST',
                originalUrl: '/api/auth/login',
                body: {
                    email: 'teste@exemplo.com',
                    senha: 'senha-incorreta'
                }
            };

            usuariosClient.request.mockResolvedValue({
                status: 401,
                data: {
                    message: 'Credenciais inválidas'
                }
            });

            await encaminharAuth(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        test('deve retornar 502 quando autenticação estiver indisponível', async () => {
            const req = {
                method: 'POST',
                originalUrl: '/api/auth/login',
                body: {}
            };

            usuariosClient.request.mockRejectedValue(
                new Error('ECONNREFUSED')
            );

            await encaminharAuth(req, res);

            expect(res.status).toHaveBeenCalledWith(502);
        });
    });

    describe('Proxy de Chamados', () => {
        test('deve encaminhar listagem com JWT', async () => {
            const req = {
                method: 'GET',
                originalUrl: '/api/chamados',
                body: {},
                headers: {
                    authorization: 'Bearer jwt-simulado'
                }
            };

            chamadosClient.request.mockResolvedValue({
                status: 200,
                data: [
                    {
                        id: '1',
                        titulo: 'Chamado de teste'
                    }
                ]
            });

            await encaminharChamados(req, res);

            expect(chamadosClient.request).toHaveBeenCalledWith({
                method: 'GET',
                url: '/api/chamados',
                data: {},
                headers: {
                    Authorization: 'Bearer jwt-simulado'
                },
                validateStatus: expect.any(Function)
            });

            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('deve preservar parâmetros de consulta', async () => {
            const req = {
                method: 'GET',
                originalUrl: '/api/chamados?status=ABERTO',
                body: {},
                headers: {}
            };

            chamadosClient.request.mockResolvedValue({
                status: 200,
                data: []
            });

            await encaminharChamados(req, res);

            expect(chamadosClient.request).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: '/api/chamados?status=ABERTO'
                })
            );
        });

        test('deve encaminhar criação de chamado', async () => {
            const req = {
                method: 'POST',
                originalUrl: '/api/chamados',
                body: {
                    titulo: 'Problema no sistema'
                },
                headers: {
                    authorization: 'Bearer jwt-simulado'
                }
            };

            chamadosClient.request.mockResolvedValue({
                status: 201,
                data: {
                    id: '1',
                    titulo: 'Problema no sistema'
                }
            });

            await encaminharChamados(req, res);

            expect(chamadosClient.request).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'POST',
                    data: req.body
                })
            );

            expect(res.status).toHaveBeenCalledWith(201);
        });

        test('deve preservar erro 403 de Chamados', async () => {
            const req = {
                method: 'DELETE',
                originalUrl: '/api/chamados/1',
                body: {},
                headers: {
                    authorization: 'Bearer jwt-simulado'
                }
            };

            chamadosClient.request.mockResolvedValue({
                status: 403,
                data: {
                    message: 'Acesso negado'
                }
            });

            await encaminharChamados(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
        });

        test('deve retornar 502 quando Chamados estiver indisponível', async () => {
            const req = {
                method: 'GET',
                originalUrl: '/api/chamados',
                body: {},
                headers: {}
            };

            chamadosClient.request.mockRejectedValue(
                new Error('ECONNREFUSED')
            );

            await encaminharChamados(req, res);

            expect(res.status).toHaveBeenCalledWith(502);
        });
    });

    describe('Proxy de Usuários', () => {
        test('deve encaminhar listagem com JWT', async () => {
            const req = {
                method: 'GET',
                originalUrl: '/api/usuarios',
                body: {},
                headers: {
                    authorization: 'Bearer jwt-simulado'
                }
            };

            usuariosClient.request.mockResolvedValue({
                status: 200,
                data: [
                    {
                        id: 1,
                        nome: 'Usuário de teste'
                    }
                ]
            });

            await encaminharUsuarios(req, res);

            expect(usuariosClient.request).toHaveBeenCalledWith({
                method: 'GET',
                url: '/api/usuarios',
                data: {},
                headers: {
                    Authorization: 'Bearer jwt-simulado'
                },
                validateStatus: expect.any(Function)
            });

            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('deve encaminhar atualização de usuário', async () => {
            const req = {
                method: 'PUT',
                originalUrl: '/api/usuarios/1',
                body: {
                    nome: 'Nome atualizado'
                },
                headers: {
                    authorization: 'Bearer jwt-simulado'
                }
            };

            usuariosClient.request.mockResolvedValue({
                status: 200,
                data: {
                    id: 1,
                    nome: 'Nome atualizado'
                }
            });

            await encaminharUsuarios(req, res);

            expect(usuariosClient.request).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'PUT',
                    url: '/api/usuarios/1',
                    data: req.body
                })
            );
        });

        test('deve preservar erro 404 de Usuários', async () => {
            const req = {
                method: 'GET',
                originalUrl: '/api/usuarios/999',
                body: {},
                headers: {}
            };

            usuariosClient.request.mockResolvedValue({
                status: 404,
                data: {
                    message: 'Usuário não encontrado'
                }
            });

            await encaminharUsuarios(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        test('deve retornar 502 quando Usuários estiver indisponível', async () => {
            const req = {
                method: 'GET',
                originalUrl: '/api/usuarios',
                body: {},
                headers: {}
            };

            usuariosClient.request.mockRejectedValue(
                new Error('ECONNREFUSED')
            );

            await encaminharUsuarios(req, res);

            expect(res.status).toHaveBeenCalledWith(502);
        });
    });
});