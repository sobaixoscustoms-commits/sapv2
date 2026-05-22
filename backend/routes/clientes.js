// routes/clientes.js

const express = require("express");
const router = express.Router();
const pool = require("../db");
const { auth, role } = require("../middleware/auth");

router.use(auth);

// GET /api/clientes?q=busca
router.get("/", async (req, res) => {
  try {
    const q = `%${req.query.q || ""}%`;
    const { rows } = await pool.query(
      "SELECT * FROM clientes WHERE nome ILIKE $1 OR telefone ILIKE $2 OR cpf_cnpj ILIKE $3 OR email ILIKE $4 ORDER BY nome",
      [q, q, q, q]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// GET /api/clientes/:id
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM clientes WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ erro: "Cliente não encontrado." });
    const cliente = rows[0];
    const veiculos = await pool.query("SELECT * FROM veiculos WHERE cliente_id = $1 ORDER BY id", [cliente.id]);
    cliente.veiculos = veiculos.rows;
    res.json(cliente);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// POST /api/clientes
router.post("/", role("admin","recepcionista"), async (req, res) => {
  try {
    const { nome, telefone, email, cpf_cnpj, endereco, obs } = req.body;
    if (!nome) return res.status(400).json({ erro: "Nome obrigatório." });

    const { rows } = await pool.query(
      "INSERT INTO clientes (nome, telefone, email, cpf_cnpj, endereco, obs) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [nome, telefone||"", email||"", cpf_cnpj||"", endereco||"", obs||""]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// PUT /api/clientes/:id
router.put("/:id", role("admin","recepcionista"), async (req, res) => {
  try {
    const { rows: ex } = await pool.query("SELECT * FROM clientes WHERE id = $1", [req.params.id]);
    if (!ex[0]) return res.status(404).json({ erro: "Cliente não encontrado." });
    const existing = ex[0];

    const { nome, telefone, email, cpf_cnpj, endereco, obs } = req.body;
    const { rows } = await pool.query(
      "UPDATE clientes SET nome=$1,telefone=$2,email=$3,cpf_cnpj=$4,endereco=$5,obs=$6 WHERE id=$7 RETURNING *",
      [nome||existing.nome, telefone??existing.telefone, email??existing.email,
       cpf_cnpj??existing.cpf_cnpj, endereco??existing.endereco, obs??existing.obs, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// DELETE /api/clientes/:id
router.delete("/:id", role("admin"), async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT id FROM clientes WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ erro: "Cliente não encontrado." });
    await pool.query("DELETE FROM clientes WHERE id = $1", [req.params.id]);
    res.json({ mensagem: "Cliente removido." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// GET /api/clientes/:id/veiculos
router.get("/:id/veiculos", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM veiculos WHERE cliente_id = $1 ORDER BY id", [req.params.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// POST /api/clientes/:id/veiculos
router.post("/:id/veiculos", role("admin","recepcionista"), async (req, res) => {
  try {
    const { placa, marca, modelo, ano, cor, km } = req.body;
    const { rows } = await pool.query(
      "INSERT INTO veiculos (cliente_id, placa, marca, modelo, ano, cor, km) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",
      [req.params.id, placa||"", marca||"", modelo||"", ano||null, cor||"", km||0]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// PUT /api/clientes/:clienteId/veiculos/:id
router.put("/:clienteId/veiculos/:id", role("admin","recepcionista"), async (req, res) => {
  try {
    const { rows: vRows } = await pool.query("SELECT * FROM veiculos WHERE id = $1 AND cliente_id = $2", [req.params.id, req.params.clienteId]);
    if (!vRows[0]) return res.status(404).json({ erro: "Veículo não encontrado." });
    const v = vRows[0];
    const { placa, marca, modelo, ano, cor, km } = req.body;
    const { rows } = await pool.query(
      "UPDATE veiculos SET placa=$1,marca=$2,modelo=$3,ano=$4,cor=$5,km=$6 WHERE id=$7 RETURNING *",
      [placa??v.placa, marca??v.marca, modelo??v.modelo, ano??v.ano, cor??v.cor, km??v.km, v.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// DELETE /api/clientes/:clienteId/veiculos/:id
router.delete("/:clienteId/veiculos/:id", role("admin"), async (req, res) => {
  try {
    await pool.query("DELETE FROM veiculos WHERE id = $1 AND cliente_id = $2", [req.params.id, req.params.clienteId]);
    res.json({ mensagem: "Veículo removido." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

module.exports = router;
