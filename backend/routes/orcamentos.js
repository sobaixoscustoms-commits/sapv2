// routes/orcamentos.js

const express = require("express");
const router = express.Router();
const pool = require("../db");
const { auth, role } = require("../middleware/auth");

router.use(auth);

async function getOrcamento(id) {
  const { rows } = await pool.query("SELECT * FROM orcamentos WHERE id = $1", [id]);
  if (!rows[0]) return null;
  const orc = rows[0];
  const itens = await pool.query("SELECT * FROM orcamento_itens WHERE orcamento_id = $1 ORDER BY id", [id]);
  orc.itens = itens.rows;
  return orc;
}

async function nextNumero() {
  const { rows } = await pool.query("SELECT numero FROM orcamentos ORDER BY id DESC LIMIT 1");
  if (!rows[0]) return "ORC-001";
  const n = parseInt(rows[0].numero.replace("ORC-", ""), 10) + 1;
  return `ORC-${String(n).padStart(3, "0")}`;
}

// GET /api/orcamentos?q=&status=
router.get("/", async (req, res) => {
  try {
    const q = `%${req.query.q || ""}%`;
    const status = req.query.status || null;
    let sql = "SELECT * FROM orcamentos WHERE (cliente_nome ILIKE $1 OR numero ILIKE $2)";
    const params = [q, q];
    if (status) { sql += " AND status = $3"; params.push(status); }
    sql += " ORDER BY id DESC";
    const { rows } = await pool.query(sql, params);
    for (const o of rows) {
      const itens = await pool.query("SELECT * FROM orcamento_itens WHERE orcamento_id = $1", [o.id]);
      o.itens = itens.rows;
    }
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// GET /api/orcamentos/:id
router.get("/:id", async (req, res) => {
  try {
    const orc = await getOrcamento(req.params.id);
    if (!orc) return res.status(404).json({ erro: "Orçamento não encontrado." });
    res.json(orc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// POST /api/orcamentos
router.post("/", role("admin","recepcionista"), async (req, res) => {
  try {
    const { cliente_nome, veiculo, itens, obs } = req.body;
    if (!cliente_nome) return res.status(400).json({ erro: "Nome do cliente obrigatório." });
    if (!itens || itens.length === 0) return res.status(400).json({ erro: "Adicione pelo menos um item." });

    const total = itens.reduce((acc, i) => acc + (Number(i.valor_unit) * Number(i.quantidade)), 0);
    const numero = await nextNumero();

    const { rows } = await pool.query(
      "INSERT INTO orcamentos (numero, cliente_nome, veiculo, total, obs) VALUES ($1,$2,$3,$4,$5) RETURNING id",
      [numero, cliente_nome, veiculo||"", total, obs||""]
    );
    const orcId = rows[0].id;

    for (const item of itens) {
      const vt = Number(item.valor_unit) * Number(item.quantidade);
      await pool.query(
        "INSERT INTO orcamento_itens (orcamento_id, descricao, quantidade, valor_unit, valor_total) VALUES ($1,$2,$3,$4,$5)",
        [orcId, item.descricao, Number(item.quantidade), Number(item.valor_unit), vt]
      );
    }

    res.status(201).json(await getOrcamento(orcId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// PUT /api/orcamentos/:id
router.put("/:id", role("admin","recepcionista"), async (req, res) => {
  try {
    const { rows: ex } = await pool.query("SELECT * FROM orcamentos WHERE id = $1", [req.params.id]);
    if (!ex[0]) return res.status(404).json({ erro: "Orçamento não encontrado." });
    const existing = ex[0];

    const { cliente_nome, veiculo, status, itens, obs } = req.body;

    let total = existing.total;
    if (itens) {
      total = itens.reduce((acc, i) => acc + (Number(i.valor_unit) * Number(i.quantidade)), 0);
      await pool.query("DELETE FROM orcamento_itens WHERE orcamento_id = $1", [req.params.id]);
      for (const item of itens) {
        await pool.query(
          "INSERT INTO orcamento_itens (orcamento_id, descricao, quantidade, valor_unit, valor_total) VALUES ($1,$2,$3,$4,$5)",
          [req.params.id, item.descricao, Number(item.quantidade), Number(item.valor_unit), Number(item.valor_unit) * Number(item.quantidade)]
        );
      }
    }

    await pool.query(
      "UPDATE orcamentos SET cliente_nome=$1,veiculo=$2,status=$3,total=$4,obs=$5 WHERE id=$6",
      [cliente_nome||existing.cliente_nome, veiculo??existing.veiculo, status||existing.status, total, obs??existing.obs, req.params.id]
    );

    res.json(await getOrcamento(req.params.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// PATCH /api/orcamentos/:id/status
router.patch("/:id/status", role("admin","recepcionista"), async (req, res) => {
  try {
    const { status } = req.body;
    if (!["aguardando","aprovado","recusado","expirado"].includes(status)) return res.status(400).json({ erro: "Status inválido." });
    const { rows } = await pool.query("SELECT id FROM orcamentos WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ erro: "Não encontrado." });
    await pool.query("UPDATE orcamentos SET status = $1 WHERE id = $2", [status, req.params.id]);
    res.json({ mensagem: "Status atualizado.", status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// POST /api/orcamentos/:id/gerar-os
router.post("/:id/gerar-os", role("admin","recepcionista"), async (req, res) => {
  try {
    const orc = await getOrcamento(req.params.id);
    if (!orc) return res.status(404).json({ erro: "Orçamento não encontrado." });
    if (orc.status !== "aprovado") return res.status(400).json({ erro: "Orçamento precisa estar aprovado." });

    const { rows: lastRows } = await pool.query("SELECT numero FROM ordens ORDER BY id DESC LIMIT 1");
    const n = lastRows[0] ? parseInt(lastRows[0].numero.replace("OS-",""), 10) + 1 : 1;
    const numero = `OS-${String(n).padStart(3, "0")}`;
    const today = new Date().toISOString().split("T")[0];

    const { rows } = await pool.query(
      "INSERT INTO ordens (numero, cliente_nome, veiculo, status, total, entrada, previsao, obs, orcamento_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id",
      [numero, orc.cliente_nome, orc.veiculo, "aguardando", orc.total, today, today, orc.obs||"", orc.id]
    );
    const osId = rows[0].id;

    for (const item of orc.itens) {
      await pool.query("INSERT INTO ordem_servicos (ordem_id, descricao, status) VALUES ($1,$2,$3)", [osId, item.descricao, "pendente"]);
    }

    const os = (await pool.query("SELECT * FROM ordens WHERE id = $1", [osId])).rows[0];
    os.servicos = (await pool.query("SELECT * FROM ordem_servicos WHERE ordem_id = $1", [osId])).rows;
    res.status(201).json(os);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// DELETE /api/orcamentos/:id
router.delete("/:id", role("admin"), async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT id FROM orcamentos WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ erro: "Não encontrado." });
    await pool.query("DELETE FROM orcamentos WHERE id = $1", [req.params.id]);
    res.json({ mensagem: "Orçamento removido." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

module.exports = router;
