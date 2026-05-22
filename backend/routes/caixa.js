// routes/caixa.js

const express = require("express");
const router = express.Router();
const pool = require("../db");
const { auth, role } = require("../middleware/auth");

router.use(auth, role("admin"));

// GET /api/caixa?data=&tipo=
router.get("/", async (req, res) => {
  try {
    const data = req.query.data || null;
    const tipo = req.query.tipo || null;
    let sql = "SELECT * FROM caixa WHERE 1=1";
    const params = [];
    let idx = 1;
    if (data) { sql += ` AND data = $${idx}`; params.push(data); idx++; }
    if (tipo) { sql += ` AND tipo = $${idx}`; params.push(tipo); idx++; }
    sql += " ORDER BY id DESC";
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// GET /api/caixa/saldo
router.get("/saldo", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT SUM(CASE WHEN tipo='entrada' THEN valor ELSE -valor END) as saldo FROM caixa"
    );
    res.json({ saldo: Number(rows[0].saldo) || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// POST /api/caixa
router.post("/", async (req, res) => {
  try {
    const { tipo, descricao, valor, data, forma_pagamento } = req.body;
    if (!tipo || !descricao || !valor) return res.status(400).json({ erro: "Campos obrigatórios: tipo, descricao, valor." });
    if (!["entrada","saida"].includes(tipo)) return res.status(400).json({ erro: "Tipo inválido." });

    const today = new Date().toISOString().split("T")[0];
    const { rows } = await pool.query(
      "INSERT INTO caixa (tipo, descricao, valor, data, forma_pagamento, criado_por) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [tipo, descricao, Number(valor), data||today, forma_pagamento||"dinheiro", req.user.nome]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// DELETE /api/caixa/:id
router.delete("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT id FROM caixa WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ erro: "Não encontrado." });
    await pool.query("DELETE FROM caixa WHERE id = $1", [req.params.id]);
    res.json({ mensagem: "Lançamento removido." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

module.exports = router;
