/**
 * Testes de sistema – Caso de Uso "Criar Serviço"  (POST /api/servicos/criarServico)
 * Técnicas: Teste de Caso de Uso/GFC, Partição de Equivalência (PE), Análise de Valor Limite (AVL)
 *           e Teste Baseado em Modelo (Máquina de Estados).
 * Cada teste carrega o ID do caso de teste da planilha (CT#nn).
 * Testes marcados [RN proposta] verificam regras que o código atual ainda NÃO implementa.
 */
const H = require("./helpers");

let admin;
beforeAll(async () => {
  admin = await H.tokenAdmin();
  await H.garantirCliente(admin);
});

// ───────────── Teste de Caso de Uso / GFC ─────────────
describe("Caso de Uso – cenários (fluxos do GFC)", () => {
  test("CT#01 Fluxo principal: dados válidos criam serviço Pendente (caminho 1-2-4-6-8-10-12-13-15-16-17-18)", async () => {
    const res = await H.criarServico(admin, H.payloadValido());
    expect(res.status).toBe(201);
    expect(res.body.service.status_servico).toBe("Pendente");
    expect(res.body.service.prioridade).toBe("Alta");
    const salvo = await H.buscarServico(admin, res.body.service.id);
    expect(salvo).toBeDefined();
  });

  test("CT#02 Alternativo A1: prioridade omitida assume 'Média' [RN proposta]", async () => {
    const p = H.payloadValido(); delete p.prioridade;
    const res = await H.criarServico(admin, p);
    expect(res.status).toBe(201);
    expect(res.body.service.prioridade).toBe("Média");
  });

  test("CT#03 Exceção E1: token inválido retorna 403", async () => {
    const res = await H.criarServico("token.invalido.xyz", H.payloadValido());
    expect(res.status).toBe(403);
  });

  test("CT#04 Exceção E2: dispositivo vazio retorna 400", async () => {
    const res = await H.criarServico(admin, H.payloadValido({ dispositivo: "" }));
    expect(res.status).toBe(400);
  });

  test("CT#05 Exceção E3: cliente inexistente retorna 404 [RN proposta]", async () => {
    const res = await H.criarServico(admin, H.payloadValido({ user_id: 999999 }));
    expect(res.status).toBe(404);
  });

  test("CT#06 Exceção E4: nº de série já em serviço aberto retorna 409 [RN proposta]", async () => {
    const serie = H.serieUnica();
    const primeiro = await H.criarServico(admin, H.payloadValido({ numero_serie: serie }));
    expect(primeiro.status).toBe(201);
    const segundo = await H.criarServico(admin, H.payloadValido({ numero_serie: serie }));
    expect(segundo.status).toBe(409);
  });
  // CT#07 e CT#08 (falha ao gravar serviço / histórico) estão em criarServico.mock.test.js
});

// ───────────── Partição de Equivalência ─────────────
describe("Partição de Equivalência", () => {
  test("CT#09 PE token: ausente retorna 401", async () => {
    const res = await H.criarServico(null, H.payloadValido());
    expect(res.status).toBe(401);
  });
  test("CT#10 PE user_id: valor não inteiro ('abc') retorna 400", async () => {
    const res = await H.criarServico(admin, H.payloadValido({ user_id: "abc" }));
    expect(res.status).toBe(400);
  });
  test("CT#11 PE user_id: ausente retorna 400", async () => {
    const p = H.payloadValido(); delete p.user_id;
    const res = await H.criarServico(admin, p);
    expect(res.status).toBe(400);
  });
  test("CT#12 PE user_id: cliente cadastrado (id sem correspondente em 'usuarios') deve criar serviço (FK do SQL aponta para usuarios)", async () => {
    const novo = await H.criarCliente(admin);
    expect(novo.status).toBe(201);
    const res = await H.criarServico(admin, H.payloadValido({ user_id: novo.body.cliente.id }));
    expect(res.status).toBe(201);
  });
  test("CT#13 PE dispositivo: ausente retorna 400", async () => {
    const p = H.payloadValido(); delete p.dispositivo;
    const res = await H.criarServico(admin, p);
    expect(res.status).toBe(400);
  });
  test("CT#14 PE dispositivo: tipo numérico (123) retorna 400", async () => {
    const res = await H.criarServico(admin, H.payloadValido({ dispositivo: 123 }));
    expect(res.status).toBe(400);
  });
  test("CT#15 PE numero_serie: ausente retorna 400", async () => {
    const p = H.payloadValido(); delete p.numero_serie;
    const res = await H.criarServico(admin, p);
    expect(res.status).toBe(400);
  });
  test("CT#16 PE tecnico: 'Celso' (válido) cria serviço", async () => {
    const res = await H.criarServico(admin, H.payloadValido({ tecnico: "Celso" }));
    expect(res.status).toBe(201);
    expect(res.body.service.tecnico).toBe("Celso");
  });
  test("CT#17 PE tecnico: valor fora do conjunto ('Carlos') retorna 400", async () => {
    const res = await H.criarServico(admin, H.payloadValido({ tecnico: "Carlos" }));
    expect(res.status).toBe(400);
  });
  test("CT#18 PE prioridade: 'Baixa' (válida) cria serviço", async () => {
    const res = await H.criarServico(admin, H.payloadValido({ prioridade: "Baixa" }));
    expect(res.status).toBe(201);
    expect(res.body.service.prioridade).toBe("Baixa");
  });
  test("CT#19 PE prioridade: valor fora do conjunto ('Urgente') retorna 400", async () => {
    const res = await H.criarServico(admin, H.payloadValido({ prioridade: "Urgente" }));
    expect(res.status).toBe(400);
  });
  test("CT#20 PE status_servico: criar já como 'Concluído' deve ser rejeitado [RN proposta]", async () => {
    const res = await H.criarServico(admin, H.payloadValido({ status_servico: "Concluído" }));
    expect([400, 422]).toContain(res.status);
  });
  test("CT#21 PE previsao_conclusao: formato inválido ('31/12/2026') retorna 400", async () => {
    const res = await H.criarServico(admin, H.payloadValido({ previsao_conclusao: "31/12/2026" }));
    expect(res.status).toBe(400);
  });
  test("CT#22 PE previsao_conclusao: data anterior à abertura deve ser rejeitada [RN proposta]", async () => {
    const res = await H.criarServico(admin, H.payloadValido({ previsao_conclusao: "2020-01-01" }));
    expect([400, 422]).toContain(res.status);
  });
});

