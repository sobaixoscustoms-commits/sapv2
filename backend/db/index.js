// db/index.js — conecta ao PostgreSQL e inicializa o schema

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id         SERIAL PRIMARY KEY,
      nome       TEXT NOT NULL,
      email      TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      perfil     TEXT NOT NULL DEFAULT 'tecnico' CHECK(perfil IN ('admin','tecnico','recepcionista')),
      ativo      SMALLINT NOT NULL DEFAULT 1,
      criado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id         SERIAL PRIMARY KEY,
      nome       TEXT NOT NULL,
      telefone   TEXT,
      email      TEXT,
      cpf_cnpj   TEXT,
      endereco   TEXT,
      obs        TEXT,
      criado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS veiculos (
      id          SERIAL PRIMARY KEY,
      cliente_id  INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
      placa       TEXT,
      marca       TEXT,
      modelo      TEXT,
      ano         INTEGER,
      cor         TEXT,
      km          INTEGER DEFAULT 0,
      criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orcamentos (
      id            SERIAL PRIMARY KEY,
      numero        TEXT NOT NULL UNIQUE,
      cliente_id    INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
      cliente_nome  TEXT NOT NULL,
      veiculo       TEXT,
      status        TEXT NOT NULL DEFAULT 'aguardando' CHECK(status IN ('aguardando','aprovado','recusado','expirado')),
      total         NUMERIC NOT NULL DEFAULT 0,
      obs           TEXT,
      criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orcamento_itens (
      id            SERIAL PRIMARY KEY,
      orcamento_id  INTEGER NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
      descricao     TEXT NOT NULL,
      quantidade    NUMERIC NOT NULL DEFAULT 1,
      valor_unit    NUMERIC NOT NULL DEFAULT 0,
      valor_total   NUMERIC NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS ordens (
      id            SERIAL PRIMARY KEY,
      numero        TEXT NOT NULL UNIQUE,
      cliente_nome  TEXT NOT NULL,
      veiculo       TEXT,
      status        TEXT NOT NULL DEFAULT 'aguardando' CHECK(status IN ('aguardando','em_andamento','concluido','cancelado')),
      tecnico       TEXT,
      total         NUMERIC NOT NULL DEFAULT 0,
      entrada       TEXT,
      previsao      TEXT,
      obs           TEXT,
      orcamento_id  INTEGER REFERENCES orcamentos(id) ON DELETE SET NULL,
      criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ordem_servicos (
      id        SERIAL PRIMARY KEY,
      ordem_id  INTEGER NOT NULL REFERENCES ordens(id) ON DELETE CASCADE,
      descricao TEXT NOT NULL,
      status    TEXT NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente','em_andamento','concluido'))
    );

    CREATE TABLE IF NOT EXISTS agendamentos (
      id            SERIAL PRIMARY KEY,
      cliente_nome  TEXT NOT NULL,
      veiculo       TEXT,
      servico       TEXT NOT NULL,
      data          TEXT NOT NULL,
      hora          TEXT NOT NULL,
      tecnico       TEXT,
      status        TEXT NOT NULL DEFAULT 'aguardando' CHECK(status IN ('aguardando','confirmado','concluido','cancelado')),
      obs           TEXT,
      criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS contas_receber (
      id            SERIAL PRIMARY KEY,
      descricao     TEXT NOT NULL,
      valor         NUMERIC NOT NULL,
      vencimento    TEXT,
      status        TEXT NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente','recebido','vencido')),
      cliente_nome  TEXT,
      recebido_em   TEXT,
      obs           TEXT,
      criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS contas_pagar (
      id          SERIAL PRIMARY KEY,
      descricao   TEXT NOT NULL,
      valor       NUMERIC NOT NULL,
      vencimento  TEXT,
      status      TEXT NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente','pago','vencido')),
      fornecedor  TEXT,
      pago_em     TEXT,
      obs         TEXT,
      criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS caixa (
      id               SERIAL PRIMARY KEY,
      tipo             TEXT NOT NULL CHECK(tipo IN ('entrada','saida')),
      descricao        TEXT NOT NULL,
      valor            NUMERIC NOT NULL,
      data             TEXT NOT NULL,
      forma_pagamento  TEXT NOT NULL DEFAULT 'dinheiro',
      criado_por       TEXT,
      criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS estoque (
      id          SERIAL PRIMARY KEY,
      nome        TEXT NOT NULL,
      categoria   TEXT,
      unidade     TEXT NOT NULL DEFAULT 'pç',
      quantidade  NUMERIC NOT NULL DEFAULT 0,
      qtd_minima  NUMERIC NOT NULL DEFAULT 0,
      custo       NUMERIC NOT NULL DEFAULT 0,
      venda       NUMERIC NOT NULL DEFAULT 0,
      fornecedor  TEXT,
      criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS estoque_movimentos (
      id          SERIAL PRIMARY KEY,
      estoque_id  INTEGER NOT NULL REFERENCES estoque(id) ON DELETE CASCADE,
      tipo        TEXT NOT NULL CHECK(tipo IN ('entrada','saida','ajuste')),
      quantidade  NUMERIC NOT NULL,
      obs         TEXT,
      usuario     TEXT,
      criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

initDb().catch(err => {
  console.error("Erro ao inicializar banco de dados:", err.message);
  process.exit(1);
});

module.exports = pool;
