const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("../../src/infrastructure/clients/httpClients", () => ({
  chamadosClient: {
    get: jest.fn(),
  },
  usuariosClient: {
    get: jest.fn(),
  },
  metricsClient: {
    post: jest.fn(),
  },
}));

const {
  chamadosClient,
  usuariosClient,
  metricsClient,
} = require("../../src/infrastructure/clients/httpClients");

const app = require("../../src/app");

describe("BFF - Integração HTTP", () => {
  const jwtSecretAnterior = process.env.JWT_SECRET;

  const chamados = [
    {
      _id: "chamado-1",
      titulo: "Problema de acesso",
      usuarioId: "2",
      status: "ABERTO",
    },
  ];

  const usuarios = [
    {
      id: 2,
      nome: "Administrador",
      perfil: "ADMIN",
    },
  ];

  const metricas = {
    totalChamados: 1,
    chamadosAbertos: 1,
    chamadosEmAndamento: 0,
    chamadosResolvidos: 0,
    chamadosFechados: 0,
    chamadosConcluidos: 0,
    percentualResolucao: 0,
    distribuicaoPorPrioridade: {
      BAIXA: 0,
      MEDIA: 0,
      ALTA: 0,
      CRITICA: 0,
    },
  };

  const gerarToken = (perfil, id = "2") => {
    return jwt.sign({ perfil }, process.env.JWT_SECRET, {
      subject: id,
      algorithm: "HS256",
      expiresIn: "1h",
    });
  };

  beforeEach(() => {
    process.env.JWT_SECRET = "segredo-exclusivo-para-testes-do-bff-123456789";

    jest.clearAllMocks();

    chamadosClient.get.mockResolvedValue({
      data: chamados,
    });

    usuariosClient.get.mockResolvedValue({
      data: usuarios,
    });

    metricsClient.post.mockResolvedValue({
      data: metricas,
    });
  });

  afterAll(() => {
    if (jwtSecretAnterior === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = jwtSecretAnterior;
    }
  });

  test("GET /health deve retornar 200", async () => {
    const resposta = await request(app).get("/health");

    expect(resposta.status).toBe(200);
    expect(resposta.body.status).toBe("UP");
    expect(resposta.body.service).toBe("help-flow-bff");
  });

  test("GET /aggregated-data sem token deve retornar 401", async () => {
    const resposta = await request(app).get("/aggregated-data");

    expect(resposta.status).toBe(401);
  });

  test("GET /aggregated-data com token inválido deve retornar 401", async () => {
    const resposta = await request(app)
      .get("/aggregated-data")
      .set("Authorization", "Bearer token-invalido");

    expect(resposta.status).toBe(401);
  });

  test("ADMIN deve receber chamados, usuários e métricas", async () => {
    const token = gerarToken("ADMIN");

    const resposta = await request(app)
      .get("/aggregated-data")
      .set("Authorization", `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.usuarioAutenticado).toEqual({
      id: "2",
      perfil: "ADMIN",
    });

    expect(resposta.body.chamados.total).toBe(1);
    expect(resposta.body.usuarios.autorizado).toBe(true);
    expect(resposta.body.usuarios.total).toBe(1);
    expect(resposta.body.metricas).toEqual(metricas);
  });

  test("ATENDENTE deve receber chamados e usuários", async () => {
    const token = gerarToken("ATENDENTE");

    const resposta = await request(app)
      .get("/aggregated-data")
      .set("Authorization", `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.usuarios.autorizado).toBe(true);
    expect(resposta.body.usuarios.total).toBe(1);
  });

  test("CLIENTE não deve receber dados de usuários", async () => {
    const token = gerarToken("CLIENTE", "3");

    const resposta = await request(app)
      .get("/aggregated-data")
      .set("Authorization", `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.usuarioAutenticado.id).toBe("3");
    expect(resposta.body.usuarios.autorizado).toBe(false);
    expect(resposta.body.usuarios.dados).toBeUndefined();

    expect(usuariosClient.get).not.toHaveBeenCalled();
  });

  test("deve retornar 502 quando um microserviço falhar", async () => {
    chamadosClient.get.mockRejectedValue(new Error("ECONNREFUSED"));

    const token = gerarToken("ADMIN");

    const resposta = await request(app)
      .get("/aggregated-data")
      .set("Authorization", `Bearer ${token}`);

    expect(resposta.status).toBe(502);
  });

  test("deve retornar 403 quando o microserviço negar acesso", async () => {
    usuariosClient.get.mockRejectedValue({
      response: {
        status: 403,
      },
    });

    const token = gerarToken("ADMIN");

    const resposta = await request(app)
      .get("/aggregated-data")
      .set("Authorization", `Bearer ${token}`);

    expect(resposta.status).toBe(403);
  });

  test("deve retornar 502 quando a Azure Function falhar", async () => {
    metricsClient.post.mockRejectedValue(new Error("ECONNREFUSED"));

    const token = gerarToken("CLIENTE");

    const resposta = await request(app)
      .get("/aggregated-data")
      .set("Authorization", `Bearer ${token}`);

    expect(resposta.status).toBe(502);
  });

  test("deve retornar 404 para rota inexistente", async () => {
    const resposta = await request(app).get("/rota-inexistente");

    expect(resposta.status).toBe(404);
  });

  test("deve retornar 400 para JSON inválido", async () => {
    const resposta = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email":');

    expect(resposta.status).toBe(400);
  });
});
