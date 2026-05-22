// routes/usuarios.js

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const pool = require("../db");
const { auth, role } = require("../middleware/auth");

router.use(auth, role("admin"));

// GET /api/usuarios
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, nome, email, perfil, ativo, criado_em FROM usuarios ORDER BY nome"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// POST /api/usuarios
router.post("/", async (req, res) => {
  try {
    const { nome, email, senha, perfil } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ erro: "Nome, e-mail e senha são obrigatórios." });
    if (senha.length < 6) return res.status(400).json({ erro: "Senha deve ter pelo menos 6 caracteres." });

    const { rows: ex } = await pool.query("SELECT id FROM usuarios WHERE email = $1", [email]);
    if (ex[0]) return res.status(400).json({ erro: "E-mail já cadastrado." });

    const hash = bcrypt.hashSync(senha, 10);
    const { rows } = await pool.query(
      "INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES ($1,$2,$3,$4) RETURNING id, nome, email, perfil, ativo, criado_em",
      [nome, email, hash, perfil || "tecnico"]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// PUT /api/usuarios/:id
router.put("/:id", async (req, res) => {
  try {
    const { rows: ex } = await pool.query("SELECT * FROM usuarios WHERE id = $1", [req.params.id]);
    if (!ex[0]) return res.status(404).json({ erro: "Usuário não encontrado." });
    const existing = ex[0];

    const { nome, email, senha, perfil } = req.body;
    let hash = existing.senha_hash;
    if (senha && senha.length >= 6) hash = bcrypt.hashSync(senha, 10);

    const { rows } = await pool.query(
      "UPDATE usuarios SET nome=$1,email=$2,senha_hash=$3,perfil=$4 WHERE id=$5 RETURNING id, nome, email, perfil, ativo, criado_em",
      [nome||existing.nome, email||existing.email, hash, perfil||existing.perfil, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// PATCH /api/usuarios/:id/toggle — ativa/desativa usuário
router.patch("/:id/toggle", async (req, res) => {
  try {
    const { rows: ex } = await pool.query("SELECT * FROM usuarios WHERE id = $1", [req.params.id]);
    if (!ex[0]) return res.status(404).json({ erro: "Usuário não encontrado." });
    const novoAtivo = ex[0].ativo ? 0 : 1;
    await pool.query("UPDATE usuarios SET ativo = $1 WHERE id = $2", [novoAtivo, req.params.id]);
    res.json({ mensagem: novoAtivo ? "Usuário ativado." : "Usuário desativado.", ativo: novoAtivo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

module.exports = router;
