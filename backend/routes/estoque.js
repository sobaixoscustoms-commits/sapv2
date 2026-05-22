// routes/estoque.js

const express = require("express");
const router = express.Router();
const pool = require("../db");
const { auth, role } = require("../middleware/auth");

router.use(auth);

// GET /api/estoque?q=&categoria=
router.get("/", async (req, res) => {
  try {
    const q = `%${req.query.q || ""}%`;
    const cat = req.query.categoria || null;
    let sql = "SELECT * FROM estoque WHERE nome ILIKE $1";
    const params = [q];
    if (cat) { sql += " AND categoria = $2"; params.push(cat); }
    sql += " ORDER BY categoria, nome";
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// GET /api/estoque/critico
router.get("/critico", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM estoque WHERE quantidade <= qtd_minima ORDER BY nome");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// GET /api/estoque/:id
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM estoque WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ erro: "Item não encontrado." });
    const item = rows[0];
    const movimentos = await pool.query("SELECT * FROM estoque_movimentos WHERE estoque_id = $1 ORDER BY id DESC LIMIT 20", [item.id]);
    item.movimentos = movimentos.rows;
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// POST /api/estoque
router.post("/", role("admin","recepcionista"), async (req, res) => {
  try {
    const { nome, categoria, unidade, quantidade, qtd_minima, custo, venda, fornecedor } = req.body;
    if (!nome) return res.status(400).json({ erro: "Nome obrigatório." });

    const { rows } = await pool.query(
      "INSERT INTO estoque (nome, categoria, unidade, quantidade, qtd_minima, custo, venda, fornecedor) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
      [nome, categoria||"", unidade||"pç", Number(quantidade)||0, Number(qtd_minima)||0, Number(custo)||0, Number(venda)||0, fornecedor||""]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// PUT /api/estoque/:id
router.put("/:id", role("admin","recepcionista"), async (req, res) => {
  try {
    const { rows: ex } = await pool.query("SELECT * FROM estoque WHERE id = $1", [req.params.id]);
    if (!ex[0]) return res.status(404).json({ erro: "Item não encontrado." });
    const existing = ex[0];

    const { nome, categoria, unidade, quantidade, qtd_minima, custo, venda, fornecedor } = req.body;
    const { rows } = await pool.query(
      "UPDATE estoque SET nome=$1,categoria=$2,unidade=$3,quantidade=$4,qtd_minima=$5,custo=$6,venda=$7,fornecedor=$8 WHERE id=$9 RETURNING *",
      [
        nome||existing.nome, categoria??existing.categoria, unidade||existing.unidade,
        quantidade !== undefined ? Number(quantidade) : existing.quantidade,
        qtd_minima !== undefined ? Number(qtd_minima) : existing.qtd_minima,
        custo !== undefined ? Number(custo) : existing.custo,
        venda !== undefined ? Number(venda) : existing.venda,
        fornecedor??existing.fornecedor,
        req.params.id
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// PATCH /api/estoque/:id/ajuste — ajusta quantidade (+/-)
router.patch("/:id/ajuste", role("admin","recepcionista"), async (req, res) => {
  try {
    const { delta, obs } = req.body;
    if (delta === undefined) return res.status(400).json({ erro: "Campo delta obrigatório." });

    const { rows } = await pool.query("SELECT * FROM estoque WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ erro: "Item não encontrado." });
    const item = rows[0];

    const novaQtd = Math.max(0, Number(item.quantidade) + Number(delta));
    await pool.query("UPDATE estoque SET quantidade = $1 WHERE id = $2", [novaQtd, req.params.id]);
    await pool.query(
      "INSERT INTO estoque_movimentos (estoque_id, tipo, quantidade, obs, usuario) VALUES ($1,$2,$3,$4,$5)",
      [req.params.id, delta > 0 ? "entrada" : "saida", Math.abs(Number(delta)), obs||"", req.user.nome]
    );

    res.json({ mensagem: "Estoque ajustado.", quantidade: novaQtd });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// DELETE /api/estoque/:id
router.delete("/:id", role("admin"), async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT id FROM estoque WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ erro: "Não encontrado." });
    await pool.query("DELETE FROM estoque WHERE id = $1", [req.params.id]);
    res.json({ mensagem: "Item removido." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

module.exports = router;
