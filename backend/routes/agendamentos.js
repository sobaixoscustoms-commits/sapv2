// routes/agendamentos.js

const express = require("express");
const router = express.Router();
const db = require("../db");
const { auth, role } = require("../middleware/auth");

router.use(auth);

// GET /api/agendamentos?data=&status=&q=
router.get("/", (req, res) => {
  const q = `%${req.query.q || ""}%`;
  const data = req.query.data || null;
  let sql = "SELECT * FROM agendamentos WHERE (cliente_nome LIKE ? OR servico LIKE ?)";
  const params = [q, q];
  if (data) { sql += " AND data = ?"; params.push(data); }
  sql += " ORDER BY data, hora";
  res.json(db.prepare(sql).all(...params));
});

// GET /api/agendamentos/:id
router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM agendamentos WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ erro: "Agendamento não encontrado." });
  res.json(row);
});

// POST /api/agendamentos
router.post("/", (req, res) => {
  const { cliente_nome, veiculo, servico, data, hora, tecnico, obs } = req.body;
  if (!cliente_nome || !servico || !data || !hora) return res.status(400).json({ erro: "Campos obrigatórios: cliente_nome, servico, data, hora." });

  const result = db.prepare(
    "INSERT INTO agendamentos (cliente_nome, veiculo, servico, data, hora, tecnico, status, obs) VALUES (?,?,?,?,?,?,?,?)"
  ).run(cliente_nome, veiculo||"", servico, data, hora, tecnico||"", "aguardando", obs||"");

  res.status(201).json(db.prepare("SELECT * FROM agendamentos WHERE id = ?").get(result.lastInsertRowid));
});

// PUT /api/agendamentos/:id
router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM agendamentos WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ erro: "Agendamento não encontrado." });

  const { cliente_nome, veiculo, servico, data, hora, tecnico, status, obs } = req.body;
  db.prepare(
    "UPDATE agendamentos SET cliente_nome=?,veiculo=?,servico=?,data=?,hora=?,tecnico=?,status=?,obs=? WHERE id=?"
  ).run(
    cliente_nome||existing.cliente_nome, veiculo??existing.veiculo,
    servico||existing.servico, data||existing.data, hora||existing.hora,
    tecnico??existing.tecnico, status||existing.status, obs??existing.obs,
    req.params.id
  );

  res.json(db.prepare("SELECT * FROM agendamentos WHERE id = ?").get(req.params.id));
});

// PATCH /api/agendamentos/:id/status
router.patch("/:id/status", (req, res) => {
  const { status } = req.body;
  if (!["aguardando","confirmado","concluido","cancelado"].includes(status)) return res.status(400).json({ erro: "Status inválido." });
  db.prepare("UPDATE agendamentos SET status = ? WHERE id = ?").run(status, req.params.id);
  res.json({ mensagem: "Status atualizado.", status });
});

// DELETE /api/agendamentos/:id
router.delete("/:id", role("admin"), (req, res) => {
  const row = db.prepare("SELECT id FROM agendamentos WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ erro: "Não encontrado." });
  db.prepare("DELETE FROM agendamentos WHERE id = ?").run(req.params.id);
  res.json({ mensagem: "Agendamento removido." });
});

module.exports = router;