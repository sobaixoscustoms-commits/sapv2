// db/seed.js — popula o banco com dados iniciais
// Execute: node db/seed.js

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const pool = require("./index");
const bcrypt = require("bcryptjs");

async function seed() {
  console.log("🌱 Iniciando seed do banco de dados...");

  const today = new Date().toISOString().split("T")[0];

  // ─── USUÁRIOS ────────────────────────────────────────────────────────────────
  const usuarios = [
    { nome: "Tacio (Admin)",   email: "tacio@sbcustoms.com",  senha: "admin123",  perfil: "admin" },
    { nome: "Carlos Mecânico", email: "carlos@sbcustoms.com", senha: "carlos123", perfil: "tecnico" },
    { nome: "Marina Recepção", email: "marina@sbcustoms.com", senha: "marina123", perfil: "recepcionista" },
  ];

  for (const u of usuarios) {
    const hash = bcrypt.hashSync(u.senha, 10);
    await pool.query(
      "INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES ($1,$2,$3,$4) ON CONFLICT (email) DO NOTHING",
      [u.nome, u.email, hash, u.perfil]
    );
  }
  console.log("✅ Usuários criados");

  // ─── CLIENTES ────────────────────────────────────────────────────────────────
  const clientes = [
    { nome: "João Silva",          telefone: "(54) 99999-1111", email: "joao@email.com",    cpf_cnpj: "123.456.789-00",      endereco: "Rua das Flores, 123 - Caxias do Sul", obs: "Cliente VIP" },
    { nome: "Maria Oliveira",      telefone: "(54) 98888-2222", email: "maria@email.com",   cpf_cnpj: "987.654.321-00",      endereco: "Av. Getúlio, 456 - Caxias do Sul",    obs: "" },
    { nome: "Pedro Mecânico Ltda", telefone: "(54) 3333-4444",  email: "pedro@empresa.com", cpf_cnpj: "12.345.678/0001-99", endereco: "Rod. RS-122, Km 5",                   obs: "Empresa parceira" },
  ];

  for (const c of clientes) {
    await pool.query(
      "INSERT INTO clientes (nome, telefone, email, cpf_cnpj, endereco, obs) VALUES ($1,$2,$3,$4,$5,$6)",
      [c.nome, c.telefone, c.email, c.cpf_cnpj, c.endereco, c.obs]
    );
  }
  console.log("✅ Clientes criados");

  // ─── ESTOQUE ─────────────────────────────────────────────────────────────────
  const estoqueItens = [
    { nome: "Óleo Motor 5W30 Sintético",    categoria: "Lubrificantes", unidade: "litro",  quantidade: 48, qtd_minima: 10, custo: 25,  venda: 45,  fornecedor: "Luboil" },
    { nome: "Filtro de Óleo Universal",     categoria: "Filtros",       unidade: "pç",     quantidade: 15, qtd_minima: 5,  custo: 18,  venda: 38,  fornecedor: "Filtros BR" },
    { nome: "Pastilha de Freio Dianteira",  categoria: "Freios",        unidade: "jg",     quantidade: 8,  qtd_minima: 3,  custo: 45,  venda: 95,  fornecedor: "Frasle" },
    { nome: "Líquido de Freio DOT4",        categoria: "Fluidos",       unidade: "frasco", quantidade: 2,  qtd_minima: 5,  custo: 22,  venda: 45,  fornecedor: "Bosch" },
    { nome: "Vela de Ignição NGK",          categoria: "Ignição",       unidade: "pç",     quantidade: 20, qtd_minima: 8,  custo: 28,  venda: 55,  fornecedor: "NGK BR" },
    { nome: "Correia Dentada Universal",    categoria: "Motor",         unidade: "pç",     quantidade: 6,  qtd_minima: 3,  custo: 85,  venda: 160, fornecedor: "Gates" },
    { nome: "Tinta Sikkens Premium Branco", categoria: "Pintura",       unidade: "litro",  quantidade: 12, qtd_minima: 4,  custo: 180, venda: 280, fornecedor: "Tintauto" },
  ];

  for (const e of estoqueItens) {
    await pool.query(
      "INSERT INTO estoque (nome, categoria, unidade, quantidade, qtd_minima, custo, venda, fornecedor) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
      [e.nome, e.categoria, e.unidade, e.quantidade, e.qtd_minima, e.custo, e.venda, e.fornecedor]
    );
  }
  console.log("✅ Estoque criado");

  // ─── ORÇAMENTOS ──────────────────────────────────────────────────────────────
  const { rows: orc1rows } = await pool.query(
    "INSERT INTO orcamentos (numero, cliente_nome, veiculo, status, total, obs) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (numero) DO NOTHING RETURNING id",
    ["ORC-001", "João Silva", "VW Gol 2018 - ABC-1234", "aprovado", 195, ""]
  );

  if (orc1rows[0]) {
    const orcId = orc1rows[0].id;
    await pool.query("INSERT INTO orcamento_itens (orcamento_id, descricao, quantidade, valor_unit, valor_total) VALUES ($1,$2,$3,$4,$5)", [orcId, "Troca de óleo", 1, 150, 150]);
    await pool.query("INSERT INTO orcamento_itens (orcamento_id, descricao, quantidade, valor_unit, valor_total) VALUES ($1,$2,$3,$4,$5)", [orcId, "Filtro de óleo", 1, 45, 45]);
  }

  const { rows: orc2rows } = await pool.query(
    "INSERT INTO orcamentos (numero, cliente_nome, veiculo, status, total, obs) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (numero) DO NOTHING RETURNING id",
    ["ORC-002", "Maria Oliveira", "Fiat Uno 2015 - DEF-5678", "aguardando", 120, "Cliente confirmará amanhã"]
  );

  if (orc2rows[0]) {
    await pool.query("INSERT INTO orcamento_itens (orcamento_id, descricao, quantidade, valor_unit, valor_total) VALUES ($1,$2,$3,$4,$5)", [orc2rows[0].id, "Alinhamento e balanceamento", 1, 120, 120]);
  }
  console.log("✅ Orçamentos criados");

  // ─── ORDENS DE SERVIÇO ───────────────────────────────────────────────────────
  const { rows: os1rows } = await pool.query(
    "INSERT INTO ordens (numero, cliente_nome, veiculo, status, tecnico, total, entrada, previsao, obs) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (numero) DO NOTHING RETURNING id",
    ["OS-001", "João Silva", "VW Gol 2018 - ABC-1234", "em_andamento", "Carlos Mecânico", 195, today, today, ""]
  );

  if (os1rows[0]) {
    const osId = os1rows[0].id;
    await pool.query("INSERT INTO ordem_servicos (ordem_id, descricao, status) VALUES ($1,$2,$3)", [osId, "Troca de óleo completa", "concluido"]);
    await pool.query("INSERT INTO ordem_servicos (ordem_id, descricao, status) VALUES ($1,$2,$3)", [osId, "Verificação freios", "em_andamento"]);
  }
  console.log("✅ Ordens de serviço criadas");

  // ─── AGENDAMENTOS ────────────────────────────────────────────────────────────
  await pool.query(
    "INSERT INTO agendamentos (cliente_nome, veiculo, servico, data, hora, tecnico, status, obs) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
    ["Pedro Mecânico Ltda", "Gol G5 - GHI-9012", "Revisão completa", today, "09:00", "Carlos Mecânico", "confirmado", ""]
  );
  await pool.query(
    "INSERT INTO agendamentos (cliente_nome, veiculo, servico, data, hora, tecnico, status, obs) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
    ["João Silva", "VW Gol 2018", "Troca de pastilhas", today, "14:00", "Carlos Mecânico", "aguardando", ""]
  );
  console.log("✅ Agendamentos criados");

  // ─── CONTAS ──────────────────────────────────────────────────────────────────
  await pool.query(
    "INSERT INTO contas_receber (descricao, valor, vencimento, status, cliente_nome) VALUES ($1,$2,$3,$4,$5)",
    ["OS-001 - João Silva", 195, today, "pendente", "João Silva"]
  );
  await pool.query(
    "INSERT INTO contas_receber (descricao, valor, vencimento, status, cliente_nome, recebido_em) VALUES ($1,$2,$3,$4,$5,$6)",
    ["OS-002 - Maria Oliveira", 120, today, "recebido", "Maria Oliveira", today]
  );
  await pool.query(
    "INSERT INTO contas_pagar (descricao, valor, vencimento, status, fornecedor) VALUES ($1,$2,$3,$4,$5)",
    ["Tinta Sikkens Premium", 850, today, "pendente", "Tintauto Caxias"]
  );
  await pool.query(
    "INSERT INTO contas_pagar (descricao, valor, vencimento, status, fornecedor, pago_em) VALUES ($1,$2,$3,$4,$5,$6)",
    ["Lixas Indasa", 320, today, "pago", "Abrasivos Sul", today]
  );
  console.log("✅ Contas criadas");

  // ─── CAIXA ───────────────────────────────────────────────────────────────────
  await pool.query(
    "INSERT INTO caixa (tipo, descricao, valor, data, forma_pagamento, criado_por) VALUES ($1,$2,$3,$4,$5,$6)",
    ["entrada", "Recebimento OS-002", 120, today, "pix", "Marina Recepção"]
  );
  await pool.query(
    "INSERT INTO caixa (tipo, descricao, valor, data, forma_pagamento, criado_por) VALUES ($1,$2,$3,$4,$5,$6)",
    ["saida", "Compra lixas Indasa", 320, today, "transferencia", "Tacio (Admin)"]
  );
  console.log("✅ Caixa criado");

  console.log("\n🎉 Seed concluído com sucesso!");
  console.log("   Admin: tacio@sbcustoms.com / admin123");
  console.log("   Técnico: carlos@sbcustoms.com / carlos123");
  console.log("   Recepção: marina@sbcustoms.com / marina123");

  await pool.end();
}

seed().catch(err => {
  console.error("Erro no seed:", err.message);
  process.exit(1);
});
