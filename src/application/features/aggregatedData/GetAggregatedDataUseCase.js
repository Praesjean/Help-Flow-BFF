const jwt = require("jsonwebtoken");

const {
  chamadosClient,
  usuariosClient,
  metricsClient,
} = require("../../../infrastructure/clients/httpClients");

class GetAggregatedDataUseCase {
  async executar(authorization) {
    if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) {
      const erro = new Error("Token de autenticação não informado.");
      erro.status = 401;
      throw erro;
    }

    const token = authorization.replace(/^Bearer\s+/i, "");

    if (!process.env.JWT_SECRET) {
      const erro = new Error("JWT_SECRET não configurado no BFF.");
      erro.status = 500;
      throw erro;
    }

    let usuarioAutenticado;

    try {
      usuarioAutenticado = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ["HS256"],
      });
    } catch (error) {
      const erro = new Error("Token inválido ou expirado.");
      erro.status = 401;
      throw erro;
    }

    const perfil = usuarioAutenticado.perfil;

    if (
      !usuarioAutenticado.sub ||
      !["ADMIN", "ATENDENTE", "CLIENTE"].includes(perfil)
    ) {
      const erro = new Error("Token com informações inválidas.");
      erro.status = 401;
      throw erro;
    }

    const podeListarUsuarios = ["ADMIN", "ATENDENTE"].includes(perfil);

    const headers = {
      Authorization: authorization,
    };

    const requisicoes = [chamadosClient.get("/api/chamados", { headers })];

    if (podeListarUsuarios) {
      requisicoes.push(usuariosClient.get("/api/usuarios", { headers }));
    }

    let respostas;

    try {
      respostas = await Promise.all(requisicoes);
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        const erro = new Error("Acesso negado por um dos microserviços.");
        erro.status = error.response.status;
        throw erro;
      }

      const erro = new Error("Não foi possível consultar os microserviços.");
      erro.status = 502;
      throw erro;
    }

    const chamados = respostas[0].data;

    if (!Array.isArray(chamados)) {
      const erro = new Error("Resposta inválida do microserviço de Chamados.");
      erro.status = 502;
      throw erro;
    }

    // Consulta a Azure Function para calcular as métricas
    let metricas;

    try {
      const respostaMetricas = await metricsClient.post("", {
        chamados,
      });

      metricas = respostaMetricas.data;
    } catch (error) {
      const erro = new Error(
        "Não foi possível calcular as métricas dos chamados.",
      );
      erro.status = 502;
      throw erro;
    }

    const resultado = {
      usuarioAutenticado: {
        id: String(usuarioAutenticado.sub),
        perfil,
      },
      chamados: {
        total: chamados.length,
        dados: chamados,
      },
      metricas,
      usuarios: {
        autorizado: podeListarUsuarios,
      },
      geradoEm: new Date().toISOString(),
    };

    if (podeListarUsuarios) {
      const usuarios = respostas[1].data;

      if (!Array.isArray(usuarios)) {
        const erro = new Error(
          "Resposta inválida do microserviço de Usuários.",
        );
        erro.status = 502;
        throw erro;
      }

      resultado.usuarios.total = usuarios.length;
      resultado.usuarios.dados = usuarios;
    }

    return resultado;
  }
}

module.exports = GetAggregatedDataUseCase;
