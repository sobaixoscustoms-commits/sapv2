// db/index.js — inicializa o banco SQLite e cria todas as tabelas

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_DIR = path.join(__dirname, "../data");
const DB_PATH = path.join(DB_DIR, "sbcustoms.db");

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);

// Performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ─── SCHEMA ──────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nome       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    perfil     TEXT NOT NULL DEFAULT 'tecnico' CHECK(perfil IN ('admin','tecnico','recepcionista')),
    ativo      INTEGER NOT NULL DEFAULT 1,
    criado_em  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS clientes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nome       TEXT NOT NULL,
    telefone   TEXT,
    email      TEXT,
    cpf_cnpj   TEXT,
    endereco   TEXT,
    obs        TEXT,
    criado_em  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS veiculos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id  INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    placa       TEXT,
    marca       TEXT,
    modelo      TEXT,
    ano         INTEGER,
    cor         TEXT,
    km          INTEGER DEFAULT 0,
    criado_em   TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS orcamentos (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    numero        TEXT NOT NULL UNIQUE,
    cliente_id    INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    cliente_nome  TEXT NOT NULL,
    veiculo       TEXT,
    status        TEXT NOT NULL DEFAULT 'aguardando' CHECK(status IN ('aguardando','aprovado','recusado','expirado')),
    total         REAL NOT NULL DEFAULT 0,
    obs           TEXT,
    criado_em     TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS orcamento_itens (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    orcamento_id  INTEGER NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
    descricao     TEXT NOT NULL,
    quantidade    REAL NOT NULL DEFAULT 1,
    valor_unit    REAL NOT NULL DEFAULT 0,
    valor_total   REAL NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS ordens (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    numero        TEXT NOT NULL UNIQUE,
    cliente_nome  TEXT NOT NULL,
    veiculo       TEXT,
    status        TEXT NOT NULL DEFAULT 'aguardando' CHECK(status IN ('aguardando','em_andamento','concluido','cancelado')),
    tecnico       TEXT,
    total         REAL NOT NULL DEFAULT 0,
    entrada       TEXT,
    previsao      TEXT,
    obs           TEXT,
    orcamento_id  INTEGER REFERENCES orcamentos(id) ON DELETE SET NULL,
    criado_em     TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS ordem_servicos (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    ordem_id  INTEGER NOT NULL REFERENCES ordens(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    status    TEXT NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente','em_andamento','concluido'))
  );

  CREATE TABLE IF NOT EXISTS agendamentos (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_nome  TEXT NOT NULL,
    veiculo       TEXT,
    servico       TEXT NOT NULL,
    data          TEXT NOT NULL,
    hora          TEXT NOT NULL,
    tecnico       TEXT,
    status        TEXT NOT NULL DEFAULT 'aguardando' CHECK(status IN ('aguardando','confirmado','concluido','cancelado')),
    obs           TEXT,
    criado_em     TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS contas_receber (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    descricao     TEXT NOT NULL,
    valor         REAL NOT NULL,
    vencimento    TEXT,
    status        TEXT NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente','recebido','vencido')),
    cliente_nome  TEXT,
    recebido_em   TEXT,
    obs           TEXT,
    criado_em     TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS contas_pagar (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    descricao   TEXT NOT NULL,
    valor       REAL NOT NULL,
    vencimento  TEXT,
    status      TEXT NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente','pago','vencido')),
    fornecedor  TEXT,
    pago_em     TEXT,
    obs         TEXT,
    criado_em   TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS caixa (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo             TEXT NOT NULL CHECK(tipo IN ('entrada','saida')),
    descricao        TEXT NOT NULL,
    valor            REAL NOT NULL,
    data             TEXT NOT NULL,
    forma_pagamento  TEXT NOT NULL DEFAULT 'dinheiro',
    criado_por       TEXT,
    criado_em        TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS estoque (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nome        TEXT NOT NULL,
    categoria   TEXT,
    unidade     TEXT NOT NULL DEFAULT 'pç',
    quantidade  REAL NOT NULL DEFAULT 0,
    qtd_minima  REAL NOT NULL DEFAULT 0,
    custo       REAL NOT NULL DEFAULT 0,
    venda       REAL NOT NULL DEFAULT 0,
    fornecedor  TEXT,
    criado_em   TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS estoque_movimentos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    estoque_id  INTEGER NOT NULL REFERENCES estoque(id) ON DELETE CASCADE,
    tipo        TEXT NOT NULL CHECK(tipo IN ('entrada','saida','ajuste')),
    quantidade  REAL NOT NULL,
    obs         TEXT,
    usuario     TEXT,
    criado_em   TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
`);

module.exports = db;