// Pacote: domain.entities – tabela `clientes`. Campos NOT NULL do SQL viram invariantes.
const DominioError = require("../errors/DominioError");

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const obrigatorio = (valor) => typeof valor === "string" && valor.trim().length > 0;

class Cliente {
  constructor({ id = null, nome, email, telefone, endereco, cidade, estado, dataCadastro = new Date() }) {
    if (!obrigatorio(nome)) throw new DominioError("Cliente: nome é obrigatório");
    if (typeof email !== "string" || !EMAIL.test(email)) throw new DominioError("Cliente: e-mail inválido");
    for (const [campo, valor] of Object.entries({ telefone, endereco, cidade, estado })) {
      if (!obrigatorio(valor)) throw new DominioError(`Cliente: ${campo} é obrigatório`);
    }
    Object.assign(this, { id, nome, email, telefone, endereco, cidade, estado, dataCadastro });
  }
}
module.exports = Cliente;
