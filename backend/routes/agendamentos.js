// routes/agendamentos.js

const express = require("express");
const router = express.Router();
const pool = require("../db");
const { auth, role } = require("../middleware/auth");

router.use(auth);

// GET /api/agendamentos?data=&status=&q=
router.get("/", async (req, res) => {
  try {
    const q = `%${req.query.q || ""}%`;
    const data = req.query.data || null;
    let sql = "SELECT * FROM agendamentos WHERE (cliente_nome ILIKE $1 OR servico ILIKE $2)";
    const params = [q, q];
    if (data) { sql += " AND data = $3"; params.push(data); }
    sql += " ORDER BY data, hora";
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// GET /api/agendamentos/:id
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM agendamentos WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ erro: "Agendamento não encontrado." });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// POST /api/agendamentos
router.post("/", async (req, res) => {
  try {
    const { cliente_nome, veiculo, servico, data, hora, tecnico, obs } = req.body;
    if (!cliente_nome || !servico || !data || !hora) return res.status(400).json({ erro: "Campos obrigatórios: cliente_nome, servico, data, hora." });

    const { rows } = await pool.query(
      "INSERT INTO agendamentos (cliente_nome, veiculo, servico, data, hora, tecnico, status, obs) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
      [cliente_nome, veiculo||"", servico, data, hora, tecnico||"", "aguardando", obs||""]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// PUT /api/agendamentos/:id
router.put("/:id", async (req, res) => {
  try {
    const { rows: ex } = await pool.query("SELECT * FROM agendamentos WHERE id = $1", [req.params.id]);
    if (!ex[0]) return res.status(404).json({ erro: "Agendamento não encontrado." });
    const existing = ex[0];

    const { cliente_nome, veiculo, servico, data, hora, tecnico, status, obs } = req.body;
    const { rows } = await pool.query(
      "UPDATE agendamentos SET cliente_nome=$1,veiculo=$2,servico=$3,data=$4,hora=$5,tecnico=$6,status=$7,obs=$8 WHERE id=$9 RETURNING *",
      [
        cliente_nome||existing.cliente_nome, veiculo??existing.veiculo,
        servico||existing.servico, data||existing.data, hora||existing.hora,
        tecnico??existing.tecnico, status||existing.status, obs??existing.obs,
        req.params.id
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// PATCH /api/agendamentos/:id/status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["aguardando","confirmado","concluido","cancelado"].includes(status)) return res.status(400).json({ erro: "Status inválido." });
    await pool.query("UPDATE agendamentos SET status = $1 WHERE id = $2", [status, req.params.id]);
    res.json({ mensagem: "Status atualizado.", status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// DELETE /api/agendamentos/:id
router.delete("/:id", role("admin"), async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT id FROM agendamentos WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ erro: "Não encontrado." });
    await pool.query("DELETE FROM agendamentos WHERE id = $1", [req.params.id]);
    res.json({ mensagem: "Agendamento removido." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

module.exports = router;