// ───────────── Análise de Valor Limite ─────────────
describe("Análise de Valor Limite", () => {
  test("CT#23 AVL numero_serie: 0 caracteres (limite inferior - 1) retorna 400", async () => {
    const res = await H.criarServico(admin, H.payloadValido({ numero_serie: "" }));
    expect(res.status).toBe(400);
  });
  test("CT#24 AVL numero_serie: 1 caractere (limite inferior) é aceito", async () => {
    const res = await H.criarServico(admin, H.payloadValido({ numero_serie: H.serieUnica(1) }));
    expect(res.status).toBe(201);
  });
  test("CT#25 AVL numero_serie: 25 caracteres (limite superior) é aceito", async () => {
    const res = await H.criarServico(admin, H.payloadValido({ numero_serie: H.serieUnica(25) }));
    expect(res.status).toBe(201);
  });
  test("CT#26 AVL numero_serie: 26 caracteres (limite superior + 1) retorna 400", async () => {
    const res = await H.criarServico(admin, H.payloadValido({ numero_serie: H.serieUnica(26) }));
    expect(res.status).toBe(400);
  });
  test("CT#27 AVL dispositivo: 1 caractere (limite inferior) é aceito", async () => {
    const res = await H.criarServico(admin, H.payloadValido({ dispositivo: "X" }));
    expect(res.status).toBe(201);
  });
  test("CT#28 AVL dispositivo: 200 caracteres (limite superior) é aceito", async () => {
    const res = await H.criarServico(admin, H.payloadValido({ dispositivo: "D".repeat(200) }));
    expect(res.status).toBe(201);
  });
  test("CT#29 AVL dispositivo: 201 caracteres (limite superior + 1) retorna 400", async () => {
    const res = await H.criarServico(admin, H.payloadValido({ dispositivo: "D".repeat(201) }));
    expect(res.status).toBe(400);
  });
});

// ───────────── Teste Baseado em Modelo (Máquina de Estados) ─────────────
// Cada passo envia os pré-requisitos das guardas (técnico, laudo, motivo) para que a sequência
// seja válida também depois que as regras de transição forem implementadas.
const PASSO = {
  "Em diagnóstico": { observacao_tecnica: "Laudo preliminar: placa-mãe com defeito" },
  "Aguardando peças": { observacao_tecnica: "Aguardando peça solicitada" },
  "Em andamento": { observacao_tecnica: "Reparo aprovado pelo cliente" },
  "Concluído": { observacao_tecnica: "Reparo concluído e testado" },
  "Cancelado": { motivo_cancelamento: "Cliente desistiu do conserto" },
};

async function percorrer(sequencia, token = admin) {
  const criado = await H.criarServico(admin, H.payloadValido());
  expect(criado.status).toBe(201);
  const id = criado.body.service.id;
  let estado = "Pendente";
  for (const alvo of sequencia) {
    const res = await H.editarServico(token, id, { status_servico: alvo, ...PASSO[alvo] });
    expect(res.status).toBe(200);
    estado = (await H.buscarServico(admin, id)).status_servico;
    expect(estado).toBe(alvo);
  }
  return estado;
}

