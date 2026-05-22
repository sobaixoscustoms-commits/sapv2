// routes/contas.js

const express = require("express");
const router = express.Router();
const pool = require("../db");
const { auth, role } = require("../middleware/auth");

router.use(auth, role("admin"));

const today = () => new Date().toISOString().split("T")[0];

// ─── CONTAS A RECEBER ────────────────────────────────────────────────────────

router.get("/receber", async (req, res) => {
  try {
    const status = req.query.status || null;
    let sql = "SELECT * FROM contas_receber WHERE 1=1";
    const params = [];
    if (status) { sql += " AND status = $1"; params.push(status); }
    sql += " ORDER BY vencimento, id DESC";
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

router.post("/receber", async (req, res) => {
  try {
    const { descricao, valor, vencimento, cliente_nome, obs } = req.body;
    if (!descricao || !valor) return res.status(400).json({ erro: "Descrição e valor obrigatórios." });

    const { rows } = await pool.query(
      "INSERT INTO contas_receber (descricao, valor, vencimento, status, cliente_nome, obs) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [descricao, Number(valor), vencimento||today(), "pendente", cliente_nome||"", obs||""]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

router.put("/receber/:id", async (req, res) => {
  try {
    const { rows: ex } = await pool.query("SELECT * FROM contas_receber WHERE id = $1", [req.params.id]);
    if (!ex[0]) return res.status(404).json({ erro: "Não encontrado." });
    const existing = ex[0];

    const { descricao, valor, vencimento, status, cliente_nome, obs } = req.body;
    const { rows } = await pool.query(
      "UPDATE contas_receber SET descricao=$1,valor=$2,vencimento=$3,status=$4,cliente_nome=$5,obs=$6 WHERE id=$7 RETURNING *",
      [descricao||existing.descricao, Number(valor)||existing.valor,
       vencimento||existing.vencimento, status||existing.status,
       cliente_nome??existing.cliente_nome, obs??existing.obs, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

router.patch("/receber/:id/baixar", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT id FROM contas_receber WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ erro: "Não encontrado." });
    await pool.query("UPDATE contas_receber SET status='recebido', recebido_em=$1 WHERE id=$2", [today(), req.params.id]);
    res.json({ mensagem: "Recebimento confirmado." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

router.delete("/receber/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM contas_receber WHERE id = $1", [req.params.id]);
    res.json({ mensagem: "Removido." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// ─── CONTAS A PAGAR ──────────────────────────────────────────────────────────

router.get("/pagar", async (req, res) => {
  try {
    const status = req.query.status || null;
    let sql = "SELECT * FROM contas_pagar WHERE 1=1";
    const params = [];
    if (status) { sql += " AND status = $1"; params.push(status); }
    sql += " ORDER BY vencimento, id DESC";
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

router.post("/pagar", async (req, res) => {
  try {
    const { descricao, valor, vencimento, fornecedor, obs } = req.body;
    if (!descricao || !valor) return res.status(400).json({ erro: "Descrição e valor obrigatórios." });

    const { rows } = await pool.query(
      "INSERT INTO contas_pagar (descricao, valor, vencimento, status, fornecedor, obs) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [descricao, Number(valor), vencimento||today(), "pendente", fornecedor||"", obs||""]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

router.put("/pagar/:id", async (req, res) => {
  try {
    const { rows: ex } = await pool.query("SELECT * FROM contas_pagar WHERE id = $1", [req.params.id]);
    if (!ex[0]) return res.status(404).json({ erro: "Não encontrado." });
    const existing = ex[0];

    const { descricao, valor, vencimento, status, fornecedor, obs } = req.body;
    const { rows } = await pool.query(
      "UPDATE contas_pagar SET descricao=$1,valor=$2,vencimento=$3,status=$4,fornecedor=$5,obs=$6 WHERE id=$7 RETURNING *",
      [descricao||existing.descricao, Number(valor)||existing.valor,
       vencimento||existing.vencimento, status||existing.status,
       fornecedor??existing.fornecedor, obs??existing.obs, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

router.patch("/pagar/:id/baixar", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT id FROM contas_pagar WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ erro: "Não encontrado." });
    await pool.query("UPDATE contas_pagar SET status='pago', pago_em=$1 WHERE id=$2", [today(), req.params.id]);
    res.json({ mensagem: "Pagamento confirmado." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

router.delete("/pagar/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM contas_pagar WHERE id = $1", [req.params.id]);
    res.json({ mensagem: "Removido." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

module.exports = router;
