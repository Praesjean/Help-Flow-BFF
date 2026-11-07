# Help Flow - Backend for Frontend (BFF)

## 1. Descrição

O Help Flow BFF é o componente responsável pela comunicação entre o microfrontend React e os microserviços da aplicação Help Flow.

Desenvolvido em Node.js com Express, o BFF centraliza as requisições do frontend, encaminha operações aos microserviços e disponibiliza um endpoint de agregação de dados.

O componente integra:

- Microservice Chamados, com MongoDB Atlas.
- Microservice Usuários, com Azure SQL.
- Autenticação baseada em JWT.
- Documentação Swagger/OpenAPI.
- Testes automatizados com Jest e Supertest.

O BFF não possui banco de dados próprio. Cada microserviço é responsável pela persistência de seus dados.

## 2. Tecnologias

- Node.js 22
- Express 5
- Axios
- JSON Web Token (JWT)
- Helmet
- CORS
- dotenv
- Swagger UI
- Swagger JSDoc
- Jest
- Supertest
- Nodemon
- Docker

## 3. Arquitetura

O BFF utiliza uma organização em camadas inspirada na Clean Architecture, separando as responsabilidades de API, Application e Infrastructure.

Também utiliza a organização por funcionalidades (Vertical Slice) na camada Application.

### Estrutura do projeto

```text
bff/
├── src/
│   ├── api/
│   │   ├── controllers/
│   │   │   └── AggregatedDataController.js
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── aggregatedDataRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── chamadosRoutes.js
│   │   │   └── usuariosRoutes.js
│   │   └── swagger/
│   │       └── swagger.js
│   ├── application/
│   │   └── features/
│   │       ├── aggregatedData/
│   │       │   └── GetAggregatedDataUseCase.js
│   │       ├── auth/
│   │       │   └── authProxy.js
│   │       ├── chamados/
│   │       │   └── chamadosProxy.js
│   │       └── usuarios/
│   │           └── usuariosProxy.js
│   ├── infrastructure/
│   │   └── clients/
│   │       └── httpClients.js
│   ├── app.js
│   └── server.js
├── tests/
│   ├── integration/
│   │   └── aggregatedData.test.js
│   └── unit/
│       ├── AuthMiddleware.test.js
│       ├── GetAggregatedDataUseCase.test.js
│       └── Proxies.test.js
├── .dockerignore
├── .gitignore
├── Dockerfile
├── package.json
├── package-lock.json
└── README.md
```

### Responsabilidades das camadas

**API**

Responsável pelas rotas HTTP, controllers, middlewares e documentação Swagger.

**Application**

Contém os casos de uso e os proxies responsáveis pela comunicação com os microserviços.

**Infrastructure**

Contém a configuração dos clientes HTTP Axios utilizados para acessar os microserviços.

## 4. Fluxo de comunicação

```text
Microfrontend React
        |
        v
API Gateway (previsto na arquitetura)
        |
        v
BFF - Node.js / Express
        |
        +-----------------------+
        |                       |
        v                       v
Microservice Chamados    Microservice Usuários
        |                       |
        v                       v
MongoDB Atlas              Azure SQL
```

O microfrontend deve consumir o BFF, sem acessar diretamente os microserviços.

O BFF encaminha as requisições e consolida informações quando necessário.

## 5. Integração com os microserviços

| Serviço | Porta local | Banco de dados |
|---|---|---|
| BFF | 3000 | Não possui |
| Microservice Chamados | 3001 | MongoDB Atlas |
| Microservice Usuários | 3002 | Azure SQL |

A comunicação é realizada por HTTP utilizando Axios.

Os clientes HTTP possuem timeout de 10 segundos.

## 6. Endpoints

### Monitoramento

| Método | Endpoint | Descrição |
|---|---|---|
| GET | /health | Verifica a disponibilidade do BFF |

### Autenticação

| Método | Endpoint | Descrição |
|---|---|---|
| POST | /api/auth/login | Autentica um usuário |
| POST | /api/auth/register | Cadastra um usuário |

### Chamados

| Método | Endpoint | Descrição |
|---|---|---|
| GET | /api/chamados | Lista chamados |
| POST | /api/chamados | Cria um chamado |
| GET | /api/chamados/:id | Consulta um chamado |
| PUT | /api/chamados/:id | Atualiza um chamado |
| DELETE | /api/chamados/:id | Exclui um chamado |

### Usuários

| Método | Endpoint | Descrição |
|---|---|---|
| GET | /api/usuarios | Lista usuários |
| POST | /api/usuarios | Cria um usuário |
| GET | /api/usuarios/:id | Consulta um usuário |
| PUT | /api/usuarios/:id | Atualiza um usuário |
| DELETE | /api/usuarios/:id | Exclui um usuário |

### Agregação

| Método | Endpoint | Descrição |
|---|---|---|
| GET | /aggregated-data | Consolida informações dos microserviços |

### Documentação

| Método | Endpoint | Descrição |
|---|---|---|
| GET | /api-docs | Interface Swagger |
| GET | /api-docs.json | Especificação OpenAPI |

## 7. Endpoint de agregação

### GET /aggregated-data

O endpoint consulta os microserviços e reúne as informações em uma única resposta JSON.

É necessário enviar um token JWT válido:

```http
Authorization: Bearer TOKEN_JWT
```

### Permissões

**ADMIN**

Recebe dados de chamados e usuários.

**ATENDENTE**

Recebe dados de chamados e usuários.

**CLIENTE**

Recebe apenas os chamados autorizados pelo microserviço, sem consultar a listagem de usuários.

