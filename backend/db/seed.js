// db/seed.js — popula o banco com dados iniciais
// Execute: node db/seed.js

const db = require("./index");
const bcrypt = require("bcryptjs");

console.log("🌱 Iniciando seed do banco de dados...");

const today = new Date().toISOString().split("T")[0];

// ─── USUÁRIOS ────────────────────────────────────────────────────────────────
const usuarios = [
  { nome: "Tacio (Admin)", email: "tacio@sbcustoms.com", senha: "admin123", perfil: "admin" },
  { nome: "Carlos Mecânico", email: "carlos@sbcustoms.com", senha: "carlos123", perfil: "tecnico" },
  { nome: "Marina Recepção", email: "marina@sbcustoms.com", senha: "marina123", perfil: "recepcionista" },
];

const insertUsuario = db.prepare(
  "INSERT OR IGNORE INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)"
);
for (const u of usuarios) {
  const hash = bcrypt.hashSync(u.senha, 10);
  insertUsuario.run(u.nome, u.email, hash, u.perfil);
}
console.log("✅ Usuários criados");

// ─── CLIENTES ────────────────────────────────────────────────────────────────
const clientes = [
  { nome: "João Silva",         telefone: "(54) 99999-1111", email: "joao@email.com",   cpf_cnpj: "123.456.789-00",      endereco: "Rua das Flores, 123 - Caxias do Sul", obs: "Cliente VIP" },
  { nome: "Maria Oliveira",     telefone: "(54) 98888-2222", email: "maria@email.com",  cpf_cnpj: "987.654.321-00",      endereco: "Av. Getúlio, 456 - Caxias do Sul",    obs: "" },
  { nome: "Pedro Mecânico Ltda",telefone: "(54) 3333-4444", email: "pedro@empresa.com", cpf_cnpj: "12.345.678/0001-99", endereco: "Rod. RS-122, Km 5",                   obs: "Empresa parceira" },
];

const insertCliente = db.prepare(
  "INSERT OR IGNORE INTO clientes (nome, telefone, email, cpf_cnpj, endereco, obs) VALUES (?, ?, ?, ?, ?, ?)"
);
for (const c of clientes) {
  insertCliente.run(c.nome, c.telefone, c.email, c.cpf_cnpj, c.endereco, c.obs);
}
console.log("✅ Clientes criados");

// ─── ESTOQUE ─────────────────────────────────────────────────────────────────
const estoque = [
  { nome: "Óleo Motor 5W30 Sintético",    categoria: "Lubrificantes", unidade: "litro",  quantidade: 48, qtd_minima: 10, custo: 25,  venda: 45,  fornecedor: "Luboil" },
  { nome: "Filtro de Óleo Universal",     categoria: "Filtros",       unidade: "pç",     quantidade: 15, qtd_minima: 5,  custo: 18,  venda: 38,  fornecedor: "Filtros BR" },
  { nome: "Pastilha de Freio Dianteira",  categoria: "Freios",        unidade: "jg",     quantidade: 8,  qtd_minima: 3,  custo: 45,  venda: 95,  fornecedor: "Frasle" },
  { nome: "Líquido de Freio DOT4",        categoria: "Fluidos",       unidade: "frasco", quantidade: 2,  qtd_minima: 5,  custo: 22,  venda: 45,  fornecedor: "Bosch" },
  { nome: "Vela de Ignição NGK",          categoria: "Ignição",       unidade: "pç",     quantidade: 20, qtd_minima: 8,  custo: 28,  venda: 55,  fornecedor: "NGK BR" },
  { nome: "Correia Dentada Universal",    categoria: "Motor",         unidade: "pç",     quantidade: 6,  qtd_minima: 3,  custo: 85,  venda: 160, fornecedor: "Gates" },
  { nome: "Tinta Sikkens Premium Branco", categoria: "Pintura",       unidade: "litro",  quantidade: 12, qtd_minima: 4,  custo: 180, venda: 280, fornecedor: "Tintauto" },
];

const insertEstoque = db.prepare(
  "INSERT OR IGNORE INTO estoque (nome, categoria, unidade, quantidade, qtd_minima, custo, venda, fornecedor) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
);
for (const e of estoque) {
  insertEstoque.run(e.nome, e.categoria, e.unidade, e.quantidade, e.qtd_minima, e.custo, e.venda, e.fornecedor);
}
console.log("✅ Estoque criado");

// ─── ORÇAMENTOS ──────────────────────────────────────────────────────────────
const orc1 = db.prepare(
  "INSERT OR IGNORE INTO orcamentos (numero, cliente_nome, veiculo, status, total, obs) VALUES (?,?,?,?,?,?)"
).run("ORC-001", "João Silva", "VW Gol 2018 - ABC-1234", "aprovado", 195, "");

