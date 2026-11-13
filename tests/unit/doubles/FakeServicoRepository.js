// Pacote: tests.unit.doubles
// TEST DOUBLE do tipo FAKE: implementação real e funcional, porém em memória (substitui o MySQL/Sequelize).
// Diferente de um mock, ele tem comportamento próprio: gera ids, guarda e busca serviços.
const IServicoRepository = require("../../../src/application/ports/IServicoRepository");

class FakeServicoRepository extends IServicoRepository {
  constructor() { super(); this.itens = new Map(); this.proximoId = 1; }
  /** Atalho do teste para pré-popular o "banco" (arrange). */
  semear(servico) { servico.id = this.proximoId++; this.itens.set(servico.id, servico); return servico; }
  async salvar(servico) { return this.semear(servico); }
  async buscarAberto(serie) {
    return [...this.itens.values()].find((s) => s.numeroSerie === serie && s.estaAberto()) ?? null;
  }
  async remover(id) { this.itens.delete(id); }
}
module.exports = FakeServicoRepository;
