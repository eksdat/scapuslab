/* Plataforma de orçamentos de impressão 3D: interface. Sem dependências externas. */
(function () {
  'use strict';

  const D = window.DADOS;
  const C = window.Calc;
  const KEY = 'orcamento3d:v1';

  const STATUS = { rascunho: 'Rascunho', enviado: 'Enviado', aprovado: 'Aprovado', producao: 'Em produção', entregue: 'Entregue', recusado: 'Recusado' };
  const ARRED = { 0: 'Não arredondar', 0.5: 'R$ 0,50', 1: 'R$ 1,00', 5: 'R$ 5,00' };
  const COMPAT_TXT = { ideal: 'ideal', possivel: 'possível com cuidados', nao: 'não recomendado' };
  const FAM_CURTO = { PLA: 'PLA', PETG: 'PETG', TPU: 'TPU', PVA: 'PVA', ABS: 'ABS', ASA: 'ASA', PC: 'policarbonato', PA: 'nylon', CF: 'filamentos com fibra' };

  /* ---------- utilidades ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const brl = (n) => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const num = (n, d = 2) => (Number(n) || 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmtNum = (n) => (Number(n) || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  const fmtIn = (v) => (v === '' || v == null ? '' : typeof v === 'number' ? v.toLocaleString('pt-BR', { maximumFractionDigits: 3, useGrouping: false }) : String(v));
  const pct = (x) => Math.round((x || 0) * 100) + '%';
  const uid = () => Math.random().toString(36).slice(2, 10);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const pad = (n) => String(n).padStart(2, '0');
  const isoLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const hojeISO = () => isoLocal(new Date());
  const hhmm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const addDias = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + (Number(n) || 0)); return isoLocal(d); };
  const dataOk = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v);
  const fmtData = (iso) => { if (!dataOk(iso)) return ''; const [y, m, d] = iso.slice(0, 10).split('-'); return `${d}/${m}/${y}`; };
  /* Só aceita imagem embutida (data:image/...). Qualquer outra coisa vira "sem logo". */
  const logoSeguro = (v) => (typeof v === 'string' && /^data:image\/(png|jpe?g|gif|webp|svg\+xml)(;[a-z0-9=;-]*)?(;base64)?,[a-z0-9+/=%._~!$&'()*,;:@-]*$/i.test(v) ? v : '');
  const imgLogo = (v, alt) => { const src = logoSeguro(v); return src ? `<img src="${esc(src)}" alt="${esc(alt || '')}">` : ''; };
  const mesa = (imp) => ((imp && Array.isArray(imp.volume) ? imp.volume : []).slice(0, 3).map((x) => fmtNum(C.n0(x))).join(' × '));
  /* Lê JSON descartando chaves que poderiam alterar protótipos de objetos. */
  const lerJSON = (txt) => JSON.parse(txt, (k, v) => (k === '__proto__' || k === 'constructor' || k === 'prototype' ? undefined : v));
  const corValida = (c) => (/^#[0-9a-f]{6}$/i.test(c || '') ? c : '');
  const COR_FERRAMENTA = '#FF6A00', COR_DOC_NEUTRA = '#3A342E';
  const corUI = (c) => corValida(c) || COR_FERRAMENTA;
  const corDoc = (c) => corValida(c) || COR_DOC_NEUTRA;
  /* Texto legível sobre a cor da marca: escuro em cores claras, branco em cores escuras. */
  function textoSobre(hex) {
    const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
    const L = 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
    return (L + 0.05) / 0.05 >= 1.05 / (L + 0.05) ? '#1D1A16' : '#FFFFFF';
  }
  const slug = (t) => String(t || 'empresa').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'empresa';
  const iniciais = (n) => (String(n || '').trim().split(/\s+/).map((w) => w[0] || '').join('').slice(0, 2) || '3D').toUpperCase();
  const acha = (lista, id) => (lista || []).find((x) => x.id === id) || null;
  const apelido = (imp) => (imp ? imp.apelido || `${imp.marca} ${imp.modelo}` : 'impressora');
  const cidadeCurta = () => (String(S.empresa.cidade || '').split(/[–,-]/)[0].trim() || 'sua cidade');
  const preenchido = (v) => String(v == null ? '' : v).trim() !== '';
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const reduzMovimento = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fmtHoras(h) {
    const t = Math.round((h || 0) * 60);
    if (t < 60) return `${t} min`;
    const hh = Math.floor(t / 60), mm = t % 60;
    return mm ? `${hh}h${pad(mm)}` : `${hh}h`;
  }
  function listaPT(arr) {
    const a = arr.filter(Boolean);
    if (a.length < 2) return a.join('');
    return a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1];
  }

  let toastT = 0;
  function toast(msg, acao) {
    const t = $('#toast');
    t.innerHTML = `<span>${esc(msg)}</span>${acao ? `<button type="button" class="toast-btn">${esc(acao.label)}</button>` : ''}`;
    t.classList.toggle('has-btn', !!acao);
    if (acao) t.querySelector('button').addEventListener('click', () => { t.classList.remove('show'); acao.fn(); });
    t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('show'), acao ? 8000 : 3600);
  }

  /* ---------- estado ---------- */
  function migrar(s) {
    const base = D.estadoInicial();
    if (!lista(s.equipe).length) s.equipe = base.equipe;
    s.ui = Object.assign({}, base.ui, s.ui || {});
    if ((Number(s.versao) || 1) < 2) {
      const e = s.empresa = obj(s.empresa);
      if (!e.logo) e.logo = base.empresa.logo;
      if (e.cor === '#B07A2A') e.cor = base.empresa.cor;
      if (e.slogan === 'Impressão 3D sob medida em Belo Horizonte') e.slogan = base.empresa.slogan;
      if (!e.instagram) e.instagram = base.empresa.instagram;
      if (!e.site) e.site = base.empresa.site;
      s.versao = 2;
    }
    if ((Number(s.versao) || 1) < 3) {
      // Até a versão 2 a plataforma vinha com o nome, o logo e os contatos da Scapus Lab.
      // A partir da 3, cada empresa se cadastra: o que ainda for o padrão antigo é apagado.
      const e = s.empresa = obj(s.empresa);
      const ANTIGO = { nome: 'Scapus Lab', slogan: 'Modelagem 3D, protótipos e peças sob encomenda', instagram: '@scapus.br', site: 'scapus.com.br', cidade: 'Belo Horizonte – MG', prefixo: 'SCP', cor: '#FF6A00' };
      Object.keys(ANTIGO).forEach((k) => { if (e[k] === ANTIGO[k]) e[k] = base.empresa[k]; });
      let logo = String(e.logo || '');
      try { logo = decodeURIComponent(logo); } catch (x) { /* mantém */ }
      if (logo.indexOf('M117 36.5H70C53') >= 0) e.logo = '';
      s.ui.empresaCadastrada = false;
      s.versao = 3;
    }
    const migrarOrc = (o) => {
      if (!o || typeof o !== 'object') return;
      if (!Array.isArray(o.servicos)) o.servicos = [];
      (o.itens || []).forEach((it) => {
        const h = C.n0(it.modelagemH);
        if (h > 0) { o.servicos.push({ id: uid(), descricao: 'Modelagem 3D' + (it.descricao ? ': ' + it.descricao : ''), horas: fmtIn(h) }); it.modelagemH = 0; }
      });
      if (!o.responsavelId) o.responsavelId = (s.equipe[0] || {}).id;
    };
    migrarOrc(s.atual);
    (s.orcamentos || []).forEach(migrarOrc);
    return s;
  }

  /* Confere tipos e formatos de tudo que vem do navegador ou de um backup, para que um arquivo
     adulterado não consiga injetar HTML nem quebrar a página. O texto é escapado na hora de exibir. */
  const idOk = (v) => typeof v === 'string' && /^[A-Za-z0-9_-]{1,48}$/.test(v);
  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  const lista = (v) => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object' && !Array.isArray(x)) : []);
  const txt = (v) => (v == null ? '' : typeof v === 'string' ? v : typeof v === 'number' || typeof v === 'boolean' ? String(v) : '');
  const nOuVazio = (v) => (v === '' || v == null ? '' : C.n0(v));
  function sanearOrc(o) {
    o.id = idOk(o.id) ? o.id : uid();
    o.numero = typeof o.numero === 'string' ? o.numero.slice(0, 40) : null;
    o.status = Object.prototype.hasOwnProperty.call(STATUS, o.status) ? o.status : 'rascunho';
    ['criadoEm', 'emitidoEm'].forEach((k) => { if (o[k] != null && !dataOk(o[k])) delete o[k]; });
    if (o.totalCache != null) o.totalCache = C.n0(o.totalCache);
    o.cliente = obj(o.cliente);
    ['nome', 'contato', 'cidade'].forEach((k) => { o.cliente[k] = txt(o.cliente[k]); });
    o.itens = lista(o.itens);
    o.itens.forEach((it) => {
      it.id = idOk(it.id) ? it.id : uid();
      ['descricao', 'cor', 'tempo', 'materialId', 'impressoraId'].forEach((k) => { it[k] = txt(it[k]); });
      ['qtd', 'gramas', 'acabamentoMin', 'extras', 'modelagemH'].forEach((k) => { it[k] = nOuVazio(it[k]); });
      it.dims = (Array.isArray(it.dims) ? it.dims : []).slice(0, 3).map(nOuVazio);
      while (it.dims.length < 3) it.dims.push('');
    });
    o.servicos = lista(o.servicos);
    o.servicos.forEach((sv) => { sv.id = idOk(sv.id) ? sv.id : uid(); sv.descricao = txt(sv.descricao); sv.horas = txt(sv.horas); });
    ['entrega', 'pagamento', 'prazo', 'observacoes', 'responsavelId'].forEach((k) => { o[k] = txt(o[k]); });
    ['frete', 'descontoPct'].forEach((k) => { o[k] = nOuVazio(o[k]); });
    o.travado = !!o.travado;
    if (o.snap) { o.snap = obj(o.snap); o.snap.params = obj(o.snap.params); o.snap.materiais = lista(o.snap.materiais).map(sanearMat); o.snap.impressoras = lista(o.snap.impressoras).map(sanearImp); }
    return o;
  }
  function sanearMat(m) {
    m.id = idOk(m.id) ? m.id : 'mat-' + uid();
    m.nome = txt(m.nome); m.familia = Object.prototype.hasOwnProperty.call(D.FAMILIAS, m.familia) ? m.familia : 'PLA';
    m.precoKg = C.n0(m.precoKg); m.ativo = !!m.ativo;
    return m;
  }
  function sanearImp(i) {
    i.id = idOk(i.id) ? i.id : 'imp-' + uid();
    ['apelido', 'marca', 'modelo', 'estrutura', 'obs', 'potenciaFonte'].forEach((k) => { i[k] = txt(i[k]); });
    i.catalogoId = idOk(i.catalogoId) ? i.catalogoId : null;
    i.volume = (Array.isArray(i.volume) ? i.volume : [256, 256, 256]).slice(0, 3).map((x) => C.n0(x));
    while (i.volume.length < 3) i.volume.push(0);
    const fam = (a) => (Array.isArray(a) ? a.filter((f) => Object.prototype.hasOwnProperty.call(D.FAMILIAS, f)) : []);
    i.ideais = fam(i.ideais); i.possiveis = fam(i.possiveis);
    ['potencia', 'vidaUtilH', 'manutencaoH'].forEach((k) => { i[k] = C.n0(i[k]); });
    i.precoPago = nOuVazio(i.precoPago);
    return i;
  }
  function sanear(s) {
    const e = s.empresa;
    Object.keys(e).forEach((k) => { if (typeof e[k] !== 'boolean' && typeof e[k] !== 'number') e[k] = txt(e[k]); });
    e.logo = logoSeguro(e.logo);
    e.cor = corValida(e.cor);
    Object.keys(s.params).forEach((k) => { s.params[k] = C.n0(s.params[k]); });
    s.materiais = lista(s.materiais).map(sanearMat);
    s.impressoras = lista(s.impressoras).map(sanearImp);
    s.exemplos = lista(s.exemplos).map((x) => ({ id: idOk(x.id) ? x.id : 'ex-' + uid(), nome: txt(x.nome), gramas: nOuVazio(x.gramas), tempo: txt(x.tempo) }));
    s.equipe = lista(s.equipe).map((m) => ({ id: idOk(m.id) ? m.id : 'eq-' + uid(), nome: txt(m.nome), cargo: txt(m.cargo), whatsapp: txt(m.whatsapp), email: txt(m.email) }));
    if (!s.equipe.length) s.equipe = D.estadoInicial().equipe;
    s.orcamentos = lista(s.orcamentos).map(sanearOrc);
    s.atual = s.atual && typeof s.atual === 'object' ? sanearOrc(s.atual) : null;
    s.ui = obj(s.ui);
    if (s.ui.ultimoBackup && !dataOk(s.ui.ultimoBackup)) s.ui.ultimoBackup = '';
    s.ui.ultimoResponsavel = idOk(s.ui.ultimoResponsavel) ? s.ui.ultimoResponsavel : s.equipe[0].id;
    s.ui.empresaCadastrada = !!s.ui.empresaCadastrada && preenchido(e.nome);
    delete s.ui.setupFeito; delete s.ui.bloqueioMin;
    s.seq = Math.max(0, Math.round(C.n0(s.seq)));
    return s;
  }

  const CHAVES = ['versao', 'seq', 'empresa', 'equipe', 'ui', 'params', 'materiais', 'impressoras', 'exemplos', 'orcamentos', 'atual'];
  function mesclar(base, bruto) {
    if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) return sanear(base);
    const s = {};
    CHAVES.forEach((k) => { if (Object.prototype.hasOwnProperty.call(bruto, k)) s[k] = bruto[k]; });
    if (!s.materiais || !s.materiais.length) s.materiais = base.materiais;
    if (!s.impressoras || !s.impressoras.length) s.impressoras = base.impressoras;
    return sanear(migrar(Object.assign({}, base, s, {
      empresa: Object.assign({}, base.empresa, obj(s.empresa)),
      params: Object.assign({}, base.params, obj(s.params)),
      materiais: lista(s.materiais).length ? s.materiais : base.materiais,
      impressoras: lista(s.impressoras).length ? s.impressoras : base.impressoras,
      exemplos: Array.isArray(s.exemplos) ? s.exemplos : base.exemplos,
      orcamentos: Array.isArray(s.orcamentos) ? s.orcamentos : []
    })));
  }

  /* ---------- armazenamento ----------
     Tudo fica no localStorage deste navegador, numa única chave. Nada é enviado para servidor. */
  let migrou = false;
  let S = null;
  function lerBruto() {
    try { return lerJSON(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
  }
  function iniciarEstado() {
    let b = lerBruto();
    if (b && typeof b === 'object' && b.cifrado) b = null; // dados de uma versão de teste com senha, que não existe mais
    if (b && Number(b.versao) !== 3) migrou = true;
    S = mesclar(D.estadoInicial(), b);
  }
  const LIMITE = 2500000; // menor limite comum do localStorage: Safari/iPhone guarda ~5 MB em UTF-16 (~2,5 milhões de caracteres)
  function usoArmazenamento() {
    let n = 0;
    try { n = (localStorage.getItem(KEY) || '').length; } catch (e) { n = 0; }
    return Math.min(1, n / LIMITE);
  }
  function pedirPersistencia() {
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) { /* sem suporte */ }
  }
  const U = { busca: '', marca: '', tabMat: '', tabImp: '', histFiltro: 'todos', histBusca: '', abertos: {} };
  let timer = 0, pendente = false, avisouStorage = false, ultimoSalvo = null;

  const ctx = () => ({ params: S.params, materiais: S.materiais, impressoras: S.impressoras });
  const ctxDe = (o) => (o && o.travado && o.snap ? o.snap : ctx());
  const calcAtual = () => C.calcOrcamento(S.atual, ctxDe(S.atual));
  const responsavel = (o) => acha(S.equipe, o && o.responsavelId) || S.equipe[0];

  const temConteudo = (o) => !!o && (preenchido(o.cliente && o.cliente.nome) ||
    (o.itens || []).some((it) => C.n0(it.gramas) > 0 || preenchido(it.tempo) || preenchido(it.descricao)) ||
    (o.servicos || []).some((s) => preenchido(s.horas) || preenchido(s.descricao)));

  /* Salvamento automático: cada mudança vai para o navegador e, se o orçamento tem conteúdo, para o histórico. */
  function salvar() { pendente = true; clearTimeout(timer); timer = setTimeout(salvarJa, 400); }
  function salvarJa() {
    clearTimeout(timer); pendente = false;
    if (!S) return;
    if (S.atual && temConteudo(S.atual)) registrar();
    gravar(JSON.stringify(S));
    ultimoSalvo = new Date();
    indicarSalvo();
  }
  function gravar(json) {
    try { localStorage.setItem(KEY, json); avisouStorage = false; }
    catch (e) {
      if (!avisouStorage) { avisouStorage = true; toast('Este navegador não deixou salvar (espaço cheio ou modo privado). Exporte um backup e exclua orçamentos antigos.'); }
    }
  }
  function indicarSalvo() {
    if (!S) return;
    const n = $('#numero'); if (n && S.atual) n.textContent = S.atual.numero || '';
    const el = $('#salvo');
    if (el) el.textContent = S.atual && S.atual.numero && ultimoSalvo ? `Salvo no histórico às ${hhmm(ultimoSalvo)}` : '';
  }

  function registrar() {
    const o = S.atual;
    if (!o.numero) {
      S.seq = (Number(S.seq) || 0) + 1;
      const pre = String(S.empresa.prefixo || 'ORC').toUpperCase().replace(/[^A-Z0-9]/g, '') || 'ORC';
      o.numero = `${pre}-${new Date().getFullYear()}-${String(S.seq).padStart(4, '0')}`;
    }
    if (!o.emitidoEm) o.emitidoEm = hojeISO();
    o.atualizadoEm = new Date().toISOString();
    o.totalCache = calcAtual().total;
    const copia = clone(o);
    if (!o.travado) copia.snap = snapDe(o);
    const i = S.orcamentos.findIndex((x) => x.id === o.id);
    if (i >= 0) S.orcamentos[i] = copia; else S.orcamentos.unshift(copia);
  }

  function snapDe(o) {
    const mats = new Set((o.itens || []).map((it) => it.materialId)), imps = new Set((o.itens || []).map((it) => it.impressoraId));
    return { params: clone(S.params), materiais: clone(S.materiais.filter((m) => mats.has(m.id))), impressoras: clone(S.impressoras.filter((i) => imps.has(i.id))) };
  }

  /* Ação destrutiva com "Desfazer" no aviso, em vez de caixa de confirmação. */
  function comDesfazer(msg, acao) {
    const antes = JSON.stringify(S);
    acao();
    salvarJa(); render();
    toast(msg, { label: 'Desfazer', fn: () => { S = JSON.parse(antes); salvarJa(); render(); toast('Desfeito.'); } });
  }

  function textoPrazo() {
    const a = Number(S.empresa.prazoMin) || 0, b = Number(S.empresa.prazoMax) || 0;
    if (!a && !b) return 'A combinar';
    if (!b || a === b || !a) return `${a || b} dias úteis após a aprovação`;
    return `${a} a ${b} dias úteis após a aprovação`;
  }

  function novoItem(base) {
    const mat = S.materiais.find((m) => m.ativo) || S.materiais[0] || {};
    return { id: uid(), descricao: '', cor: '', qtd: 1, gramas: '', tempo: '', materialId: base ? base.materialId : mat.id, impressoraId: base ? base.impressoraId : (S.impressoras[0] || {}).id, acabamentoMin: '', extras: '', dims: ['', '', ''] };
  }
  const novoServico = () => ({ id: uid(), descricao: '', horas: '' });

  function novoOrcamento() {
    const e = S.empresa;
    const resp = acha(S.equipe, S.ui.ultimoResponsavel) || S.equipe[0];
    return {
      id: uid(), numero: null, criadoEm: hojeISO(), status: 'rascunho', responsavelId: resp.id,
      cliente: { nome: '', contato: '', cidade: '' },
      itens: [novoItem()], servicos: [],
      entrega: e.retiradaAtivo ? 'retirada' : e.correiosAtivo ? 'correios' : 'combinar',
      frete: '', pagamento: 'pix', descontoPct: '', prazo: textoPrazo(), observacoes: e.observacoes || ''
    };
  }

  function garantirAtual() {
    if (!S.atual) S.atual = novoOrcamento();
    const o = S.atual;
    if (!Array.isArray(o.servicos)) o.servicos = [];
    if (o.travado) return;
    const matPadrao = (S.materiais.find((m) => m.ativo) || S.materiais[0] || {}).id;
    o.itens.forEach((it) => {
      if (!acha(S.materiais, it.materialId)) it.materialId = matPadrao;
      if (!acha(S.impressoras, it.impressoraId)) it.impressoraId = (S.impressoras[0] || {}).id;
      if (!Array.isArray(it.dims)) it.dims = ['', '', ''];
    });
    if (!o.itens.length) o.itens.push(novoItem());
    if (!acha(S.equipe, o.responsavelId)) o.responsavelId = S.equipe[0].id;
  }

  /* ---------- textos de política ---------- */
  function entregaLabel(k) {
    const e = S.empresa;
    if (k === 'retirada') return e.retiradaLocal ? `Retirada: ${e.retiradaLocal}` : `Retirada em ${cidadeCurta()}`;
    if (k === 'correios') return 'Correios (PAC ou SEDEX)';
    if (k === 'app') return `Entrega por aplicativo em ${cidadeCurta()}`;
    return 'A combinar';
  }
  function freteLabel(k) { return k === 'correios' ? 'Frete pelos Correios' : k === 'app' ? 'Entrega por aplicativo' : 'Frete'; }
  function textoAjustes() {
    const n = Math.max(0, Math.round(C.n0(S.empresa.ajustesInclusos)));
    if (!n) return 'ajustes no modelo são cobrados à parte';
    return n === 1 ? '1 rodada de ajuste no modelo inclusa' : `${n} rodadas de ajuste no modelo inclusas`;
  }
  function textoPagamento(o) {
    const e = S.empresa;
    if (o && o.pagamento === 'cartao') return `Cartão, com acréscimo de ${fmtNum(S.params.taxaCartaoPct)}% já somado ao total.`;
    let t = e.pagamentoTexto || 'Pix.';
    if (e.pix) t += ` Chave Pix: ${e.pix}.`;
    return t;
  }
  const volume = (i) => (i.volume || []).reduce((a, x) => a * (C.n0(x) || 1), 1);
  const fmtTamanho = (v) => v.map((x) => num(x / 10, 1)).join(' × ') + ' cm';

  function politicaItens() {
    const e = S.empresa, p = S.params;
    const ativos = S.materiais.filter((m) => m.ativo);
    const atende = ativos.filter((m) => S.impressoras.some((i) => C.compat(i, m.familia) === 'ideal'));
    const cuidado = ativos.filter((m) => atende.indexOf(m) < 0 && S.impressoras.some((i) => C.compat(i, m.familia) === 'possivel'));
    const naoFam = Object.keys(D.FAMILIAS).filter((f) => f !== 'PVA' && !S.impressoras.some((i) => C.compat(i, f) !== 'nao'));
    const maior = S.impressoras.slice().sort((a, b) => volume(b) - volume(a))[0];
    const entregas = [];
    if (e.retiradaAtivo) entregas.push(e.retiradaLocal ? `retirada sem custo (${e.retiradaLocal})` : `retirada sem custo em ${cidadeCurta()}, em ponto combinado`);
    if (e.correiosAtivo) entregas.push('Correios (PAC ou SEDEX) para todo o Brasil, frete pelo CEP');
    if (e.appAtivo) entregas.push(`entrega por aplicativo em ${cidadeCurta()}, pelo valor da corrida`);
    const L = [];
    L.push(['Materiais', atende.length ? listaPT(atende.map((m) => m.nome)) + '.' : 'Ative ao menos um material compatível.']);
    if (cuidado.length) L.push(['Sob consulta', listaPT(cuidado.map((m) => m.nome)) + '.']);
    if (naoFam.length) L.push(['Não trabalhamos com', cap(listaPT(naoFam.map((f) => FAM_CURTO[f]))) + '.']);
    if (maior) L.push(['Tamanho máximo', `${fmtTamanho(maior.volume.map(C.n0))} por peça. Peças maiores podem ser impressas em partes e coladas.`]);
    L.push(['Modelagem 3D', `${brl(p.horaModelagem)} por hora trabalhada, a partir de foto, desenho ou medidas.`]);
    L.push(['Prazo padrão', textoPrazo() + '.']);
    L.push(['Ajustes', cap(textoAjustes()) + '.']);
    if (e.pecaPiloto) L.push(['Aprove a primeira peça', e.pecaPilotoTexto]);
    L.push(['Pagamento', textoPagamento()]);
    if (entregas.length) L.push(['Entrega', cap(entregas.join('; ')) + '.']);
    if (C.n0(p.pedidoMinimo)) L.push(['Pedido mínimo', `${brl(p.pedidoMinimo)} em peças impressas, sem contar o frete.`]);
    return L;
  }

  function contatos() {
    const e = S.empresa, c = [];
    if (e.whatsapp) c.push(`WhatsApp ${e.whatsapp}`);
    if (e.instagram) c.push(`Instagram ${e.instagram}`);
    if (e.email) c.push(e.email);
    if (e.site) c.push(e.site);
    return c;
  }

  /* ---------- pedaços de formulário ---------- */
  function campo(label, controle, dica, cls) {
    return `<label class="field ${cls || ''}"><span class="field-label">${label}</span>${controle}${dica ? `<small>${dica}</small>` : ''}</label>`;
  }
  function inp(bind, val, ph, extra) {
    return `<input data-bind="${bind}" value="${esc(val)}"${ph ? ` placeholder="${esc(ph)}"` : ''} autocomplete="off" ${extra || ''}>`;
  }
  /* Campos numéricos aceitam vírgula: "1,5", "3.400". */
  function numInp(attr, val, o) {
    o = o || {};
    return `<input type="text" inputmode="${o.int ? 'numeric' : 'decimal'}" data-tipo="num" ${attr} value="${esc(fmtIn(val))}" autocomplete="off"${o.ph ? ` placeholder="${esc(o.ph)}"` : ''} ${o.extra || ''}>`;
  }
  function opcoes(mapa, atual) {
    return Object.keys(mapa).map((k) => `<option value="${esc(k)}"${String(k) === String(atual) ? ' selected' : ''}>${esc(mapa[k])}</option>`).join('');
  }
  const nota = (nivel, texto) => `<p class="note ${nivel}">${texto}</p>`;

  function ecoTempo(raw, vazio) {
    if (!preenchido(raw)) return { cls: '', txt: vazio, invalido: false };
    const h = C.parseTempo(raw);
    if (!h) return { cls: 'erro', txt: 'Não entendi. Escreva como 2h35m, 2:35 ou 1,5.', invalido: true };
    return { cls: 'ok', txt: `Entendido: ${fmtHoras(h)}`, invalido: false };
  }
  const ECO_TEMPO = 'Como no fatiador, ex.: 2h35m';
  const ECO_HORAS = 'ex.: 2 ou 1h30m';

  /* ================= ORÇAMENTO ================= */
  function viewOrcamento() {
    garantirAtual();
    const o = S.atual, trav = !!o.travado;
    return `<div class="page">
    <header class="page-head">
      <div>
        <h1>Orçamento<span class="num-badge" id="numero">${esc(o.numero || '')}</span></h1>
        <p class="lede">Use as gramas e o tempo que o fatiador mostra. Tudo é salvo sozinho no histórico.</p>
        <p class="salvo" id="salvo" aria-live="polite"></p>
      </div>
      <div class="head-actions">
        <label class="inline-field">Status <select data-bind="atual.status">${opcoes(STATUS, o.status)}</select></label>
        <button class="btn" data-act="duplicar-atual"${temConteudo(o) ? '' : ' disabled'}>Duplicar</button>
        <button class="btn btn-solid" data-act="novo">Novo orçamento</button>
      </div>
    </header>
    ${trav ? `<div class="banner" role="note"><p><b>Este orçamento já foi enviado.</b> Os valores estão travados como o cliente recebeu, mesmo que a tabela de preços tenha mudado depois.</p><div class="head-actions"><button class="btn" data-act="destravar">Editar valores</button><button class="btn btn-solid" data-act="duplicar-atual">Duplicar como novo</button></div></div>` : ''}
    <div class="editor">
      <fieldset class="lock editor-main"${trav ? ' disabled' : ''}>
        <legend class="sr-only">Dados do orçamento</legend>
        <section class="panel" id="cliente" aria-labelledby="h-cli">${clienteHTML()}</section>
        <section class="panel" aria-labelledby="h-pecas">
          <div class="panel-head"><div><h2 id="h-pecas">Peças impressas</h2><p class="panel-sub">Prototipagem e confecção sob medida. Levam a margem da tabela de preços.</p></div><button class="btn" data-act="add-item">Adicionar peça</button></div>
          <div id="itens">${itensHTML()}</div>
        </section>
        <section class="panel" aria-labelledby="h-serv">
          <div class="panel-head"><div><h2 id="h-serv">Modelagem 3D</h2><p class="panel-sub" id="serv-sub">${servSubHTML()}</p></div><button class="btn" data-act="add-serv">Adicionar modelagem</button></div>
          <div id="servicos">${servicosHTML()}</div>
        </section>
        <section class="panel" id="entrega">${entregaHTML()}</section>
      </fieldset>
      <aside class="editor-side" aria-label="Resumo do orçamento"><div class="resumo" id="resumo">${resumoHTML()}</div></aside>
    </div>
    <div class="mbar" id="mbar">${mbarHTML()}</div>
    </div>`;
  }

  function clienteHTML() {
    const o = S.atual;
    const resp = responsavel(o);
    const idx = S.equipe.indexOf(resp);
    const optEq = S.equipe.map((m) => `<option value="${esc(m.id)}"${m.id === resp.id ? ' selected' : ''}>${esc(m.nome || 'Sem nome')}</option>`).join('');
    const nomes = {};
    S.orcamentos.forEach((h) => { if (h.id !== o.id && h.cliente && preenchido(h.cliente.nome) && !nomes[h.cliente.nome]) nomes[h.cliente.nome] = h.cliente.contato || ''; });
    return `<h2 id="h-cli">Cliente</h2>
      <div class="grid g4">
        ${campo('Nome', inp('atual.cliente.nome', o.cliente.nome, 'Nome ou empresa', 'list="lista-clientes"'))}
        ${campo('WhatsApp ou e-mail', inp('atual.cliente.contato', o.cliente.contato, '(31) 9 9999-9999'))}
        ${campo('Cidade', inp('atual.cliente.cidade', o.cliente.cidade, cidadeCurta()))}
        <div class="field"><label class="field-label" for="resp-sel">Feito por</label>
          <select id="resp-sel" data-bind="atual.responsavelId" data-rerender="cliente">${optEq}</select>
          ${preenchido(resp.nome) ? '<small>Aparece no PDF e na mensagem.</small>' : inp(`equipe.${idx}.nome`, resp.nome, 'Escreva seu nome', 'aria-label="Nome de quem faz o orçamento"')}
        </div>
      </div>
      <datalist id="lista-clientes">${Object.keys(nomes).map((n) => `<option value="${esc(n)}">${esc(nomes[n])}</option>`).join('')}</datalist>`;
  }

  const itensHTML = () => S.atual.itens.map(itemHTML).join('');

  function itemHTML(it, i) {
    const imp = acha(ctxDe(S.atual).impressoras, it.impressoraId);
    const mats = ctxDe(S.atual).materiais.filter((m) => m.ativo || m.id === it.materialId);
    const optMat = mats.map((m) => {
      const c = C.compat(imp, m.familia);
      const suf = c === 'nao' ? ' (não recomendado)' : c === 'possivel' ? ' (com cuidados)' : '';
      return `<option value="${esc(m.id)}"${m.id === it.materialId ? ' selected' : ''}>${esc(m.nome + suf)}</option>`;
    }).join('');
    const multi = S.impressoras.length > 1;
    const eco = ecoTempo(it.tempo, ECO_TEMPO);
    const dims = it.dims || ['', '', ''];
    const aberto = U.abertos[it.id] !== undefined ? U.abertos[it.id] : (C.n0(it.acabamentoMin) > 0 || C.n0(it.extras) > 0 || dims.some((d) => C.n0(d) > 0));
    const unico = S.atual.itens.length < 2;
    return `<article class="item" data-coll="itens" data-id="${esc(it.id)}">
      <div class="item-head">
        <span class="item-n">Peça ${i + 1}</span>
        <input class="item-title" data-f="descricao" value="${esc(it.descricao)}" placeholder="Nome da peça, ex.: suporte de celular" aria-label="Nome da peça ${i + 1}" autocomplete="off">
        <div class="item-tools">
          <button class="btn btn-text" data-act="dup-item">Duplicar</button>
          <button class="btn btn-text danger" data-act="del-item"${unico ? ' disabled title="O orçamento precisa de ao menos uma linha de peça"' : ''}>Excluir</button>
        </div>
      </div>
      <div class="grid g3">
        ${campo('Material', `<select data-f="materialId">${optMat}</select>`)}
        ${campo('Cor', `<input data-f="cor" value="${esc(it.cor)}" placeholder="ex.: preto" autocomplete="off">`)}
        ${campo('Quantidade', numInp('data-f="qtd"', it.qtd, { int: true }))}
        ${campo('Gramas por peça', numInp('data-f="gramas"', it.gramas, { ph: 'ex.: 42' }), 'Com suportes e purga, como no fatiador')}
        <label class="field"><span class="field-label">Tempo por peça</span><input data-f="tempo" value="${esc(it.tempo)}" placeholder="ex.: 2h35m" autocomplete="off" aria-describedby="eco-${esc(it.id)}"${eco.invalido ? ' aria-invalid="true"' : ''}><small id="eco-${esc(it.id)}" class="${eco.cls}" data-eco="tempo">${eco.txt}</small></label>
        ${multi ? campo('Impressora', `<select data-f="impressoraId" data-rerender="itens">${S.impressoras.map((p) => `<option value="${esc(p.id)}"${p.id === it.impressoraId ? ' selected' : ''}>${esc(apelido(p))}</option>`).join('')}</select>`) : ''}
      </div>
      <details class="mais"${aberto ? ' open' : ''}><summary>Acabamento, extras e tamanho</summary>
        <div class="grid g3">
          ${campo('Acabamento (min por peça)', numInp('data-f="acabamentoMin"', it.acabamentoMin, { int: true, ph: '0' }), `Lixar, colar, tirar suporte. ${brl(S.params.horaOperacao)}/h, sem margem.`)}
          ${campo('Extras por peça (R$)', numInp('data-f="extras"', it.extras, { ph: '0,00' }), 'Ímã, argola, parafuso')}
          <div class="field"><span class="field-label">Tamanho X × Y × Z (mm)</span>
            <div class="dims">${[0, 1, 2].map((k) => `<input type="text" inputmode="numeric" data-tipo="num" data-f="dims.${k}" value="${esc(fmtIn(dims[k]))}" placeholder="${'XYZ'[k]}" aria-label="${'XYZ'[k]} em mm" autocomplete="off">`).join('<span aria-hidden="true">×</span>')}</div>
            <small>Confere se cabe na mesa${imp ? ` da ${esc(apelido(imp))} (${mesa(imp)} mm)` : ''}.</small>
          </div>
        </div>
      </details>
      <div class="item-meta" data-meta="${esc(it.id)}">${itemMetaHTML(it.id)}</div>
    </article>`;
  }

  function itemMetaHTML(id, r) {
    r = r || calcAtual();
    const x = r.itens.find((l) => l.id === id);
    if (!x) return '';
    const out = [];
    if (x.preco > 0) out.push(`<div class="item-figs"><span>Custo de produção <b>${brl(x.custo)}</b></span><span>Na proposta <b>${brl(x.precoLinha)}</b>${x.qtd > 1 ? ` (${brl(x.precoUnit)} cada)` : ''}</span>${x.horas ? `<span>Máquina <b>${fmtHoras(x.horas * x.qtd)}</b></span>` : ''}</div>`);
    const nomeImp = esc(apelido(x.imp));
    x.avisos.forEach((a) => {
      if (a.tipo === 'material' && a.nivel === 'ruim') {
        const ok = S.materiais.filter((m) => m.ativo && C.compat(x.imp, m.familia) === 'ideal').map((m) => m.familia);
        const sug = listaPT([...new Set(ok)].slice(0, 2));
        out.push(nota('ruim', `${esc(x.mat.nome)} não é recomendado na ${nomeImp}.${sug ? ` Ofereça ${esc(sug)} ou use uma impressora fechada.` : ''}`));
      } else if (a.tipo === 'material') {
        out.push(nota('atencao', `${esc(x.mat.nome)} na ${nomeImp} é possível, mas pede cuidados (fechamento, bico endurecido ou secagem). Considere uma reserva de falhas maior.`));
      } else if (a.tipo === 'tamanho') {
        out.push(nota('ruim', `Não cabe na mesa da ${nomeImp} (${mesa(x.imp)} mm). Divida o modelo em partes e some gramas e tempo.`));
      }
    });
    return out.join('');
  }

  const servSubHTML = () => `Prestação de serviço: horas trabalhadas × ${brl(ctxDe(S.atual).params.horaModelagem)} por hora, <b>sem margem</b>. Não recebe desconto nem entra no pedido mínimo.`;

  function servicosHTML() {
    const o = S.atual;
    if (!o.servicos.length) return '<p class="empty-line">Sem modelagem neste orçamento. Adicione quando o cliente mandar foto, desenho ou medidas em vez do arquivo 3D.</p>';
    const r = calcAtual();
    return o.servicos.map((s, i) => {
      const eco = ecoTempo(s.horas, ECO_HORAS);
      const c = r.servicos[i] || { total: 0, horas: 0, valorHora: 0 };
      return `<div class="serv" data-coll="servicos" data-id="${esc(s.id)}">
        <label class="field"><span class="field-label">O que será modelado</span><input data-f="descricao" value="${esc(s.descricao)}" placeholder="ex.: suporte a partir de foto e medidas" autocomplete="off"></label>
        <label class="field"><span class="field-label">Horas de trabalho</span><input data-f="horas" value="${esc(s.horas)}" placeholder="ex.: 1h30m" autocomplete="off" aria-describedby="eco-${esc(s.id)}"${eco.invalido ? ' aria-invalid="true"' : ''}><small id="eco-${esc(s.id)}" class="${eco.cls}" data-eco="horas">${eco.txt}</small></label>
        <div class="serv-total" data-serv-total="${esc(s.id)}">${servTotalHTML(c)}</div>
        <button class="btn btn-text danger" data-act="del-serv" aria-label="Excluir modelagem ${i + 1}">Excluir</button>
      </div>`;
    }).join('');
  }
  const servTotalHTML = (c) => `${brl(c.total)}<small>${c.horas ? `${fmtHoras(c.horas)} × ${brl(c.valorHora)}` : 'sem horas'}</small>`;

  function atualizarMetas() {
    const r = calcAtual();
    $$('[data-meta]').forEach((el) => { el.innerHTML = itemMetaHTML(el.dataset.meta, r); });
    $$('#itens [data-coll="itens"]').forEach((card) => {
      const it = acha(S.atual.itens, card.dataset.id); if (!it) return;
      const eco = ecoTempo(it.tempo, ECO_TEMPO);
      const small = card.querySelector('[data-eco="tempo"]'), input = card.querySelector('[data-f="tempo"]');
      if (small) { small.className = eco.cls; small.textContent = eco.txt; }
      if (input) { if (eco.invalido) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); }
    });
    S.atual.servicos.forEach((s, i) => {
      const row = $(`#servicos [data-id="${CSS.escape(s.id)}"]`); if (!row) return;
      const eco = ecoTempo(s.horas, ECO_HORAS);
      const small = row.querySelector('[data-eco="horas"]'), input = row.querySelector('[data-f="horas"]');
      if (small) { small.className = eco.cls; small.textContent = eco.txt; }
      if (input) { if (eco.invalido) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); }
      const tot = row.querySelector('[data-serv-total]'); if (tot) tot.innerHTML = servTotalHTML(r.servicos[i]);
    });
  }

  function entregaHTML() {
    const o = S.atual, e = S.empresa;
    const disp = ['retirada', 'correios', 'app', 'combinar'].filter((k) => k === 'combinar' || k === o.entrega || (k === 'retirada' && e.retiradaAtivo) || (k === 'correios' && e.correiosAtivo) || (k === 'app' && e.appAtivo));
    const radio = (name, val, label, atual) => `<label class="chip-radio"><input type="radio" name="${name}" value="${val}" data-bind="atual.${name}" data-rerender="entrega"${atual === val ? ' checked' : ''}><span>${esc(label)}</span></label>`;
    const dicaFrete = o.entrega === 'correios' ? 'Simule no site dos Correios com o CEP do cliente.' : o.entrega === 'app' ? 'Valor da corrida (Uber Flash, 99 Entrega).' : o.entrega === 'retirada' ? 'Retirada não tem frete.' : '';
    const pagamentos = [['pix', 'Pix']];
    if (e.aceitaCartao || o.pagamento === 'cartao') pagamentos.push(['cartao', `Cartão (+${fmtNum(S.params.taxaCartaoPct)}%)`]);
    return `<h2>Entrega, pagamento e prazo</h2>
    <div class="grid g2">
      <fieldset class="field"><legend class="field-label">Entrega</legend><div class="choice">${disp.map((k) => radio('entrega', k, entregaLabel(k), o.entrega)).join('')}</div></fieldset>
      ${campo('Frete (R$)', numInp('data-bind="atual.frete"', o.entrega === 'retirada' ? '' : o.frete, { ph: o.entrega === 'retirada' ? 'Grátis' : '0,00', extra: o.entrega === 'retirada' ? 'disabled' : '' }), dicaFrete)}
      <fieldset class="field"><legend class="field-label">Pagamento</legend><div class="choice">${pagamentos.map((p) => radio('pagamento', p[0], p[1], o.pagamento)).join('')}</div>${!e.aceitaCartao ? '<small>Para aceitar cartão, ative em Empresa e equipe.</small>' : ''}</fieldset>
      ${campo('Desconto nas peças (%)', numInp('data-bind="atual.descontoPct"', o.descontoPct, { ph: '0' }), 'Não vale para a modelagem. O pedido mínimo continua valendo.')}
      ${campo('Prazo', inp('atual.prazo', o.prazo, textoPrazo()), '', 'span2')}
      ${campo('Observações para o cliente', `<textarea rows="3" data-bind="atual.observacoes">${esc(o.observacoes)}</textarea>`, '', 'span2')}
    </div>`;
  }

  function stackHTML(r) {
    const tot = r.camadas.reduce((a, c) => a + c.valor, 0);
    if (!tot) return '<p class="empty-note">Preencha gramas e tempo de uma peça, ou as horas de modelagem, para ver de que é feito o preço.</p>';
    const desc = r.camadas.filter((c) => c.valor > 0).map((c) => `${c.nome} ${pct(c.valor / tot)}`).join(', ');
    return `<div class="stack">
      <div class="stack-figure" role="img" aria-label="Composição do preço: ${esc(desc)}">
        <div class="stack-col">${r.camadas.map((c) => `<span class="seg seg-${c.chave}" data-grow="${(c.valor / tot).toFixed(4)}"></span>`).join('')}</div>
        <div class="plate"></div>
      </div>
      <ul class="stack-legend">${r.camadas.slice().reverse().map((c) => `<li><i class="seg-${c.chave}"></i><span>${c.nome}</span><b>${brl(c.valor)}</b></li>`).join('')}</ul>
    </div>`;
  }

  function comoHTML(r, p) {
    const L = [];
    const cam = (k) => (r.camadas.find((c) => c.chave === k) || {}).valor || 0;
    if (r.temPecas) {
      L.push(`Material: <b>${num(r.gramasTotal, 0)} g</b> de filamento = <b>${brl(cam('material'))}</b>`);
      L.push(`Máquina: <b>${fmtHoras(r.horasTotal)}</b> de impressão, com energia e desgaste = <b>${brl(cam('maquina'))}</b>`);
      L.push(`Reserva de ${fmtNum(p.falhaPct)}% para falhas, extras e embalagem = <b>${brl(cam('perdas'))}</b>`);
      L.push(`Margem de ${fmtNum(p.margemPct)}% sobre esse custo = <b>${brl(r.margem)}</b>`);
      L.push(`Acabamento e preparo do pedido, sem margem = <b>${brl(r.trabalho - r.servicosTotal)}</b>`);
      if (r.arredondamento > 0.004) L.push(`Arredondamento para cima = <b>${brl(r.arredondamento)}</b>`);
      if (r.desconto) L.push(`Desconto de ${fmtNum(r.descontoPct)}% nas peças = <b>− ${brl(r.desconto)}</b>`);
      if (r.ajusteMinimo) L.push(`Complemento até o pedido mínimo de ${brl(p.pedidoMinimo)} = <b>${brl(r.ajusteMinimo)}</b>`);
    }
    if (r.servicosTotal) L.push(`Modelagem: <b>${fmtHoras(r.servicosHoras)}</b> × ${brl(p.horaModelagem)}, sem margem = <b>${brl(r.servicosTotal)}</b>`);
    if (!L.length) return '';
    return `<details class="como"><summary>Como chegamos neste valor</summary><ol>${L.map((l) => `<li>${l}</li>`).join('')}</ol></details>`;
  }

  function pendencias(r) {
    const o = S.atual, P = [];
    const resp = responsavel(o);
    if (!empresaValida()) P.push({ b: true, t: 'Dados da empresa: nome, cidade e WhatsApp ou e-mail', alvo: '#empresa' });
    if (!preenchido(resp.nome)) P.push({ b: true, t: 'Nome de quem faz o orçamento', alvo: `[data-bind="equipe.${S.equipe.indexOf(resp)}.nome"]` });
    if (!preenchido(o.cliente.nome)) P.push({ b: true, t: 'Nome do cliente', alvo: '[data-bind="atual.cliente.nome"]' });
    if (!r.temItens) P.push({ b: true, t: 'Gramas e tempo de uma peça, ou horas de modelagem', alvo: `[data-id="${o.itens[0].id}"] [data-f="gramas"]` });
    r.itens.forEach((x, i) => {
      const it = o.itens[i], sel = `[data-id="${it.id}"]`;
      if (preenchido(it.tempo) && !x.horas) P.push({ b: true, t: `Peça ${i + 1}: tempo não reconhecido`, alvo: `${sel} [data-f="tempo"]` });
      else if ((x.gramas > 0) !== (x.horas > 0)) P.push({ b: true, t: `Peça ${i + 1}: ${x.gramas > 0 ? 'falta o tempo' : 'faltam as gramas'}`, alvo: `${sel} [data-f="${x.gramas > 0 ? 'tempo' : 'gramas'}"]` });
      if (x.avisos.some((a) => a.nivel === 'ruim')) P.push({ b: false, t: `Peça ${i + 1}: confira material ou tamanho`, alvo: `${sel} .item-title` });
    });
    r.servicos.forEach((s, i) => {
      const raw = o.servicos[i], sel = `[data-id="${raw.id}"] [data-f="horas"]`;
      if (preenchido(raw.horas) && !s.horas) P.push({ b: true, t: `Modelagem ${i + 1}: horas não reconhecidas`, alvo: sel });
      else if (preenchido(raw.descricao) && !s.horas) P.push({ b: true, t: `Modelagem ${i + 1}: faltam as horas`, alvo: sel });
    });
    if (r.flags.abaixoDoCusto) P.push({ b: true, t: 'Preço abaixo do custo: diminua o desconto', alvo: '[data-bind="atual.descontoPct"]' });
    if ((o.entrega === 'correios' || o.entrega === 'app') && !r.frete) P.push({ b: false, t: 'Valor do frete', alvo: '[data-bind="atual.frete"]' });
    if (o.pagamento === 'pix' && !preenchido(S.empresa.pix)) P.push({ b: false, t: 'Chave Pix da empresa', alvo: '#empresa' });
    return P;
  }

  function pendHTML(P) {
    if (!P.length) return '<p class="pronto">Pronto para enviar.</p>';
    return `<div class="pend"><h3>Antes de enviar</h3><ul>${P.map((p) => `<li><button type="button" class="link" data-act="ir" data-alvo="${esc(p.alvo)}">${esc(p.t)}</button>${p.b ? '' : ' <span>(recomendado)</span>'}</li>`).join('')}</ul></div>`;
  }

  function resumoHTML() {
    const o = S.atual, r = calcAtual(), p = ctxDe(o).params;
    const L = [];
    if (r.temPecas) L.push(['Peças impressas', brl(r.bruto)]);
    if (r.desconto) L.push([`Desconto nas peças (${fmtNum(r.descontoPct)}%)`, '− ' + brl(r.desconto)]);
    if (r.ajusteMinimo) L.push([`Ajuste para o pedido mínimo<small>Peças somam menos de ${brl(p.pedidoMinimo)}</small>`, brl(r.ajusteMinimo)]);
    if (r.servicosTotal) L.push([`Modelagem 3D<small>${fmtHoras(r.servicosHoras)} × ${brl(p.horaModelagem)}, sem margem</small>`, brl(r.servicosTotal)]);
    if (o.entrega !== 'retirada') L.push([freteLabel(o.entrega), r.frete ? brl(r.frete) : 'a definir']);
    if (r.taxaCartao) L.push([`Taxa do cartão (${fmtNum(p.taxaCartaoPct)}%)`, brl(r.taxaCartao)]);

    const alertas = [];
    if (r.flags.trabalhoNaoPago) alertas.push(nota('atencao', 'O preço cobre os materiais, mas não paga todo o seu tempo nas peças.'));
    if (r.flags.minimoAplicado) alertas.push(nota('', `Pedido mínimo aplicado. Vale sugerir mais unidades ao cliente: o valor de cada peça cai bastante em lote.`));

    const partes = [o.pagamento === 'cartao' ? 'No cartão' : 'No Pix'];
    if (r.temPecas) partes.push(`${num(r.gramasTotal, 0)} g e ${fmtHoras(r.horasTotal)} de máquina`);
    if (r.servicosTotal) partes.push(`${fmtHoras(r.servicosHoras)} de modelagem`);
    const sub = r.temItens ? partes.join(', ') : 'Preencha as peças ou a modelagem';
    return `<span class="total-label">Total para o cliente</span>
      <strong class="total-value">${brl(r.total)}</strong>
      <span class="total-sub">${esc(sub)}</span>
      <div class="actions">
        <button class="btn btn-solid" data-act="pdf">Ver PDF</button>
        <button class="btn" data-act="whats-copy">Copiar mensagem</button>
        <button class="btn" data-act="whats-open">Abrir WhatsApp</button>
      </div>
      ${temConteudo(o) ? pendHTML(pendencias(r)) : ''}
      ${stackHTML(r)}
      <dl class="lines">${L.map((l) => `<dt>${l[0]}</dt><dd>${l[1]}</dd>`).join('')}<dt class="sum-total">Total</dt><dd class="sum-total">${brl(r.total)}</dd></dl>
      ${r.temItens ? `<div class="internal"><h3>Só para você, não vai no PDF</h3><dl>
        ${r.temPecas ? `<dt>Custo de produção</dt><dd>${brl(r.custoProducao)}</dd>` : ''}
        <dt>Seu trabalho</dt><dd>${brl(r.trabalho)}</dd>
        ${r.temPecas ? `<dt>Lucro nas peças</dt><dd class="${r.lucro >= 0 ? 'pos' : 'neg'}">${brl(r.lucro)}</dd><dt>Preço por grama</dt><dd>${brl(r.precoPorGrama)}</dd>` : ''}
      </dl>${comoHTML(r, p)}</div>` : ''}
      ${alertas.join('')}`;
  }

  function mbarHTML() {
    const r = calcAtual();
    return `<div><small>Total para o cliente</small><b>${brl(r.total)}</b></div>
      <div class="head-actions"><button class="btn" data-act="ir-resumo">Resumo</button><button class="btn btn-solid" data-act="pdf">Ver PDF</button></div>`;
  }

  /* ================= HISTÓRICO ================= */
  function viewHistorico() {
    const filtros = Object.assign({ todos: 'Todos' }, STATUS);
    const dias = S.ui.ultimoBackup ? Math.round((Date.now() - new Date(S.ui.ultimoBackup + 'T12:00:00')) / 864e5) : null;
    const lembrar = S.orcamentos.length >= 3 && (dias === null || dias > 14);
    const uso = usoArmazenamento();
    return `<div class="page">
    <header class="page-head">
      <div><h1>Histórico</h1><p class="lede">Todo orçamento com conteúdo fica salvo aqui. Atualize o status para ver o que virou pedido.</p></div>
      <div class="head-actions"><button class="btn btn-solid" data-act="novo">Novo orçamento</button></div>
    </header>
    ${lembrar ? `<div class="banner" role="note"><p><b>Faça um backup.</b> Os orçamentos existem só neste navegador${dias !== null ? ` e o último backup foi há ${dias} dias` : ''}.</p><div class="head-actions"><button class="btn" data-act="exportar">Exportar backup</button></div></div>` : ''}
    ${uso > 0.6 ? `<div class="banner" role="alert"><p><b>O espaço deste navegador está ${pct(uso)} usado.</b> Exporte um backup e exclua orçamentos antigos para continuar salvando.</p><div class="head-actions"><button class="btn" data-act="exportar">Exportar backup</button></div></div>` : ''}
    <div id="hist-stats">${histStatsHTML()}</div>
    <section class="panel">
      <div class="toolbar">
        <input type="search" data-ui="histBusca" data-rerender="hist-lista" value="${esc(U.histBusca)}" placeholder="Buscar cliente, número ou peça" aria-label="Buscar no histórico">
        <label class="inline-field">Mostrar <select data-ui="histFiltro" data-rerender="hist-lista">${opcoes(filtros, U.histFiltro)}</select></label>
      </div>
      <div id="hist-lista">${histListaHTML()}</div>
    </section></div>`;
  }

  function histStatsHTML() {
    const L = S.orcamentos;
    if (!L.length) return '';
    const fechados = L.filter((o) => ['aprovado', 'producao', 'entregue'].indexOf(o.status) >= 0);
    const recusados = L.filter((o) => o.status === 'recusado').length;
    const abertos = L.filter((o) => o.status === 'enviado');
    const soma = (arr) => arr.reduce((a, o) => a + (Number(o.totalCache) || 0), 0);
    const taxa = fechados.length + recusados ? fechados.length / (fechados.length + recusados) : null;
    return `<div class="stats">
      <div><b>${L.length}</b>orçamentos</div>
      <div><b>${brl(soma(abertos))}</b>aguardando resposta</div>
      <div><b>${brl(soma(fechados))}</b>aprovados</div>
      ${taxa !== null ? `<div><b>${pct(taxa)}</b>de aprovação</div>` : ''}
    </div>`;
  }

  function resumoItens(o) {
    const n = (o.itens || []).filter((it) => C.n0(it.gramas) > 0);
    const nomes = n.map((it) => it.descricao).filter(Boolean);
    const partes = [];
    if (n.length) partes.push(nomes.length ? nomes.slice(0, 2).join(', ') + (nomes.length > 2 ? ` e mais ${nomes.length - 2}` : '') : `${n.length} peça${n.length > 1 ? 's' : ''}`);
    if ((o.servicos || []).some((s) => C.parseTempo(s.horas) > 0)) partes.push('modelagem');
    return partes.join(' + ') || 'sem peças';
  }

  function histListaHTML() {
    const q = U.histBusca.trim().toLowerCase();
    const L = S.orcamentos.filter((o) => (U.histFiltro === 'todos' || o.status === U.histFiltro) &&
      (!q || [o.numero, o.cliente && o.cliente.nome, o.cliente && o.cliente.contato].concat((o.itens || []).map((it) => it.descricao), (o.servicos || []).map((sv) => sv.descricao)).join(' ').toLowerCase().indexOf(q) >= 0));
    if (!S.orcamentos.length) return '<div class="empty"><p>Nenhum orçamento ainda.</p><p>Comece um na aba Orçamento: ele aparece aqui assim que você preencher algo.</p></div>';
    if (!L.length) return '<div class="empty"><p>Nada encontrado com esse filtro ou busca.</p></div>';
    return `<div class="table-wrap"><table>
      <thead><tr><th>Número</th><th>Cliente</th><th>Feito por</th><th>Data</th><th class="num">Total</th><th>Status</th><th><span class="sr-only">Ações</span></th></tr></thead>
      <tbody>${L.map((o) => { const r = acha(S.equipe, o.responsavelId); return `<tr data-id="${esc(o.id)}">
        <td class="strong">${esc(o.numero || 'sem número')}</td>
        <td>${esc(o.cliente && o.cliente.nome ? o.cliente.nome : 'Sem nome')}<br><small class="muted">${esc(resumoItens(o))}</small></td>
        <td>${esc(r && r.nome ? r.nome : '–')}</td>
        <td>${fmtData(o.emitidoEm || o.criadoEm)}</td>
        <td class="num strong">${brl(o.totalCache)}</td>
        <td><select data-hist-status="${esc(o.id)}" aria-label="Status de ${esc(o.numero)}">${opcoes(STATUS, o.status)}</select></td>
        <td><div class="row-actions">
          <button class="btn btn-text" data-act="abrir">Abrir</button>
          <button class="btn btn-text" data-act="duplicar">Duplicar</button>
          <button class="btn btn-text" data-act="pdf-hist">PDF</button>
          <button class="btn btn-text danger" data-act="excluir">Excluir</button>
        </div></td></tr>`; }).join('')}</tbody></table></div>`;
  }

  /* ================= TABELA DE PREÇOS ================= */
  function viewTabela() {
    const p = S.params;
    const f = (k, label, dica, int) => campo(label, numInp(`data-bind="params.${k}"`, p[k], { int: int }), dica);
    return `<div class="page">
    <header class="page-head"><div><h1>Tabela de preços</h1><p class="lede">Estes valores entram em todos os orçamentos novos. Os enviados ficam travados com os valores da época. Os padrões foram calculados para uma Bambu Lab A1 em Belo Horizonte.</p></div></header>
    <section class="panel">
      <h2>Peças impressas</h2>
      <div class="grid g4">
        ${f('tarifaKwh', 'Energia (R$ por kWh)', 'CEMIG residencial com impostos fica perto de R$ 1,18. Some a bandeira do mês.')}
        ${f('falhaPct', 'Reserva para falhas (%)', 'Cobre impressões que dão errado e testes.')}
        ${f('margemPct', 'Margem sobre o custo (%)', 'Só nas peças: material, máquina, falhas e extras.')}
        ${campo('Arredondar as peças para cima', `<select data-bind="params.arredondamento" data-tipo="num">${opcoes(ARRED, p.arredondamento)}</select>`)}
        ${f('preparoMin', 'Preparo por pedido (min)', 'Fatiar, preparar a mesa, separar e conferir.', true)}
        ${f('embalagem', 'Embalagem por pedido (R$)', 'Caixa, plástico bolha, etiqueta.')}
        ${f('pedidoMinimo', 'Pedido mínimo em peças (R$)', 'Sem contar frete e modelagem.')}
        ${f('taxaCartaoPct', 'Taxa do cartão (%)', 'Só entra quando o cliente paga no cartão.')}
      </div>
    </section>
    <section class="panel">
      <h2>Mão de obra e serviços</h2>
      <p class="panel-note">Hora de trabalho é prestação de serviço: entra pelo valor da hora, sem margem por cima.</p>
      <div class="grid g4">
        ${f('horaModelagem', 'Hora de modelagem 3D (R$)', 'Da foto ou do desenho ao arquivo pronto.')}
        ${f('horaOperacao', 'Hora de acabamento (R$)', 'Tirar suporte, lixar, colar, montar. Também vale para o preparo.')}
      </div>
    </section>
    <section class="panel" id="tab-custos">${tabCustosHTML()}</section>
    <section class="panel" id="tab-rapida">${tabRapidaHTML()}</section></div>`;
  }

  function tabCustosHTML() {
    const p = S.params, fal = 1 + C.n0(p.falhaPct) / 100;
    const mats = S.materiais.filter((m) => m.ativo);
    const preparo = C.n0(p.preparoMin) / 60 * C.n0(p.horaOperacao);
    return `<h2>Quanto custa produzir</h2>
    <p class="panel-note">Custo direto, antes da margem. Serve para conferir se o preço que o mercado pratica cobre o seu custo.</p>
    <div class="grid g2">
      <div class="table-wrap"><table><thead><tr><th>Material</th><th class="num">Kg</th><th class="num">Grama</th><th class="num">Grama com falhas</th></tr></thead>
        <tbody>${mats.map((m) => `<tr><td>${esc(m.nome)}</td><td class="num">${brl(m.precoKg)}</td><td class="num">R$ ${num(C.n0(m.precoKg) / 1000, 3)}</td><td class="num">R$ ${num(C.n0(m.precoKg) / 1000 * fal, 3)}</td></tr>`).join('')}</tbody></table></div>
      <div class="table-wrap"><table><thead><tr><th>Impressora</th><th class="num">Energia/h</th><th class="num">Desgaste/h</th><th class="num">Total/h</th></tr></thead>
        <tbody>${S.impressoras.map((i) => { const h = C.custoHoraMaquina(i, p); return `<tr><td>${esc(apelido(i))}</td><td class="num">${brl(h.energia)}</td><td class="num">${brl(h.desgaste)}</td><td class="num strong">${brl(h.total)}</td></tr>`; }).join('')}</tbody></table></div>
    </div>
    <p class="panel-note after">Todo pedido de peças carrega ${brl(preparo)} de preparo e ${brl(p.embalagem)} de embalagem. É por isso que existe o pedido mínimo de ${brl(p.pedidoMinimo)}: um chaveiro avulso sozinho não paga o seu tempo.</p>`;
  }

  function precoExemplo(ex, qtd, semMinimo) {
    const params = semMinimo ? Object.assign({}, S.params, { pedidoMinimo: 0 }) : S.params;
    const r = C.calcOrcamento({ itens: [{ id: 'x', materialId: U.tabMat, impressoraId: U.tabImp, qtd: qtd, gramas: ex.gramas, tempo: ex.tempo }], entrega: 'retirada', pagamento: 'pix', descontoPct: 0 },
      { params: params, materiais: S.materiais, impressoras: S.impressoras });
    return r.temPecas ? r.produtos / qtd : 0;
  }
  function exCalc(ex, col) {
    const v = col === 'avulso' ? precoExemplo(ex, 1, false) : col === 'semmin' ? precoExemplo(ex, 1, true) : precoExemplo(ex, 10, false);
    return v ? brl(v) : '<span class="muted">–</span>';
  }

  function tabRapidaHTML() {
    const mats = S.materiais.filter((m) => m.ativo);
    if (!mats.some((m) => m.id === U.tabMat)) U.tabMat = (mats[0] || {}).id;
    if (!acha(S.impressoras, U.tabImp)) U.tabImp = (S.impressoras[0] || {}).id;
    const optM = mats.map((m) => `<option value="${esc(m.id)}"${m.id === U.tabMat ? ' selected' : ''}>${esc(m.nome)}</option>`).join('');
    const optI = S.impressoras.map((i) => `<option value="${esc(i.id)}"${i.id === U.tabImp ? ' selected' : ''}>${esc(apelido(i))}</option>`).join('');
    return `<div class="panel-head"><div><h2>Tabela rápida para responder no WhatsApp</h2><p class="panel-sub">Preços com a sua margem para peças típicas. Troque os exemplos por peças que você já fatiou.</p></div><button class="btn" data-act="pdf-tabela">Ver PDF</button></div>
    <div class="toolbar">
      <label class="inline-field">Material <select data-ui="tabMat" data-rerender="tab-rapida">${optM}</select></label>
      ${S.impressoras.length > 1 ? `<label class="inline-field">Impressora <select data-ui="tabImp" data-rerender="tab-rapida">${optI}</select></label>` : ''}
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Peça</th><th class="num">Gramas</th><th>Tempo</th><th class="num">Pedido avulso</th><th class="num">Sem pedido mínimo</th><th class="num">Cada, em lote de 10</th><th><span class="sr-only">Ações</span></th></tr></thead>
      <tbody>${S.exemplos.map((ex) => `<tr data-coll="exemplos" data-id="${esc(ex.id)}">
        <td><input class="w-m" data-f="nome" value="${esc(ex.nome)}" aria-label="Nome da peça" autocomplete="off"></td>
        <td class="num"><input type="text" inputmode="decimal" data-tipo="num" class="w-s" data-f="gramas" value="${esc(fmtIn(ex.gramas))}" aria-label="Gramas" autocomplete="off"></td>
        <td><input class="w-s" data-f="tempo" value="${esc(ex.tempo)}" placeholder="2h30m" aria-label="Tempo de impressão" autocomplete="off"></td>
        <td class="num strong" data-calc="ex:${esc(ex.id)}:avulso">${exCalc(ex, 'avulso')}</td>
        <td class="num" data-calc="ex:${esc(ex.id)}:semmin">${exCalc(ex, 'semmin')}</td>
        <td class="num" data-calc="ex:${esc(ex.id)}:lote">${exCalc(ex, 'lote')}</td>
        <td><button class="btn btn-text danger" data-act="del-ex">Excluir</button></td></tr>`).join('')}</tbody></table></div>
    <div class="toolbar after"><button class="btn" data-act="add-ex">Adicionar exemplo</button></div>`;
  }

  /* ================= IMPRESSORAS ================= */
  function viewImpressoras() {
    const marcas = { '': 'Todas as marcas' };
    D.CATALOGO.forEach((c) => { marcas[c.marca] = c.marca; });
    return `<div class="page">
    <header class="page-head"><div><h1>Impressoras</h1><p class="lede">O custo por hora de cada máquina entra no orçamento: energia mais desgaste, que é o preço pago dividido pela vida útil, somado à manutenção.</p></div></header>
    <section class="panel">
      <div class="panel-head"><h2>Suas impressoras</h2><button class="btn" data-act="add-imp-outra">Cadastrar outra</button></div>
      <div class="printers">${S.impressoras.map(impCardHTML).join('')}</div>
    </section>
    <section class="panel">
      <h2>Catálogo do mercado</h2>
      <p class="panel-note">Dados de referência dos modelos mais vendidos. A potência é a média aproximada imprimindo PLA: “fabricante” vem da medição da Bambu Lab; o resto é estimativa. Confira no manual da sua máquina.</p>
      <div class="toolbar">
        <input type="search" data-ui="busca" data-rerender="catalogo" value="${esc(U.busca)}" placeholder="Buscar modelo" aria-label="Buscar modelo">
        <select data-ui="marca" data-rerender="catalogo" aria-label="Filtrar por marca">${opcoes(marcas, U.marca)}</select>
      </div>
      <div id="catalogo">${catalogoHTML()}</div>
    </section></div>`;
  }

  function catalogoHTML() {
    const q = U.busca.trim().toLowerCase();
    const L = D.CATALOGO.filter((c) => (!U.marca || c.marca === U.marca) && (!q || (c.marca + ' ' + c.modelo).toLowerCase().indexOf(q) >= 0));
    if (!L.length) return '<div class="empty"><p>Nenhum modelo encontrado. Use “Cadastrar outra” para incluir a sua.</p></div>';
    return `<div class="table-wrap"><table>
      <thead><tr><th>Modelo</th><th>Mesa (mm)</th><th>Estrutura</th><th class="num">Potência média</th><th>Materiais ideais</th><th><span class="sr-only">Ações</span></th></tr></thead>
      <tbody>${L.map((c) => `<tr>
        <td><span class="strong">${esc(c.marca)} ${esc(c.modelo)}</span>${c.obs ? `<br><small class="muted">${esc(c.obs)}</small>` : ''}</td>
        <td>${c.volume.join(' × ')}</td><td>${esc(c.estrutura)}</td>
        <td class="num">${c.potencia} W<br><small class="muted">${c.potenciaFonte}</small></td>
        <td>${c.ideais.map((f) => `<span class="tag">${esc(f)}</span>`).join('')}</td>
        <td class="num"><button class="btn" data-act="add-imp" data-modelo="${esc(c.id)}">Adicionar</button></td></tr>`).join('')}</tbody></table></div>`;
  }

  function impTagsHTML(i) {
    return `<span class="field-label">Materiais</span> ${(i.ideais || []).map((f) => `<span class="tag ideal">${esc(f)}</span>`).join('')}${(i.possiveis || []).map((f) => `<span class="tag possivel">${esc(f)} com cuidados</span>`).join('')}`;
  }
  function impCalcHTML(i) {
    const h = C.custoHoraMaquina(i, S.params);
    return `<div class="hour-cost"><div>Energia por hora<b>${brl(h.energia)}</b></div><div>Desgaste por hora<b>${brl(h.desgaste)}</b></div><div class="total">Custo por hora<b>${brl(h.total)}</b></div></div>${C.n0(i.precoPago) ? '' : nota('atencao', 'Sem o preço pago, o desgaste da máquina fica de fora do orçamento.')}`;
  }
  function impCardHTML(i) {
    const cat = acha(D.CATALOGO, i.catalogoId);
    const dicaPot = cat && cat.potenciaFonte === 'fabricante' ? `O fabricante mediu cerca de ${cat.potencia} W com PLA.` : 'Estimativa. Uma tomada medidora dá o valor real.';
    const fams = Object.keys(D.FAMILIAS).map((f) => campo(esc(D.FAMILIAS[f]), `<select data-fam="${f}">${opcoes(COMPAT_TXT, C.compat(i, f))}</select>`)).join('');
    const unico = S.impressoras.length < 2;
    return `<article class="printer" data-coll="impressoras" data-id="${esc(i.id)}">
      <div class="printer-head">
        <div class="grow"><input data-f="apelido" value="${esc(i.apelido)}" aria-label="Nome da impressora" autocomplete="off"><p class="meta">${esc(i.marca)} ${esc(i.modelo)}, ${esc(String(i.estrutura || '').toLowerCase())}</p></div>
        <button class="btn btn-text danger" data-act="del-imp"${unico ? ' disabled title="Mantenha ao menos uma impressora"' : ''}>Excluir</button>
      </div>
      <div class="grid g2">
        ${campo('Preço que você pagou (R$)', numInp('data-f="precoPago"', i.precoPago, { ph: 'ex.: 3400' }))}
        ${campo('Vida útil (horas)', numInp('data-f="vidaUtilH"', i.vidaUtilH, { int: true }), 'Horas de impressão para a máquina se pagar.')}
        ${campo('Manutenção (R$ por hora)', numInp('data-f="manutencaoH"', i.manutencaoH), 'Bico, mesa PEI, tubo PTFE, correias.')}
        ${campo('Potência média (W)', numInp('data-f="potencia"', i.potencia, { int: true }), dicaPot)}
        <div class="field span2"><span class="field-label">Mesa X × Y × Z (mm)</span>
          <div class="dims">${[0, 1, 2].map((k) => `<input type="text" inputmode="numeric" data-tipo="num" data-f="volume.${k}" value="${esc(fmtIn(i.volume[k]))}" aria-label="${'XYZ'[k]} em mm" autocomplete="off">`).join('<span aria-hidden="true">×</span>')}</div>
        </div>
      </div>
      <div class="tags-line" data-calc="imptags:${esc(i.id)}">${impTagsHTML(i)}</div>
      <details class="fam"><summary>Ajustar materiais desta máquina</summary><div class="grid g2">${fams}</div></details>
      <div data-calc="imp:${esc(i.id)}">${impCalcHTML(i)}</div>
    </article>`;
  }
  function setFam(imp, f, v) {
    imp.ideais = (imp.ideais || []).filter((x) => x !== f);
    imp.possiveis = (imp.possiveis || []).filter((x) => x !== f);
    if (v === 'ideal') imp.ideais.push(f); else if (v === 'possivel') imp.possiveis.push(f);
  }

  /* ================= MATERIAIS ================= */
  function viewMateriais() {
    const temA1 = S.impressoras.some((i) => /^bambu-a1/.test(i.catalogoId || ''));
    return `<div class="page">
    <header class="page-head">
      <div><h1>Materiais</h1><p class="lede">Coloque o preço do kg já com o frete da compra. Só os materiais ativos aparecem no orçamento e na sua política.</p></div>
      <div class="head-actions"><button class="btn" data-act="add-mat">Adicionar material</button></div>
    </header>
    ${temA1 ? '<p class="note atencao wide">Na Bambu Lab A1, o fabricante indica PLA, PETG, TPU e PVA. ABS e ASA aparecem como não recomendados: sem câmara fechada a peça empena e os vapores ficam no ambiente. Por isso eles começam desativados.</p>' : ''}
    <section class="panel"><div class="table-wrap"><table>
      <thead><tr><th>Ativo</th><th>Nome</th><th>Tipo</th><th class="num">Preço do kg (R$)</th><th class="num">Custo por grama</th><th>Nas suas impressoras</th><th><span class="sr-only">Ações</span></th></tr></thead>
      <tbody>${S.materiais.map(matRowHTML).join('')}</tbody></table></div></section></div>`;
  }
  const matCalcHTML = (m) => `R$ ${num(C.n0(m.precoKg) / 1000, 3)}`;
  const matCompatHTML = (m) => S.impressoras.map((i) => { const c = C.compat(i, m.familia); return `<span class="tag ${c}">${esc(apelido(i))}: ${COMPAT_TXT[c]}</span>`; }).join('');
  function matRowHTML(m) {
    return `<tr data-coll="materiais" data-id="${esc(m.id)}">
      <td><input type="checkbox" data-f="ativo"${m.ativo ? ' checked' : ''} aria-label="${esc(m.nome)} ativo"></td>
      <td><input class="w-m" data-f="nome" value="${esc(m.nome)}" aria-label="Nome do material" autocomplete="off"></td>
      <td><select data-f="familia" aria-label="Tipo">${opcoes(D.FAMILIAS, m.familia)}</select></td>
      <td class="num"><input type="text" inputmode="decimal" data-tipo="num" class="w-s" data-f="precoKg" value="${esc(fmtIn(m.precoKg))}" aria-label="Preço do kg" autocomplete="off"></td>
      <td class="num" data-calc="mat:${esc(m.id)}">${matCalcHTML(m)}</td>
      <td data-calc="matcompat:${esc(m.id)}">${matCompatHTML(m)}</td>
      <td><button class="btn btn-text danger" data-act="del-mat"${S.materiais.length < 2 ? ' disabled' : ''}>Excluir</button></td></tr>`;
  }

  /* ================= EMPRESA E EQUIPE ================= */
  function viewEmpresa() {
    const e = S.empresa;
    const t = (k, label, ph, dica, extra, cls) => campo(label, inp('empresa.' + k, e[k], ph, extra), dica, cls);
    const n = (k, label, dica) => campo(label, numInp(`data-bind="empresa.${k}"`, e[k], { int: true }), dica);
    const chk = (k, label, dica) => `<label class="check"><input type="checkbox" data-bind="empresa.${k}"${e[k] ? ' checked' : ''}><span>${label}${dica ? `<small>${dica}</small>` : ''}</span></label>`;
    return `<div class="page">
    <header class="page-head"><div><h1>Empresa e equipe</h1><p class="lede">Estes dados aparecem no PDF, na mensagem do WhatsApp e na página “O que atendemos”. Ficam só neste navegador.</p></div></header>
    ${empresaValida() ? '' : `<div class="banner" role="alert"><p><b>Faltam dados da empresa.</b> Sem nome, cidade e um contato (WhatsApp ou e-mail), não dá para gerar orçamentos.</p></div>`}
    <div class="two-col"><div>
      <section class="panel"><h2>Identidade</h2><div class="grid g2">
        ${t('nome', 'Nome da empresa', 'Sua empresa')}
        ${t('slogan', 'Frase curta', 'O que você faz, em uma linha')}
        <div class="field"><span class="field-label">Logo</span>
          <div class="logo-row">${imgLogo(e.logo, 'Logo atual')}<label class="btn file-btn">${e.logo ? 'Trocar logo' : 'Enviar logo'}<input type="file" accept="image/*" data-file="logo" class="sr-only"></label>${e.logo ? '<button class="btn btn-text danger" data-act="logo-remover">Remover</button>' : ''}</div>
          <small>PNG, JPG ou SVG, de preferência quadrado.</small></div>
        <div class="field"><span class="field-label">Cor da marca</span>
          <div class="color-row"><input type="color" data-bind="empresa.cor" value="${esc(corUI(e.cor))}" aria-label="Escolher cor"><input type="text" data-bind="empresa.cor" value="${esc(e.cor)}" maxlength="7" placeholder="#RRGGBB" aria-label="Cor em hexadecimal" autocomplete="off"></div>
          <small>Sem cor escolhida, o PDF sai em tons neutros.</small></div>
        ${t('prefixo', 'Prefixo dos orçamentos', 'ORC', `Gera números como ${esc(String(e.prefixo || 'ORC').toUpperCase())}-${new Date().getFullYear()}-0001.`, 'maxlength="6"')}
      </div></section>

      <section class="panel"><div class="panel-head"><div><h2>Equipe</h2><p class="panel-sub">Quem faz orçamentos. A pessoa escolhida em “Feito por” assina o PDF e a mensagem.</p></div><button class="btn" data-act="add-eq">Adicionar pessoa</button></div>
        <div class="team">${S.equipe.map((m) => `<div class="team-row" data-coll="equipe" data-id="${esc(m.id)}">
          ${campo('Nome', `<input data-f="nome" value="${esc(m.nome)}" placeholder="Nome e sobrenome" autocomplete="off">`)}
          ${campo('Função', `<input data-f="cargo" value="${esc(m.cargo)}" placeholder="ex.: Modelagem e impressão 3D" autocomplete="off">`)}
          ${campo('WhatsApp', `<input data-f="whatsapp" value="${esc(m.whatsapp)}" placeholder="Se for diferente do da empresa" inputmode="tel" autocomplete="off">`)}
          ${campo('E-mail', `<input data-f="email" value="${esc(m.email)}" placeholder="opcional" inputmode="email" autocomplete="off">`)}
          <button class="btn btn-text danger" data-act="del-eq"${S.equipe.length < 2 ? ' disabled title="Mantenha ao menos uma pessoa"' : ''}>Excluir</button>
        </div>`).join('')}</div>
      </section>

      <section class="panel"><h2>Contato</h2><div class="grid g2">
        ${t('whatsapp', 'WhatsApp', '(31) 9 9999-9999', '', 'inputmode="tel"')}
        ${t('instagram', 'Instagram', '@suaempresa')}
        ${t('email', 'E-mail', 'contato@suaempresa.com.br', '', 'inputmode="email"')}
        ${t('site', 'Site', 'suaempresa.com.br')}
        ${t('cidade', 'Cidade', 'Belo Horizonte – MG')}
        ${t('documento', 'CPF ou CNPJ (opcional)', '', 'Aparece no rodapé do PDF.')}
      </div></section>

      <section class="panel"><h2>O que você atende</h2>
        <p class="panel-note">Materiais, tamanho máximo e valor da modelagem saem dos outros cadastros.</p>
        <div class="grid g2">
          <div class="field"><span class="field-label">Prazo padrão (dias úteis)</span>
            <div class="pair">${numInp('data-bind="empresa.prazoMin"', e.prazoMin, { int: true, extra: 'aria-label="Prazo mínimo"' })}<span>a</span>${numInp('data-bind="empresa.prazoMax"', e.prazoMax, { int: true, extra: 'aria-label="Prazo máximo"' })}</div>
            <small>Contado da aprovação e do pagamento.</small></div>
          ${n('ajustesInclusos', 'Ajustes inclusos no modelo', 'Rodadas de correção sem custo extra.')}
          ${n('validadeDias', 'Validade do orçamento (dias)', 'Filamento e energia mudam de preço.')}
          <div class="field">${chk('pecaPiloto', 'Aprove a primeira peça', 'Imprime uma peça-piloto antes do restante do pedido.')}</div>
          ${campo('Como explicar a peça-piloto ao cliente', `<textarea rows="2" data-bind="empresa.pecaPilotoTexto">${esc(e.pecaPilotoTexto)}</textarea>`, '', 'span2')}
        </div></section>

      <section class="panel"><h2>Pagamento</h2><div class="grid g2">
        ${t('pix', 'Chave Pix', 'CPF, CNPJ, e-mail, celular ou chave aleatória')}
        <div class="field">${chk('aceitaCartao', 'Aceito cartão', `Soma ${fmtNum(S.params.taxaCartaoPct)}% ao total, conforme a Tabela de preços.`)}</div>
        ${campo('Condições de pagamento', `<textarea rows="3" data-bind="empresa.pagamentoTexto">${esc(e.pagamentoTexto)}</textarea>`, '', 'span2')}
      </div></section>

      <section class="panel"><h2>Entrega</h2><div class="grid g2">
        <div class="field">${chk('retiradaAtivo', 'Retirada', 'Sem custo para o cliente.')}</div>
        ${t('retiradaLocal', 'Ponto de retirada', 'ex.: estação de metrô, faculdade')}
        <div class="field">${chk('correiosAtivo', 'Correios (PAC ou SEDEX)', 'Frete calculado pelo CEP do cliente.')}</div>
        <div class="field">${chk('appAtivo', 'Entrega por aplicativo', 'Uber Flash, 99 Entrega ou similar. O cliente paga a corrida.')}</div>
      </div></section>

      <section class="panel"><h2>Observações padrão</h2>${campo('Texto que entra em todo orçamento novo', `<textarea rows="3" data-bind="empresa.observacoes">${esc(e.observacoes)}</textarea>`)}</section>

      <section class="panel" id="dados" aria-labelledby="h-dados">${dadosHTML()}</section>
    </div>
    <aside id="politica">${politicaPreviewHTML()}</aside>
    </div></div>`;
  }

  function dadosHTML() {
    const ub = S.ui.ultimoBackup ? ` Último backup: ${fmtData(S.ui.ultimoBackup)}.` : '';
    const uso = usoArmazenamento();
    return `<h2 id="h-dados">Backup e dados deste navegador</h2>
      <p class="panel-note">Tudo fica só neste navegador.<b> Backup</b> leva tudo, inclusive o histórico com nomes e telefones de clientes: guarde em lugar seguro.<b> Configuração</b> leva só a empresa e a tabela de preços, sem clientes: serve para preparar outro aparelho.${ub}</p>
      <p class="uso">Espaço usado: <b>${pct(uso)}</b>${uso > 0.6 ? ' (exporte um backup e exclua orçamentos antigos)' : ''}</p>
      <div class="toolbar"><button class="btn" data-act="exportar">Exportar backup</button><button class="btn" data-act="exportar-config">Exportar configuração</button><button class="btn" data-act="importar">Importar arquivo</button></div>
      <div class="toolbar"><button class="btn btn-text" data-act="restaurar">Restaurar tabela de preços padrão</button></div>
      <details class="mais"><summary>Apagar os dados deste navegador</summary>
        <p class="panel-note">Use num computador compartilhado ou para recomeçar do zero. Exporte um backup antes: depois de apagado, não dá para recuperar.</p>
        <div id="apagar-area">${apagarAreaHTML(false)}</div>
      </details>`;
  }
  function apagarAreaHTML(confirmando) {
    if (!confirmando) return '<button class="btn btn-text danger" data-act="apagar-dados">Apagar tudo deste navegador</button>';
    return `<div class="confirma" role="alert"><p><b>Tem certeza?</b> A empresa, a tabela e todos os ${S.orcamentos.length} orçamentos serão apagados deste navegador.</p>
      <div class="head-actions"><button class="btn" data-act="apagar-cancelar">Cancelar</button><button class="btn btn-danger" data-act="apagar-dados-sim">Sim, apagar tudo</button></div></div>`;
  }

  function politicaPreviewHTML() {
    const e = S.empresa;
    return `<div class="policy">
      <div class="policy-top"><span class="field-label">Prévia para clientes</span><h2>O que a ${esc(e.nome || 'empresa')} atende</h2>${e.slogan ? `<p>${esc(e.slogan)}</p>` : ''}</div>
      <dl>${politicaItens().map((l) => `<dt>${l[0]}</dt><dd>${esc(l[1])}</dd>`).join('')}</dl>
      <div class="actions-light"><button class="btn btn-solid" data-act="pdf-politica">Ver PDF</button><button class="btn" data-act="copiar-politica">Copiar texto</button></div>
    </div>`;
  }
  function politicaTexto() {
    const L = [`*O que a ${S.empresa.nome} atende*`, ''];
    politicaItens().forEach((l) => L.push(`*${l[0]}:* ${l[1]}`));
    const c = contatos(); if (c.length) L.push('', c.join('\n'));
    return L.join('\n');
  }

  /* ================= DOCUMENTOS (PDF) ================= */
  function docMarca() {
    const e = S.empresa;
    return `<div class="doc-brand">${imgLogo(e.logo, e.nome) || `<span class="mono">${esc(iniciais(e.nome))}</span>`}<div><strong>${esc(e.nome)}</strong>${e.slogan ? `<span>${esc(e.slogan)}</span>` : ''}</div></div>`;
  }
  function docRodape() {
    const e = S.empresa;
    const esq = contatos().map(esc).join('<br>');
    const dir = [`<b>${esc(e.nome)}</b>`, esc(e.cidade), e.documento ? `CPF/CNPJ ${esc(e.documento)}` : ''].filter(Boolean).join('<br>');
    return `<footer class="doc-foot"><div>${esq || '&nbsp;'}</div><div class="dir">${dir}</div></footer>`;
  }
  const fmtDims = (d) => { const v = (d || []).map(C.n0); return v.every((x) => x > 0) ? v.map((x) => fmtNum(x)).join(' × ') + ' mm' : ''; };

  function docOrcamentoHTML(o, r) {
    const e = S.empresa, resp = responsavel(o), p = ctxDe(o).params;
    const emissao = o.emitidoEm || hojeISO();
    const pecas = r.itens.filter((x) => x.preco > 0).map((x, i) => {
      const it = o.itens.find((y) => y.id === x.id) || {};
      const spec = [x.mat ? x.mat.nome : '', it.cor, fmtDims(it.dims), C.n0(it.acabamentoMin) > 0 ? 'com acabamento' : ''].filter(Boolean).join(', ');
      return `<tr><td><b>${esc(it.descricao || 'Peça ' + (i + 1))}</b>${spec ? `<small>${esc(spec)}</small>` : ''}</td><td class="num">${x.qtd}</td><td class="num">${brl(x.precoUnit)}</td><td class="num">${brl(x.precoLinha)}</td></tr>`;
    }).join('');
    const servs = r.servicos.filter((s) => s.total > 0).map((s, i) => `<tr><td><b>${esc(s.descricao || 'Modelagem 3D ' + (i + 1))}</b><small>Arquivo 3D pronto para impressão</small></td><td class="num">${fmtHoras(s.horas)}</td><td class="num">${brl(s.valorHora)}</td><td class="num">${brl(s.total)}</td></tr>`).join('');
    const T = [];
    if (r.temPecas) T.push(['Peças impressas', brl(r.bruto)]);
    if (r.desconto) T.push([`Desconto nas peças (${fmtNum(r.descontoPct)}%)`, '− ' + brl(r.desconto)]);
    if (r.ajusteMinimo) T.push([`Ajuste para o pedido mínimo (${brl(p.pedidoMinimo)})`, brl(r.ajusteMinimo)]);
    if (r.servicosTotal) T.push(['Modelagem 3D', brl(r.servicosTotal)]);
    if (o.entrega !== 'retirada') T.push([freteLabel(o.entrega), r.frete ? brl(r.frete) : 'a definir']);
    if (r.taxaCartao) T.push(['Taxa do cartão', brl(r.taxaCartao)]);
    const termos = [['Prazo', o.prazo || textoPrazo()], ['Ajustes', cap(textoAjustes()) + '.']];
    if (e.pecaPiloto && r.temPecas) termos.push(['Aprove a primeira peça', e.pecaPilotoTexto]);
    termos.push(['Pagamento', textoPagamento(o)]);
    termos.push(['Entrega', entregaLabel(o.entrega)]);
    termos.push(['Validade', `Valores válidos até ${fmtData(addDias(emissao, e.validadeDias))}.`]);
    if (o.observacoes) termos.push(['Observações', o.observacoes]);
    const cli = o.cliente || {};
    const respCont = [resp.whatsapp || e.whatsapp ? `WhatsApp ${resp.whatsapp || e.whatsapp}` : '', resp.email || e.email].filter(Boolean);
    return `<article class="doc">
      <header class="doc-head">${docMarca()}
        <div class="doc-meta"><h1>Orçamento</h1><p class="doc-num">${esc(o.numero || '')}</p><p>Emitido em ${fmtData(emissao)}</p></div>
      </header>
      <div class="doc-rule"></div>
      <div class="doc-cols">
        <div><p class="doc-label">Cliente</p><p class="nome">${esc(cli.nome || 'Cliente')}</p>${cli.contato ? `<p>${esc(cli.contato)}</p>` : ''}${cli.cidade ? `<p>${esc(cli.cidade)}</p>` : ''}</div>
        <div><p class="doc-label">Orçamento feito por</p><p class="nome">${esc(resp.nome || e.nome)}</p>${resp.cargo ? `<p>${esc(resp.cargo)}, ${esc(e.nome)}</p>` : ''}${respCont.map((c) => `<p>${esc(c)}</p>`).join('')}</div>
      </div>
      ${pecas ? `<p class="doc-section">Peças impressas</p><table><thead><tr><th>Peça</th><th class="num">Qtd.</th><th class="num">Unitário</th><th class="num">Total</th></tr></thead><tbody>${pecas}</tbody></table>` : ''}
      ${servs ? `<p class="doc-section">Modelagem 3D <small>(serviço cobrado por hora)</small></p><table><thead><tr><th>Serviço</th><th class="num">Horas</th><th class="num">Valor da hora</th><th class="num">Total</th></tr></thead><tbody>${servs}</tbody></table>` : ''}
      <dl class="doc-totals">${T.map((l) => `<dt>${esc(l[0])}</dt><dd>${l[1]}</dd>`).join('')}<dt class="grand">Total</dt><dd class="grand">${brl(r.total)}</dd></dl>
      <section class="doc-terms"><p class="doc-section first">Condições</p><dl>${termos.map((l) => `<dt>${esc(l[0])}</dt><dd>${esc(l[1])}</dd>`).join('')}</dl></section>
      <div class="doc-sign"><div>De acordo: ${esc(cli.nome || 'cliente')}</div><div>Data</div></div>
      ${docRodape()}
    </article>`;
  }

  function docPoliticaHTML() {
    return `<article class="doc doc-policy">
      <header class="doc-head">${docMarca()}<div class="doc-meta"><h1>O que atendemos</h1><p>Atualizado em ${fmtData(hojeISO())}</p></div></header>
      <div class="doc-rule"></div>
      <section class="doc-terms"><dl>${politicaItens().map((l) => `<dt>${esc(l[0])}</dt><dd>${esc(l[1])}</dd>`).join('')}</dl></section>
      <p class="doc-note">Orçamento sem compromisso: envie o arquivo STL ou uma foto com as medidas da peça.</p>
      ${docRodape()}
    </article>`;
  }

  function docTabelaHTML() {
    const mat = acha(S.materiais, U.tabMat), imp = acha(S.impressoras, U.tabImp), p = S.params;
    const linhas = S.exemplos.map((ex) => `<tr><td><b>${esc(ex.nome)}</b><small>${fmtNum(C.n0(ex.gramas))} g, cerca de ${fmtHoras(C.parseTempo(ex.tempo))} de impressão</small></td><td class="num">${exCalc(ex, 'avulso')}</td><td class="num">${exCalc(ex, 'lote')}</td></tr>`).join('');
    return `<article class="doc">
      <header class="doc-head">${docMarca()}<div class="doc-meta"><h1>Tabela de preços</h1><p class="doc-num">${esc(mat ? mat.nome : '')}</p><p>Atualizada em ${fmtData(hojeISO())}</p></div></header>
      <div class="doc-rule"></div>
      <table><thead><tr><th>Exemplo de peça</th><th class="num">Uma unidade</th><th class="num">Cada, em lote de 10</th></tr></thead><tbody>${linhas}</tbody></table>
      <section class="doc-terms"><p class="doc-section first">Como calculamos</p><dl>
        <dt>Peças</dt><dd>Gramas de material e horas de máquina de cada peça, com reserva para falhas.</dd>
        <dt>Modelagem 3D</dt><dd>${brl(p.horaModelagem)} por hora trabalhada, quando você não tem o arquivo pronto.</dd>
        <dt>Acabamento</dt><dd>${brl(p.horaOperacao)} por hora (lixar, colar, montar).</dd>
        <dt>Pedido mínimo</dt><dd>${brl(p.pedidoMinimo)} em peças, sem contar frete e modelagem.</dd>
        <dt>Prazo padrão</dt><dd>${esc(textoPrazo())}.</dd>
      </dl></section>
      <p class="doc-note">Valores de referência${imp ? ` para impressão na ${esc(apelido(imp))}` : ''}. O preço final sai do orçamento com o seu arquivo.</p>
      ${docRodape()}
    </article>`;
  }

  /* Prévia: o usuário vê exatamente o que o cliente vai receber antes de salvar. */
  let pvTitulo = '', pvFocoAntes = null;
  function abrirPreview(html, titulo) {
    const raiz = $('#print-root'), cor = corDoc(S.empresa.cor);
    raiz.style.setProperty('--accent', cor);
    raiz.style.setProperty('--on-accent', textoSobre(cor));
    raiz.innerHTML = html;
    pvTitulo = titulo;
    pvFocoAntes = document.activeElement;
    $('#preview').hidden = false;
    document.body.classList.add('preview-open');
    $('.preview-scroll').scrollTop = 0;
    $('[data-pv="salvar"]').focus();
  }
  function fecharPreview() {
    $('#preview').hidden = true;
    document.body.classList.remove('preview-open');
    $('#print-root').innerHTML = '';
    if (pvFocoAntes && document.contains(pvFocoAntes)) pvFocoAntes.focus();
  }
  function salvarPDF() {
    const anterior = document.title;
    document.title = pvTitulo;
    const volta = () => { document.title = anterior; window.removeEventListener('afterprint', volta); };
    window.addEventListener('afterprint', volta);
    const pend = $$('#print-root img').filter((i) => !i.complete);
    Promise.all(pend.map((i) => new Promise((ok) => { i.onload = i.onerror = ok; })))
      .then(() => (document.fonts && document.fonts.ready) || null)
      .then(() => window.print());
  }
  const nomeArquivo = (o) => `${o.numero || 'orcamento'}${o.cliente && o.cliente.nome ? ' - ' + o.cliente.nome : ''}`;

  /* ================= WHATSAPP ================= */
  function foneWhats(s) {
    let d = String(s || '').replace(/\D/g, '');
    if (d.length === 10 || d.length === 11) d = '55' + d;
    return d.length >= 12 && d.length <= 13 ? d : '';
  }

  function textoWhats(o, r) {
    const e = S.empresa, resp = responsavel(o), L = [];
    const nome = String((o.cliente && o.cliente.nome) || '').trim().split(/\s+/)[0];
    L.push(`*Orçamento ${o.numero} | ${e.nome}*`);
    L.push(nome ? `Olá, ${nome}! Segue o orçamento:` : 'Olá! Segue o orçamento:');
    const pecas = r.itens.filter((x) => x.preco > 0);
    if (pecas.length) {
      L.push('', '*Peças impressas*');
      pecas.forEach((x, i) => {
        const it = o.itens.find((y) => y.id === x.id) || {};
        const det = [x.mat && x.mat.nome, it.cor].filter(Boolean).join(' ');
        L.push(`• ${x.qtd > 1 ? x.qtd + '× ' : ''}${it.descricao || 'Peça ' + (i + 1)}${det ? ` (${det})` : ''}: ${brl(x.precoLinha)}`);
      });
      if (r.desconto) L.push(`Desconto nas peças (${fmtNum(r.descontoPct)}%): −${brl(r.desconto)}`);
      if (r.ajusteMinimo) L.push(`Ajuste para o pedido mínimo: ${brl(r.ajusteMinimo)}`);
    }
    const servs = r.servicos.filter((s) => s.total > 0);
    if (servs.length) {
      L.push('', '*Modelagem 3D*');
      servs.forEach((s, i) => L.push(`• ${s.descricao || 'Modelagem ' + (i + 1)}: ${fmtHoras(s.horas)} × ${brl(s.valorHora)} = ${brl(s.total)}`));
    }
    L.push('');
    if (o.entrega !== 'retirada') L.push(`${freteLabel(o.entrega)}: ${r.frete ? brl(r.frete) : 'a definir'}`);
    if (r.taxaCartao) L.push(`Taxa do cartão: ${brl(r.taxaCartao)}`);
    L.push(`*Total: ${brl(r.total)}*`, '');
    L.push(`Prazo: ${o.prazo || textoPrazo()}`);
    L.push(`Ajustes: ${textoAjustes()}`);
    if (e.pecaPiloto && r.temPecas) L.push(`Aprove a primeira peça: ${e.pecaPilotoTexto}`);
    L.push(`Pagamento: ${textoPagamento(o)}`);
    if (o.entrega === 'retirada') L.push(`Entrega: ${entregaLabel('retirada')}`);
    if (o.observacoes) L.push(`Obs.: ${o.observacoes}`);
    L.push(`Válido até ${fmtData(addDias(o.emitidoEm || hojeISO(), e.validadeDias))}.`);
    L.push('', 'Qualquer dúvida, é só me chamar.', `${resp.nome ? resp.nome.split(/\s+/)[0] + ', ' : ''}${e.nome}`);
    return L.join('\n');
  }

  function copiar(txt) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(txt).catch(() => copiarAntigo(txt));
    return Promise.resolve(copiarAntigo(txt));
  }
  function copiarAntigo(txt) {
    const t = document.createElement('textarea');
    t.value = txt; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); } catch (e) { /* sem cópia */ }
    t.remove();
  }

  /* ================= LOGO E BACKUP ================= */
  function lerLogo(file) {
    if (!file) return;
    if (!/^image\//.test(file.type)) { toast('Escolha um arquivo de imagem (PNG, JPG ou SVG).'); return; }
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 360, w = img.naturalWidth || max, h = img.naturalHeight || max;
        const k = Math.min(1, max / Math.max(w, h));
        const cv = document.createElement('canvas');
        cv.width = Math.round(w * k); cv.height = Math.round(h * k);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        const antes = S.empresa.logo;
        S.empresa.logo = cv.toDataURL('image/png');
        salvarJa(); render();
        toast('Logo atualizado.', { label: 'Desfazer', fn: () => { S.empresa.logo = antes; salvarJa(); render(); } });
      };
      img.onerror = () => toast('Não consegui ler essa imagem. Tente um PNG ou JPG.');
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  }

  function baixar(conteudo, nome) {
    const blob = new Blob([conteudo], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nome;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  }

  function exportar() {
    S.ui.ultimoBackup = hojeISO();
    salvarJa();
    pedirPersistencia();
    baixar(JSON.stringify(S, null, 2), `backup-orcamentos-${slug(S.empresa.nome)}-${hojeISO()}.json`);
    toast('Backup salvo nos downloads. Ele tem dados de clientes: guarde em lugar seguro.');
    if (rota() === 'historico' || rota() === 'empresa') render();
  }

  function exportarConfig() {
    const cfg = {
      tipo: 'configuracao-orcamento3d',
      descricao: `Configuração da ${S.empresa.nome || 'empresa'}. Importe na tela de cadastro ou em Empresa e equipe.`,
      versao: 3, empresa: S.empresa, equipe: S.equipe, params: S.params, materiais: S.materiais, impressoras: S.impressoras, exemplos: S.exemplos
    };
    baixar(JSON.stringify(cfg, null, 2), `configuracao-${slug(S.empresa.nome)}.json`);
    toast('Configuração salva nos downloads. Ela não tem dados de clientes.');
  }

  function importar(file) {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast('Arquivo grande demais para ser um backup desta plataforma.'); return; }
    const fr = new FileReader();
    fr.onload = () => {
      let dados = null;
      try { dados = lerJSON(fr.result); } catch (e) { dados = null; }
      if (!dados || typeof dados !== 'object' || Array.isArray(dados) || !dados.empresa || !dados.params) { toast('Esse arquivo não é um backup nem uma configuração desta plataforma.'); return; }
      aplicarBackup(dados);
    };
    fr.onerror = () => toast('Não consegui ler esse arquivo.');
    fr.readAsText(file);
  }

  function aplicarBackup(dados) {
    const config = dados.tipo === 'configuracao-orcamento3d';
    const estavaCadastrada = S.ui.empresaCadastrada;
    comDesfazer(config ? 'Configuração importada. Seus orçamentos continuam.' : 'Backup importado.', () => {
      // configuração: troca empresa e tabela, mas mantém histórico, numeração e o estado do cadastro
      const origem = config ? Object.assign({}, dados, { orcamentos: S.orcamentos, atual: S.atual, seq: S.seq, ui: S.ui }) : dados;
      S = mesclar(D.estadoInicial(), origem);
      garantirAtual();
    });
    if (!S.ui.empresaCadastrada) toast(estavaCadastrada ? 'Importado. Confira os dados da empresa.' : 'Dados importados. Confira e conclua o cadastro.');
  }

  /* ================= CADASTRO DA EMPRESA (primeiro acesso) =================
     Nenhum nome, logo ou contato vem de fábrica. Até a empresa se cadastrar, a plataforma
     só mostra esta tela: não dá para montar orçamento nem gerar PDF. */
  function faltasCadastro() {
    const e = S.empresa, eq = S.equipe[0] || {}, F = [];
    if (!preenchido(e.nome)) F.push(['nome da empresa', 'empresa.nome']);
    if (!preenchido(eq.nome)) F.push(['seu nome', 'equipe.0.nome']);
    if (!preenchido(e.cidade)) F.push(['cidade', 'empresa.cidade']);
    if (!preenchido(e.whatsapp) && !preenchido(e.email)) F.push(['WhatsApp ou e-mail', 'empresa.whatsapp']);
    return F;
  }
  const empresaValida = () => { const e = S.empresa; return preenchido(e.nome) && preenchido(e.cidade) && (preenchido(e.whatsapp) || preenchido(e.email)); };

  function viewCadastro() {
    const e = S.empresa, eq = S.equipe[0], imp = S.impressoras[0];
    const ob = '<span class="req">obrigatório</span>';
    const marcas = [...new Set(D.CATALOGO.map((c) => c.marca))];
    const optImp = (imp && !imp.catalogoId ? `<option value="" selected>${esc(apelido(imp))}</option>` : '') +
      marcas.map((m) => `<optgroup label="${esc(m)}">${D.CATALOGO.filter((c) => c.marca === m).map((c) => `<option value="${esc(c.id)}"${imp && imp.catalogoId === c.id ? ' selected' : ''}>${esc(c.marca)} ${esc(c.modelo)}</option>`).join('')}</optgroup>`).join('');
    return `<div class="cad">
      <header class="cad-brand"><img src="assets/favicon.svg" alt=""><div><strong>Orçamentos 3D</strong><span>Ferramenta gratuita da Scapus Lab</span></div></header>
      <div class="cad-intro">
        <h1>Cadastre a sua empresa</h1>
        <p class="lede">É a primeira vez que este navegador abre a plataforma. O nome, o logo e os contatos que você cadastrar aqui vão nos seus orçamentos em PDF e nas mensagens para clientes.</p>
        <p class="cad-priv">Os dados ficam guardados só neste navegador. Ninguém mais vê, e ninguém gera orçamentos com eles.</p>
      </div>
      <div class="banner"><p><b>Já usa em outro aparelho?</b> Importe o backup ou a configuração da sua empresa e só confira os dados.</p><div class="head-actions"><button class="btn" data-act="importar">Importar arquivo</button></div></div>
      <section class="panel" aria-labelledby="cad-h1"><h2 id="cad-h1">Sua empresa</h2><div class="grid g2">
        ${campo('Nome da empresa' + ob, inp('empresa.nome', e.nome, 'Como aparece para o cliente', 'autocomplete="organization" aria-required="true"'))}
        ${campo('Cidade' + ob, inp('empresa.cidade', e.cidade, 'ex.: Belo Horizonte – MG', 'autocomplete="address-level2" aria-required="true"'))}
        <div class="field"><span class="field-label">Logo</span>
          <div class="logo-row">${imgLogo(e.logo, 'Logo atual')}<label class="btn file-btn">${e.logo ? 'Trocar logo' : 'Enviar logo'}<input type="file" accept="image/*" data-file="logo" class="sr-only"></label>${e.logo ? '<button class="btn btn-text danger" data-act="logo-remover">Remover</button>' : ''}</div>
          <small>Opcional. PNG, JPG ou SVG. Sem logo, o PDF usa as iniciais da empresa.</small></div>
        <div class="field"><span class="field-label">Cor da marca</span>
          <div class="color-row"><input type="color" data-bind="empresa.cor" value="${esc(corUI(e.cor))}" aria-label="Escolher cor"><input type="text" data-bind="empresa.cor" value="${esc(e.cor)}" maxlength="7" placeholder="#RRGGBB" aria-label="Cor em hexadecimal" autocomplete="off"></div>
          <small>Opcional. Sem cor, o PDF sai em tons neutros.</small></div>
        ${campo('Frase curta', inp('empresa.slogan', e.slogan, 'ex.: Impressão 3D sob medida'), 'Opcional. Aparece embaixo do nome no PDF.')}
        ${campo('CPF ou CNPJ', inp('empresa.documento', e.documento, ''), 'Opcional. Vai no rodapé do PDF.')}
      </div></section>
      <section class="panel" aria-labelledby="cad-h2"><h2 id="cad-h2">Contato que vai no orçamento</h2><p class="panel-note">Preencha pelo menos o WhatsApp ou o e-mail da empresa.</p><div class="grid g2">
        ${campo('Seu nome' + ob, inp('equipe.0.nome', eq.nome, 'Quem assina os orçamentos', 'autocomplete="name" aria-required="true"'))}
        ${campo('Sua função', inp('equipe.0.cargo', eq.cargo, 'ex.: Modelagem e impressão 3D'))}
        ${campo('WhatsApp da empresa', inp('empresa.whatsapp', e.whatsapp, '(31) 9 9999-9999', 'inputmode="tel" autocomplete="tel"'))}
        ${campo('E-mail', inp('empresa.email', e.email, 'contato@suaempresa.com.br', 'inputmode="email" autocomplete="email"'))}
        ${campo('Instagram', inp('empresa.instagram', e.instagram, '@suaempresa'))}
        ${campo('Site', inp('empresa.site', e.site, 'suaempresa.com.br'))}
      </div></section>
      <section class="panel" aria-labelledby="cad-h3"><h2 id="cad-h3">Sua impressora</h2><p class="panel-note">Entra no custo por hora de cada peça. Dá para cadastrar outras depois, em Impressoras.</p><div class="grid g3">
        ${campo('Modelo', `<select data-cad-imp aria-label="Modelo da impressora">${optImp}</select>`, 'Não achou? Escolha a mais parecida e ajuste depois.')}
        ${campo('Preço que você pagou (R$)', numInp('data-bind="impressoras.0.precoPago"', imp ? imp.precoPago : '', { ph: 'ex.: 3400' }), 'Para calcular o desgaste da máquina.')}
        ${campo('Energia (R$ por kWh)', numInp('data-bind="params.tarifaKwh"', S.params.tarifaKwh), 'Total da conta de luz dividido pelos kWh do mês.')}
      </div></section>
      <section class="panel" aria-labelledby="cad-h4"><h2 id="cad-h4">Pagamento e retirada</h2><p class="panel-note">Opcional agora. Aparecem nas condições do orçamento.</p><div class="grid g2">
        ${campo('Chave Pix', inp('empresa.pix', e.pix, 'CPF, CNPJ, e-mail, celular ou aleatória'))}
        ${campo('Ponto de retirada', inp('empresa.retiradaLocal', e.retiradaLocal, 'ex.: estação de metrô, faculdade'))}
      </div></section>
      <div class="cad-fim" id="cad-fim">${cadFimHTML()}</div>
    </div>`;
  }

  function cadFimHTML() {
    const F = faltasCadastro();
    const falta = F.length ? `<p class="cad-falta">Falta preencher: ${F.map((f) => `<button type="button" class="link" data-act="ir" data-alvo="${esc(`[data-bind="${f[1]}"]`)}">${esc(f[0])}</button>`).join(', ')}.</p>` : '<p class="cad-ok">Tudo certo. Pode concluir.</p>';
    return `${falta}<button class="btn btn-solid btn-grande" data-act="cad-ok">Concluir cadastro</button><p class="cad-nota">Dá para mudar tudo depois, em Empresa e equipe.</p>`;
  }

  function trocarImpressoraCadastro(catId) {
    if (!catId || !acha(D.CATALOGO, catId)) return;
    const atual = S.impressoras[0];
    const extra = { precoPago: atual ? atual.precoPago : '' };
    if (atual) extra.id = atual.id;
    const nova = sanearImp(D.daCatalogo(catId, extra));
    if (atual) S.impressoras[0] = nova; else S.impressoras.unshift(nova);
    salvar();
  }

  function concluirCadastro() {
    const F = faltasCadastro();
    if (F.length) {
      irPara(`[data-bind="${F[0][1]}"]`);
      toast(`Falta preencher: ${listaPT(F.map((f) => f[0]))}.`);
      return;
    }
    const e = S.empresa;
    if (!preenchido(e.prefixo) || e.prefixo === 'ORC') {
      const p = slug(e.nome).replace(/-/g, '').toUpperCase().slice(0, 3);
      if (p.length >= 2) e.prefixo = p;
    }
    S.ui.empresaCadastrada = true;
    S.ui.ultimoResponsavel = S.equipe[0].id;
    if (!temConteudo(S.atual)) S.atual = novoOrcamento();
    salvarJa();
    pedirPersistencia();
    history.replaceState(null, '', '#orcamento');
    render();
    window.scrollTo(0, 0);
    toast(`${e.nome} cadastrada. Agora é só montar o primeiro orçamento.`);
  }

  function apagarDados() {
    try { localStorage.removeItem(KEY); } catch (e) { /* nada */ }
    S = mesclar(D.estadoInicial(), null);
    history.replaceState(null, '', '#orcamento');
    render();
    window.scrollTo(0, 0);
    toast('Dados apagados deste navegador.');
  }

  /* Erro inesperado: avisa sem travar a página (os dados já estão salvos). */
  let ultimoErro = 0;
  function falhou() {
    if (Date.now() - ultimoErro < 10000) return;
    ultimoErro = Date.now();
    try { toast('Algo deu errado nesta tela. Seus dados continuam salvos. Se algo parecer estranho, recarregue a página.'); } catch (e) { /* nada */ }
  }

  /* ================= ROTAS E REGIÕES ================= */
  const VIEWS = { orcamento: viewOrcamento, historico: viewHistorico, tabela: viewTabela, impressoras: viewImpressoras, materiais: viewMateriais, empresa: viewEmpresa };
  const REGIOES = {
    resumo: resumoHTML, entrega: entregaHTML, itens: itensHTML, servicos: servicosHTML, cliente: clienteHTML, mbar: mbarHTML,
    'hist-lista': histListaHTML, 'hist-stats': histStatsHTML,
    'tab-custos': tabCustosHTML, 'tab-rapida': tabRapidaHTML,
    catalogo: catalogoHTML, politica: politicaPreviewHTML, 'cad-fim': cadFimHTML
  };
  function rota() { const v = (location.hash || '#orcamento').slice(1); return VIEWS[v] ? v : 'orcamento'; }

  function aplicarMarca() {
    const e = S.empresa, cor = corUI(e.cor);
    document.documentElement.style.setProperty('--accent', cor);
    document.documentElement.style.setProperty('--on-accent', textoSobre(cor));
    $('#brand').innerHTML = `${imgLogo(e.logo, '') || `<span class="mono" aria-hidden="true">${esc(iniciais(e.nome))}</span>`}<span><span class="brand-name">${esc(e.nome || 'Sua empresa')}</span><span class="brand-sub">Orçamentos</span></span>`;
    document.title = S.ui.empresaCadastrada && e.nome ? `Orçamentos | ${e.nome}` : 'Orçamentos 3D | Scapus Lab';
    const pe = $('#side-foot');
    if (pe) pe.innerHTML = 'Tudo é salvo sozinho neste navegador. Faça backup em Empresa e equipe.<span class="credito">Orçamentos 3D, ferramenta da Scapus Lab</span>';
  }

  function assinatura(el) {
    if (!el || el === document.body || !el.closest || !el.closest('#main')) return null;
    const card = el.closest('[data-id]');
    return { bind: el.dataset.bind, f: el.dataset.f, ui: el.dataset.ui, fam: el.dataset.fam, act: el.dataset.act, id: card ? card.dataset.id : null, value: el.type === 'radio' ? el.value : null };
  }
  function restaurarFoco(a) {
    if (!a) return;
    let sel = a.bind ? `[data-bind="${a.bind}"]` : a.f ? `[data-f="${a.f}"]` : a.ui ? `[data-ui="${a.ui}"]` : a.fam ? `[data-fam="${a.fam}"]` : '';
    if (!sel) return;
    if (a.value !== null) sel += `[value="${CSS.escape(a.value)}"]`;
    const escopo = a.id ? document.querySelector(`#main [data-id="${CSS.escape(a.id)}"]`) : $('#main');
    const el = escopo && escopo.querySelector(sel);
    if (el && !el.disabled) el.focus({ preventScroll: true });
  }

  /* Proporções da pilha de custos aplicadas via CSSOM (a CSP não permite estilo inline no HTML). */
  const aplicarProporcoes = (raiz) => $$('[data-grow]', raiz || document).forEach((el) => { el.style.flexGrow = el.dataset.grow; });

  function render() {
    if (!S) return;
    garantirAtual();
    aplicarMarca();
    const main = $('#main');
    if (!S.ui.empresaCadastrada) {
      document.body.classList.add('onboarding');
      const a0 = assinatura(document.activeElement);
      main.innerHTML = viewCadastro();
      main.classList.remove('has-mbar');
      restaurarFoco(a0);
      return;
    }
    document.body.classList.remove('onboarding');
    const v = rota();
    $$('.nav a').forEach((a) => { if (a.dataset.view === v) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    const a = assinatura(document.activeElement);
    main.innerHTML = VIEWS[v]();
    main.classList.toggle('has-mbar', v === 'orcamento');
    aplicarProporcoes(main);
    restaurarFoco(a);
    indicarSalvo();
  }
  function atualizar(ids) {
    if (!S) return;
    const a = assinatura(document.activeElement);
    ids.forEach((id) => { const n = document.getElementById(id); if (n && REGIOES[id]) { n.innerHTML = REGIOES[id](); aplicarProporcoes(n); } });
    restaurarFoco(a);
  }

  function calcCelula(chave) {
    const [tipo, id, col] = chave.split(':');
    if (tipo === 'mat') { const m = acha(S.materiais, id); return m ? matCalcHTML(m) : ''; }
    if (tipo === 'matcompat') { const m = acha(S.materiais, id); return m ? matCompatHTML(m) : ''; }
    if (tipo === 'imp') { const i = acha(S.impressoras, id); return i ? impCalcHTML(i) : ''; }
    if (tipo === 'imptags') { const i = acha(S.impressoras, id); return i ? impTagsHTML(i) : ''; }
    if (tipo === 'ex') { const ex = acha(S.exemplos, id); return ex ? exCalc(ex, col) : ''; }
    return '';
  }
  const atualizarCalcs = () => $$('#main [data-calc]').forEach((el) => { el.innerHTML = calcCelula(el.dataset.calc); });

  function irPara(alvo) {
    if (alvo.charAt(0) === '#' && !/[\s\[]/.test(alvo)) { location.hash = alvo; return; }
    const el = $(alvo);
    if (!el) return;
    const det = el.closest('details'); if (det) det.open = true;
    el.scrollIntoView({ block: 'center', behavior: reduzMovimento() ? 'auto' : 'smooth' });
    el.focus({ preventScroll: true });
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
  }

  /* ================= EVENTOS ================= */
  const colecao = (nome) => ({ itens: S.atual.itens, servicos: S.atual.servicos, materiais: S.materiais, impressoras: S.impressoras, exemplos: S.exemplos, equipe: S.equipe }[nome]);
  const ehEscolha = (el) => el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'radio';
  function alvo(el) { const c = el.closest('[data-coll]'); return c ? acha(colecao(c.dataset.coll), c.dataset.id) : null; }

  function setPath(obj, path, v) {
    const ks = path.split('.');
    let o = obj;
    for (let i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null) o[ks[i]] = /^\d+$/.test(ks[i + 1]) ? [] : {}; o = o[ks[i]]; }
    o[ks[ks.length - 1]] = v;
  }
  function valor(el) {
    if (el.type === 'checkbox') return el.checked;
    if (el.dataset.tipo === 'num') return el.value.trim() === '' ? '' : C.n0(el.value);
    return el.value;
  }

  function aplicar(el) {
    const v = valor(el);
    if (el.dataset.ui) { U[el.dataset.ui] = v; return; }
    if (el.dataset.histStatus) {
      const h = acha(S.orcamentos, el.dataset.histStatus);
      if (h) h.status = v;
      if (S.atual && S.atual.id === el.dataset.histStatus) S.atual.status = v;
      salvar(); return;
    }
    if (el.dataset.fam) { const imp = alvo(el); if (imp) { setFam(imp, el.dataset.fam, v); salvar(); } return; }
    if (el.dataset.bind) {
      setPath(S, el.dataset.bind, v);
      if (el.dataset.bind === 'atual.responsavelId') S.ui.ultimoResponsavel = v;
      salvar(); return;
    }
    if (el.dataset.f) { const obj = alvo(el); if (obj) { setPath(obj, el.dataset.f, v); salvar(); } }
  }

  function autoCliente(el) {
    const nome = String(el.value || '').trim().toLowerCase();
    if (!nome || preenchido(S.atual.cliente.contato)) return;
    const prev = S.orcamentos.find((h) => h.id !== S.atual.id && h.cliente && String(h.cliente.nome || '').trim().toLowerCase() === nome && preenchido(h.cliente.contato));
    if (!prev) return;
    S.atual.cliente.contato = prev.cliente.contato;
    S.atual.cliente.cidade = S.atual.cliente.cidade || prev.cliente.cidade || '';
    const c = $('[data-bind="atual.cliente.contato"]'); if (c) c.value = S.atual.cliente.contato;
    const ci = $('[data-bind="atual.cliente.cidade"]'); if (ci) ci.value = S.atual.cliente.cidade;
    salvar();
    toast(`Contato preenchido com o do orçamento ${prev.numero}.`);
  }

  function depois(el) {
    if (!S.ui.empresaCadastrada) {
      atualizar(['cad-fim']);
      if (el.dataset.bind === 'empresa.cor') {
        aplicarMarca();
        if (/^#[0-9a-f]{6}$/i.test(el.value)) $$('[data-bind="empresa.cor"]').forEach((x) => { if (x !== el) x.value = el.value; });
      }
      return;
    }
    const v = rota();
    if (el.dataset.rerender) atualizar(el.dataset.rerender.split(' '));
    if (v === 'orcamento') {
      atualizar(['resumo', 'mbar']); atualizarMetas();
      const b = el.dataset.bind || '';
      if (b === 'atual.cliente.nome') autoCliente(el);
      if (/^(equipe|empresa)\./.test(b)) {
        const prog = $('#setup-prog');
        if (prog) prog.textContent = `${[S.equipe[0].nome, S.empresa.whatsapp, S.empresa.pix, S.empresa.retiradaLocal].filter(preenchido).length} de 4 preenchidos`;
        $$('#resp-sel option').forEach((op) => { const m = acha(S.equipe, op.value); if (m) op.textContent = m.nome || 'Sem nome'; });
        if (b === 'empresa.retiradaLocal') atualizar(['entrega']);
      }
      if (b === 'atual.frete' || b === 'atual.descontoPct') return;
      return;
    }
    atualizarCalcs();
    if (v === 'tabela') atualizar(['tab-custos']);
    if (v === 'historico') atualizar(['hist-stats']);
    if (v === 'empresa') {
      atualizar(['politica']);
      if (/^empresa\.(nome|slogan|cor)$/.test(el.dataset.bind || '')) {
        aplicarMarca();
        if (el.dataset.bind === 'empresa.cor' && /^#[0-9a-f]{6}$/i.test(el.value)) $$('[data-bind="empresa.cor"]').forEach((x) => { if (x !== el) x.value = el.value; });
      }
    }
  }

  function exigeEmpresa() {
    if (empresaValida()) return true;
    toast('Complete os dados da empresa (nome, cidade e WhatsApp ou e-mail) antes de gerar documentos.');
    location.hash = '#empresa';
    return false;
  }

  /* Bloqueia o envio quando falta algo essencial e leva o usuário direto ao campo. */
  function podeEnviar() {
    const P = pendencias(calcAtual()).filter((p) => p.b);
    if (!P.length) return true;
    irPara(P[0].alvo);
    toast(`Antes de enviar, falta: ${P[0].t.charAt(0).toLowerCase() + P[0].t.slice(1)}.`);
    return false;
  }
  function registrarEnvio() {
    if (S.atual.status === 'rascunho') S.atual.status = 'enviado';
    if (!S.atual.travado) S.atual.emitidoEm = hojeISO();
    salvarJa(); render();
  }

  function novaCopia(origem) {
    const c = clone(origem);
    Object.assign(c, { id: uid(), numero: null, status: 'rascunho', criadoEm: hojeISO() });
    ['snap', 'totalCache', 'emitidoEm', 'travado', 'atualizadoEm'].forEach((k) => delete c[k]);
    c.itens.forEach((it) => { it.id = uid(); });
    (c.servicos || []).forEach((s) => { s.id = uid(); });
    return c;
  }

  function onClick(ev) {
    if (!S) return;
    const b = ev.target.closest('[data-act]');
    if (!b || b.disabled || b.closest('#preview')) return;
    const act = b.dataset.act;
    const linha = b.closest('[data-id]');
    const id = linha ? linha.dataset.id : null;

    switch (act) {
      case 'cad-ok': concluirCadastro(); break;
      case 'novo': {
        salvarJa();
        const anterior = temConteudo(S.atual) ? S.atual.numero : null;
        S.atual = novoOrcamento(); salvarJa();
        if (rota() !== 'orcamento') location.hash = '#orcamento'; else render();
        toast(anterior ? `O ${anterior} ficou salvo no histórico.` : 'Novo orçamento aberto.');
        const el = $('[data-bind="atual.cliente.nome"]'); if (el) el.focus();
        break;
      }
      case 'duplicar-atual': {
        salvarJa();
        const orig = S.atual.numero;
        S.atual = novaCopia(S.atual); salvarJa(); render(); window.scrollTo(0, 0);
        toast(`Cópia aberta como orçamento novo. O ${orig} continua no histórico.`);
        break;
      }
      case 'destravar': {
        const antes = JSON.stringify(S), tAntes = calcAtual().total;
        S.atual.travado = false; delete S.atual.snap;
        const tDepois = calcAtual().total;
        salvarJa(); render();
        toast(Math.abs(tAntes - tDepois) < 0.005 ? 'Pode editar. O total continua igual.' : `Pode editar. Com a tabela atual o total foi de ${brl(tAntes)} para ${brl(tDepois)}.`,
          { label: 'Desfazer', fn: () => { S = JSON.parse(antes); salvarJa(); render(); } });
        break;
      }
      case 'add-item': {
        const novo = novoItem(S.atual.itens[S.atual.itens.length - 1]);
        S.atual.itens.push(novo); salvar(); render();
        const el = $(`[data-id="${novo.id}"] .item-title`); if (el) el.focus();
        break;
      }
      case 'dup-item': {
        const i = S.atual.itens.findIndex((x) => x.id === id); if (i < 0) break;
        const c = clone(S.atual.itens[i]); c.id = uid();
        S.atual.itens.splice(i + 1, 0, c); salvar(); render();
        toast(`Peça ${i + 1} duplicada.`);
        break;
      }
      case 'del-item': {
        if (S.atual.itens.length < 2) break;
        const i = S.atual.itens.findIndex((x) => x.id === id);
        comDesfazer(`Peça ${i + 1} excluída.`, () => { S.atual.itens = S.atual.itens.filter((x) => x.id !== id); });
        break;
      }
      case 'add-serv': {
        const s = novoServico();
        S.atual.servicos.push(s); salvar(); render();
        const el = $(`[data-id="${s.id}"] [data-f="descricao"]`); if (el) el.focus();
        break;
      }
      case 'del-serv': comDesfazer('Modelagem excluída.', () => { S.atual.servicos = S.atual.servicos.filter((x) => x.id !== id); }); break;
      case 'ir': irPara(b.dataset.alvo); break;
      case 'ir-resumo': $('#resumo').scrollIntoView({ behavior: reduzMovimento() ? 'auto' : 'smooth' }); break;
      case 'pdf':
        if (!podeEnviar()) break;
        registrarEnvio();
        abrirPreview(docOrcamentoHTML(S.atual, calcAtual()), nomeArquivo(S.atual)); break;
      case 'whats-copy':
        if (!podeEnviar()) break;
        registrarEnvio();
        copiar(textoWhats(S.atual, calcAtual())).then(() => toast('Mensagem copiada. Cole na conversa com o cliente.')); break;
      case 'whats-open': {
        if (!podeEnviar()) break;
        const fone = foneWhats(S.atual.cliente.contato);
        if (!fone) { irPara('[data-bind="atual.cliente.contato"]'); toast('Informe o WhatsApp do cliente com DDD.'); break; }
        registrarEnvio();
        window.open(`https://wa.me/${fone}?text=${encodeURIComponent(textoWhats(S.atual, calcAtual()))}`, '_blank', 'noopener');
        break;
      }
      case 'abrir': {
        const h = acha(S.orcamentos, id); if (!h) break;
        salvarJa();
        S.atual = clone(h);
        if (h.status !== 'rascunho' && h.snap) S.atual.travado = true;
        else { S.atual.travado = false; delete S.atual.snap; }
        garantirAtual(); salvarJa();
        location.hash = '#orcamento';
        break;
      }
      case 'duplicar': {
        const h = acha(S.orcamentos, id); if (!h) break;
        salvarJa();
        S.atual = novaCopia(h); garantirAtual(); salvarJa();
        location.hash = '#orcamento'; toast(`Cópia do ${h.numero} aberta como orçamento novo.`);
        break;
      }
      case 'pdf-hist': {
        const h = acha(S.orcamentos, id); if (!h || !exigeEmpresa()) break;
        abrirPreview(docOrcamentoHTML(h, C.calcOrcamento(h, h.snap || ctx())), nomeArquivo(h)); break;
      }
      case 'excluir': {
        const h = acha(S.orcamentos, id); if (!h) break;
        comDesfazer(`Orçamento ${h.numero} excluído.`, () => {
          S.orcamentos = S.orcamentos.filter((x) => x.id !== id);
          if (S.atual && S.atual.id === id) S.atual = novoOrcamento();
        });
        break;
      }
      case 'add-imp': {
        const novo = D.daCatalogo(b.dataset.modelo, {});
        S.impressoras.push(novo); salvarJa(); render();
        const el = $(`[data-id="${novo.id}"] [data-f="precoPago"]`);
        if (el) { el.scrollIntoView({ block: 'center' }); el.focus({ preventScroll: true }); }
        toast(`${apelido(novo)} adicionada. Preencha o preço que você pagou.`);
        break;
      }
      case 'add-imp-outra': {
        const novo = { id: 'imp-' + uid(), catalogoId: null, marca: 'Outra', modelo: 'impressora', apelido: 'Minha impressora', estrutura: 'Aberta', volume: [220, 220, 250], potencia: 120, potenciaFonte: 'estimativa', ideais: ['PLA', 'PETG', 'TPU'], possiveis: [], precoPago: '', vidaUtilH: 5000, manutencaoH: 0.3, obs: '' };
        S.impressoras.push(novo); salvarJa(); render();
        const el = $(`[data-id="${novo.id}"] [data-f="apelido"]`); if (el) { el.focus(); el.select(); }
        break;
      }
      case 'del-imp': {
        const imp = acha(S.impressoras, id); if (!imp || S.impressoras.length < 2) break;
        comDesfazer(`${apelido(imp)} excluída.`, () => { S.impressoras = S.impressoras.filter((x) => x.id !== id); garantirAtual(); });
        break;
      }
      case 'add-mat': {
        const novo = { id: 'mat-' + uid(), nome: 'Novo material', familia: 'PLA', precoKg: 120, ativo: true };
        S.materiais.push(novo); salvarJa(); render();
        const el = $(`[data-id="${novo.id}"] [data-f="nome"]`); if (el) { el.focus(); el.select(); }
        break;
      }
      case 'del-mat': {
        const m = acha(S.materiais, id); if (!m || S.materiais.length < 2) break;
        comDesfazer(`${m.nome} excluído.`, () => { S.materiais = S.materiais.filter((x) => x.id !== id); garantirAtual(); });
        break;
      }
      case 'add-ex': S.exemplos.push({ id: 'ex-' + uid(), nome: 'Nova peça', gramas: 50, tempo: '2h' }); salvarJa(); atualizar(['tab-rapida']); break;
      case 'del-ex': { const ex = acha(S.exemplos, id); comDesfazer(`${ex ? ex.nome : 'Exemplo'} excluído.`, () => { S.exemplos = S.exemplos.filter((x) => x.id !== id); }); break; }
      case 'add-eq': {
        const m = { id: 'eq-' + uid(), nome: '', cargo: '', whatsapp: '', email: '' };
        S.equipe.push(m); salvarJa(); render();
        const el = $(`[data-id="${m.id}"] [data-f="nome"]`); if (el) el.focus();
        break;
      }
      case 'del-eq': {
        const m = acha(S.equipe, id); if (!m || S.equipe.length < 2) break;
        comDesfazer(`${m.nome || 'Pessoa'} excluída da equipe.`, () => { S.equipe = S.equipe.filter((x) => x.id !== id); garantirAtual(); });
        break;
      }
      case 'pdf-tabela': if (exigeEmpresa()) abrirPreview(docTabelaHTML(), `Tabela de preços - ${S.empresa.nome}`); break;
      case 'pdf-politica': if (exigeEmpresa()) abrirPreview(docPoliticaHTML(), `O que atendemos - ${S.empresa.nome}`); break;
      case 'copiar-politica': if (exigeEmpresa()) copiar(politicaTexto()).then(() => toast('Texto copiado.')); break;
      case 'logo-remover': comDesfazer('Logo removido.', () => { S.empresa.logo = ''; }); break;
      case 'exportar': exportar(); break;
      case 'exportar-config': exportarConfig(); break;
      case 'importar': $('#file-backup').click(); break;
      case 'restaurar':
        comDesfazer('Tabela de preços, materiais, impressoras e exemplos voltaram ao padrão. Empresa e histórico continuam.', () => {
          const base = D.estadoInicial();
          Object.assign(base, { empresa: S.empresa, equipe: S.equipe, ui: S.ui, orcamentos: S.orcamentos, seq: S.seq, atual: S.atual });
          S = mesclar(D.estadoInicial(), base); garantirAtual();
        });
        break;
      case 'apagar-dados': $('#apagar-area').innerHTML = apagarAreaHTML(true); $('#apagar-area [data-act="apagar-cancelar"]').focus(); break;
      case 'apagar-cancelar': $('#apagar-area').innerHTML = apagarAreaHTML(false); break;
      case 'apagar-dados-sim': apagarDados(); break;
      default: break;
    }
  }

  function iniciar() {
    iniciarEstado();
    const main = $('#main');
    main.addEventListener('input', (ev) => { const el = ev.target; if (!S || ehEscolha(el) || el.type === 'file') return; aplicar(el); depois(el); });
    main.addEventListener('change', (ev) => {
      const el = ev.target;
      if (!S) return;
      if (el.matches('[data-cad-imp]')) { trocarImpressoraCadastro(el.value); return; }
      if (el.type === 'file') { if (el.dataset.file === 'logo') lerLogo(el.files[0]); el.value = ''; return; }
      if (!ehEscolha(el)) return;
      aplicar(el); depois(el);
    });
    main.addEventListener('toggle', (ev) => {
      const d = ev.target;
      if (d.matches && d.matches('details.mais')) { const c = d.closest('[data-id]'); if (c) U.abertos[c.dataset.id] = d.open; }
    }, true);
    document.addEventListener('click', onClick);
    $('#preview').addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-pv]');
      if (b) { if (b.dataset.pv === 'fechar') fecharPreview(); else salvarPDF(); }
      else if (ev.target === $('#preview')) fecharPreview();
    });
    document.addEventListener('keydown', (ev) => {
      if ($('#preview').hidden) return;
      if (ev.key === 'Escape') { ev.preventDefault(); fecharPreview(); }
      if (ev.key === 'Tab') {
        const f = $$('#preview [data-pv]');
        const i = f.indexOf(document.activeElement);
        ev.preventDefault();
        f[(i + (ev.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
    $('#file-backup').addEventListener('change', (ev) => { importar(ev.target.files[0]); ev.target.value = ''; });
    window.addEventListener('hashchange', () => { if (pendente) salvarJa(); if (!$('#preview').hidden) fecharPreview(); window.scrollTo(0, 0); render(); main.focus({ preventScroll: true }); });
    // grava o que estiver pendente ao sair, sem sobrescrever mudanças feitas em outra aba
    window.addEventListener('pagehide', () => { if (pendente) salvarJa(); });
    // outra aba mudou os dados: acompanha
    window.addEventListener('storage', (ev) => { if (ev.key !== KEY || pendente) return; S = mesclar(D.estadoInicial(), lerBruto()); render(); });
    window.addEventListener('error', falhou);
    window.addEventListener('unhandledrejection', falhou);
    render();
    if (migrou) { migrou = false; salvarJa(); }
  }

  iniciar();
})();
