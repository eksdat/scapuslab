/*
 * Cálculo de preço. Funções puras, sem acesso à página: dá para testar no Node
 * (veja tests/calc.test.js).
 *
 * PEÇAS (confecção: produto, leva margem)
 *   material   = gramas × preço do kg ÷ 1000
 *   energia    = horas × potência (W) ÷ 1000 × tarifa (R$/kWh)
 *   desgaste   = horas × (preço da impressora ÷ vida útil em horas + manutenção por hora)
 *   falhas     = (material + energia + desgaste) × reserva de falhas
 *   custo      = material + energia + desgaste + falhas + extras
 *   preço      = custo × (1 + margem) + acabamento (mão de obra, sem margem)
 *   pedido     = Σ peças + preparo + embalagem → arredonda para cima → desconto → pedido mínimo
 *
 * SERVIÇOS (modelagem 3D: prestação de serviço, sem margem)
 *   valor      = horas trabalhadas × valor da hora
 *   Não recebe desconto nem entra no pedido mínimo.
 *
 * TOTAL = peças + serviços + frete + taxa do cartão
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Calc = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* Lê números no formato brasileiro: "1,5", "3.400", "1.234,56", "R$ 28,50". */
  function n0(v) {
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    var s = String(v === null || v === undefined ? '' : v).trim().replace(/\s|R\$/g, '');
    if (!s) return 0;
    if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^-?[1-9]\d{0,2}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    var x = parseFloat(s);
    return isFinite(x) ? x : 0;
  }

  function r2(n) { return Math.round((n0(n) + Number.EPSILON) * 100) / 100; }

  function arredondarCima(v, passo) {
    passo = n0(passo);
    if (passo <= 0) return r2(v);
    return r2(Math.ceil(r2(v) / passo - 1e-9) * passo);
  }

  /* Aceita "2h35m", "1d 3h 20m", "45 min", "1:30", "1,5" (horas). Devolve horas. */
  function parseTempo(v) {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return v > 0 ? v : 0;
    var s = String(v).trim().toLowerCase().replace(',', '.');
    if (!s) return 0;
    if (/^\d+(\.\d+)?$/.test(s)) return parseFloat(s);
    var m = s.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
    if (m) return +m[1] + (+m[2]) / 60 + (m[3] ? +m[3] / 3600 : 0);
    var re = /(\d+(?:\.\d+)?)\s*(dias|dia|d|horas|hora|hrs|hr|h|minutos|minuto|mins|min|m|segundos|seg|s)(?![a-z])/g;
    var total = 0, achou = false, x;
    while ((x = re.exec(s)) !== null) {
      achou = true;
      var n = parseFloat(x[1]), u = x[2];
      if (u.charAt(0) === 'd') total += n * 24;
      else if (u.charAt(0) === 'h') total += n;
      else if (u.charAt(0) === 'm') total += n / 60;
      else total += n / 3600;
    }
    return achou ? total : 0;
  }

  function custoHoraMaquina(imp, params) {
    if (!imp) return { energia: 0, depreciacao: 0, manutencao: 0, desgaste: 0, total: 0 };
    var energia = n0(imp.potencia) / 1000 * n0(params.tarifaKwh);
    var depreciacao = n0(imp.precoPago) / Math.max(1, n0(imp.vidaUtilH) || 1);
    var manutencao = n0(imp.manutencaoH);
    return { energia: energia, depreciacao: depreciacao, manutencao: manutencao, desgaste: depreciacao + manutencao, total: energia + depreciacao + manutencao };
  }

  function compat(imp, familia) {
    if (!imp || !familia) return 'ideal';
    if ((imp.ideais || []).indexOf(familia) >= 0) return 'ideal';
    if ((imp.possiveis || []).indexOf(familia) >= 0) return 'possivel';
    return 'nao';
  }

  /* Caixa cabe no volume em alguma orientação? null se as medidas não foram informadas. */
  function cabeNaMesa(dims, volume) {
    var d = (dims || []).map(n0).filter(function (x) { return x > 0; });
    if (d.length < 3 || !volume) return null;
    var a = d.slice().sort(function (x, y) { return y - x; });
    var b = volume.map(n0).sort(function (x, y) { return y - x; });
    for (var i = 0; i < 3; i++) if (a[i] > b[i]) return false;
    return true;
  }

  function acha(lista, id) {
    for (var i = 0; i < (lista || []).length; i++) if (lista[i].id === id) return lista[i];
    return null;
  }

  function calcItem(item, ctx) {
    var p = ctx.params;
    var mat = acha(ctx.materiais, item.materialId);
    var imp = acha(ctx.impressoras, item.impressoraId);
    var qtd = Math.max(1, Math.round(n0(item.qtd)) || 1);
    var g = Math.max(0, n0(item.gramas));
    var h = parseTempo(item.tempo);
    var hm = custoHoraMaquina(imp, p);

    var materialU = g * n0(mat && mat.precoKg) / 1000;
    var energiaU = h * hm.energia;
    var desgasteU = h * hm.desgaste;
    var baseU = materialU + energiaU + desgasteU;
    var falhaU = baseU * n0(p.falhaPct) / 100;
    var extrasU = Math.max(0, n0(item.extras));
    var custoU = baseU + falhaU + extrasU;
    var margemU = custoU * n0(p.margemPct) / 100;
    var acabamentoU = Math.max(0, n0(item.acabamentoMin)) / 60 * n0(p.horaOperacao);
    // compatibilidade com orçamentos antigos, que tinham modelagem dentro da peça
    var modelagem = Math.max(0, n0(item.modelagemH)) * n0(p.horaModelagem);

    var avisos = [];
    if (mat && imp) {
      var c = compat(imp, mat.familia);
      if (c === 'nao') avisos.push({ nivel: 'ruim', tipo: 'material' });
      else if (c === 'possivel') avisos.push({ nivel: 'atencao', tipo: 'material' });
    }
    var cabe = cabeNaMesa(item.dims, imp && imp.volume);
    if (cabe === false) avisos.push({ nivel: 'ruim', tipo: 'tamanho' });

    return {
      id: item.id, qtd: qtd, gramas: g, horas: h, mat: mat, imp: imp, cabe: cabe, horaMaquina: hm.total,
      material: materialU * qtd,
      energia: energiaU * qtd,
      desgaste: desgasteU * qtd,
      falha: falhaU * qtd,
      extras: extrasU * qtd,
      custo: custoU * qtd,
      margem: margemU * qtd,
      acabamento: acabamentoU * qtd,
      modelagem: modelagem,
      preco: (custoU + margemU + acabamentoU) * qtd + modelagem,
      avisos: avisos
    };
  }

  function calcServicos(orc, p) {
    var hora = n0(p.horaModelagem);
    return (orc.servicos || []).map(function (s) {
      var h = parseTempo(s.horas);
      return { id: s.id, descricao: s.descricao || '', horas: h, valorHora: hora, total: r2(h * hora) };
    });
  }

  function calcOrcamento(orc, ctx) {
    var p = ctx.params;
    var itens = (orc.itens || []).map(function (it) { return calcItem(it, ctx); });
    function soma(k) { return itens.reduce(function (a, x) { return a + x[k]; }, 0); }

    var servicos = calcServicos(orc, p);
    var servicosTotal = r2(servicos.reduce(function (a, s) { return a + s.total; }, 0));
    var servicosHoras = servicos.reduce(function (a, s) { return a + s.horas; }, 0);

    var temPecas = itens.some(function (x) { return x.preco > 0; });
    var preparo = temPecas ? n0(p.preparoMin) / 60 * n0(p.horaOperacao) : 0;
    var embalagem = temPecas ? n0(p.embalagem) : 0;
    var somaItens = soma('preco');
    var brutoExato = somaItens + preparo + embalagem;
    var bruto = temPecas ? arredondarCima(brutoExato, p.arredondamento) : 0;

    var descontoPct = Math.min(100, Math.max(0, n0(orc.descontoPct)));
    var desconto = r2(bruto * descontoPct / 100);
    var produtos = r2(bruto - desconto);
    var minimo = n0(p.pedidoMinimo);
    var ajusteMinimo = temPecas && produtos < minimo ? r2(minimo - produtos) : 0;
    produtos = r2(produtos + ajusteMinimo);

    var frete = orc.entrega === 'retirada' ? 0 : Math.max(0, r2(orc.frete));
    var base = produtos + servicosTotal + frete;
    var taxaCartao = orc.pagamento === 'cartao' ? r2(base * n0(p.taxaCartaoPct) / 100) : 0;
    var total = r2(base + taxaCartao);

    // Valor de cada linha da proposta: rateia preparo, embalagem e arredondamento.
    var fator = somaItens > 0 ? bruto / somaItens : 0;
    var valores = itens.map(function (x) { return r2(x.preco * fator); });
    if (temPecas) {
      var dif = r2(bruto - valores.reduce(function (a, v) { return a + v; }, 0));
      var iMax = 0;
      itens.forEach(function (x, i) { if (x.preco > itens[iMax].preco) iMax = i; });
      valores[iMax] = r2(valores[iMax] + dif);
    }
    var linhas = itens.map(function (x, i) {
      var o = {};
      for (var k in x) o[k] = x[k];
      o.precoLinha = valores[i];
      o.precoUnit = r2(valores[i] / x.qtd);
      return o;
    });

    var custoProducao = soma('material') + soma('energia') + soma('desgaste') + soma('falha') + soma('extras') + embalagem;
    var trabalhoPecas = soma('acabamento') + soma('modelagem') + preparo;
    var lucro = r2(produtos - custoProducao - trabalhoPecas);
    var gramasTotal = itens.reduce(function (a, x) { return a + x.gramas * x.qtd; }, 0);
    var horasTotal = itens.reduce(function (a, x) { return a + x.horas * x.qtd; }, 0);

    return {
      itens: linhas,
      servicos: servicos,
      servicosTotal: servicosTotal,
      servicosHoras: servicosHoras,
      temPecas: temPecas,
      temItens: temPecas || servicosTotal > 0,
      preparo: preparo,
      embalagem: embalagem,
      somaItens: somaItens,
      brutoExato: brutoExato,
      bruto: bruto,
      arredondamento: r2(bruto - brutoExato),
      margem: soma('margem'),
      descontoPct: descontoPct,
      desconto: desconto,
      ajusteMinimo: ajusteMinimo,
      produtos: produtos,
      frete: frete,
      taxaCartao: taxaCartao,
      total: total,
      custoProducao: custoProducao,
      trabalho: trabalhoPecas + servicosTotal,
      lucro: lucro,
      gramasTotal: gramasTotal,
      horasTotal: horasTotal,
      precoPorGrama: gramasTotal ? produtos / gramasTotal : 0,
      camadas: [
        { chave: 'material', nome: 'Material', valor: soma('material') },
        { chave: 'maquina', nome: 'Máquina e energia', valor: soma('energia') + soma('desgaste') },
        { chave: 'perdas', nome: 'Falhas, extras e embalagem', valor: soma('falha') + soma('extras') + embalagem },
        { chave: 'trabalho', nome: 'Seu trabalho', valor: trabalhoPecas + servicosTotal },
        { chave: 'lucro', nome: 'Lucro', valor: Math.max(0, lucro) }
      ],
      flags: {
        abaixoDoCusto: temPecas && produtos < custoProducao,
        trabalhoNaoPago: temPecas && produtos >= custoProducao && lucro < 0,
        minimoAplicado: ajusteMinimo > 0
      }
    };
  }

  return {
    n0: n0, r2: r2, arredondarCima: arredondarCima, parseTempo: parseTempo,
    custoHoraMaquina: custoHoraMaquina, compat: compat, cabeNaMesa: cabeNaMesa,
    calcItem: calcItem, calcServicos: calcServicos, calcOrcamento: calcOrcamento
  };
});
