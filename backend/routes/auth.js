// routes/auth.js

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { auth, JWT_SECRET } = require("../middleware/auth");

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ erro: "E-mail e senha obrigatórios." });

  const user = db.prepare("SELECT * FROM usuarios WHERE email = ? AND ativo = 1").get(email);
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
});

// GET /api/auth/me
router.get("/me", auth, (req, res) => {
  const user = db.prepare("SELECT id, nome, email, perfil, ativo, criado_em FROM usuarios WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ erro: "Usuário não encontrado." });
  res.json(user);
});

// PUT /api/auth/senha
router.put("/senha", auth, (req, res) => {
  const { senhaAtual, novaSenha } = req.body;
  if (!senhaAtual || !novaSenha) return res.status(400).json({ erro: "Campos obrigatórios." });
  if (novaSenha.length < 6) return res.status(400).json({ erro: "Senha deve ter pelo menos 6 caracteres." });

  const user = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(req.user.id);
  if (!bcrypt.compareSync(senhaAtual, user.senha_hash)) return res.status(400).json({ erro: "Senha atual incorreta." });

  const hash = bcrypt.hashSync(novaSenha, 10);
  db.prepare("UPDATE usuarios SET senha_hash = ? WHERE id = ?").run(hash, req.user.id);
  res.json({ mensagem: "Senha alterada com sucesso." });
});

module.exports = router;