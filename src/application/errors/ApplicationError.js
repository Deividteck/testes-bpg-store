// Pacote: application.errors – erros do caso de uso, com o código HTTP que a rota deve devolver.
class ApplicationError extends Error {
  constructor(mensagem, codigoHttp) {
    super(mensagem);
    this.name = this.constructor.name;
    this.codigoHttp = codigoHttp;
  }
}
class DadosInvalidosError extends ApplicationError {
  constructor(erros) { super("Dados inválidos: " + erros.join("; "), 400); this.erros = erros; }
}
class ClienteNaoEncontradoError extends ApplicationError {
  constructor(id) { super(`Cliente ${id} não encontrado`, 404); }
}
class SerieDuplicadaError extends ApplicationError {
  constructor(serie) { super(`Já existe serviço aberto para o nº de série ${serie}`, 409); }
}
class FalhaPersistenciaError extends ApplicationError {
  constructor(mensagem, causa) { super(mensagem, 500); this.causa = causa; }
}
module.exports = { ApplicationError, DadosInvalidosError, ClienteNaoEncontradoError, SerieDuplicadaError, FalhaPersistenciaError };
