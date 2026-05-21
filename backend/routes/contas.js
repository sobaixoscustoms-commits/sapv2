// routes/contas.js

const express = require("express");
const router = express.Router();
const db = require("../db");
const { auth, role } = require("../middleware/auth");

router.use(auth, role("admin"));

const today = () => new Date().toISOString().split("T")[0];

// ─── CONTAS A RECEBER ────────────────────────────────────────────────────────

router.get("/receber", (req, res) => {
  const status = req.query.status || null;
  let sql = "SELECT * FROM contas_receber WHERE 1=1";
  const params = [];
  if (status) { sql += " AND status = ?"; params.push(status); }
  sql += " ORDER BY vencimento, id DESC";
  res.json(db.prepare(sql).all(...params));
});

router.post("/receber", (req, res) => {
  const { descricao, valor, vencimento, cliente_nome, obs } = req.body;
  if (!descricao || !valor) return res.status(400).json({ erro: "Descrição e valor obrigatórios." });

  const result = db.prepare(
    "INSERT INTO contas_receber (descricao, valor, vencimento, status, cliente_nome, obs) VALUES (?,?,?,?,?,?)"
  ).run(descricao, Number(valor), vencimento||today(), "pendente", cliente_nome||"", obs||"");

  res.status(201).json(db.prepare("SELECT * FROM contas_receber WHERE id = ?").get(result.lastInsertRowid));
});

router.put("/receber/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM contas_receber WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ erro: "Não encontrado." });

  const { descricao, valor, vencimento, status, cliente_nome, obs } = req.body;
  db.prepare(
    "UPDATE contas_receber SET descricao=?,valor=?,vencimento=?,status=?,cliente_nome=?,obs=? WHERE id=?"
  ).run(
    descricao||existing.descricao, Number(valor)||existing.valor,
    vencimento||existing.vencimento, status||existing.status,
    cliente_nome??existing.cliente_nome, obs??existing.obs,
    req.params.id
  );

  res.json(db.prepare("SELECT * FROM contas_receber WHERE id = ?").get(req.params.id));
});

router.patch("/receber/:id/baixar", (req, res) => {
  const row = db.prepare("SELECT id FROM contas_receber WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ erro: "Não encontrado." });
  db.prepare("UPDATE contas_receber SET status='recebido', recebido_em=? WHERE id=?").run(today(), req.params.id);
  res.json({ mensagem: "Recebimento confirmado." });
});

router.delete("/receber/:id", (req, res) => {
  db.prepare("DELETE FROM contas_receber WHERE id = ?").run(req.params.id);
  res.json({ mensagem: "Removido." });
});

// ─── CONTAS A PAGAR ──────────────────────────────────────────────────────────

router.get("/pagar", (req, res) => {
  const status = req.query.status || null;
  let sql = "SELECT * FROM contas_pagar WHERE 1=1";
  const params = [];
  if (status) { sql += " AND status = ?"; params.push(status); }
  sql += " ORDER BY vencimento, id DESC";
  res.json(db.prepare(sql).all(...params));
});

router.post("/pagar", (req, res) => {
  const { descricao, valor, vencimento, fornecedor, obs } = req.body;
  if (!descricao || !valor) return res.status(400).json({ erro: "Descrição e valor obrigatórios." });

  const result = db.prepare(
    "INSERT INTO contas_pagar (descricao, valor, vencimento, status, fornecedor, obs) VALUES (?,?,?,?,?,?)"
  ).run(descricao, Number(valor), vencimento||today(), "pendente", fornecedor||"", obs||"");

  res.status(201).json(db.prepare("SELECT * FROM contas_pagar WHERE id = ?").get(result.lastInsertRowid));
});

router.put("/pagar/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM contas_pagar WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ erro: "Não encontrado." });

  const { descricao, valor, vencimento, status, fornecedor, obs } = req.body;
  db.prepare(
    "UPDATE contas_pagar SET descricao=?,valor=?,vencimento=?,status=?,fornecedor=?,obs=? WHERE id=?"
  ).run(
    descricao||existing.descricao, Number(valor)||existing.valor,
    vencimento||existing.vencimento, status||existing.status,
    fornecedor??existing.fornecedor, obs??existing.obs,
    req.params.id
  );

  res.json(db.prepare("SELECT * FROM contas_pagar WHERE id = ?").get(req.params.id));
});

router.patch("/pagar/:id/baixar", (req, res) => {
  const row = db.prepare("SELECT id FROM contas_pagar WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ erro: "Não encontrado." });
  db.prepare("UPDATE contas_pagar SET status='pago', pago_em=? WHERE id=?").run(today(), req.params.id);
  res.json({ mensagem: "Pagamento confirmado." });
});

router.delete("/pagar/:id", (req, res) => {
  db.prepare("DELETE FROM contas_pagar WHERE id = ?").run(req.params.id);
  res.json({ mensagem: "Removido." });
});

module.exports = router;