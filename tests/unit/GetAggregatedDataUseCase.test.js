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

const GetAggregatedDataUseCase = require("../../src/application/features/aggregatedData/GetAggregatedDataUseCase");

describe("BFF - GetAggregatedDataUseCase", () => {
  let useCase;

  const chamados = [
    {
      _id: "chamado-1",
      titulo: "Erro no sistema",
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

    useCase = new GetAggregatedDataUseCase();

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
    delete process.env.JWT_SECRET;
  });

  test("deve rejeitar requisição sem token", async () => {
    await expect(useCase.executar(undefined)).rejects.toMatchObject({
      status: 401,
    });
  });

  test("deve rejeitar cabeçalho de autenticação inválido", async () => {
    await expect(useCase.executar("Token invalido")).rejects.toMatchObject({
      status: 401,
    });
  });

  test("deve rejeitar JWT inválido", async () => {
    await expect(
      useCase.executar("Bearer token-invalido"),
    ).rejects.toMatchObject({
      status: 401,
    });
  });

  test("deve rejeitar JWT com perfil desconhecido", async () => {
    const token = gerarToken("GERENTE");

    await expect(useCase.executar(`Bearer ${token}`)).rejects.toMatchObject({
      status: 401,
    });
  });

  test("deve agregar chamados, usuários e métricas para ADMIN", async () => {
    const token = gerarToken("ADMIN");

    const resultado = await useCase.executar(`Bearer ${token}`);

    expect(resultado.usuarioAutenticado).toEqual({
      id: "2",
      perfil: "ADMIN",
    });

    expect(resultado.chamados.total).toBe(1);
    expect(resultado.usuarios.autorizado).toBe(true);
    expect(resultado.usuarios.total).toBe(1);
    expect(resultado.metricas).toEqual(metricas);

    expect(chamadosClient.get).toHaveBeenCalledTimes(1);
    expect(usuariosClient.get).toHaveBeenCalledTimes(1);
    expect(metricsClient.post).toHaveBeenCalledWith("", {
      chamados,
    });
  });

  test("deve agregar chamados e usuários para ATENDENTE", async () => {
    const token = gerarToken("ATENDENTE");

    const resultado = await useCase.executar(`Bearer ${token}`);

    expect(resultado.usuarios.autorizado).toBe(true);
    expect(resultado.usuarios.total).toBe(1);
    expect(resultado.metricas).toEqual(metricas);
  });

  test("CLIENTE não deve consultar a lista de usuários", async () => {
    const token = gerarToken("CLIENTE", "3");

    const resultado = await useCase.executar(`Bearer ${token}`);

    expect(resultado.usuarioAutenticado.id).toBe("3");
    expect(resultado.usuarios.autorizado).toBe(false);
    expect(resultado.usuarios.dados).toBeUndefined();
    expect(usuariosClient.get).not.toHaveBeenCalled();
  });

  test("deve encaminhar o token aos microserviços", async () => {
    const token = gerarToken("ADMIN");
    const authorization = `Bearer ${token}`;

    await useCase.executar(authorization);

    expect(chamadosClient.get).toHaveBeenCalledWith("/api/chamados", {
      headers: {
        Authorization: authorization,
      },
    });

    expect(usuariosClient.get).toHaveBeenCalledWith("/api/usuarios", {
      headers: {
        Authorization: authorization,
      },
    });
  });

  test("deve retornar 502 quando Chamados estiver indisponível", async () => {
    chamadosClient.get.mockRejectedValue(new Error("ECONNREFUSED"));

    const token = gerarToken("ADMIN");

    await expect(useCase.executar(`Bearer ${token}`)).rejects.toMatchObject({
      status: 502,
    });
  });

  test("deve preservar erro 403 de um microserviço", async () => {
    usuariosClient.get.mockRejectedValue({
      response: {
        status: 403,
      },
    });

    const token = gerarToken("ADMIN");

    await expect(useCase.executar(`Bearer ${token}`)).rejects.toMatchObject({
      status: 403,
    });
  });

  test("deve rejeitar resposta inválida de Chamados", async () => {
    chamadosClient.get.mockResolvedValue({
      data: {
        erro: "Formato inválido",
      },
    });

    const token = gerarToken("CLIENTE");

    await expect(useCase.executar(`Bearer ${token}`)).rejects.toMatchObject({
      status: 502,
    });
  });

  test("deve rejeitar resposta inválida de Usuários", async () => {
    usuariosClient.get.mockResolvedValue({
      data: {
        erro: "Formato inválido",
      },
    });

    const token = gerarToken("ADMIN");

    await expect(useCase.executar(`Bearer ${token}`)).rejects.toMatchObject({
      status: 502,
    });
  });

  test("deve retornar 502 quando a Azure Function estiver indisponível", async () => {
    metricsClient.post.mockRejectedValue(new Error("ECONNREFUSED"));

    const token = gerarToken("CLIENTE");

    await expect(useCase.executar(`Bearer ${token}`)).rejects.toMatchObject({
      status: 502,
    });
  });

  test("deve incluir a data de geração do resultado", async () => {
    const token = gerarToken("CLIENTE");

    const resultado = await useCase.executar(`Bearer ${token}`);

    expect(resultado.geradoEm).toBeDefined();

    expect(Number.isNaN(Date.parse(resultado.geradoEm))).toBe(false);
  });
});
