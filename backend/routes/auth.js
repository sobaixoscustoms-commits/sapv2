// routes/auth.js

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { auth, JWT_SECRET } = require("../middleware/auth");

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ erro: "E-mail e senha obrigatórios." });

    const { rows } = await pool.query("SELECT * FROM usuarios WHERE email = $1 AND ativo = 1", [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ erro: "Credenciais inválidas." });

    const ok = bcrypt.compareSync(senha, user.senha_hash);
    if (!ok) return res.status(401).json({ erro: "Credenciais inválidas." });

    const token = jwt.sign(
      { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil },
      JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.json({
      token,
      usuario: { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// GET /api/auth/me
router.get("/me", auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, nome, email, perfil, ativo, criado_em FROM usuarios WHERE id = $1",
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ erro: "Usuário não encontrado." });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

// PUT /api/auth/senha
router.put("/senha", auth, async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;
    if (!senhaAtual || !novaSenha) return res.status(400).json({ erro: "Campos obrigatórios." });
    if (novaSenha.length < 6) return res.status(400).json({ erro: "Senha deve ter pelo menos 6 caracteres." });

    const { rows } = await pool.query("SELECT * FROM usuarios WHERE id = $1", [req.user.id]);
    if (!bcrypt.compareSync(senhaAtual, rows[0].senha_hash)) return res.status(400).json({ erro: "Senha atual incorreta." });

    const hash = bcrypt.hashSync(novaSenha, 10);
    await pool.query("UPDATE usuarios SET senha_hash = $1 WHERE id = $2", [hash, req.user.id]);
    res.json({ mensagem: "Senha alterada com sucesso." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno." });
  }
});

module.exports = router;
