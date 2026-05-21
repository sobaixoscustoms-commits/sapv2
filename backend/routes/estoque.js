// routes/estoque.js

const express = require("express");
const router = express.Router();
const db = require("../db");
const { auth, role } = require("../middleware/auth");

router.use(auth);

// GET /api/estoque?q=&categoria=
router.get("/", (req, res) => {
  const q = `%${req.query.q || ""}%`;
  const cat = req.query.categoria || null;
  let sql = "SELECT * FROM estoque WHERE nome LIKE ?";
  const params = [q];
  if (cat) { sql += " AND categoria = ?"; params.push(cat); }
  sql += " ORDER BY categoria, nome";
  res.json(db.prepare(sql).all(...params));
});

// GET /api/estoque/critico
router.get("/critico", (req, res) => {
  res.json(db.prepare("SELECT * FROM estoque WHERE quantidade <= qtd_minima ORDER BY nome").all());
});

// GET /api/estoque/:id
router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM estoque WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ erro: "Item não encontrado." });
  row.movimentos = db.prepare("SELECT * FROM estoque_movimentos WHERE estoque_id = ? ORDER BY id DESC LIMIT 20").all(row.id);
  res.json(row);
});

// POST /api/estoque
router.post("/", role("admin","recepcionista"), (req, res) => {
  const { nome, categoria, unidade, quantidade, qtd_minima, custo, venda, fornecedor } = req.body;
  if (!nome) return res.status(400).json({ erro: "Nome obrigatório." });

  const result = db.prepare(
    "INSERT INTO estoque (nome, categoria, unidade, quantidade, qtd_minima, custo, venda, fornecedor) VALUES (?,?,?,?,?,?,?,?)"
  ).run(nome, categoria||"", unidade||"pç", Number(quantidade)||0, Number(qtd_minima)||0, Number(custo)||0, Number(venda)||0, fornecedor||"");

  res.status(201).json(db.prepare("SELECT * FROM estoque WHERE id = ?").get(result.lastInsertRowid));
});

// PUT /api/estoque/:id
router.put("/:id", role("admin","recepcionista"), (req, res) => {
  const existing = db.prepare("SELECT * FROM estoque WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ erro: "Item não encontrado." });

  const { nome, categoria, unidade, quantidade, qtd_minima, custo, venda, fornecedor } = req.body;
  db.prepare(
    "UPDATE estoque SET nome=?,categoria=?,unidade=?,quantidade=?,qtd_minima=?,custo=?,venda=?,fornecedor=? WHERE id=?"
  ).run(
    nome||existing.nome, categoria??existing.categoria, unidade||existing.unidade,
    quantidade !== undefined ? Number(quantidade) : existing.quantidade,
    qtd_minima !== undefined ? Number(qtd_minima) : existing.qtd_minima,
    custo !== undefined ? Number(custo) : existing.custo,
    venda !== undefined ? Number(venda) : existing.venda,
    fornecedor??existing.fornecedor,
    req.params.id
  );

  res.json(db.prepare("SELECT * FROM estoque WHERE id = ?").get(req.params.id));
});

// PATCH /api/estoque/:id/ajuste — ajusta quantidade (+/-)
router.patch("/:id/ajuste", role("admin","recepcionista"), (req, res) => {
  const { delta, obs } = req.body;
  if (delta === undefined) return res.status(400).json({ erro: "Campo delta obrigatório." });

  const item = db.prepare("SELECT * FROM estoque WHERE id = ?").get(req.params.id);
  if (!item) return res.status(404).json({ erro: "Item não encontrado." });

  const novaQtd = Math.max(0, item.quantidade + Number(delta));
  db.prepare("UPDATE estoque SET quantidade = ? WHERE id = ?").run(novaQtd, req.params.id);

  db.prepare(
    "INSERT INTO estoque_movimentos (estoque_id, tipo, quantidade, obs, usuario) VALUES (?,?,?,?,?)"
  ).run(req.params.id, delta > 0 ? "entrada" : "saida", Math.abs(Number(delta)), obs||"", req.user.nome);

  res.json({ mensagem: "Estoque ajustado.", quantidade: novaQtd });
});

// DELETE /api/estoque/:id
router.delete("/:id", role("admin"), (req, res) => {
  const row = db.prepare("SELECT id FROM estoque WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ erro: "Não encontrado." });
  db.prepare("DELETE FROM estoque WHERE id = ?").run(req.params.id);
  res.json({ mensagem: "Item removido." });
});

module.exports = router;