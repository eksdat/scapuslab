# Orçamento 3D

Plataforma de orçamentos para quem vende impressão 3D. Você informa as gramas e o tempo que o fatiador mostra e ela calcula material, máquina, energia, desgaste, mão de obra, margem e pedido mínimo, e gera o PDF com a sua marca ou o texto pronto para o WhatsApp.

Vem configurada para a **Scapus Lab** (Bambu Lab A1, Belo Horizonte) com a identidade de [scapus.com.br](https://scapus.com.br): logo, laranja `#FF6A00`, fonte Inter e os tons "night" e "beige" do site. Qualquer empresa troca nome, logo, cor, equipe, impressoras e preços na própria tela.

É um site estático (HTML, CSS e JavaScript puros, sem build e sem servidor). Os dados ficam no navegador de quem usa.

## O que tem

- **Orçamento** em três blocos, como o site da Scapus divide o trabalho: peças impressas (prototipagem e confecção), modelagem 3D (serviço) e entrega/pagamento. Avisa quando o material não é recomendado para a máquina (ABS na A1, por exemplo) e quando a peça não cabe na mesa.
- **Quem fez o orçamento**: o campo "Feito por" escolhe uma pessoa da equipe. O nome, a função e o contato dela saem no PDF ("Orçamento feito por") e assinam a mensagem do WhatsApp.
- **Prévia do PDF** antes de salvar, com logo, número (SCP-2026-0001), cliente, responsável, tabelas de peças e de modelagem, condições, validade, campo de aceite e rodapé com WhatsApp, Instagram e site.
- **Resumo ao vivo**: total, composição do preço em camadas, "Como chegamos neste valor" passo a passo e um bloco só seu com custo, lucro e preço por grama.
- **Antes de enviar**: lista o que falta (nome do cliente, tempo da peça, frete, chave Pix) e leva direto ao campo. O PDF e a mensagem só saem quando o essencial está preenchido.
- **Salvamento automático** no histórico, com número e horário à vista. Orçamentos já enviados reabrem **travados** com os valores que o cliente recebeu.
- **Histórico** com busca, status (enviado, aprovado, em produção, entregue, recusado), taxa de aprovação e lembrete de backup.
- **Tabela de preços** editável e **tabela rápida** de peças típicas (avulso, sem mínimo, lote de 10), com PDF.
- **Impressoras**: catálogo de referência com 28 modelos populares e o custo por hora de cada máquina.
- **Materiais** com preço do kg e compatibilidade com cada impressora.
- **Empresa e equipe**: identidade, equipe, contatos, Pix, prazo, ajustes inclusos, "Aprove a primeira peça", entrega e a página "O que atendemos" (PDF ou texto).
- **Backup** em arquivo JSON para levar os dados a outro aparelho.

## Como o preço é calculado

Por peça:

```
material   = gramas × preço do kg ÷ 1000
energia    = horas × potência (W) ÷ 1000 × tarifa (R$/kWh)
desgaste   = horas × (preço da impressora ÷ vida útil em horas + manutenção por hora)
falhas     = (material + energia + desgaste) × reserva de falhas
custo      = material + energia + desgaste + falhas + extras
preço      = custo × (1 + margem) + acabamento
```

Por pedido: soma as peças, a modelagem (uma vez por peça desenhada), o preparo e a embalagem, arredonda para cima, aplica o desconto e garante o pedido mínimo. Frete e taxa do cartão entram por fora do mínimo.

A margem incide só sobre o custo de produção das peças (confecção). **Modelagem 3D é prestação de serviço**: entra como horas trabalhadas × valor da hora, sem margem por cima, sem desconto e fora do pedido mínimo. Um orçamento pode ter só modelagem, quando o cliente quer apenas o arquivo. Acabamento e preparo também são mão de obra e entram pelo valor da hora, sem margem.

```
modelagem = horas trabalhadas × valor da hora (R$ 50 no padrão)
total     = peças (com margem, desconto e mínimo) + modelagem + frete + taxa do cartão
```

## Valores padrão (Scapus Lab, novembro de 2026)

| Item | Valor | De onde veio |
|---|---|---|
| Impressora | Bambu Lab A1, R$ 3.400, vida útil de 5.000 h | Preço da A1 com tomada BR em lojas brasileiras |
| Mesa | 256 × 256 × 256 mm | Ficha técnica da Bambu Lab |
| Materiais | PLA, PETG e TPU ativos; ABS e ASA desativados | A Bambu lista PLA, PETG, TPU e PVA como ideais na A1 e ABS, ASA, PC, PA e fibra como não recomendados |
| Potência média | 110 W | A Bambu mediu cerca de 95 W imprimindo PLA; 110 W deixa folga |
| Energia | R$ 1,20 por kWh | CEMIG residencial B1 com impostos (R$ 1,126 no início de 2026, mais o reajuste de maio). Sobra margem para bandeira amarela |
| Manutenção | R$ 0,30 por hora | Bico, mesa PEI, tubo PTFE, correias |
| PLA / PETG / TPU | R$ 120 / R$ 120 / R$ 170 por kg | Faixa de R$ 90 a R$ 135 em lojas brasileiras para PLA, com frete |
| Falhas | 10% | |
| Margem | 80% sobre o custo | |
| Modelagem / acabamento | R$ 50 / R$ 30 por hora | |
| Preparo + embalagem | 15 min + R$ 2 por pedido | |
| Pedido mínimo | R$ 30 | |

Com isso, uma hora de A1 custa cerca de R$ 1,11 (R$ 0,13 de energia e R$ 0,98 de desgaste). Alguns preços que saem da tabela:

| Peça | Avulsa | Cada, em lote de 10 |
|---|---|---|
| Chaveiro (8 g, 35 min) | R$ 30,00 (mínimo) | R$ 4,20 |
| Suporte de celular (45 g, 2h10) | R$ 30,00 (mínimo) | R$ 16,50 |
| Protótipo acadêmico (80 g, 4 h) | R$ 38,00 | R$ 28,80 |
| Maquete ou peça média (200 g, 10 h) | R$ 80,00 | R$ 70,50 |
| Peça grande (500 g, 26 h) | R$ 186,00 | R$ 177,00 |

Troque pelos seus custos reais assim que tiver: a conta de luz, o preço que você pagou no rolo e o tempo que você leva no acabamento.

## Usabilidade (heurísticas de Nielsen)

| Heurística | Como a plataforma atende |
|---|---|
| Visibilidade do estado | "Salvo no histórico às 21:08", número do orçamento no título, total sempre visível (barra fixa no celular), eco do tempo digitado ("Entendido: 2h10") |
| Correspondência com o mundo real | Aceita o tempo como o Bambu Studio mostra (2h35m, 1d 3h), números com vírgula, termos do dia a dia; "Ver PDF" abre a prévia e explica o "Salvar como PDF" |
| Controle e liberdade | Toda exclusão tem "Desfazer"; "Novo orçamento" e "Duplicar" nunca perdem o anterior; Esc fecha a prévia |
| Consistência | Mesmos rótulos em toda parte ("Ver PDF", "Excluir", "Duplicar"); visual igual ao scapus.com.br |
| Prevenção de erros | Bloqueia PDF e mensagem sem nome do cliente, responsável ou peça válida; avisa material incompatível, peça maior que a mesa, preço abaixo do custo; orçamentos enviados ficam travados |
| Reconhecer em vez de lembrar | Clientes anteriores aparecem como sugestão e preenchem o contato; responsável lembrado; materiais marcam "não recomendado" na própria lista |
| Flexibilidade e eficiência | Duplicar orçamento ou peça, tabela rápida para responder no WhatsApp, abrir o WhatsApp do cliente já com a mensagem |
| Estética e minimalismo | Campos avançados (acabamento, extras, tamanho) recolhidos; detalhes do cálculo só quando pedidos |
| Recuperar de erros | Mensagens dizem o que houve e como resolver ("Não entendi. Escreva como 2h35m…") e levam ao campo |
| Ajuda e documentação | Configuração inicial na primeira vez, dicas em cada campo, "Como chegamos neste valor" |

## Rodar no computador

Basta abrir `public/index.html` no navegador. Para testar como no servidor:

```bash
npx serve public
```

Testes do cálculo, incluindo a modelagem sem margem (Node 18 ou mais novo):

```bash
npm test
```

## Subir no GitHub

Pelo site, sem instalar nada:

1. Em github.com, clique em **New repository**, dê o nome `orcamento3d` e crie.
2. Na página do repositório vazio, clique em **uploading an existing file**.
3. Arraste o conteúdo desta pasta (o `README.md`, o `package.json` e as pastas `public` e `tests`) e clique em **Commit changes**.

Pelo terminal:

```bash
git init
git add .
git commit -m "Plataforma de orçamentos 3D"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/orcamento3d.git
git push -u origin main
```

## Publicar no Cloudflare Pages

1. Entre em dash.cloudflare.com e abra **Workers & Pages**.
2. Clique em **Create**, escolha a aba **Pages** e depois **Connect to Git**.
3. Autorize o GitHub e escolha o repositório `orcamento3d`, branch `main`.
4. Em **Build settings**: Framework preset **None**, Build command **vazio**, Build output directory **`public`**.
5. Clique em **Save and Deploy**. O site fica em `orcamento3d.pages.dev`, e cada `git push` publica de novo sozinho.

Domínio próprio (ex.: `orcamento.scapuslab.com.br`): no projeto, abra **Custom domains** e siga os passos.

Sem GitHub, direto do terminal:

```bash
npx wrangler login
npx wrangler pages deploy public --project-name orcamento3d
```

O arquivo `public/_headers` já configura cabeçalhos de segurança no Cloudflare.

## Onde ficam os dados

Tudo fica no `localStorage` do navegador: empresa, equipe, tabela, impressoras e histórico. Ninguém mais vê, nem quem acessa o mesmo link. Isso também quer dizer que limpar os dados do navegador apaga tudo, então use **Empresa e política → Exportar backup** de vez em quando. Para usar no celular e no computador, exporte num e importe no outro.

Se um dia quiser sincronizar entre aparelhos ou ter login para uma equipe, o caminho natural no Cloudflare é um banco D1 com uma Pages Function.

## Estrutura

```
public/
  index.html         página única
  _headers           cabeçalhos de segurança (Cloudflare)
  assets/
    app.js           interface
    calc.js          cálculo de preço (funções puras, testadas)
    data.js          catálogo de impressoras e configuração inicial
    styles.css       visual e layout do PDF
    favicon.svg
tests/
  calc.test.js       testes do cálculo
```

## Licença

MIT. Use, adapte e distribua à vontade.


# VIBECODE