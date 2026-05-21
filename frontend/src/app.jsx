import { useState, useEffect, useCallback } from "react";
import {
  authApi, clientesApi, orcamentosApi, ordensApi,
  agendamentosApi, estoqueApi, caixaApi, contasApi, usuariosApi
} from "./api.js";

// ============================================================
// ESTILOS GLOBAIS
// ============================================================
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0a0a0f; --surface: #111118; --surface2: #1a1a24; --surface3: #22222f;
      --border: #2a2a3a; --accent: #f0c040; --accent2: #4a9eff; --accent3: #2ecc71;
      --danger: #e74c3c; --warn: #f39c12; --text: #f0f0f8; --text2: #9090a8;
      --text3: #555568; --font: 'DM Sans', sans-serif; --mono: 'Space Mono', monospace;
      --r: 10px; --r2: 6px;
    }
    html, body { background: var(--bg); color: var(--text); font-family: var(--font); font-size: 14px; }
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: var(--surface); }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
    input, select, textarea {
      background: var(--surface3); border: 1px solid var(--border); color: var(--text);
      border-radius: var(--r2); padding: 8px 12px; font-family: var(--font);
      font-size: 14px; outline: none; width: 100%; transition: border-color .2s;
    }
    input:focus, select:focus, textarea:focus { border-color: var(--accent); }
    select option { background: var(--surface2); }
    textarea { resize: vertical; min-height: 80px; }
    label { display: block; color: var(--text2); font-size: 12px; font-weight: 500; margin-bottom: 4px; text-transform: uppercase; letter-spacing: .5px; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: var(--r2); border: none; cursor: pointer; font-family: var(--font); font-size: 13px; font-weight: 600; transition: all .15s; }
    .btn-primary { background: var(--accent); color: #000; }
    .btn-primary:hover { background: #ffd060; }
    .btn-secondary { background: var(--surface3); color: var(--text); border: 1px solid var(--border); }
    .btn-secondary:hover { background: var(--surface2); border-color: var(--accent); }
    .btn-danger { background: var(--danger); color: #fff; }
    .btn-success { background: var(--accent3); color: #000; }
    .btn-success:hover { background: #27ae60; }
    .btn-sm { padding: 5px 10px; font-size: 12px; }
    .btn-icon { padding: 6px 8px; background: var(--surface3); border: 1px solid var(--border); color: var(--text2); border-radius: var(--r2); cursor: pointer; transition: all .15s; display: inline-flex; align-items: center; justify-content: center; }
    .btn-icon:hover { border-color: var(--accent); color: var(--accent); }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .8px; color: var(--text3); border-bottom: 1px solid var(--border); }
    td { padding: 12px 14px; border-bottom: 1px solid var(--border); color: var(--text); font-size: 13px; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: var(--surface2); }
    .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .badge-yellow { background: rgba(240,192,64,.15); color: var(--accent); }
    .badge-blue { background: rgba(74,158,255,.15); color: var(--accent2); }
    .badge-green { background: rgba(46,204,113,.15); color: var(--accent3); }
    .badge-red { background: rgba(231,76,60,.15); color: var(--danger); }
    .badge-gray { background: var(--surface3); color: var(--text2); }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.75); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .modal { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); width: 100%; max-width: 700px; max-height: 90vh; overflow-y: auto; }
    .modal-header { padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: var(--surface); z-index: 1; }
    .modal-body { padding: 24px; }
    .modal-footer { padding: 16px 24px; border-top: 1px solid var(--border); display: flex; gap: 10px; justify-content: flex-end; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    .grid4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }
    .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 20px; }
    .stat-value { font-size: 26px; font-weight: 700; font-family: var(--mono); }
    .stat-label { font-size: 11px; color: var(--text2); margin-top: 4px; text-transform: uppercase; letter-spacing: .5px; }
    .tab-bar { display: flex; gap: 2px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 4px; margin-bottom: 20px; }
    .tab-item { flex: 1; padding: 8px 12px; text-align: center; border-radius: 7px; cursor: pointer; font-size: 13px; font-weight: 500; color: var(--text2); transition: all .15s; }
    .tab-item.active { background: var(--accent); color: #000; font-weight: 700; }
    .search-bar { display: flex; gap: 10px; margin-bottom: 16px; }
    .search-bar input { flex: 1; }
    .divider { height: 1px; background: var(--border); margin: 16px 0; }
    .empty-state { text-align: center; padding: 60px 20px; color: var(--text3); }
    .empty-state .icon { font-size: 48px; margin-bottom: 16px; }
    .notification { position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; }
    .notif { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r2); padding: 12px 16px; display: flex; align-items: center; gap: 10px; font-size: 13px; min-width: 280px; animation: slideIn .3s ease; box-shadow: 0 8px 32px rgba(0,0,0,.4); }
    .notif-success { border-left: 3px solid var(--accent3); }
    .notif-error { border-left: 3px solid var(--danger); }
    .notif-info { border-left: 3px solid var(--accent2); }
    @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .loading { display: flex; align-items: center; justify-content: center; padding: 40px; color: var(--text2); gap: 10px; }
    .spinner { width: 20px; height: 20px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .text-accent { color: var(--accent); } .text-green { color: var(--accent3); } .text-red { color: var(--danger); }
    .text-blue { color: var(--accent2); } .text-muted { color: var(--text2); } .text-sm { font-size: 12px; }
    .text-mono { font-family: var(--mono); } .fw700 { font-weight: 700; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-center { display: flex; align-items: center; gap: 8px; }
    .mb16 { margin-bottom: 16px; } .mt16 { margin-top: 16px; } .w100 { width: 100%; }
  `}</style>
);

// ============================================================
// UTILS
// ============================================================
let _toastId = 0;
let _toastFn = null;
const toast = (msg, type = "success") => _toastFn?.(msg, type);
const fmtBRL = v => "R$ " + Number(v || 0).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const fmtDate = d => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "-";
const today = () => new Date().toISOString().split("T")[0];
const nowStr = () => new Date().toLocaleString("pt-BR");

// ============================================================
// TOAST
// ============================================================
function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    _toastFn = (msg, type) => {
      const id = ++_toastId;
      setToasts(p => [...p, { id, msg, type }]);
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
    };
  }, []);
  return (
    <div className="notification">
      {toasts.map(t => (
        <div key={t.id} className={`notif notif-${t.type}`}>
          <span>{t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// LOADING
// ============================================================
function Loading() {
  return <div className="loading"><div className="spinner" /><span>Carregando...</span></div>;
}

// ============================================================
// MODAL
// ============================================================
function Modal({ title, onClose, children, footer, size = 700 }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: size }}>
        <div className="modal-header">
          <span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ============================================================
// STATUS BADGE
// ============================================================
function StatusBadge({ s, type }) {
  const map = {
    os:     { aguardando: ["yellow","Aguardando"], em_andamento: ["blue","Em Andamento"], concluido: ["green","Concluído"], cancelado: ["red","Cancelado"] },
    orc:    { aguardando: ["yellow","Aguardando"], aprovado: ["green","Aprovado"], recusado: ["red","Recusado"], expirado: ["gray","Expirado"] },
    conta:  { pendente: ["yellow","Pendente"], pago: ["green","Pago"], recebido: ["green","Recebido"], vencido: ["red","Vencido"] },
    agenda: { aguardando: ["yellow","Aguardando"], confirmado: ["green","Confirmado"], concluido: ["blue","Concluído"], cancelado: ["red","Cancelado"] },
  };
  const [color, label] = (map[type] || {})[s] || ["gray", s];
  return <span className={`badge badge-${color}`}>{label}</span>;
}

// ============================================================
// LOGIN
// ============================================================
function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true); setErr("");
    try {
      const res = await authApi.login(email, pass);
      localStorage.setItem("sbcustoms_token", res.token);
      onLogin(res.usuario);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, rgba(240,192,64,.06) 0%, transparent 60%)" }} />
      <div style={{ width: 380, position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔧</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 700, color: "var(--accent)" }}>SB CUSTOMS</div>
          <div style={{ color: "var(--text2)", fontSize: 13, marginTop: 4 }}>Sistema de Gestão de Oficina</div>
        </div>
        <div className="card">
          <div className="form-group">
            <label>E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" onKeyDown={e => e.key === "Enter" && handleLogin()} />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handleLogin()} />
          </div>
          {err && <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 12 }}>⚠ {err}</div>}
          <button className="btn btn-primary w100" style={{ width: "100%", justifyContent: "center", padding: 11 }} onClick={handleLogin} disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>
        <div style={{ marginTop: 16, padding: 12, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--r2)" }}>
          <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6, fontWeight: 600 }}>ACESSOS DE DEMONSTRAÇÃO</div>
          {[["tacio@sbcustoms.com","admin123","Admin"],["carlos@sbcustoms.com","carlos123","Técnico"],["marina@sbcustoms.com","marina123","Recepção"]].map(([e,p,r]) => (
            <div key={e} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text2)", padding: "3px 0", cursor: "pointer" }} onClick={() => { setEmail(e); setPass(p); }}>
              <span>{e}</span><span style={{ color: "var(--accent)", fontFamily: "var(--mono)" }}>{r}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SIDEBAR
// ============================================================
const MENU = [
  { id: "dashboard",    icon: "◉",  label: "Dashboard",          roles: ["admin","tecnico","recepcionista"] },
  { id: "clientes",     icon: "👥", label: "Clientes",            roles: ["admin","recepcionista"] },
  { id: "orcamentos",   icon: "📋", label: "Orçamentos",          roles: ["admin","recepcionista"] },
  { id: "ordens",       icon: "🔧", label: "Ordens de Serviço",   roles: ["admin","tecnico","recepcionista"] },
  { id: "agendamentos", icon: "📅", label: "Agendamentos",        roles: ["admin","tecnico","recepcionista"] },
  { id: "estoque",      icon: "📦", label: "Estoque",             roles: ["admin","recepcionista"] },
  { id: "caixa",        icon: "💰", label: "Caixa",               roles: ["admin"] },
  { id: "contas",       icon: "💳", label: "Contas",              roles: ["admin"] },
  { id: "usuarios",     icon: "👤", label: "Usuários",            roles: ["admin"] },
];

function Sidebar({ active, onNav, user }) {
  const allowed = MENU.filter(m => m.roles.includes(user.perfil));
  return (
    <div style={{ width: 220, background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0, flexShrink: 0 }}>
      <div style={{ padding: "20px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 700, color: "var(--accent)" }}>SB CUSTOMS</div>
        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>Gestão de Oficina</div>
      </div>
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {allowed.map(m => (
          <button key={m.id} onClick={() => onNav(m.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", borderRadius: "var(--r2)", border: "none", cursor: "pointer", fontFamily: "var(--font)", fontSize: 13, fontWeight: active === m.id ? 700 : 400, background: active === m.id ? "rgba(240,192,64,.12)" : "transparent", color: active === m.id ? "var(--accent)" : "var(--text2)", marginBottom: 2, transition: "all .15s", textAlign: "left" }}>
            <span style={{ fontSize: 16 }}>{m.icon}</span>{m.label}
          </button>
        ))}
      </nav>
      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{user.nome}</div>
        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2, textTransform: "uppercase" }}>{user.perfil}</div>
      </div>
    </div>
  );
}

function Topbar({ title, onLogout }) {
  const [time, setTime] = useState(nowStr());
  useEffect(() => { const t = setInterval(() => setTime(nowStr()), 30000); return () => clearInterval(t); }, []);
  return (
    <div style={{ height: 56, background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 12, color: "var(--text2)" }}>{time}</div>
        <button className="btn btn-secondary btn-sm" onClick={onLogout}>Sair</button>
      </div>
    </div>
  );
}

// ============================================================
// DASHBOARD
// ============================================================
function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [agHoje, setAgHoje] = useState([]);
  const [critico, setCritico] = useState([]);
  const [ordens, setOrdens] = useState([]);
  const [caixa, setCaixa] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [ag, est, ord] = await Promise.all([
          agendamentosApi.list("", today()),
          estoqueApi.critico(),
          ordensApi.list(),
        ]);
        setAgHoje(ag);
        setCritico(est);
        setOrdens(ord.slice(0, 4));
        if (user.perfil === "admin") {
          const [cx, receber, pagar] = await Promise.all([
            caixaApi.list(),
            contasApi.receber("pendente"),
            contasApi.pagar("pendente"),
          ]);
          setCaixa(cx.slice(0, 4));
          const saldo = cx.reduce((a, b) => b.tipo === "entrada" ? a + b.valor : a - b.valor, 0);
          const totalReceber = receber.reduce((a, b) => a + b.valor, 0);
          const totalPagar = pagar.reduce((a, b) => a + b.valor, 0);
          const osAberto = ord.filter(o => o.status !== "concluido" && o.status !== "cancelado").length;
          setStats({ saldo, totalReceber, totalPagar, osAberto });
        }
      } catch (e) { toast(e.message, "error"); }
    };
    load();
  }, [user.perfil]);

  return (
    <div>
      {user.perfil === "admin" && stats && (
        <div className="grid4" style={{ marginBottom: 24 }}>
          {[
            { label: "Saldo em Caixa", value: fmtBRL(stats.saldo), color: stats.saldo >= 0 ? "var(--accent3)" : "var(--danger)", icon: "💰" },
            { label: "A Receber", value: fmtBRL(stats.totalReceber), color: "var(--accent2)", icon: "📈" },
            { label: "A Pagar", value: fmtBRL(stats.totalPagar), color: "var(--danger)", icon: "📉" },
            { label: "OS em Aberto", value: stats.osAberto, color: "var(--accent)", icon: "🔧" },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
              <div className="stat-value" style={{ color: s.color, fontSize: 22 }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <div className="flex-between mb16"><span className="fw700">📅 Agendamentos Hoje ({agHoje.length})</span></div>
          {agHoje.length === 0
            ? <div className="text-muted text-sm">Nenhum agendamento hoje.</div>
            : agHoje.map(a => (
              <div key={a.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{a.hora} — {a.cliente_nome}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>{a.servico} · {a.veiculo}</div>
                </div>
                <StatusBadge s={a.status} type="agenda" />
              </div>
            ))
          }
        </div>

        <div className="card">
          <div className="flex-between mb16"><span className="fw700">⚠ Estoque Crítico ({critico.length})</span></div>
          {critico.length === 0
            ? <div className="text-muted text-sm">Estoque dentro do esperado.</div>
            : critico.map(e => (
              <div key={e.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{e.nome}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>Mínimo: {e.qtd_minima} {e.unidade}</div>
                </div>
                <span className="badge badge-red">{e.quantidade} {e.unidade}</span>
              </div>
            ))
          }
        </div>

        <div className="card">
          <div className="fw700 mb16">🔧 Ordens Recentes</div>
          {ordens.map(o => (
            <div key={o.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{o.numero} — {o.cliente_nome}</div>
                <div style={{ fontSize: 12, color: "var(--text2)" }}>{o.veiculo}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", fontFamily: "var(--mono)" }}>{fmtBRL(o.total)}</div>
                <StatusBadge s={o.status} type="os" />
              </div>
            </div>
          ))}
        </div>

        {user.perfil === "admin" && (
          <div className="card">
            <div className="fw700 mb16">💳 Últimas Movimentações</div>
            {caixa.map(m => (
              <div key={m.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.descricao}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>{fmtDate(m.data)} · {m.forma_pagamento}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--mono)", color: m.tipo === "entrada" ? "var(--accent3)" : "var(--danger)" }}>
                  {m.tipo === "entrada" ? "+" : "-"}{fmtBRL(m.valor)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// CLIENTES
// ============================================================
function Clientes({ user }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const canEdit = ["admin","recepcionista"].includes(user.perfil);

  const load = useCallback(async () => {
    try { setLoading(true); setList(await clientesApi.list(search)); }
    catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const open = (c = null) => {
    setForm(c ? { ...c } : { nome: "", telefone: "", email: "", cpf_cnpj: "", endereco: "", obs: "" });
    setModal("form");
  };

  const save = async () => {
    if (!form.nome?.trim()) return toast("Nome obrigatório", "error");
    try {
      if (form.id) await clientesApi.update(form.id, form);
      else await clientesApi.create(form);
      toast(form.id ? "Cliente atualizado!" : "Cliente cadastrado!");
      setModal(null);
      load();
    } catch (e) { toast(e.message, "error"); }
  };

  const del = async (id) => {
    if (!confirm("Excluir cliente?")) return;
    try { await clientesApi.delete(id); toast("Cliente removido.", "info"); load(); }
    catch (e) { toast(e.message, "error"); }
  };

  return (
    <div>
      <div className="search-bar">
        <input placeholder="🔍 Buscar por nome, telefone ou CPF/CNPJ..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && load()} />
        <button className="btn btn-secondary" onClick={load}>Buscar</button>
        {canEdit && <button className="btn btn-primary" onClick={() => open()}>+ Novo Cliente</button>}
      </div>
      <div className="card" style={{ padding: 0 }}>
        {loading ? <Loading /> : (
          <table>
            <thead><tr><th>Nome</th><th>Telefone</th><th>E-mail</th><th>CPF/CNPJ</th><th>Cadastro</th><th></th></tr></thead>
            <tbody>
              {list.length === 0 ? <tr><td colSpan={6}><div className="empty-state"><div className="icon">👥</div><p>Nenhum cliente encontrado</p></div></td></tr>
                : list.map(c => (
                  <tr key={c.id}>
                    <td><div className="fw700">{c.nome}</div>{c.obs && <div className="text-sm text-muted">{c.obs}</div>}</td>
                    <td>{c.telefone}</td>
                    <td className="text-muted">{c.email || "-"}</td>
                    <td className="text-mono text-sm">{c.cpf_cnpj || "-"}</td>
                    <td className="text-muted text-sm">{fmtDate(c.criado_em)}</td>
                    <td style={{ display: "flex", gap: 4 }}>
                      {canEdit && <button className="btn-icon" onClick={() => open(c)}>✏</button>}
                      {user.perfil === "admin" && <button className="btn-icon" onClick={() => del(c.id)}>🗑</button>}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
      {modal === "form" && (
        <Modal title={form.id ? "Editar Cliente" : "Novo Cliente"} onClose={() => setModal(null)}
          footer={<><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button><button className="btn btn-primary" onClick={save}>Salvar</button></>}>
          <div className="grid2">
            <div className="form-group"><label>Nome *</label><input value={form.nome || ""} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} /></div>
            <div className="form-group"><label>Telefone</label><input value={form.telefone || ""} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} placeholder="(54) 99999-9999" /></div>
            <div className="form-group"><label>E-mail</label><input value={form.email || ""} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div className="form-group"><label>CPF / CNPJ</label><input value={form.cpf_cnpj || ""} onChange={e => setForm(p => ({ ...p, cpf_cnpj: e.target.value }))} /></div>
          </div>
          <div className="form-group"><label>Endereço</label><input value={form.endereco || ""} onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))} /></div>
          <div className="form-group"><label>Observações</label><textarea value={form.obs || ""} onChange={e => setForm(p => ({ ...p, obs: e.target.value }))} /></div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// ORÇAMENTOS
// ============================================================
function Orcamentos({ user }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [viewOrc, setViewOrc] = useState(null);

  const canEdit = ["admin","recepcionista"].includes(user.perfil);

  const load = useCallback(async () => {
    try { setLoading(true); setList(await orcamentosApi.list(search)); }
    catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const newForm = () => ({ cliente_nome: "", veiculo: "", obs: "", itens: [{ descricao: "", quantidade: 1, valor_unit: 0, valor_total: 0 }], total: 0 });

  const open = (o = null) => {
    setForm(o ? { ...o, itens: (o.itens || []).map(i => ({ ...i })) } : newForm());
    setModal("form");
  };

  const calcTotal = (itens) => itens.reduce((a, b) => a + (Number(b.quantidade) * Number(b.valor_unit)), 0);

  const updateItem = (i, field, val) => setForm(p => {
    const itens = p.itens.map((item, j) => {
      if (j !== i) return item;
      const updated = { ...item, [field]: field === "descricao" ? val : Number(val) };
      updated.valor_total = updated.quantidade * updated.valor_unit;
      return updated;
    });
    return { ...p, itens, total: calcTotal(itens) };
  });

  const save = async () => {
    if (!form.cliente_nome?.trim()) return toast("Nome do cliente obrigatório", "error");
    try {
      if (form.id) await orcamentosApi.update(form.id, form);
      else await orcamentosApi.create(form);
      toast(form.id ? "Orçamento atualizado!" : "Orçamento criado!");
      setModal(null); load();
    } catch (e) { toast(e.message, "error"); }
  };

  const changeStatus = async (id, status) => {
    try { await orcamentosApi.status(id, status); toast("Status atualizado!"); load(); }
    catch (e) { toast(e.message, "error"); }
  };

  const gerarOS = async (orc) => {
    try { await orcamentosApi.gerarOS(orc.id); toast("OS criada!"); load(); }
    catch (e) { toast(e.message, "error"); }
  };

  return (
    <div>
      <div className="search-bar">
        <input placeholder="🔍 Buscar orçamento..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && load()} />
        <button className="btn btn-secondary" onClick={load}>Buscar</button>
        {canEdit && <button className="btn btn-primary" onClick={() => open()}>+ Novo Orçamento</button>}
      </div>
      <div className="card" style={{ padding: 0 }}>
        {loading ? <Loading /> : (
          <table>
            <thead><tr><th>Número</th><th>Cliente</th><th>Veículo</th><th>Total</th><th>Status</th><th>Data</th><th></th></tr></thead>
            <tbody>
              {list.length === 0 ? <tr><td colSpan={7}><div className="empty-state"><div className="icon">📋</div><p>Nenhum orçamento</p></div></td></tr>
                : list.map(o => (
                  <tr key={o.id}>
                    <td><span className="text-mono text-accent">{o.numero}</span></td>
                    <td className="fw700">{o.cliente_nome}</td>
                    <td className="text-muted text-sm">{o.veiculo}</td>
                    <td><span className="text-mono text-green fw700">{fmtBRL(o.total)}</span></td>
                    <td><StatusBadge s={o.status} type="orc" /></td>
                    <td className="text-muted text-sm">{fmtDate(o.criado_em)}</td>
                    <td style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      <button className="btn-icon" title="Ver" onClick={() => setViewOrc(o)}>👁</button>
                      {canEdit && <button className="btn-icon" title="Editar" onClick={() => open(o)}>✏</button>}
                      {canEdit && o.status === "aprovado" && <button className="btn btn-success btn-sm" onClick={() => gerarOS(o)}>→ OS</button>}
                      {canEdit && o.status === "aguardando" && (
                        <select style={{ fontSize: 11, padding: "4px 6px", width: "auto" }} onChange={e => changeStatus(o.id, e.target.value)} defaultValue="">
                          <option value="" disabled>Status</option>
                          <option value="aprovado">Aprovar</option>
                          <option value="recusado">Recusar</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {modal === "form" && (
        <Modal title={form.id ? "Editar Orçamento" : "Novo Orçamento"} onClose={() => setModal(null)} size={820}
          footer={<><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button><button className="btn btn-primary" onClick={save}>Salvar</button></>}>
          <div className="grid2">
            <div className="form-group"><label>Cliente *</label><input value={form.cliente_nome || ""} onChange={e => setForm(p => ({ ...p, cliente_nome: e.target.value }))} /></div>
            <div className="form-group"><label>Veículo</label><input value={form.veiculo || ""} onChange={e => setForm(p => ({ ...p, veiculo: e.target.value }))} placeholder="Marca Modelo Ano - PLACA" /></div>
          </div>
          <div className="divider" />
          <div className="flex-between mb16"><span className="fw700">Itens / Serviços</span><button className="btn btn-secondary btn-sm" onClick={() => setForm(p => ({ ...p, itens: [...p.itens, { descricao: "", quantidade: 1, valor_unit: 0, valor_total: 0 }] }))}>+ Item</button></div>
          {form.itens?.map((item, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 100px 32px", gap: 8, marginBottom: 8, alignItems: "end" }}>
              <div className="form-group" style={{ margin: 0 }}>{i === 0 && <label>Descrição</label>}<input value={item.descricao} onChange={e => updateItem(i, "descricao", e.target.value)} placeholder="Serviço ou peça" /></div>
              <div className="form-group" style={{ margin: 0 }}>{i === 0 && <label>Qtd</label>}<input type="number" min="1" value={item.quantidade} onChange={e => updateItem(i, "quantidade", e.target.value)} /></div>
              <div className="form-group" style={{ margin: 0 }}>{i === 0 && <label>Unit (R$)</label>}<input type="number" min="0" step="0.01" value={item.valor_unit} onChange={e => updateItem(i, "valor_unit", e.target.value)} /></div>
              <div className="form-group" style={{ margin: 0 }}>{i === 0 && <label>Total</label>}<input value={fmtBRL(item.valor_total)} readOnly style={{ opacity: .7 }} /></div>
              <div style={{ paddingTop: i === 0 ? 20 : 0 }}><button className="btn-icon" onClick={() => setForm(p => ({ ...p, itens: p.itens.filter((_, j) => j !== i) }))}>✕</button></div>
            </div>
          ))}
          <div className="divider" />
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <div style={{ textAlign: "right" }}>
              <div className="text-muted text-sm">TOTAL</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--mono)", color: "var(--accent3)" }}>{fmtBRL(form.total)}</div>
            </div>
          </div>
          <div className="form-group"><label>Observações</label><textarea value={form.obs || ""} onChange={e => setForm(p => ({ ...p, obs: e.target.value }))} /></div>
        </Modal>
      )}

      {viewOrc && (
        <Modal title={`Orçamento ${viewOrc.numero}`} onClose={() => setViewOrc(null)} size={680}
          footer={
            <div style={{ display: "flex", gap: 8, width: "100%" }}>
              <button className="btn btn-secondary" onClick={() => { navigator.clipboard.writeText(window.location.href + "?orc=" + viewOrc.numero); toast("Link copiado!"); }}>🔗 Copiar Link</button>
              <button className="btn btn-secondary" onClick={() => window.print()}>🖨 Imprimir / PDF</button>
              <div style={{ flex: 1 }} />
              <button className="btn btn-secondary" onClick={() => setViewOrc(null)}>Fechar</button>
            </div>
          }>
          <div style={{ background: "#fff", color: "#111", padding: 32, borderRadius: "var(--r)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <div><div style={{ fontSize: 24, fontWeight: 800 }}>SB CUSTOMS</div><div style={{ fontSize: 12, color: "#666" }}>Restauração e Personalização Automotiva · Caxias do Sul, RS</div></div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#c8a000" }}>{viewOrc.numero}</div>
                <div style={{ fontSize: 12, color: "#666" }}>Data: {fmtDate(viewOrc.criado_em)}</div>
              </div>
            </div>
            <div style={{ background: "#f8f8f8", border: "1px solid #eee", borderRadius: 6, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>CLIENTE</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{viewOrc.cliente_nome}</div>
              {viewOrc.veiculo && <div style={{ fontSize: 13, color: "#444", marginTop: 4 }}>🚗 {viewOrc.veiculo}</div>}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
              <thead><tr style={{ background: "#f0f0f0" }}>
                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: "#666" }}>Serviço / Peça</th>
                <th style={{ padding: "8px 12px", textAlign: "center", fontSize: 11, color: "#666" }}>Qtd</th>
                <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 11, color: "#666" }}>Unit.</th>
                <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 11, color: "#666" }}>Total</th>
              </tr></thead>
              <tbody>
                {(viewOrc.itens || []).map((item, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "10px 12px" }}>{item.descricao}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>{item.quantidade}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>{fmtBRL(item.valor_unit)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>{fmtBRL(item.valor_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
              <div style={{ background: "#c8a000", color: "#fff", padding: "12px 24px", borderRadius: 6, textAlign: "right" }}>
                <div style={{ fontSize: 11, opacity: .8 }}>TOTAL</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{fmtBRL(viewOrc.total)}</div>
              </div>
            </div>
            {viewOrc.obs && <div style={{ background: "#fffbec", border: "1px solid #ffe58a", borderRadius: 6, padding: 12, fontSize: 12, color: "#555" }}><strong>Obs:</strong> {viewOrc.obs}</div>}
            <div style={{ marginTop: 24, borderTop: "1px solid #eee", paddingTop: 12, fontSize: 11, color: "#999", textAlign: "center" }}>Válido por 30 dias · SB Customs — Caxias do Sul, RS</div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// ORDENS DE SERVIÇO
// ============================================================
function Ordens({ user }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const load = useCallback(async () => {
    try { setLoading(true); setList(await ordensApi.list(search, filterStatus)); }
    catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  }, [search, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const newForm = () => ({ cliente_nome: "", veiculo: "", tecnico: "", status: "aguardando", servicos: [{ descricao: "", status: "pendente" }], total: 0, entrada: today(), previsao: today(), obs: "" });
  const open = (o = null) => { setForm(o ? { ...o, servicos: (o.servicos || []).map(s => ({ ...s })) } : newForm()); setModal("form"); };

  const save = async () => {
    if (!form.cliente_nome?.trim()) return toast("Nome do cliente obrigatório", "error");
    try {
      if (form.id) await ordensApi.update(form.id, form);
      else await ordensApi.create(form);
      toast(form.id ? "OS atualizada!" : "OS criada!");
      setModal(null); load();
    } catch (e) { toast(e.message, "error"); }
  };

  const changeStatus = async (id, status) => {
    try { await ordensApi.status(id, status); toast("Status atualizado!"); load(); }
    catch (e) { toast(e.message, "error"); }
  };

  return (
    <div>
      <div className="search-bar">
        <input placeholder="🔍 Buscar OS..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && load()} />
        <select style={{ width: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos status</option>
          <option value="aguardando">Aguardando</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="concluido">Concluído</option>
          <option value="cancelado">Cancelado</option>
        </select>
        {user.perfil !== "tecnico" && <button className="btn btn-primary" onClick={() => open()}>+ Nova OS</button>}
      </div>
      <div className="card" style={{ padding: 0 }}>
        {loading ? <Loading /> : (
          <table>
            <thead><tr><th>Número</th><th>Cliente</th><th>Veículo</th><th>Técnico</th><th>Total</th><th>Status</th><th>Entrada</th><th></th></tr></thead>
            <tbody>
              {list.length === 0 ? <tr><td colSpan={8}><div className="empty-state"><div className="icon">🔧</div><p>Nenhuma OS encontrada</p></div></td></tr>
                : list.map(o => (
                  <tr key={o.id}>
                    <td><span className="text-mono text-accent">{o.numero}</span></td>
                    <td className="fw700">{o.cliente_nome}</td>
                    <td className="text-muted text-sm">{o.veiculo}</td>
                    <td>{o.tecnico || <span className="text-muted">—</span>}</td>
                    <td><span className="text-mono text-green fw700">{fmtBRL(o.total)}</span></td>
                    <td><StatusBadge s={o.status} type="os" /></td>
                    <td className="text-muted text-sm">{fmtDate(o.entrada)}</td>
                    <td style={{ display: "flex", gap: 4 }}>
                      <button className="btn-icon" onClick={() => open(o)}>✏</button>
                      <select style={{ fontSize: 11, padding: "4px 6px", width: "auto" }} value={o.status} onChange={e => changeStatus(o.id, e.target.value)}>
                        <option value="aguardando">Aguardando</option>
                        <option value="em_andamento">Em Andamento</option>
                        <option value="concluido">Concluído</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
      {modal === "form" && (
        <Modal title={form.id ? `Editar OS — ${form.numero}` : "Nova Ordem de Serviço"} onClose={() => setModal(null)} size={750}
          footer={<><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button><button className="btn btn-primary" onClick={save}>Salvar</button></>}>
          <div className="grid3">
            <div className="form-group"><label>Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="aguardando">Aguardando</option><option value="em_andamento">Em Andamento</option>
                <option value="concluido">Concluído</option><option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div className="form-group"><label>Técnico</label><input value={form.tecnico || ""} onChange={e => setForm(p => ({ ...p, tecnico: e.target.value }))} /></div>
            <div className="form-group"><label>Total (R$)</label><input type="number" min="0" step="0.01" value={form.total || 0} onChange={e => setForm(p => ({ ...p, total: Number(e.target.value) }))} /></div>
          </div>
          <div className="grid2">
            <div className="form-group"><label>Cliente *</label><input value={form.cliente_nome || ""} onChange={e => setForm(p => ({ ...p, cliente_nome: e.target.value }))} /></div>
            <div className="form-group"><label>Veículo</label><input value={form.veiculo || ""} onChange={e => setForm(p => ({ ...p, veiculo: e.target.value }))} /></div>
            <div className="form-group"><label>Data Entrada</label><input type="date" value={form.entrada || today()} onChange={e => setForm(p => ({ ...p, entrada: e.target.value }))} /></div>
            <div className="form-group"><label>Previsão Entrega</label><input type="date" value={form.previsao || today()} onChange={e => setForm(p => ({ ...p, previsao: e.target.value }))} /></div>
          </div>
          <div className="divider" />
          <div className="flex-between mb16">
            <span className="fw700">Serviços</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setForm(p => ({ ...p, servicos: [...(p.servicos || []), { descricao: "", status: "pendente" }] }))}>+ Serviço</button>
          </div>
          {(form.servicos || []).map((s, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 130px 28px", gap: 8, marginBottom: 8, alignItems: "end" }}>
              <div className="form-group" style={{ margin: 0 }}>{i === 0 && <label>Descrição</label>}<input value={s.descricao} onChange={e => setForm(p => ({ ...p, servicos: p.servicos.map((x, j) => j === i ? { ...x, descricao: e.target.value } : x) }))} /></div>
              <div className="form-group" style={{ margin: 0 }}>{i === 0 && <label>Status</label>}
                <select value={s.status} onChange={e => setForm(p => ({ ...p, servicos: p.servicos.map((x, j) => j === i ? { ...x, status: e.target.value } : x) }))}>
                  <option value="pendente">Pendente</option><option value="em_andamento">Em Andamento</option><option value="concluido">Concluído</option>
                </select>
              </div>
              <div style={{ paddingTop: i === 0 ? 20 : 0 }}><button className="btn-icon" onClick={() => setForm(p => ({ ...p, servicos: p.servicos.filter((_, j) => j !== i) }))}>✕</button></div>
            </div>
          ))}
          <div className="form-group mt16"><label>Observações</label><textarea value={form.obs || ""} onChange={e => setForm(p => ({ ...p, obs: e.target.value }))} /></div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// AGENDAMENTOS
// ============================================================
function Agendamentos({ user }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterData, setFilterData] = useState(today());
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const load = useCallback(async () => {
    try { setLoading(true); setList(await agendamentosApi.list("", filterData)); }
    catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  }, [filterData]);

  useEffect(() => { load(); }, [load]);

  const newForm = () => ({ cliente_nome: "", veiculo: "", servico: "", data: today(), hora: "08:00", tecnico: "", status: "aguardando", obs: "" });
  const open = (a = null) => { setForm(a ? { ...a } : newForm()); setModal("form"); };

  const save = async () => {
    if (!form.cliente_nome?.trim() || !form.servico?.trim()) return toast("Preencha cliente e serviço", "error");
    try {
      if (form.id) await agendamentosApi.update(form.id, form);
      else await agendamentosApi.create(form);
      toast(form.id ? "Agendamento atualizado!" : "Agendamento criado!");
      setModal(null); load();
    } catch (e) { toast(e.message, "error"); }
  };

  const changeStatus = async (id, status) => {
    try { await agendamentosApi.status(id, status); load(); }
    catch (e) { toast(e.message, "error"); }
  };

  const del = async (id) => {
    if (!confirm("Excluir?")) return;
    try { await agendamentosApi.delete(id); toast("Removido.", "info"); load(); }
    catch (e) { toast(e.message, "error"); }
  };

  const horas = Array.from({ length: 20 }, (_, i) => { const h = Math.floor(i / 2) + 8; const m = i % 2 === 0 ? "00" : "30"; return `${String(h).padStart(2, "0")}:${m}`; });

  return (
    <div>
      <div className="search-bar">
        <input type="date" value={filterData} onChange={e => setFilterData(e.target.value)} style={{ width: 180 }} />
        <button className="btn btn-secondary" onClick={() => setFilterData("")}>Ver Todos</button>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => open()}>+ Novo Agendamento</button>
      </div>
      {loading ? <Loading /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
          {list.length === 0
            ? <div className="empty-state"><div className="icon">📅</div><p>Nenhum agendamento</p></div>
            : list.map(a => (
              <div key={a.id} className="card" style={{ borderLeft: `3px solid ${a.status === "confirmado" ? "var(--accent3)" : a.status === "cancelado" ? "var(--danger)" : "var(--accent)"}` }}>
                <div className="flex-between">
                  <span style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 700, color: "var(--accent)" }}>{a.hora}</span>
                  <StatusBadge s={a.status} type="agenda" />
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, marginTop: 8 }}>{a.cliente_nome}</div>
                <div style={{ color: "var(--text2)", fontSize: 12, marginTop: 2 }}>🚗 {a.veiculo}</div>
                <div style={{ color: "var(--text2)", fontSize: 13, marginTop: 6 }}>{a.servico}</div>
                {a.tecnico && <div style={{ color: "var(--accent2)", fontSize: 12, marginTop: 4 }}>👤 {a.tecnico}</div>}
                <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => open(a)}>Editar</button>
                  <select style={{ fontSize: 11, padding: "4px 6px", width: "auto" }} value={a.status} onChange={e => changeStatus(a.id, e.target.value)}>
                    <option value="aguardando">Aguardando</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="concluido">Concluído</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                  {user.perfil === "admin" && <button className="btn-icon" onClick={() => del(a.id)}>🗑</button>}
                </div>
              </div>
            ))
          }
        </div>
      )}
      {modal === "form" && (
        <Modal title={form.id ? "Editar Agendamento" : "Novo Agendamento"} onClose={() => setModal(null)}
          footer={<><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button><button className="btn btn-primary" onClick={save}>Salvar</button></>}>
          <div className="grid2">
            <div className="form-group"><label>Cliente *</label><input value={form.cliente_nome || ""} onChange={e => setForm(p => ({ ...p, cliente_nome: e.target.value }))} /></div>
            <div className="form-group"><label>Veículo</label><input value={form.veiculo || ""} onChange={e => setForm(p => ({ ...p, veiculo: e.target.value }))} /></div>
            <div className="form-group"><label>Data *</label><input type="date" value={form.data || today()} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} /></div>
            <div className="form-group"><label>Horário *</label>
              <select value={form.hora || "08:00"} onChange={e => setForm(p => ({ ...p, hora: e.target.value }))}>
                {horas.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Serviço *</label><input value={form.servico || ""} onChange={e => setForm(p => ({ ...p, servico: e.target.value }))} /></div>
            <div className="form-group"><label>Técnico</label><input value={form.tecnico || ""} onChange={e => setForm(p => ({ ...p, tecnico: e.target.value }))} /></div>
          </div>
          <div className="form-group"><label>Observações</label><textarea value={form.obs || ""} onChange={e => setForm(p => ({ ...p, obs: e.target.value }))} /></div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// ESTOQUE
// ============================================================
function Estoque({ user }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [critico, setCritico] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const canEdit = ["admin","recepcionista"].includes(user.perfil);
  const cats = ["todos", ...new Set(list.map(e => e.categoria).filter(Boolean))];
  const [tab, setTab] = useState("todos");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [all, crit] = await Promise.all([estoqueApi.list(search), estoqueApi.critico()]);
      setList(all);
      setCritico(crit);
    } catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const filtered = tab === "todos" ? list : list.filter(e => e.categoria === tab);

  const open = (e = null) => {
    setForm(e ? { ...e } : { nome: "", categoria: "", unidade: "pç", quantidade: 0, qtd_minima: 5, custo: 0, venda: 0, fornecedor: "" });
    setModal("form");
  };

  const save = async () => {
    if (!form.nome?.trim()) return toast("Nome obrigatório", "error");
    try {
      if (form.id) await estoqueApi.update(form.id, form);
      else await estoqueApi.create(form);
      toast(form.id ? "Item atualizado!" : "Item cadastrado!");
      setModal(null); load();
    } catch (e) { toast(e.message, "error"); }
  };

  const ajustar = async (id, delta) => {
    try { await estoqueApi.ajuste(id, delta); load(); }
    catch (e) { toast(e.message, "error"); }
  };

  const del = async (id) => {
    if (!confirm("Excluir?")) return;
    try { await estoqueApi.delete(id); toast("Removido.", "info"); load(); }
    catch (e) { toast(e.message, "error"); }
  };

  return (
    <div>
      {critico.length > 0 && (
        <div style={{ background: "rgba(231,76,60,.1)", border: "1px solid var(--danger)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>⚠</span>
          <span style={{ fontSize: 13, color: "var(--danger)", fontWeight: 600 }}>{critico.length} ite{critico.length > 1 ? "ns" : "m"} com estoque crítico: {critico.map(e => e.nome).join(", ")}</span>
        </div>
      )}
      <div className="search-bar">
        <input placeholder="🔍 Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && load()} />
        <button className="btn btn-secondary" onClick={load}>Buscar</button>
        {canEdit && <button className="btn btn-primary" onClick={() => open()}>+ Novo Item</button>}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {cats.map(c => <button key={c} className={`btn btn-${tab === c ? "primary" : "secondary"} btn-sm`} onClick={() => setTab(c)}>{c}</button>)}
      </div>
      <div className="card" style={{ padding: 0 }}>
        {loading ? <Loading /> : (
          <table>
            <thead><tr><th>Produto</th><th>Categoria</th><th>Estoque</th><th>Mínimo</th><th>Custo</th><th>Venda</th><th>Fornecedor</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={8}><div className="empty-state"><div className="icon">📦</div><p>Nenhum item</p></div></td></tr>
                : filtered.map(e => (
                  <tr key={e.id}>
                    <td><div className="fw700">{e.nome}</div>{e.quantidade <= e.qtd_minima && <span className="badge badge-red" style={{ fontSize: 10 }}>CRÍTICO</span>}</td>
                    <td><span className="badge badge-gray">{e.categoria}</span></td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {canEdit && <button className="btn-icon" style={{ padding: "2px 6px" }} onClick={() => ajustar(e.id, -1)}>−</button>}
                        <span className="text-mono fw700" style={{ color: e.quantidade <= e.qtd_minima ? "var(--danger)" : "var(--text)" }}>{e.quantidade}</span>
                        <span className="text-muted text-sm">{e.unidade}</span>
                        {canEdit && <button className="btn-icon" style={{ padding: "2px 6px" }} onClick={() => ajustar(e.id, 1)}>+</button>}
                      </div>
                    </td>
                    <td className="text-muted">{e.qtd_minima} {e.unidade}</td>
                    <td>{user.perfil === "admin" ? <span className="text-mono text-sm">{fmtBRL(e.custo)}</span> : <span className="text-muted">—</span>}</td>
                    <td><span className="text-mono text-sm text-green">{fmtBRL(e.venda)}</span></td>
                    <td className="text-muted text-sm">{e.fornecedor}</td>
                    <td style={{ display: "flex", gap: 4 }}>
                      {canEdit && <button className="btn-icon" onClick={() => open(e)}>✏</button>}
                      {user.perfil === "admin" && <button className="btn-icon" onClick={() => del(e.id)}>🗑</button>}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
      {modal === "form" && (
        <Modal title={form.id ? "Editar Item" : "Novo Item de Estoque"} onClose={() => setModal(null)}
          footer={<><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button><button className="btn btn-primary" onClick={save}>Salvar</button></>}>
          <div className="grid2">
            <div className="form-group" style={{ gridColumn: "1/-1" }}><label>Nome *</label><input value={form.nome || ""} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} /></div>
            <div className="form-group"><label>Categoria</label><input value={form.categoria || ""} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))} list="cat-list" /><datalist id="cat-list"><option value="Lubrificantes"/><option value="Filtros"/><option value="Freios"/><option value="Ignição"/><option value="Fluidos"/><option value="Pintura"/><option value="Motor"/></datalist></div>
            <div className="form-group"><label>Unidade</label><select value={form.unidade || "pç"} onChange={e => setForm(p => ({ ...p, unidade: e.target.value }))}><option value="pç">pç</option><option value="jg">jg</option><option value="litro">litro</option><option value="frasco">frasco</option><option value="kg">kg</option><option value="m">metro</option></select></div>
            <div className="form-group"><label>Qtd Atual</label><input type="number" min="0" value={form.quantidade || 0} onChange={e => setForm(p => ({ ...p, quantidade: Number(e.target.value) }))} /></div>
            <div className="form-group"><label>Qtd Mínima</label><input type="number" min="0" value={form.qtd_minima || 0} onChange={e => setForm(p => ({ ...p, qtd_minima: Number(e.target.value) }))} /></div>
            <div className="form-group"><label>Custo (R$)</label><input type="number" min="0" step="0.01" value={form.custo || 0} onChange={e => setForm(p => ({ ...p, custo: Number(e.target.value) }))} /></div>
            <div className="form-group"><label>Venda (R$)</label><input type="number" min="0" step="0.01" value={form.venda || 0} onChange={e => setForm(p => ({ ...p, venda: Number(e.target.value) }))} /></div>
            <div className="form-group" style={{ gridColumn: "1/-1" }}><label>Fornecedor</label><input value={form.fornecedor || ""} onChange={e => setForm(p => ({ ...p, fornecedor: e.target.value }))} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// CAIXA
// ============================================================
function Caixa({ user }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const load = useCallback(async () => {
    try { setLoading(true); setList(await caixaApi.list(filterDate)); }
    catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  }, [filterDate]);

  useEffect(() => { load(); }, [load]);

  const saldo = list.reduce((a, b) => b.tipo === "entrada" ? a + b.valor : a - b.valor, 0);
  const totalEntradas = list.filter(m => m.tipo === "entrada").reduce((a, b) => a + b.valor, 0);
  const totalSaidas = list.filter(m => m.tipo === "saida").reduce((a, b) => a + b.valor, 0);

  const save = async () => {
    if (!form.descricao?.trim() || !form.valor) return toast("Preencha todos os campos", "error");
    try {
      await caixaApi.create({ ...form, valor: Number(form.valor) });
      toast("Lançamento registrado!"); setModal(null); load();
    } catch (e) { toast(e.message, "error"); }
  };

  const del = async (id) => {
    if (!confirm("Excluir lançamento?")) return;
    try { await caixaApi.delete(id); toast("Removido.", "info"); load(); }
    catch (e) { toast(e.message, "error"); }
  };

  return (
    <div>
      <div className="grid3" style={{ marginBottom: 20 }}>
        {[
          { icon: "💰", value: fmtBRL(saldo), label: "Saldo Total", color: saldo >= 0 ? "var(--accent3)" : "var(--danger)" },
          { icon: "📈", value: fmtBRL(totalEntradas), label: "Entradas", color: "var(--accent3)" },
          { icon: "📉", value: fmtBRL(totalSaidas), label: "Saídas", color: "var(--danger)" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: 22, marginTop: 8 }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="search-bar">
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ width: 180 }} />
        <button className="btn btn-secondary" onClick={() => setFilterDate("")}>Ver Todos</button>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => { setForm({ tipo: "entrada", descricao: "", valor: 0, data: today(), forma_pagamento: "dinheiro" }); setModal("form"); }}>+ Lançamento</button>
      </div>
      <div className="card" style={{ padding: 0 }}>
        {loading ? <Loading /> : (
          <table>
            <thead><tr><th>Data</th><th>Descrição</th><th>Forma</th><th>Tipo</th><th>Valor</th><th></th></tr></thead>
            <tbody>
              {list.length === 0 ? <tr><td colSpan={6}><div className="empty-state"><div className="icon">💳</div><p>Nenhum lançamento</p></div></td></tr>
                : list.map(m => (
                  <tr key={m.id}>
                    <td className="text-sm text-muted">{fmtDate(m.data)}</td>
                    <td className="fw700">{m.descricao}</td>
                    <td><span className="badge badge-gray">{m.forma_pagamento}</span></td>
                    <td><span className={`badge badge-${m.tipo === "entrada" ? "green" : "red"}`}>{m.tipo}</span></td>
                    <td><span className="text-mono fw700" style={{ color: m.tipo === "entrada" ? "var(--accent3)" : "var(--danger)" }}>{m.tipo === "entrada" ? "+" : "-"}{fmtBRL(m.valor)}</span></td>
                    <td><button className="btn-icon" onClick={() => del(m.id)}>🗑</button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
      {modal === "form" && (
        <Modal title="Novo Lançamento" onClose={() => setModal(null)} size={500}
          footer={<><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button><button className="btn btn-primary" onClick={save}>Salvar</button></>}>
          <div className="form-group">
            <label>Tipo</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["entrada","saida"].map(t => (
                <button key={t} className={`btn btn-${form.tipo === t ? (t === "entrada" ? "success" : "danger") : "secondary"} w100`} style={{ flex: 1, justifyContent: "center" }} onClick={() => setForm(p => ({ ...p, tipo: t }))}>
                  {t === "entrada" ? "↑ Entrada" : "↓ Saída"}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group"><label>Descrição *</label><input value={form.descricao || ""} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Ex: Recebimento OS-001, Compra material..." /></div>
          <div className="grid2">
            <div className="form-group"><label>Valor (R$) *</label><input type="number" min="0" step="0.01" value={form.valor || 0} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} /></div>
            <div className="form-group"><label>Data</label><input type="date" value={form.data || today()} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} /></div>
          </div>
          <div className="form-group"><label>Forma de Pagamento</label>
            <select value={form.forma_pagamento || "dinheiro"} onChange={e => setForm(p => ({ ...p, forma_pagamento: e.target.value }))}>
              <option value="dinheiro">Dinheiro</option><option value="pix">PIX</option>
              <option value="cartao_credito">Cartão de Crédito</option><option value="cartao_debito">Cartão de Débito</option>
              <option value="transferencia">Transferência</option><option value="boleto">Boleto</option>
            </select>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// CONTAS
// ============================================================
function Contas({ user }) {
  const [tab, setTab] = useState("receber");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setList(tab === "receber" ? await contasApi.receber() : await contasApi.pagar());
    } catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const totalPendente = list.filter(c => c.status === "pendente").reduce((a, b) => a + b.valor, 0);
  const totalPago = list.filter(c => ["pago","recebido"].includes(c.status)).reduce((a, b) => a + b.valor, 0);

  const newForm = () => tab === "receber"
    ? { descricao: "", valor: 0, vencimento: today(), cliente_nome: "", obs: "" }
    : { descricao: "", valor: 0, vencimento: today(), fornecedor: "", obs: "" };

  const open = (c = null) => { setForm(c ? { ...c } : newForm()); setModal("form"); };

  const save = async () => {
    if (!form.descricao?.trim()) return toast("Descrição obrigatória", "error");
    try {
      if (form.id) {
        tab === "receber" ? await contasApi.editarReceber(form.id, form) : await contasApi.editarPagar(form.id, form);
      } else {
        tab === "receber" ? await contasApi.criarReceber(form) : await contasApi.criarPagar(form);
      }
      toast("Conta salva!"); setModal(null); load();
    } catch (e) { toast(e.message, "error"); }
  };

  const baixar = async (id) => {
    try {
      tab === "receber" ? await contasApi.baixarReceber(id) : await contasApi.baixarPagar(id);
      toast(tab === "receber" ? "Recebimento confirmado!" : "Pagamento confirmado!"); load();
    } catch (e) { toast(e.message, "error"); }
  };

  return (
    <div>
      <div className="tab-bar">
        <div className={`tab-item ${tab === "receber" ? "active" : ""}`} onClick={() => setTab("receber")}>📈 Contas a Receber</div>
        <div className={`tab-item ${tab === "pagar" ? "active" : ""}`} onClick={() => setTab("pagar")}>📉 Contas a Pagar</div>
      </div>
      <div className="grid2" style={{ marginBottom: 16 }}>
        <div className="stat-card"><div className="stat-value" style={{ color: "var(--accent)", fontSize: 20 }}>{fmtBRL(totalPendente)}</div><div className="stat-label">Pendente</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: "var(--accent3)", fontSize: 20 }}>{fmtBRL(totalPago)}</div><div className="stat-label">{tab === "receber" ? "Recebido" : "Pago"}</div></div>
      </div>
      <div className="search-bar"><div style={{ flex: 1 }} /><button className="btn btn-primary" onClick={() => open()}>+ Nova Conta</button></div>
      <div className="card" style={{ padding: 0 }}>
        {loading ? <Loading /> : (
          <table>
            <thead><tr><th>Descrição</th><th>{tab === "receber" ? "Cliente" : "Fornecedor"}</th><th>Valor</th><th>Vencimento</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {list.length === 0 ? <tr><td colSpan={6}><div className="empty-state"><div className="icon">💳</div><p>Nenhuma conta</p></div></td></tr>
                : list.map(c => (
                  <tr key={c.id}>
                    <td className="fw700">{c.descricao}</td>
                    <td className="text-muted">{tab === "receber" ? c.cliente_nome : c.fornecedor}</td>
                    <td><span className="text-mono fw700" style={{ color: tab === "receber" ? "var(--accent3)" : "var(--danger)" }}>{fmtBRL(c.valor)}</span></td>
                    <td className="text-sm text-muted">{fmtDate(c.vencimento)}</td>
                    <td><StatusBadge s={c.status} type="conta" /></td>
                    <td style={{ display: "flex", gap: 4 }}>
                      <button className="btn-icon" onClick={() => open(c)}>✏</button>
                      {c.status === "pendente" && <button className="btn btn-success btn-sm" onClick={() => baixar(c.id)}>✓ Baixar</button>}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
      {modal === "form" && (
        <Modal title={form.id ? "Editar Conta" : `Nova Conta a ${tab === "receber" ? "Receber" : "Pagar"}`} onClose={() => setModal(null)} size={500}
          footer={<><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button><button className="btn btn-primary" onClick={save}>Salvar</button></>}>
          <div className="form-group"><label>Descrição *</label><input value={form.descricao || ""} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} /></div>
          <div className="grid2">
            <div className="form-group"><label>Valor (R$)</label><input type="number" min="0" step="0.01" value={form.valor || 0} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} /></div>
            <div className="form-group"><label>Vencimento</label><input type="date" value={form.vencimento || today()} onChange={e => setForm(p => ({ ...p, vencimento: e.target.value }))} /></div>
          </div>
          <div className="form-group"><label>{tab === "receber" ? "Cliente" : "Fornecedor"}</label><input value={tab === "receber" ? (form.cliente_nome || "") : (form.fornecedor || "")} onChange={e => setForm(p => tab === "receber" ? { ...p, cliente_nome: e.target.value } : { ...p, fornecedor: e.target.value })} /></div>
          <div className="form-group"><label>Observações</label><textarea value={form.obs || ""} onChange={e => setForm(p => ({ ...p, obs: e.target.value }))} /></div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// USUÁRIOS
// ============================================================
function Usuarios({ user }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const roleLabel = { admin: "Administrador", tecnico: "Técnico", recepcionista: "Recepcionista" };
  const roleDesc = { admin: "Acesso total ao sistema", tecnico: "Ver OS e agendamentos, sem valores financeiros", recepcionista: "Clientes, OS, agendamentos, estoque — sem financeiro" };

  const load = async () => {
    try { setLoading(true); setList(await usuariosApi.list()); }
    catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const open = (u = null) => {
    setForm(u ? { ...u, senha: "" } : { nome: "", email: "", senha: "", perfil: "tecnico" });
    setModal("form");
  };

  const save = async () => {
    if (!form.nome?.trim() || !form.email?.trim()) return toast("Preencha todos os campos", "error");
    if (!form.id && !form.senha) return toast("Senha obrigatória", "error");
    try {
      if (form.id) await usuariosApi.update(form.id, form);
      else await usuariosApi.create(form);
      toast(form.id ? "Usuário atualizado!" : "Usuário criado!"); setModal(null); load();
    } catch (e) { toast(e.message, "error"); }
  };

  const toggle = async (id) => {
    if (id === user.id) return toast("Você não pode desativar sua própria conta", "error");
    try { await usuariosApi.toggle(id); load(); }
    catch (e) { toast(e.message, "error"); }
  };

  return (
    <div>
      <div className="grid3" style={{ marginBottom: 20 }}>
        {Object.entries(roleLabel).map(([role, label]) => (
          <div key={role} className="card" style={{ padding: 14 }}>
            <div className="fw700">{label}</div>
            <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 4 }}>{roleDesc[role]}</div>
            <div style={{ marginTop: 8, fontFamily: "var(--mono)", fontSize: 18, color: "var(--accent)" }}>{list.filter(u => u.perfil === role && u.ativo).length}</div>
          </div>
        ))}
      </div>
      <div className="search-bar"><div style={{ flex: 1 }} /><button className="btn btn-primary" onClick={() => open()}>+ Novo Usuário</button></div>
      <div className="card" style={{ padding: 0 }}>
        {loading ? <Loading /> : (
          <table>
            <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Permissões</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {list.map(u => (
                <tr key={u.id}>
                  <td className="fw700">{u.nome}{u.id === user.id && <span className="badge badge-blue" style={{ fontSize: 10, marginLeft: 6 }}>você</span>}</td>
                  <td className="text-muted text-sm">{u.email}</td>
                  <td><span className={`badge badge-${u.perfil === "admin" ? "yellow" : u.perfil === "tecnico" ? "blue" : "green"}`}>{roleLabel[u.perfil]}</span></td>
                  <td className="text-sm text-muted">{roleDesc[u.perfil]}</td>
                  <td><span className={`badge badge-${u.ativo ? "green" : "gray"}`}>{u.ativo ? "Ativo" : "Inativo"}</span></td>
                  <td style={{ display: "flex", gap: 4 }}>
                    <button className="btn-icon" onClick={() => open(u)}>✏</button>
                    <button className="btn-icon" onClick={() => toggle(u.id)}>{u.ativo ? "🚫" : "✅"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {modal === "form" && (
        <Modal title={form.id ? "Editar Usuário" : "Novo Usuário"} onClose={() => setModal(null)} size={500}
          footer={<><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button><button className="btn btn-primary" onClick={save}>Salvar</button></>}>
          <div className="form-group"><label>Nome *</label><input value={form.nome || ""} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} /></div>
          <div className="form-group"><label>E-mail *</label><input type="email" value={form.email || ""} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
          <div className="form-group"><label>{form.id ? "Nova Senha (deixe em branco para manter)" : "Senha *"}</label><input type="password" value={form.senha || ""} onChange={e => setForm(p => ({ ...p, senha: e.target.value }))} /></div>
          <div className="form-group"><label>Perfil de Acesso</label>
            <select value={form.perfil || "tecnico"} onChange={e => setForm(p => ({ ...p, perfil: e.target.value }))}>
              <option value="admin">Administrador — Acesso total</option>
              <option value="tecnico">Técnico — OS e agendamentos, sem valores</option>
              <option value="recepcionista">Recepcionista — OS, clientes, estoque</option>
            </select>
          </div>
          <div style={{ padding: 12, background: "var(--surface2)", borderRadius: "var(--r2)", fontSize: 12, color: "var(--text2)", marginTop: 8 }}>
            ℹ {roleDesc[form.perfil || "tecnico"]}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// APP ROOT
// ============================================================
const PAGE_TITLES = {
  dashboard: "Dashboard", clientes: "Clientes", orcamentos: "Orçamentos",
  ordens: "Ordens de Serviço", agendamentos: "Agendamentos", estoque: "Estoque",
  caixa: "Controle de Caixa", contas: "Contas a Pagar / Receber", usuarios: "Usuários e Acessos"
};

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [checking, setChecking] = useState(true);

  // Verificar token salvo
  useEffect(() => {
    const token = localStorage.getItem("sbcustoms_token");
    if (!token) { setChecking(false); return; }
    authApi.me()
      .then(u => { setUser(u); setChecking(false); })
      .catch(() => { localStorage.removeItem("sbcustoms_token"); setChecking(false); });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("sbcustoms_token");
    setUser(null);
    setPage("dashboard");
  };

  if (checking) return <><GlobalStyles /><div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}><Loading /></div></>;

  if (!user) return <><GlobalStyles /><ToastContainer /><Login onLogin={u => { setUser(u); toast(`Bem-vindo, ${u.nome}!`); }} /></>;

  const renderPage = () => {
    const props = { user };
    switch (page) {
      case "dashboard":    return <Dashboard {...props} />;
      case "clientes":     return <Clientes {...props} />;
      case "orcamentos":   return <Orcamentos {...props} />;
      case "ordens":       return <Ordens {...props} />;
      case "agendamentos": return <Agendamentos {...props} />;
      case "estoque":      return <Estoque {...props} />;
      case "caixa":        return <Caixa {...props} />;
      case "contas":       return <Contas {...props} />;
      case "usuarios":     return <Usuarios {...props} />;
      default: return null;
    }
  };

  return (
    <>
      <GlobalStyles />
      <ToastContainer />
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar active={page} onNav={setPage} user={user} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <Topbar title={PAGE_TITLES[page]} onLogout={handleLogout} />
          <main style={{ flex: 1, padding: 24, overflowY: "auto" }}>
            {renderPage()}
          </main>
        </div>
      </div>
    </>
  );
}