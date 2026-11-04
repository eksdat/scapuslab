/*
 * Dados de base da plataforma.
 * - CATALOGO: impressoras FDM populares no Brasil, com valores de referência.
 *   "potencia" é a média aproximada imprimindo PLA (W). Onde a fonte é o
 *   fabricante, isso está marcado; o resto é estimativa. Confira e ajuste.
 * - estadoInicial(): configuração inicial (Scapus Lab, Bambu Lab A1, BH),
 *   com a identidade de scapus.com.br (logo, cor #FF6A00, Instagram).
 */
(function (root) {
  'use strict';

  var FAMILIAS = {
    PLA: 'PLA',
    PETG: 'PETG',
    TPU: 'TPU (flexível)',
    PVA: 'PVA (suporte solúvel)',
    ABS: 'ABS',
    ASA: 'ASA',
    PC: 'PC (policarbonato)',
    PA: 'PA (nylon)',
    CF: 'Com fibra (CF/GF)'
  };

  function p(id, marca, modelo, estrutura, volume, potencia, fonte, ideais, possiveis, obs) {
    return {
      id: id, marca: marca, modelo: modelo, estrutura: estrutura, volume: volume,
      potencia: potencia, potenciaFonte: fonte, ideais: ideais, possiveis: possiveis || [], obs: obs || ''
    };
  }

  var BASICOS = ['PLA', 'PETG', 'TPU'];
  var CATALOGO = [
    // Bambu Lab
    p('bambu-a1-mini', 'Bambu Lab', 'A1 mini', 'Aberta', [180, 180, 180], 80, 'fabricante',
      ['PLA', 'PETG', 'TPU', 'PVA'], [], 'Mesa até 80 °C. ABS, ASA, PC e PA não recomendados.'),
    p('bambu-a1', 'Bambu Lab', 'A1', 'Aberta', [256, 256, 256], 95, 'fabricante',
      ['PLA', 'PETG', 'TPU', 'PVA'], [], 'Estrutura aberta: ABS, ASA, PC, PA e filamentos com fibra não são recomendados.'),
    p('bambu-a2l', 'Bambu Lab', 'A2L', 'Aberta', [330, 320, 325], 130, 'estimativa',
      BASICOS, [], 'Aberta, mesa maior que a A1.'),
    p('bambu-p1p', 'Bambu Lab', 'P1P', 'Aberta (CoreXY)', [256, 256, 256], 110, 'estimativa',
      ['PLA', 'PETG', 'TPU', 'PVA'], ['ABS', 'ASA'], 'ABS/ASA só com fechamento improvisado.'),
    p('bambu-p1s', 'Bambu Lab', 'P1S', 'Fechada', [256, 256, 256], 120, 'estimativa',
      ['PLA', 'PETG', 'TPU', 'PVA', 'ABS', 'ASA'], ['PC', 'PA', 'CF'], 'Fibra exige bico de aço endurecido.'),
    p('bambu-p2s', 'Bambu Lab', 'P2S', 'Fechada', [256, 256, 256], 130, 'estimativa',
      ['PLA', 'PETG', 'TPU', 'PVA', 'ABS', 'ASA'], ['PC', 'PA', 'CF']),
    p('bambu-x1c', 'Bambu Lab', 'X1 Carbon', 'Fechada', [256, 256, 256], 130, 'estimativa',
      ['PLA', 'PETG', 'TPU', 'PVA', 'ABS', 'ASA', 'PC', 'CF'], ['PA']),
    p('bambu-h2s', 'Bambu Lab', 'H2S', 'Fechada', [340, 320, 340], 180, 'estimativa',
      ['PLA', 'PETG', 'TPU', 'PVA', 'ABS', 'ASA', 'PC', 'CF'], ['PA']),
    p('bambu-h2d', 'Bambu Lab', 'H2D', 'Fechada (dois bicos)', [325, 320, 325], 200, 'estimativa',
      ['PLA', 'PETG', 'TPU', 'PVA', 'ABS', 'ASA', 'PC', 'PA', 'CF'], []),
    // Creality
    p('creality-e3v3se', 'Creality', 'Ender-3 V3 SE', 'Aberta', [220, 220, 250], 120, 'estimativa',
      BASICOS, ['ABS'], 'Bico até 260 °C.'),
    p('creality-e3v3ke', 'Creality', 'Ender-3 V3 KE', 'Aberta', [220, 220, 240], 120, 'estimativa',
      BASICOS, ['ABS', 'ASA']),
    p('creality-k1c', 'Creality', 'K1C', 'Fechada', [220, 220, 250], 150, 'estimativa',
      ['PLA', 'PETG', 'TPU', 'ABS', 'ASA', 'CF'], ['PA']),
    p('creality-k1max', 'Creality', 'K1 Max', 'Fechada', [300, 300, 300], 200, 'estimativa',
      ['PLA', 'PETG', 'TPU', 'ABS', 'ASA'], ['PA', 'CF']),
    p('creality-k2plus', 'Creality', 'K2 Plus', 'Fechada (câmara aquecida)', [350, 350, 350], 250, 'estimativa',
      ['PLA', 'PETG', 'TPU', 'ABS', 'ASA', 'PC', 'PA', 'CF'], []),
    p('creality-hi', 'Creality', 'Hi', 'Aberta', [260, 260, 300], 130, 'estimativa',
      BASICOS, []),
    // Elegoo
    p('elegoo-cc', 'Elegoo', 'Centauri Carbon', 'Fechada', [256, 256, 256], 130, 'estimativa',
      ['PLA', 'PETG', 'TPU', 'ABS', 'ASA', 'CF'], ['PC']),
    p('elegoo-n4pro', 'Elegoo', 'Neptune 4 Pro', 'Aberta', [225, 225, 265], 130, 'estimativa',
      BASICOS, ['ABS']),
    p('elegoo-n4max', 'Elegoo', 'Neptune 4 Max', 'Aberta', [420, 420, 480], 250, 'estimativa',
      BASICOS, ['ABS'], 'Mesa grande: consumo maior.'),
    // Prusa
    p('prusa-mk4s', 'Prusa', 'MK4S', 'Aberta', [250, 210, 220], 90, 'estimativa',
      BASICOS, ['ASA', 'ABS', 'PC']),
    p('prusa-coreone', 'Prusa', 'Core One', 'Fechada', [250, 220, 270], 120, 'estimativa',
      ['PLA', 'PETG', 'TPU', 'ASA', 'ABS'], ['PC', 'PA', 'CF']),
    p('prusa-mini', 'Prusa', 'MINI+', 'Aberta', [180, 180, 180], 70, 'estimativa',
      BASICOS, []),
    // Anycubic
    p('anycubic-kobra3', 'Anycubic', 'Kobra 3', 'Aberta', [250, 250, 260], 120, 'estimativa',
      BASICOS, []),
    p('anycubic-kobras1', 'Anycubic', 'Kobra S1', 'Fechada', [250, 250, 250], 140, 'estimativa',
      ['PLA', 'PETG', 'TPU', 'ABS', 'ASA'], ['CF']),
    // Flashforge
    p('ff-ad5m', 'Flashforge', 'Adventurer 5M', 'Aberta', [220, 220, 220], 110, 'estimativa',
      BASICOS, []),
    p('ff-ad5mpro', 'Flashforge', 'Adventurer 5M Pro', 'Fechada', [220, 220, 220], 130, 'estimativa',
      ['PLA', 'PETG', 'TPU', 'ABS', 'ASA'], ['CF']),
    // Qidi
    p('qidi-q1pro', 'Qidi', 'Q1 Pro', 'Fechada (câmara aquecida)', [245, 245, 240], 160, 'estimativa',
      ['PLA', 'PETG', 'TPU', 'ABS', 'ASA', 'PC', 'CF'], ['PA']),
    p('qidi-plus4', 'Qidi', 'Plus4', 'Fechada (câmara aquecida)', [305, 305, 280], 220, 'estimativa',
      ['PLA', 'PETG', 'TPU', 'ABS', 'ASA', 'PC', 'PA', 'CF'], []),
    // Sovol
    p('sovol-sv08', 'Sovol', 'SV08', 'Aberta (CoreXY)', [350, 350, 345], 200, 'estimativa',
      BASICOS, ['ABS', 'ASA'])
  ];

  function daCatalogo(id, extra) {
    var c = CATALOGO.filter(function (x) { return x.id === id; })[0];
    var o = JSON.parse(JSON.stringify(c));
    o.catalogoId = c.id;
    o.id = 'imp-' + c.id + '-' + Math.random().toString(36).slice(2, 7);
    o.apelido = c.marca + ' ' + c.modelo;
    o.precoPago = '';
    o.vidaUtilH = 5000;
    o.manutencaoH = 0.3;
    for (var k in extra) o[k] = extra[k];
    return o;
  }

  var LOGO_SCAPUS = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect x="4" y="4" width="152" height="152" rx="38" fill="#FF6A00"/>' +
    '<path d="M117 36.5H70C53 36.5 43 45.5 43 58.5C43 71.5 51 78.5 66 82.5L100 90.5C108 92.5 113 97.5 113 105.5C113 116.5 105 123.5 91 123.5H47" ' +
    'fill="none" stroke="#fff" stroke-width="19" stroke-linecap="round" stroke-linejoin="round"/></svg>');

  function estadoInicial() {
    return {
      versao: 2,
      seq: 0,
      empresa: {
        nome: 'Scapus Lab',
        slogan: 'Modelagem 3D, protótipos e peças sob encomenda',
        logo: LOGO_SCAPUS,
        cor: '#FF6A00',
        prefixo: 'SCP',
        cidade: 'Belo Horizonte – MG',
        site: 'scapus.com.br',
        whatsapp: '',
        instagram: '@scapus.br',
        email: '',
        documento: '',
        validadeDias: 7,
        prazoMin: 3,
        prazoMax: 5,
        ajustesInclusos: 1,
        pecaPiloto: true,
        pecaPilotoTexto: 'Imprimimos uma peça-piloto e você aprova antes de produzirmos o restante do pedido.',
        pix: '',
        pagamentoTexto: 'Pix. Pedidos até R$ 100: pagamento integral na aprovação. Acima de R$ 100: 50% na aprovação e 50% na entrega ou retirada.',
        aceitaCartao: false,
        retiradaAtivo: true,
        retiradaLocal: '',
        correiosAtivo: true,
        appAtivo: false,
        observacoes: 'Cores conforme o estoque de filamento. Peças impressas em FDM têm linhas de camada visíveis; acabamento liso é serviço à parte.'
      },
      equipe: [
        { id: 'eq-1', nome: '', cargo: 'Modelagem e impressão 3D', whatsapp: '', email: '' }
      ],
      ui: { setupFeito: false, ultimoResponsavel: 'eq-1', ultimoBackup: '' },
      params: {
        tarifaKwh: 1.2,
        falhaPct: 10,
        margemPct: 80,
        horaModelagem: 50,
        horaOperacao: 30,
        preparoMin: 15,
        embalagem: 2,
        pedidoMinimo: 30,
        taxaCartaoPct: 5,
        arredondamento: 1
      },
      materiais: [
        { id: 'pla', nome: 'PLA', familia: 'PLA', precoKg: 120, ativo: true },
        { id: 'pla-matte', nome: 'PLA Matte', familia: 'PLA', precoKg: 130, ativo: true },
        { id: 'pla-silk', nome: 'PLA Silk', familia: 'PLA', precoKg: 145, ativo: true },
        { id: 'petg', nome: 'PETG', familia: 'PETG', precoKg: 120, ativo: true },
        { id: 'tpu', nome: 'TPU 95A (flexível)', familia: 'TPU', precoKg: 170, ativo: true },
        { id: 'abs', nome: 'ABS', familia: 'ABS', precoKg: 110, ativo: false },
        { id: 'asa', nome: 'ASA', familia: 'ASA', precoKg: 140, ativo: false }
      ],
      impressoras: [
        daCatalogo('bambu-a1', { id: 'imp-a1', apelido: 'Bambu Lab A1', precoPago: 3400, potencia: 110 })
      ],
      exemplos: [
        { id: 'ex1', nome: 'Chaveiro', gramas: 8, tempo: '35m' },
        { id: 'ex2', nome: 'Suporte de celular', gramas: 45, tempo: '2h10m' },
        { id: 'ex3', nome: 'Protótipo acadêmico pequeno', gramas: 80, tempo: '4h' },
        { id: 'ex4', nome: 'Maquete ou peça média', gramas: 200, tempo: '10h' },
        { id: 'ex5', nome: 'Peça grande', gramas: 500, tempo: '1d 2h' }
      ],
      orcamentos: [],
      atual: null
    };
  }

  root.DADOS = { FAMILIAS: FAMILIAS, CATALOGO: CATALOGO, daCatalogo: daCatalogo, estadoInicial: estadoInicial, LOGO_SCAPUS: LOGO_SCAPUS };
})(typeof self !== 'undefined' ? self : this);
