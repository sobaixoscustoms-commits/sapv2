// routes/ordens.js

const express = require("express");
const router = express.Router();
const db = require("../db");
const { auth, role } = require("../middleware/auth");

router.use(auth);

function getOrdem(id) {
  const ordem = db.prepare("SELECT * FROM ordens WHERE id = ?").get(id);
  if (!ordem) return null;
  ordem.servicos = db.prepare("SELECT * FROM ordem_servicos WHERE ordem_id = ? ORDER BY id").all(id);
  return ordem;
}

function nextNumero() {
  const last = db.prepare("SELECT numero FROM ordens ORDER BY id DESC LIMIT 1").get();
  if (!last) return "OS-001";
  const n = parseInt(last.numero.replace("OS-",""), 10) + 1;
  return `OS-${String(n).padStart(3, "0")}`;
}

// GET /api/ordens?q=&status=
router.get("/", (req, res) => {
  const q = `%${req.query.q || ""}%`;
  const status = req.query.status || null;
  let sql = "SELECT * FROM ordens WHERE (cliente_nome LIKE ? OR numero LIKE ?)";
  const params = [q, q];
  if (status) { sql += " AND status = ?"; params.push(status); }
  sql += " ORDER BY id DESC";
  const rows = db.prepare(sql).all(...params);
  rows.forEach(o => { o.servicos = db.prepare("SELECT * FROM ordem_servicos WHERE ordem_id = ?").all(o.id); });
  res.json(rows);
});

// GET /api/ordens/:id
router.get("/:id", (req, res) => {
  const ordem = getOrdem(req.params.id);
  if (!ordem) return res.status(404).json({ erro: "OS não encontrada." });
  res.json(ordem);
});

// POST /api/ordens
router.post("/", role("admin","recepcionista"), (req, res) => {
  const { cliente_nome, veiculo, tecnico, servicos, total, entrada, previsao, obs } = req.body;
  if (!cliente_nome) return res.status(400).json({ erro: "Nome do cliente obrigatório." });

  const numero = nextNumero();
  const today = new Date().toISOString().split("T")[0];

  const result = db.prepare(
    "INSERT INTO ordens (numero, cliente_nome, veiculo, status, tecnico, total, entrada, previsao, obs) VALUES (?,?,?,?,?,?,?,?,?)"
  ).run(numero, cliente_nome, veiculo||"", "aguardando", tecnico||"", Number(total)||0, entrada||today, previsao||today, obs||"");

  const osId = result.lastInsertRowid;
  if (servicos && servicos.length > 0) {
    const ins = db.prepare("INSERT INTO ordem_servicos (ordem_id, descricao, status) VALUES (?,?,?)");
    for (const s of servicos) {
      ins.run(osId, s.descricao, s.status || "pendente");
    }
  }

  res.status(201).json(getOrdem(osId));
});

// PUT /api/ordens/:id
router.put("/:id", role("admin","recepcionista","tecnico"), (req, res) => {
  const existing = db.prepare("SELECT * FROM ordens WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ erro: "OS não encontrada." });

  // Técnico só pode atualizar status e servicos
  const isTecnico = req.user.perfil === "tecnico";
  const { cliente_nome, veiculo, tecnico, status, servicos, total, entrada, previsao, obs } = req.body;

  if (!isTecnico) {
    db.prepare(
      "UPDATE ordens SET cliente_nome=?,veiculo=?,tecnico=?,status=?,total=?,entrada=?,previsao=?,obs=? WHERE id=?"
    ).run(
      cliente_nome||existing.cliente_nome, veiculo??existing.veiculo,
      tecnico??existing.tecnico, status||existing.status,
      total !== undefined ? Number(total) : existing.total, entrada||existing.entrada,
      previsao||existing.previsao, obs??existing.obs,
      req.params.id
    );
  } else {
    // Técnico: só status
    if (status) db.prepare("UPDATE ordens SET status=? WHERE id=?").run(status, req.params.id);
  }

  if (servicos) {
    db.prepare("DELETE FROM ordem_servicos WHERE ordem_id = ?").run(req.params.id);
    const ins = db.prepare("INSERT INTO ordem_servicos (ordem_id, descricao, status) VALUES (?,?,?)");
    for (const s of servicos) {
      ins.run(req.params.id, s.descricao, s.status || "pendente");
    }
  }

  res.json(getOrdem(req.params.id));
});

// PATCH /api/ordens/:id/status
router.patch("/:id/status", (req, res) => {
  const { status } = req.body;
  if (!["aguardando","em_andamento","concluido","cancelado"].includes(status)) return res.status(400).json({ erro: "Status inválido." });
  const existing = db.prepare("SELECT id FROM ordens WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ erro: "Não encontrado." });
  db.prepare("UPDATE ordens SET status = ? WHERE id = ?").run(status, req.params.id);
  res.json({ mensagem: "Status atualizado.", status });
});

// DELETE /api/ordens/:id
router.delete("/:id", role("admin"), (req, res) => {
  const row = db.prepare("SELECT id FROM ordens WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ erro: "Não encontrado." });
  db.prepare("DELETE FROM ordens WHERE id = ?").run(req.params.id);
  res.json({ mensagem: "OS removida." });
});

module.exports = router;