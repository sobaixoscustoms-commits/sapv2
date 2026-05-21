// backend/index.js — Servidor Express principal

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`✅ SB Customs backend rodando em http://localhost:${PORT}`);
});
