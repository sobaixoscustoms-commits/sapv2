// backend/index.js — Servidor Express principal

require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const bcrypt  = require("bcryptjs");
const pool    = require("./db");
const { initDb } = require("./db");

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "*", methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"] }));
app.use(express.json());

// Health check para Railway
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Rotas da API
app.use("/api/auth",         require("./routes/auth"));
app.use("/api/clientes",     require("./routes/clientes"));
app.use("/api/orcamentos",   require("./routes/orcamentos"));
app.use("/api/ordens",       require("./routes/ordens"));
app.use("/api/agendamentos", require("./routes/agendamentos"));
app.use("/api/estoque",      require("./routes/estoque"));
app.use("/api/caixa",        require("./routes/caixa"));
app.use("/api/contas",       require("./routes/contas"));
app.use("/api/usuarios",     require("./routes/usuarios"));

async function seedUsuarios() {
  const demos = [
    { nome: "Tacio (Admin)",   email: "tacio@sbcustoms.com",  senha: "admin123",  perfil: "admin" },
    { nome: "Carlos Mecânico", email: "carlos@sbcustoms.com", senha: "carlos123", perfil: "tecnico" },
    { nome: "Marina Recepção", email: "marina@sbcustoms.com", senha: "marina123", perfil: "recepcionista" },
  ];

  for (const u of demos) {
    const hash = bcrypt.hashSync(u.senha, 10);
    await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [u.nome, u.email, hash, u.perfil]
    );
  }
  console.log("✅ Usuários demo criados (tacio / carlos / marina)");
}

async function main() {
  await initDb();

  const { rows } = await pool.query("SELECT COUNT(*) FROM usuarios");
  if (Number(rows[0].count) === 0) {
    console.log("Banco vazio — criando usuários de demonstração...");
    await seedUsuarios();
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ SB Customs backend rodando na porta ${PORT}`);
  });
}

main().catch(err => {
  console.error("Erro ao iniciar servidor:", err.message);
  process.exit(1);
});
