// routes/caixa.js

const express = require("express");
const router = express.Router();
const db = require("../db");
const { auth, role } = require("../middleware/auth");

router.use(auth, role("admin"));

// GET /api/caixa?data=&tipo=
router.get("/", (req, res) => {
  const data = req.query.data || null;
  const tipo = req.query.tipo || null;
  let sql = "SELECT * FROM caixa WHERE 1=1";
  const params = [];
  if (data) { sql += " AND data = ?"; params.push(data); }
  if (tipo) { sql += " AND tipo = ?"; params.push(tipo); }
  sql += " ORDER BY id DESC";
  res.json(db.prepare(sql).all(...params));
});

// GET /api/caixa/saldo
router.get("/saldo", (req, res) => {
  const result = db.prepare(
    "SELECT SUM(CASE WHEN tipo='entrada' THEN valor ELSE -valor END) as saldo FROM caixa"
  ).get();
  res.json({ saldo: result.saldo || 0 });
});

// POST /api/caixa
router.post("/", (req, res) => {
  const { tipo, descricao, valor, data, forma_pagamento } = req.body;
  if (!tipo || !descricao || !valor) return res.status(400).json({ erro: "Campos obrigatórios: tipo, descricao, valor." });
  if (!["entrada","saida"].includes(tipo)) return res.status(400).json({ erro: "Tipo inválido." });

  const today = new Date().toISOString().split("T")[0];
  const result = db.prepare(
    "INSERT INTO caixa (tipo, descricao, valor, data, forma_pagamento, criado_por) VALUES (?,?,?,?,?,?)"
  ).run(tipo, descricao, Number(valor), data||today, forma_pagamento||"dinheiro", req.user.nome);

  res.status(201).json(db.prepare("SELECT * FROM caixa WHERE id = ?").get(result.lastInsertRowid));
});

// DELETE /api/caixa/:id
router.delete("/:id", (req, res) => {
  const row = db.prepare("SELECT id FROM caixa WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ erro: "Não encontrado." });
  db.prepare("DELETE FROM caixa WHERE id = ?").run(req.params.id);
  res.json({ mensagem: "Lançamento removido." });
});

module.exports = router;