if (orc1.lastInsertRowid) {
  const insItem = db.prepare(
    "INSERT INTO orcamento_itens (orcamento_id, descricao, quantidade, valor_unit, valor_total) VALUES (?,?,?,?,?)"
  );
  insItem.run(orc1.lastInsertRowid, "Troca de óleo", 1, 150, 150);
  insItem.run(orc1.lastInsertRowid, "Filtro de óleo", 1, 45, 45);
}

const orc2 = db.prepare(
  "INSERT OR IGNORE INTO orcamentos (numero, cliente_nome, veiculo, status, total, obs) VALUES (?,?,?,?,?,?)"
).run("ORC-002", "Maria Oliveira", "Fiat Uno 2015 - DEF-5678", "aguardando", 120, "Cliente confirmará amanhã");

if (orc2.lastInsertRowid) {
  db.prepare(
    "INSERT INTO orcamento_itens (orcamento_id, descricao, quantidade, valor_unit, valor_total) VALUES (?,?,?,?,?)"
  ).run(orc2.lastInsertRowid, "Alinhamento e balanceamento", 1, 120, 120);
}
console.log("✅ Orçamentos criados");

// ─── ORDENS DE SERVIÇO ───────────────────────────────────────────────────────
const os1 = db.prepare(
  "INSERT OR IGNORE INTO ordens (numero, cliente_nome, veiculo, status, tecnico, total, entrada, previsao, obs) VALUES (?,?,?,?,?,?,?,?,?)"
).run("OS-001", "João Silva", "VW Gol 2018 - ABC-1234", "em_andamento", "Carlos Mecânico", 195, today, today, "");

if (os1.lastInsertRowid) {
  const insServ = db.prepare("INSERT INTO ordem_servicos (ordem_id, descricao, status) VALUES (?,?,?)");
  insServ.run(os1.lastInsertRowid, "Troca de óleo completa", "concluido");
  insServ.run(os1.lastInsertRowid, "Verificação freios", "em_andamento");
}
console.log("✅ Ordens de serviço criadas");

// ─── AGENDAMENTOS ────────────────────────────────────────────────────────────
db.prepare(
  "INSERT OR IGNORE INTO agendamentos (cliente_nome, veiculo, servico, data, hora, tecnico, status, obs) VALUES (?,?,?,?,?,?,?,?)"
).run("Pedro Mecânico Ltda", "Gol G5 - GHI-9012", "Revisão completa", today, "09:00", "Carlos Mecânico", "confirmado", "");

db.prepare(
  "INSERT OR IGNORE INTO agendamentos (cliente_nome, veiculo, servico, data, hora, tecnico, status, obs) VALUES (?,?,?,?,?,?,?,?)"
).run("João Silva", "VW Gol 2018", "Troca de pastilhas", today, "14:00", "Carlos Mecânico", "aguardando", "");
console.log("✅ Agendamentos criados");

// ─── CONTAS ──────────────────────────────────────────────────────────────────
db.prepare(
  "INSERT OR IGNORE INTO contas_receber (descricao, valor, vencimento, status, cliente_nome) VALUES (?,?,?,?,?)"
).run("OS-001 - João Silva", 195, today, "pendente", "João Silva");

db.prepare(
  "INSERT OR IGNORE INTO contas_receber (descricao, valor, vencimento, status, cliente_nome, recebido_em) VALUES (?,?,?,?,?,?)"
).run("OS-002 - Maria Oliveira", 120, today, "recebido", "Maria Oliveira", today);

db.prepare(
  "INSERT OR IGNORE INTO contas_pagar (descricao, valor, vencimento, status, fornecedor) VALUES (?,?,?,?,?)"
).run("Tinta Sikkens Premium", 850, today, "pendente", "Tintauto Caxias");

db.prepare(
  "INSERT OR IGNORE INTO contas_pagar (descricao, valor, vencimento, status, fornecedor, pago_em) VALUES (?,?,?,?,?,?)"
).run("Lixas Indasa", 320, today, "pago", "Abrasivos Sul", today);
console.log("✅ Contas criadas");

// ─── CAIXA ───────────────────────────────────────────────────────────────────
db.prepare(
  "INSERT OR IGNORE INTO caixa (tipo, descricao, valor, data, forma_pagamento, criado_por) VALUES (?,?,?,?,?,?)"
).run("entrada", "Recebimento OS-002", 120, today, "pix", "Marina Recepção");

db.prepare(
  "INSERT OR IGNORE INTO caixa (tipo, descricao, valor, data, forma_pagamento, criado_por) VALUES (?,?,?,?,?,?)"
).run("saida", "Compra lixas Indasa", 320, today, "transferencia", "Tacio (Admin)");
console.log("✅ Caixa criado");

console.log("\n🎉 Seed concluído com sucesso!");
console.log("   Admin: tacio@sbcustoms.com / admin123");
console.log("   Técnico: carlos@sbcustoms.com / carlos123");
console.log("   Recepção: marina@sbcustoms.com / marina123");