As regras de autorização específicas continuam sendo aplicadas pelos microserviços.

### Exemplo de resposta

```json
{
  "usuarioAutenticado": {
    "id": "2",
    "perfil": "ADMIN"
  },
  "chamados": {
    "total": 1,
    "dados": [
      {
        "_id": "exemplo-id",
        "titulo": "Erro no sistema",
        "status": "ABERTO"
      }
    ]
  },
  "usuarios": {
    "autorizado": true,
    "total": 1,
    "dados": [
      {
        "id": 2,
        "nome": "Administrador",
        "perfil": "ADMIN"
      }
    ]
  },
  "geradoEm": "2026-11-06T12:00:00.000Z"
}
```

Os dados são ilustrativos.

## 8. Segurança

O BFF utiliza autenticação JWT para proteger o endpoint de agregação.

O token é validado utilizando o algoritmo HS256 e um segredo compartilhado com os microserviços.

### Perfis reconhecidos

- ADMIN
- ATENDENTE
- CLIENTE

### Middlewares

**authMiddleware.js**

- Verifica a presença do JWT.
- Valida assinatura e expiração.
- Verifica o perfil do usuário.
- Disponibiliza os dados autenticados em `req.usuario`.

**errorHandler.js**

- Centraliza o tratamento de erros HTTP.
- Trata requisições com JSON inválido.
- Padroniza respostas de erro.

### Outras medidas

- Helmet para cabeçalhos de segurança.
- CORS habilitado.
- Limite de 1 MB para JSON.
- Timeout de 10 segundos nos clientes HTTP.
- Tratamento de falhas de comunicação com os microserviços.
- Variáveis sensíveis armazenadas em `.env`.

## 9. Swagger

O BFF utiliza Swagger UI e OpenAPI 3.0.3 para documentar seus endpoints.

### Endereços

Swagger UI:

http://localhost:3000/api-docs

Especificação JSON:

http://localhost:3000/api-docs.json

A documentação possui 8 caminhos e 14 operações HTTP, organizadas em:

- Monitoramento
- Autenticação
- Chamados
- Usuários
- Agregação

### Testar endpoints protegidos

1. Execute o login em `/api/auth/login`.
2. Copie o token JWT retornado.
3. Clique em `Authorize`.
4. Informe o token.
5. Execute o endpoint desejado.

Os microserviços precisam estar disponíveis para executar as operações reais.

## 10. Configuração do ambiente

Crie um arquivo `.env` na raiz do BFF:

```env
PORT=3000
CHAMADOS_SERVICE_URL=http://localhost:3001
USUARIOS_SERVICE_URL=http://localhost:3002
JWT_SECRET=SUBSTITUIR_PELO_SEGREDO_COMPARTILHADO
```

O valor de `JWT_SECRET` deve ser o mesmo utilizado pelos microserviços.

O arquivo `.env` não deve ser enviado ao GitHub.

## 11. Execução local

### Requisitos

- Node.js 22
- npm
- Microserviços configurados

### Instalar dependências

```powershell
npm.cmd install
```

### Executar em desenvolvimento

```powershell
npm.cmd run dev
```

### Executar normalmente

```powershell
npm.cmd start
```

O BFF estará disponível em:

http://localhost:3000

## 12. Docker

O BFF possui um Dockerfile para permitir sua execução em contêiner.

### Construir a imagem

```powershell
docker build -t help-flow-bff:v1 .
```

### Executar o contêiner

```powershell
docker run --rm -p 3000:3000 --env-file .env help-flow-bff:v1
```

Quando executado em Docker, os endereços dos microserviços devem ser acessíveis a partir do contêiner.

Em uma configuração local com os microserviços executando no Windows, é possível utilizar `host.docker.internal` como endereço do host.

Em uma rede Docker compartilhada, devem ser utilizados os nomes dos serviços.

### Docker Hub

A imagem pode ser publicada no Docker Hub para posterior implantação em ambiente cloud.

## 13. Testes automatizados

O BFF utiliza Jest e Supertest.

### Executar testes

```powershell
npm.cmd test
```

### Executar cobertura

```powershell
npm.cmd run test:coverage
```

### Testes implementados

| Categoria | Quantidade |
|---|---:|
| Agregação de dados | 13 |
| Integração HTTP | 10 |
| Proxies | 12 |
| Autenticação JWT | 9 |
| **Total** | **44** |

Os testes utilizam mocks para simular a comunicação com os microserviços.

Foram validados:

- Autenticação JWT.
- Permissões por perfil.
- Agregação de dados.
- Encaminhamento de requisições.
- Preservação de códigos HTTP.
- Tratamento de indisponibilidade dos microserviços.
- Rotas HTTP do Express.

## 14. Padrões arquiteturais

### Backend for Frontend (BFF)

Centraliza a comunicação entre o microfrontend e os serviços de backend.

### Microservices

A aplicação utiliza serviços independentes para Chamados e Usuários.

### Database per Service

Cada microserviço possui seu próprio banco de dados.

### Clean Architecture

A organização do código separa responsabilidades entre API, Application e Infrastructure.

### Vertical Slice

Os casos de uso e proxies são organizados por funcionalidades.

### API Gateway

A arquitetura prevê um gateway para centralizar o acesso externo ao BFF.

## 15. Projeto acadêmico

Componente desenvolvido para o projeto Help Flow, na disciplina de Arquitetura e Soluções Cloud da PUCPR.

O objetivo é demonstrar uma aplicação distribuída utilizando padrões modernos de arquitetura de software e serviços cloud.