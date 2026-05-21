// backend/middleware/auth.js

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "sbcustoms_dev_secret_troque_em_producao";

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ erro: "Token não fornecido." });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado." });
  }
}

function role(...perfis) {
  return (req, res, next) => {
    if (!req.user || !perfis.includes(req.user.perfil)) {
      return res.status(403).json({ erro: "Acesso negado para este perfil." });
    }
    next();
  };
}

// JWT_SECRET exportado para uso nas rotas (ex: routes/auth.js)
module.exports = { auth, role, JWT_SECRET };