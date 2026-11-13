// Pacote: tests.unit.domain.entities – classe Cliente (campos NOT NULL e e-mail).
const Cliente = require("../../../../src/domain/entities/Cliente");
const DominioError = require("../../../../src/domain/errors/DominioError");

const base = { nome: "Maria", email: "maria@bpg.com", telefone: "11999990000", endereco: "Rua A", cidade: "SP", estado: "SP" };

describe("Cliente", () => {
  test("cria cliente válido", () => {
    const c = new Cliente(base);
    expect(c.nome).toBe("Maria");
    expect(c.dataCadastro).toBeInstanceOf(Date);
  });
  test.each(["", "semarroba", "a@b", "a b@c.com", undefined, 42])("rejeita e-mail inválido: %p", (email) => {
    expect(() => new Cliente({ ...base, email })).toThrow(DominioError);
  });
  test.each(["nome", "telefone", "endereco", "cidade", "estado"])("rejeita %s vazio", (campo) => {
    expect(() => new Cliente({ ...base, [campo]: "  " })).toThrow(DominioError);
  });
});