describe("Teste Baseado em Modelo – sequências independentes do Grafo de Estados (Quadro 2b)", () => {
  test("CT#30 MBT S1: T1,T2,T5,T11,T15  Pendente→Em diagnóstico→Em andamento→Concluído", async () => {
    expect(await percorrer(["Em diagnóstico", "Em andamento", "Concluído"])).toBe("Concluído");
  });
  test("CT#31 MBT S2: T1,T3,T14  Pendente→Cancelado", async () => {
    expect(await percorrer(["Cancelado"])).toBe("Cancelado");
  });
  test("CT#32 MBT S3: T1,T2,T6,T15  Em diagnóstico→Concluído (sem reparo)", async () => {
    expect(await percorrer(["Em diagnóstico", "Concluído"])).toBe("Concluído");
  });
  test("CT#33 MBT S4: T1,T2,T7,T14  Em diagnóstico→Cancelado", async () => {
    expect(await percorrer(["Em diagnóstico", "Cancelado"])).toBe("Cancelado");
  });
  test("CT#34 MBT S5: T1,T2,T4,T8,T11,T15  Em diagnóstico→Aguardando peças→Em andamento→Concluído", async () => {
    expect(await percorrer(["Em diagnóstico", "Aguardando peças", "Em andamento", "Concluído"])).toBe("Concluído");
  });
  test("CT#35 MBT S6: T1,T2,T4,T9,T14  Aguardando peças→Cancelado", async () => {
    expect(await percorrer(["Em diagnóstico", "Aguardando peças", "Cancelado"])).toBe("Cancelado");
  });
  test("CT#36 MBT S7: T1,T2,T5,T10,T8,T11,T15  laço Em andamento↔Aguardando peças", async () => {
    expect(await percorrer(["Em diagnóstico", "Em andamento", "Aguardando peças", "Em andamento", "Concluído"])).toBe("Concluído");
  });
  test("CT#37 MBT S8: T1,T2,T5,T12,T14  Em andamento→Cancelado", async () => {
    expect(await percorrer(["Em diagnóstico", "Em andamento", "Cancelado"])).toBe("Cancelado");
  });
  test("CT#38 MBT S9: T1,T2,T5,T11,T13,T11,T15  reabertura por ADMIN (Concluído→Em andamento)", async () => {
    expect(await percorrer(["Em diagnóstico", "Em andamento", "Concluído", "Em andamento", "Concluído"])).toBe("Concluído");
  });

  test("CT#39 MBT transição inválida: Pendente→Concluído deve retornar 422 [RN proposta]", async () => {
    const c = await H.criarServico(admin, H.payloadValido());
    const res = await H.editarServico(admin, c.body.service.id, { status_servico: "Concluído", ...PASSO["Concluído"] });
    expect(res.status).toBe(422);
  });
  test("CT#40 MBT transição inválida: Cancelado→Pendente deve retornar 422 [RN proposta]", async () => {
    const c = await H.criarServico(admin, H.payloadValido());
    await H.editarServico(admin, c.body.service.id, { status_servico: "Cancelado", ...PASSO["Cancelado"] });
    const res = await H.editarServico(admin, c.body.service.id, { status_servico: "Pendente" });
    expect(res.status).toBe(422);
  });
  test("CT#41 MBT T13: reabrir Concluído por perfil 'user' deve retornar 403 [RN proposta]", async () => {
    const c = await H.criarServico(admin, H.payloadValido());
    const id = c.body.service.id;
    for (const alvo of ["Em diagnóstico", "Em andamento", "Concluído"]) {
      await H.editarServico(admin, id, { status_servico: alvo, ...PASSO[alvo] });
    }
    const res = await H.editarServico(H.tokenComPerfil("user"), id, { status_servico: "Em andamento", justificativa: "Teste" });
    expect(res.status).toBe(403);
  });
  test("CT#42 MBT guarda T2: sair de Pendente sem técnico deve retornar 422 [RN proposta]", async () => {
    const p = H.payloadValido(); delete p.tecnico;
    const c = await H.criarServico(admin, p);
    const res = await H.editarServico(admin, c.body.service.id, { status_servico: "Em diagnóstico", ...PASSO["Em diagnóstico"] });
    expect(res.status).toBe(422);
  });
  test("CT#43 MBT guarda T11: concluir sem laudo (observacao_tecnica) deve retornar 422 [RN proposta]", async () => {
    const c = await H.criarServico(admin, H.payloadValido());
    const id = c.body.service.id;
    await H.editarServico(admin, id, { status_servico: "Em diagnóstico" });
    await H.editarServico(admin, id, { status_servico: "Em andamento" });
    const res = await H.editarServico(admin, id, { status_servico: "Concluído" });
    expect(res.status).toBe(422);
  });
  test("CT#44 MBT guarda T3: cancelar sem motivo deve retornar 422 [RN proposta]", async () => {
    const c = await H.criarServico(admin, H.payloadValido());
    const res = await H.editarServico(admin, c.body.service.id, { status_servico: "Cancelado" });
    expect(res.status).toBe(422);
  });
});
