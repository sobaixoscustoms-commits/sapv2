// routes/orcamentos.js

const express = require("express");
const router = express.Router();
const db = require("../db");
const { auth, role } = require("../middleware/auth");

router.use(auth);

function getOrcamento(id) {
  const orc = db.prepare("SELECT * FROM orcamentos WHERE id = ?").get(id);
  if (!orc) return null;
  orc.itens = db.prepare("SELECT * FROM orcamento_itens WHERE orcamento_id = ? ORDER BY id").all(id);
  return orc;
}

function nextNumero() {
  const last = db.prepare("SELECT numero FROM orcamentos ORDER BY id DESC LIMIT 1").get();
  if (!last) return "ORC-001";
  const n = parseInt(last.numero.replace("ORC-", ""), 10) + 1;
  return `ORC-${String(n).padStart(3, "0")}`;
}

// GET /api/orcamentos?q=&status=
router.get("/", (req, res) => {
  const q = `%${req.query.q || ""}%`;
  const status = req.query.status || null;
  let sql = "SELECT * FROM orcamentos WHERE (cliente_nome LIKE ? OR numero LIKE ?)";
  const params = [q, q];
  if (status) { sql += " AND status = ?"; params.push(status); }
  sql += " ORDER BY id DESC";
  const rows = db.prepare(sql).all(...params);
  rows.forEach(o => { o.itens = db.prepare("SELECT * FROM orcamento_itens WHERE orcamento_id = ?").all(o.id); });
  res.json(rows);
});

// GET /api/orcamentos/:id
router.get("/:id", (req, res) => {
  const orc = getOrcamento(req.params.id);
  if (!orc) return res.status(404).json({ erro: "Orçamento não encontrado." });
  res.json(orc);
});

// POST /api/orcamentos
router.post("/", role("admin","recepcionista"), (req, res) => {
  const { cliente_nome, veiculo, itens, obs } = req.body;
  if (!cliente_nome) return res.status(400).json({ erro: "Nome do cliente obrigatório." });
  if (!itens || itens.length === 0) return res.status(400).json({ erro: "Adicione pelo menos um item." });

  const total = itens.reduce((acc, i) => acc + (Number(i.valor_unit) * Number(i.quantidade)), 0);
  const numero = nextNumero();

  const result = db.prepare(
    "INSERT INTO orcamentos (numero, cliente_nome, veiculo, total, obs) VALUES (?,?,?,?,?)"
  ).run(numero, cliente_nome, veiculo||"", total, obs||"");

  const orcId = result.lastInsertRowid;
  const insItem = db.prepare(
    "INSERT INTO orcamento_itens (orcamento_id, descricao, quantidade, valor_unit, valor_total) VALUES (?,?,?,?,?)"
  );
  for (const item of itens) {
    const vt = Number(item.valor_unit) * Number(item.quantidade);
    insItem.run(orcId, item.descricao, Number(item.quantidade), Number(item.valor_unit), vt);
  }

  res.status(201).json(getOrcamento(orcId));
});

// PUT /api/orcamentos/:id
router.put("/:id", role("admin","recepcionista"), (req, res) => {
  const existing = db.prepare("SELECT * FROM orcamentos WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ erro: "Orçamento não encontrado." });

  const { cliente_nome, veiculo, status, itens, obs } = req.body;

  let total = existing.total;
  if (itens) {
    total = itens.reduce((acc, i) => acc + (Number(i.valor_unit) * Number(i.quantidade)), 0);
    db.prepare("DELETE FROM orcamento_itens WHERE orcamento_id = ?").run(req.params.id);
    const insItem = db.prepare(
      "INSERT INTO orcamento_itens (orcamento_id, descricao, quantidade, valor_unit, valor_total) VALUES (?,?,?,?,?)"
    );
    for (const item of itens) {
      insItem.run(req.params.id, item.descricao, Number(item.quantidade), Number(item.valor_unit), Number(item.valor_unit) * Number(item.quantidade));
    }
  }

  db.prepare("UPDATE orcamentos SET cliente_nome=?,veiculo=?,status=?,total=?,obs=? WHERE id=?")
    .run(cliente_nome||existing.cliente_nome, veiculo??existing.veiculo, status||existing.status, total, obs??existing.obs, req.params.id);

  res.json(getOrcamento(req.params.id));
});

// PATCH /api/orcamentos/:id/status
router.patch("/:id/status", role("admin","recepcionista"), (req, res) => {
  const { status } = req.body;
  if (!["aguardando","aprovado","recusado","expirado"].includes(status)) return res.status(400).json({ erro: "Status inválido." });
  const existing = db.prepare("SELECT id FROM orcamentos WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ erro: "Não encontrado." });
  db.prepare("UPDATE orcamentos SET status = ? WHERE id = ?").run(status, req.params.id);
  res.json({ mensagem: "Status atualizado.", status });
});

// POST /api/orcamentos/:id/gerar-os
router.post("/:id/gerar-os", role("admin","recepcionista"), (req, res) => {
  const orc = getOrcamento(req.params.id);
  if (!orc) return res.status(404).json({ erro: "Orçamento não encontrado." });
  if (orc.status !== "aprovado") return res.status(400).json({ erro: "Orçamento precisa estar aprovado." });

  const last = db.prepare("SELECT numero FROM ordens ORDER BY id DESC LIMIT 1").get();
  const n = last ? parseInt(last.numero.replace("OS-",""), 10) + 1 : 1;
  const numero = `OS-${String(n).padStart(3, "0")}`;
  const today = new Date().toISOString().split("T")[0];

  const result = db.prepare(
    "INSERT INTO ordens (numero, cliente_nome, veiculo, status, total, entrada, previsao, obs, orcamento_id) VALUES (?,?,?,?,?,?,?,?,?)"
  ).run(numero, orc.cliente_nome, orc.veiculo, "aguardando", orc.total, today, today, orc.obs||"", orc.id);

  const osId = result.lastInsertRowid;
  const insServ = db.prepare("INSERT INTO ordem_servicos (ordem_id, descricao, status) VALUES (?,?,?)");
  for (const item of orc.itens) {
    insServ.run(osId, item.descricao, "pendente");
  }

  const os = db.prepare("SELECT * FROM ordens WHERE id = ?").get(osId);
  os.servicos = db.prepare("SELECT * FROM ordem_servicos WHERE ordem_id = ?").all(osId);
  res.status(201).json(os);
});

// DELETE /api/orcamentos/:id
router.delete("/:id", role("admin"), (req, res) => {
  const row = db.prepare("SELECT id FROM orcamentos WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ erro: "Não encontrado." });
  db.prepare("DELETE FROM orcamentos WHERE id = ?").run(req.params.id);
  res.json({ mensagem: "Orçamento removido." });
});

module.exports = router;