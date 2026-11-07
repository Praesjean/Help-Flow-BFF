const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'Help Flow - BFF API',
            version: '1.0.0',
            description:
                'Documentação da API Backend for Frontend do sistema Help Flow.'
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Ambiente local'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                Chamado: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        titulo: { type: 'string' },
                        descricao: { type: 'string' },
                        prioridade: {
                            type: 'string',
                            enum: ['BAIXA', 'MEDIA', 'ALTA']
                        },
                        status: { type: 'string' },
                        usuarioId: { type: 'string' }
                    }
                },
                Usuario: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        nome: { type: 'string' },
                        email: {
                            type: 'string',
                            format: 'email'
                        },
                        perfil: {
                            type: 'string',
                            enum: ['ADMIN', 'ATENDENTE', 'CLIENTE']
                        }
                    }
                },
                Erro: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' }
                    }
                }
            }
        },
        paths: {
            '/health': {
                get: {
                    tags: ['Monitoramento'],
                    summary: 'Verificar disponibilidade do BFF',
                    responses: {
                        200: {
                            description: 'BFF disponível'
                        }
                    }
                }
            },
            '/api/auth/login': {
                post: {
                    tags: ['Autenticação'],
                    summary: 'Autenticar usuário',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'senha'],
                                    properties: {
                                        email: {
                                            type: 'string',
                                            format: 'email'
                                        },
                                        senha: {
                                            type: 'string',
                                            format: 'password'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Autenticação realizada'
                        },
                        401: {
                            description: 'Credenciais inválidas'
                        },
                        502: {
                            description: 'Serviço de autenticação indisponível'
                        }
                    }
                }
            },
            '/api/auth/register': {
                post: {
                    tags: ['Autenticação'],
                    summary: 'Cadastrar novo usuário',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['nome', 'email', 'senha'],
                                    properties: {
                                        nome: { type: 'string' },
                                        email: {
                                            type: 'string',
                                            format: 'email'
                                        },
                                        senha: {
                                            type: 'string',
                                            format: 'password'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: 'Usuário cadastrado'
                        },
                        400: {
                            description: 'Dados inválidos'
                        }
                    }
                }
            },
            '/api/chamados': {
                get: {
                    tags: ['Chamados'],
                    summary: 'Listar chamados',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'Lista de chamados',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: {
                                            $ref: '#/components/schemas/Chamado'
                                        }
                                    }
                                }
                            }
                        },
                        401: {
                            description: 'Não autenticado'
                        }
                    }
                },
                post: {
                    tags: ['Chamados'],
                    summary: 'Criar chamado',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: [
                                        'titulo',
                                        'descricao',
                                        'prioridade'
                                    ],
                                    properties: {
                                        titulo: { type: 'string' },
                                        descricao: { type: 'string' },
                                        prioridade: {
                                            type: 'string',
                                            enum: ['BAIXA', 'MEDIA', 'ALTA']
                                        },
                                        usuarioId: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: 'Chamado criado'
                        },
                        400: {
                            description: 'Dados inválidos'
                        }
                    }
                }
            },
            '/api/chamados/{id}': {
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                get: {
                    tags: ['Chamados'],
                    summary: 'Consultar chamado',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: 'Chamado encontrado' },
                        404: { description: 'Chamado não encontrado' }
                    }
                },
                put: {
                    tags: ['Chamados'],
                    summary: 'Atualizar chamado',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        titulo: { type: 'string' },
                                        descricao: { type: 'string' },
                                        prioridade: { type: 'string' },
                                        status: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'Chamado atualizado' },
                        403: { description: 'Acesso negado' }
                    }
                },
                delete: {
                    tags: ['Chamados'],
                    summary: 'Excluir chamado',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: 'Chamado excluído' },
                        403: { description: 'Acesso negado' }
                    }
                }
            },
            '/api/usuarios': {
                get: {
                    tags: ['Usuários'],
                    summary: 'Listar usuários',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: 'Lista de usuários' },
                        403: { description: 'Acesso negado' }
                    }
                },
                post: {
                    tags: ['Usuários'],
                    summary: 'Criar usuário',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['nome', 'email', 'senha'],
                                    properties: {
                                        nome: { type: 'string' },
                                        email: {
                                            type: 'string',
                                            format: 'email'
                                        },
                                        senha: {
                                            type: 'string',
                                            format: 'password'
                                        },
                                        perfil: {
                                            type: 'string',
                                            enum: [
                                                'ADMIN',
                                                'ATENDENTE',
                                                'CLIENTE'
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        201: { description: 'Usuário criado' },
                        403: { description: 'Acesso negado' }
                    }
                }
            },
            '/api/usuarios/{id}': {
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'integer' }
                    }
                ],
                get: {
                    tags: ['Usuários'],
                    summary: 'Consultar usuário',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: 'Usuário encontrado' },
                        404: { description: 'Usuário não encontrado' }
                    }
                },
                put: {
                    tags: ['Usuários'],
                    summary: 'Atualizar usuário',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: 'Usuário atualizado' },
                        403: { description: 'Acesso negado' }
                    }
                },
                delete: {
                    tags: ['Usuários'],
                    summary: 'Excluir usuário',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: 'Usuário excluído' },
                        403: { description: 'Acesso negado' }
                    }
                }
            },
            '/aggregated-data': {
                get: {
                    tags: ['Agregação'],
                    summary: 'Obter dados agregados dos microserviços',
                    description:
                        'Consolida chamados e, conforme o perfil, usuários.',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'Dados agregados com sucesso'
                        },
                        401: {
                            description: 'Token inválido ou ausente'
                        },
                        403: {
                            description: 'Acesso negado'
                        },
                        502: {
                            description: 'Falha na comunicação com microserviços'
                        }
                    }
                }
            }
        }
    },
    apis: []
};

module.exports = swaggerJsdoc(options);