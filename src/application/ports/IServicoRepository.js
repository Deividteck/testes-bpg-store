class IServicoRepository {
  /** @returns {Promise<Servico>} serviço com id gerado */
  async salvar(servico) { throw new Error("não implementado"); }
  /** @returns {Promise<Servico|null>} serviço EM ABERTO com o nº de série, se existir */
  async buscarAberto(serie) { throw new Error("não implementado"); }
  /** Compensação (rollback manual) caso o histórico falhe – RN-SRV-22. */
  async remover(id) { throw new Error("não implementado"); }
}
module.exports = IServicoRepository;
