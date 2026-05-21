// routes/clientes.js

const express = require("express");
const router = express.Router();
const db = require("../db");
const { auth, role } = require("../middleware/auth");

router.use(auth);

// GET /api/clientes?q=busca
router.get("/", (req, res) => {
  const q = `%${req.query.q || ""}%`;
  const rows = db.prepare(
    "SELECT * FROM clientes WHERE nome LIKE ? OR telefone LIKE ? OR cpf_cnpj LIKE ? OR email LIKE ? ORDER BY nome"
  ).all(q, q, q, q);
  res.json(rows);
});

// GET /api/clientes/:id
router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM clientes WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ erro: "Cliente não encontrado." });
  row.veiculos = db.prepare("SELECT * FROM veiculos WHERE cliente_id = ? ORDER BY id").all(row.id);
  res.json(row);
});

// POST /api/clientes
router.post("/", role("admin","recepcionista"), (req, res) => {
  const { nome, telefone, email, cpf_cnpj, endereco, obs } = req.body;
  if (!nome) return res.status(400).json({ erro: "Nome obrigatório." });

  const result = db.prepare(
    "INSERT INTO clientes (nome, telefone, email, cpf_cnpj, endereco, obs) VALUES (?,?,?,?,?,?)"
  ).run(nome, telefone||"", email||"", cpf_cnpj||"", endereco||"", obs||"");

  res.status(201).json(db.prepare("SELECT * FROM clientes WHERE id = ?").get(result.lastInsertRowid));
});

// PUT /api/clientes/:id
router.put("/:id", role("admin","recepcionista"), (req, res) => {
  const existing = db.prepare("SELECT * FROM clientes WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ erro: "Cliente não encontrado." });

  const { nome, telefone, email, cpf_cnpj, endereco, obs } = req.body;
  db.prepare(
    "UPDATE clientes SET nome=?, telefone=?, email=?, cpf_cnpj=?, endereco=?, obs=? WHERE id=?"
  ).run(
    nome||existing.nome, telefone??existing.telefone, email??existing.email,
    cpf_cnpj??existing.cpf_cnpj, endereco??existing.endereco, obs??existing.obs,
    req.params.id
  );

  res.json(db.prepare("SELECT * FROM clientes WHERE id = ?").get(req.params.id));
});

// DELETE /api/clientes/:id
router.delete("/:id", role("admin"), (req, res) => {
  const row = db.prepare("SELECT id FROM clientes WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ erro: "Cliente não encontrado." });
  db.prepare("DELETE FROM clientes WHERE id = ?").run(req.params.id);
  res.json({ mensagem: "Cliente removido." });
});

// GET /api/clientes/:id/veiculos
router.get("/:id/veiculos", (req, res) => {
  res.json(db.prepare("SELECT * FROM veiculos WHERE cliente_id = ? ORDER BY id").all(req.params.id));
});

// POST /api/clientes/:id/veiculos
router.post("/:id/veiculos", role("admin","recepcionista"), (req, res) => {
  const { placa, marca, modelo, ano, cor, km } = req.body;
  const result = db.prepare(
    "INSERT INTO veiculos (cliente_id, placa, marca, modelo, ano, cor, km) VALUES (?,?,?,?,?,?,?)"
  ).run(req.params.id, placa||"", marca||"", modelo||"", ano||null, cor||"", km||0);
  res.status(201).json(db.prepare("SELECT * FROM veiculos WHERE id = ?").get(result.lastInsertRowid));
});

// PUT /api/clientes/:clienteId/veiculos/:id
router.put("/:clienteId/veiculos/:id", role("admin","recepcionista"), (req, res) => {
  const v = db.prepare("SELECT * FROM veiculos WHERE id = ? AND cliente_id = ?").get(req.params.id, req.params.clienteId);
  if (!v) return res.status(404).json({ erro: "Veículo não encontrado." });
  const { placa, marca, modelo, ano, cor, km } = req.body;
  db.prepare("UPDATE veiculos SET placa=?,marca=?,modelo=?,ano=?,cor=?,km=? WHERE id=?")
    .run(placa??v.placa, marca??v.marca, modelo??v.modelo, ano??v.ano, cor??v.cor, km??v.km, v.id);
  res.json(db.prepare("SELECT * FROM veiculos WHERE id = ?").get(v.id));
});

// DELETE /api/clientes/:clienteId/veiculos/:id
router.delete("/:clienteId/veiculos/:id", role("admin"), (req, res) => {
  db.prepare("DELETE FROM veiculos WHERE id = ? AND cliente_id = ?").run(req.params.id, req.params.clienteId);
  res.json({ mensagem: "Veículo removido." });
});

module.exports = router;