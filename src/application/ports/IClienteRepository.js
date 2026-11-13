// Pacote: application.ports – "interface" (JS não tem interface: classe abstrata). A implementação real usará Sequelize.
class IClienteRepository {
  /** @returns {Promise<Cliente|null>} */
  async buscarPorId(id) { throw new Error("não implementado"); }
}
module.exports = IClienteRepository;
