// Rode com: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../public/assets/calc.js');
const { DADOS } = require('../public/assets/data.js');

const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const perto = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} deveria ser ~${b}`);

function ctx() {
  const s = DADOS.estadoInicial();
  return { s, ctx: { params: s.params, materiais: s.materiais, impressoras: s.impressoras } };
}

function orc(itens, extra = {}) {
  return Object.assign({ itens, entrega: 'retirada', frete: 0, pagamento: 'pix', descontoPct: 0 }, extra);
}

const item = (o) => Object.assign({ id: 'i' + Math.random(), materialId: 'pla', impressoraId: 'imp-a1', qtd: 1, gramas: 0, tempo: '' }, o);

test('lê o tempo do fatiador em vários formatos', () => {
  perto(C.parseTempo('2h35m'), 2 + 35 / 60, 1e-9);
  perto(C.parseTempo('1d 3h 20m'), 27 + 20 / 60, 1e-9);
  perto(C.parseTempo('45 min'), 0.75, 1e-9);
  perto(C.parseTempo('1:30'), 1.5, 1e-9);
  perto(C.parseTempo('1,5'), 1.5, 1e-9);
  perto(C.parseTempo('35m'), 35 / 60, 1e-9);
  assert.equal(C.parseTempo('abc'), 0);
  assert.equal(C.parseTempo(''), 0);
});

test('hora de máquina da A1 em BH', () => {
  const { s } = ctx();
  const hm = C.custoHoraMaquina(s.impressoras[0], s.params);
  perto(hm.energia, 0.132, 1e-9);     // 110 W × R$ 1,20
  perto(hm.depreciacao, 0.68, 1e-9);  // R$ 3.400 ÷ 5.000 h
  perto(hm.total, 1.112, 1e-9);
});

test('suporte de celular avulso cai no pedido mínimo', () => {
  const { ctx: c } = ctx();
  const r = C.calcOrcamento(orc([item({ gramas: 45, tempo: '2h10m' })]), c);
  perto(r.itens[0].preco, 15.46);
  perto(r.brutoExato, 24.96);
  assert.equal(r.bruto, 25);
  assert.equal(r.ajusteMinimo, 5);
  assert.equal(r.total, 30);
  assert.ok(r.flags.minimoAplicado);
});

test('lote de 10 suportes', () => {
  const { ctx: c } = ctx();
  const r = C.calcOrcamento(orc([item({ gramas: 45, tempo: '2h10m', qtd: 10 })]), c);
  assert.equal(r.total, 165);
  assert.equal(r.itens[0].precoUnit, 16.5);
  assert.equal(r.ajusteMinimo, 0);
});

test('peça grande: margem real e preço por grama', () => {
  const { ctx: c } = ctx();
  const r = C.calcOrcamento(orc([item({ gramas: 500, tempo: '1d 2h' })]), c);
  assert.equal(r.total, 186);
  perto(r.precoPorGrama, 0.372, 0.001);
  assert.ok(r.lucro > 0);
  // camadas somam o valor das peças quando há lucro
  perto(r.camadas.reduce((a, x) => a + x.valor, 0), r.produtos);
});

test('frete, cartão e desconto', () => {
  const { ctx: c } = ctx();
  const r = C.calcOrcamento(orc([item({ gramas: 200, tempo: '10h' })], { entrega: 'correios', frete: 25, pagamento: 'cartao', descontoPct: 10 }), c);
  assert.equal(r.bruto, 80);
  assert.equal(r.desconto, 8);
  assert.equal(r.produtos, 72);
  assert.equal(r.taxaCartao, 4.85); // 5% de (72 + 25)
  assert.equal(r.total, 101.85);
});

test('retirada zera o frete', () => {
  const { ctx: c } = ctx();
  const r = C.calcOrcamento(orc([item({ gramas: 200, tempo: '10h' })], { entrega: 'retirada', frete: 40 }), c);
  assert.equal(r.frete, 0);
});

test('linhas da proposta somam o valor das peças', () => {
  const { ctx: c } = ctx();
  const r = C.calcOrcamento(orc([
    item({ gramas: 12, tempo: '40m', qtd: 3 }),
    item({ gramas: 130, tempo: '6h', modelagemH: 1.5, acabamentoMin: 20 }),
    item({ gramas: 0, tempo: '' })
  ]), c);
  const soma = r.itens.reduce((a, x) => a + x.precoLinha, 0);
  perto(soma, r.bruto, 0.001);
});

test('desconto grande dispara alerta de prejuízo', () => {
  const { ctx: c } = ctx();
  const r = C.calcOrcamento(orc([item({ gramas: 500, tempo: '1d 2h', qtd: 5 })], { descontoPct: 70 }), c);
  assert.ok(r.flags.abaixoDoCusto);
});

test('ABS na A1 gera aviso de material; peça grande demais gera aviso de tamanho', () => {
  const { ctx: c } = ctx();
  const r = C.calcOrcamento(orc([item({ materialId: 'abs', gramas: 10, tempo: '1h', dims: [300, 20, 20] })]), c);
  const tipos = r.itens[0].avisos.map(a => a.tipo + ':' + a.nivel);
  assert.ok(tipos.includes('material:ruim'));
  assert.ok(tipos.includes('tamanho:ruim'));
  assert.equal(C.cabeNaMesa([250, 30, 256], [256, 256, 256]), true);
  assert.equal(C.cabeNaMesa([10, '', 5], [256, 256, 256]), null);
});

test('lê números no formato brasileiro', () => {
  assert.equal(C.n0('1,5'), 1.5);
  assert.equal(C.n0('3.400'), 3400);
  assert.equal(C.n0('1.234,56'), 1234.56);
  assert.equal(C.n0('R$ 28,50'), 28.5);
  assert.equal(C.n0('1.5'), 1.5);
  assert.equal(C.n0('0.3'), 0.3);
  assert.equal(C.n0(''), 0);
});

test('modelagem sozinha: horas × valor da hora, sem margem e sem pedido mínimo', () => {
  const { ctx: c } = ctx();
  const r = C.calcOrcamento(orc([item({})], { servicos: [{ id: 's1', descricao: 'Modelagem a partir de foto', horas: '1h30m' }] }), c);
  assert.equal(r.servicosTotal, 75);   // 1,5 h × R$ 50
  assert.equal(r.total, 75);
  assert.equal(r.ajusteMinimo, 0);
  assert.equal(r.temPecas, false);
  assert.equal(r.temItens, true);
});

test('modelagem com peças: margem só nas peças, desconto não toca a modelagem', () => {
  const { ctx: c } = ctx();
  const semServ = C.calcOrcamento(orc([item({ gramas: 200, tempo: '10h' })], { descontoPct: 10 }), c);
  const comServ = C.calcOrcamento(orc([item({ gramas: 200, tempo: '10h' })], { descontoPct: 10, servicos: [{ id: 's', horas: 2 }] }), c);
  assert.equal(comServ.produtos, semServ.produtos);       // peças iguais
  assert.equal(comServ.total, r2(semServ.total + 100));   // + 2 h × R$ 50, cheio
  assert.equal(comServ.lucro, semServ.lucro);             // modelagem não gera lucro extra
  assert.equal(comServ.trabalho, r2(semServ.trabalho + 100));
});

test('taxa do cartão incide sobre peças, modelagem e frete', () => {
  const { ctx: c } = ctx();
  const r = C.calcOrcamento(orc([item({ gramas: 200, tempo: '10h' })], { servicos: [{ id: 's', horas: 2 }], entrega: 'correios', frete: 20, pagamento: 'cartao' }), c);
  assert.equal(r.taxaCartao, 10);  // 5% de (80 + 100 + 20)
  assert.equal(r.total, 210);
});

test('orçamento vazio fica zerado (sem pedido mínimo)', () => {
  const { ctx: c } = ctx();
  const r = C.calcOrcamento(orc([item({})]), c);
  assert.equal(r.total, 0);
  assert.equal(r.ajusteMinimo, 0);
});
