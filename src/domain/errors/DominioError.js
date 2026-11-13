// Pacote: domain.errors – violação de invariante (regra que a própria entidade protege).
class DominioError extends Error {
  constructor(mensagem) {
    super(mensagem);
    this.name = "DominioError";
  }
}
module.exports = DominioError;
