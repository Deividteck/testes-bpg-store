# Testes – Caso de Uso "Criar Serviço" (BPG Store)

Ferramenta: **Jest** (equivalente do JUnit para Node.js) + **Supertest** (testes de API).

## Estrutura por pacote e classe
```
src/                                   ← camadas do diagrama de classes
├── domain/
│   ├── entities/   Cliente, Servico, HistoricoAtendimento
│   ├── enums/      StatusServico, Prioridade, Tecnico
│   └── errors/     DominioError
└── application/
    ├── usecases/   CriarServicoUseCase
    ├── dto/        CriarServicoDTO
    ├── ports/      IClienteRepository, IServicoRepository, IHistoricoRepository
    └── errors/     ApplicationError (+ DadosInvalidos, ClienteNaoEncontrado, SerieDuplicada, FalhaPersistencia)

tests/
├── unit/                              ← TESTES DE UNIDADE (sem banco, sem servidor)
│   ├── domain/entities/      Servico.test, Cliente.test, HistoricoAtendimento.test
│   ├── domain/enums/         enums.test
│   ├── application/usecases/ CriarServicoUseCase.test   ← stubs, mocks, fake e driver comentados
│   ├── application/dto/      CriarServicoDTO.test
│   ├── application/ports/    ports.test
│   ├── doubles/              FakeServicoRepository      (FAKE – banco em memória)
│   └── support/              builders.js                (dados de teste)
├── criarServico.integration.test.js   ← testes de SISTEMA (API real + MySQL), 42 casos da planilha
├── criarServico.mock.test.js          ← CT#07/#08 (falhas de gravação simuladas)
├── helpers.js
├── jest.unit.config.js
└── jest.config.js
```

## Testes de unidade (esta fase)
```bash
npm install --save-dev jest supertest
npx jest -c tests/jest.unit.config.js --coverage
```
Resultado obtido: **7 suítes, 116 testes aprovados; cobertura 100% de linhas, funções e instruções**.
Como ler os dublês (explicados também nos comentários do código):
| Recurso | Papel | Onde aparece |
|---|---|---|
| **Driver** | o próprio `test(...)`, que chama `useCase.executar()` | todos os testes |
| **Stub** | resposta pré-programada (cliente existe / não existe, relógio fixo) | `clienteRepo`, `relogio` |
| **Mock** | verifica interações (chamadas, argumentos, ordem) | `historicoRepo.salvar`, `servicoRepo.remover` |
| **Fake** | implementação em memória no lugar do MySQL | `FakeServicoRepository` |
| **Spy** | observa o fake sem trocar o comportamento | `jest.spyOn(servicoRepo, ...)` |

Regras de negócio cobertas: RN-SRV-01 (cliente existe), RN-SRV-03 (status inicial Pendente, prioridade padrão Média),
RN-SRV-04 (série normalizada e única entre serviços abertos), RN-SRV-16 (previsão não anterior à abertura),
RN-SRV-19 (histórico automático) e RN-SRV-22 (compensação se o histórico falhar).

## Testes de sistema (planilha de testes)
Use um **banco de TESTE** (os testes criam clientes e serviços), backend no ar (`node server.js`) e
cliente id 1 / usuário id 1 existentes (ou `CLIENTE_ID=<id>`):
```bash
npx jest -c tests/jest.config.js --runInBand --verbose
```
Testes terminados em `[RN proposta]` verificam regras que o código atual ainda não implementa (resultam em NOK).
