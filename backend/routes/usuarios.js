// backend/routes/usuarios.js

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("../db");
const { auth, role } = require("../middleware/auth");

router.use(auth, role("admin"));

// GET /api/usuarios
router.get("/", (req, res) => {
  const rows = db.prepare(
    "SELECT id, nome, email, perfil, ativo, criado_em FROM usuarios ORDER BY nome"
  ).all();
  res.json(rows);
});

// POST /api/usuarios
router.post("/", (req, res) => {
  const { nome, email, senha, perfil } = req.body;
  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: "Nome, e-mail e senha são obrigatórios." });
  }
  if (senha.length < 6) {
    return res.status(400).json({ erro: "Senha deve ter pelo menos 6 caracteres." });
  }
  const existe = db.prepare("SELECT id FROM usuarios WHERE email = ?").get(email);
  if (existe) return res.status(400).json({ erro: "E-mail já cadastrado." });

  const hash = bcrypt.hashSync(senha, 10);
  const result = db.prepare(
    "INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?,?,?,?)"
  ).run(nome, email, hash, perfil || "tecnico");

  const user = db.prepare(
    "SELECT id, nome, email, perfil, ativo, criado_em FROM usuarios WHERE id = ?"
  ).get(result.lastInsertRowid);

  res.status(201).json(user);
});

// PUT /api/usuarios/:id
router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ erro: "Usuário não encontrado." });

  const { nome, email, senha, perfil } = req.body;
  let hash = existing.senha_hash;
  if (senha && senha.length >= 6) {
    hash = bcrypt.hashSync(senha, 10);
  }

  db.prepare(
    "UPDATE usuarios SET nome=?, email=?, senha_hash=?, perfil=? WHERE id=?"
  ).run(
    nome || existing.nome,
    email || existing.email,
    hash,
    perfil || existing.perfil,
    req.params.id
  );

  const user = db.prepare(
    "SELECT id, nome, email, perfil, ativo, criado_em FROM usuarios WHERE id = ?"
  ).get(req.params.id);

  res.json(user);
});

// PATCH /api/usuarios/:id/toggle — ativa/desativa usuário
router.patch("/:id/toggle", (req, res) => {
  const existing = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ erro: "Usuário não encontrado." });

  const novoAtivo = existing.ativo ? 0 : 1;
  db.prepare("UPDATE usuarios SET ativo = ? WHERE id = ?").run(novoAtivo, req.params.id);

  res.json({ mensagem: novoAtivo ? "Usuário ativado." : "Usuário desativado.", ativo: novoAtivo });
});

module.exports = router;