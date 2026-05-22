// routes/ordens.js

const express = require("express");
const router = express.Router();
const pool = require("../db");
const { auth, role } = require("../middleware/auth");

router.use(auth);

async function getOrdem(id) {
  const { rows } = await pool.query("SELECT * FROM ordens WHERE id = $1", [id]);
  if (!rows[0]) return null;
  const ordem = rows[0];
  const servicos = await pool.query("SELECT * FROM ordem_servicos WHERE ordem_id = $1 ORDER BY id", [id]);
  ordem.servicos = servicos.rows;
  return ordem;
}

async function nextNumero() {
  const { rows } = await pool.query("SELECT numero FROM ordens ORDER BY id DESC LIMIT 1");
  if (!rows[0]) return "OS-001";
  const n = parseInt(rows[0].numero.replace("OS-",""), 10) + 1;
  return `OS-${String(n).padStart(3, "0")}`;
}

// GET /api/ordens?q=&status=
router.get("/", async (req, res) => {
  try {
    const q = `%${req.query.q || ""}%`;
    const status = req.query.status || null;
    let sql = "SELECT * FROM ordens WHERE (cliente_nome ILIKE $1 OR numero ILIKE $2)";
    const params = [q, q];
    if (status) { sql += " AND status = $3"; params.push(status); }
    sql += " ORDER BY id DESC";
    const { rows } = await pool.query(sql, params);
    for (const o of rows) {
      const servicos = await pool.query("SELECT * FROM ordem_servicos WHERE ordem_id = $1", [o.id]);
      o.servicos = servicos.rows;
    }
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// GET /api/ordens/:id
router.get("/:id", async (req, res) => {
  try {
    const ordem = await getOrdem(req.params.id);
    if (!ordem) return res.status(404).json({ erro: "OS não encontrada." });
    res.json(ordem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// POST /api/ordens
router.post("/", role("admin","recepcionista"), async (req, res) => {
  try {
    const { cliente_nome, veiculo, tecnico, servicos, total, entrada, previsao, obs } = req.body;
    if (!cliente_nome) return res.status(400).json({ erro: "Nome do cliente obrigatório." });

    const numero = await nextNumero();
    const today = new Date().toISOString().split("T")[0];

    const { rows } = await pool.query(
      "INSERT INTO ordens (numero, cliente_nome, veiculo, status, tecnico, total, entrada, previsao, obs) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id",
      [numero, cliente_nome, veiculo||"", "aguardando", tecnico||"", Number(total)||0, entrada||today, previsao||today, obs||""]
    );
    const osId = rows[0].id;

    if (servicos && servicos.length > 0) {
      for (const s of servicos) {
        await pool.query("INSERT INTO ordem_servicos (ordem_id, descricao, status) VALUES ($1,$2,$3)", [osId, s.descricao, s.status || "pendente"]);
      }
    }

    res.status(201).json(await getOrdem(osId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// PUT /api/ordens/:id
router.put("/:id", role("admin","recepcionista","tecnico"), async (req, res) => {
  try {
    const { rows: ex } = await pool.query("SELECT * FROM ordens WHERE id = $1", [req.params.id]);
    if (!ex[0]) return res.status(404).json({ erro: "OS não encontrada." });
    const existing = ex[0];

    const isTecnico = req.user.perfil === "tecnico";
    const { cliente_nome, veiculo, tecnico, status, servicos, total, entrada, previsao, obs } = req.body;

    if (!isTecnico) {
      await pool.query(
        "UPDATE ordens SET cliente_nome=$1,veiculo=$2,tecnico=$3,status=$4,total=$5,entrada=$6,previsao=$7,obs=$8 WHERE id=$9",
        [
          cliente_nome||existing.cliente_nome, veiculo??existing.veiculo,
          tecnico??existing.tecnico, status||existing.status,
          total !== undefined ? Number(total) : existing.total, entrada||existing.entrada,
          previsao||existing.previsao, obs??existing.obs,
          req.params.id
        ]
      );
    } else {
      if (status) await pool.query("UPDATE ordens SET status=$1 WHERE id=$2", [status, req.params.id]);
    }

    if (servicos) {
      await pool.query("DELETE FROM ordem_servicos WHERE ordem_id = $1", [req.params.id]);
      for (const s of servicos) {
        await pool.query("INSERT INTO ordem_servicos (ordem_id, descricao, status) VALUES ($1,$2,$3)", [req.params.id, s.descricao, s.status || "pendente"]);
      }
    }

    res.json(await getOrdem(req.params.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// PATCH /api/ordens/:id/status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["aguardando","em_andamento","concluido","cancelado"].includes(status)) return res.status(400).json({ erro: "Status inválido." });
    const { rows } = await pool.query("SELECT id FROM ordens WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ erro: "Não encontrado." });
    await pool.query("UPDATE ordens SET status = $1 WHERE id = $2", [status, req.params.id]);
    res.json({ mensagem: "Status atualizado.", status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// DELETE /api/ordens/:id
router.delete("/:id", role("admin"), async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT id FROM ordens WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ erro: "Não encontrado." });
    await pool.query("DELETE FROM ordens WHERE id = $1", [req.params.id]);
    res.json({ mensagem: "OS removida." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

module.exports = router;
