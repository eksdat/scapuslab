# Orçamento 3D

Plataforma de orçamentos para quem vende impressão 3D. Você informa as gramas e o tempo que o fatiador mostra e ela calcula material, máquina, energia, desgaste, mão de obra, margem e pedido mínimo, e gera o PDF com a sua marca ou o texto pronto para o WhatsApp.

É uma ferramenta gratuita da [Scapus Lab](https://scapus.com.br), com o visual do site da Scapus (Inter, laranja `#FF6A00`, tons "night" e "beige"). **Nenhum nome, logo ou contato de empresa vem no código**: na primeira vez que alguém abre a plataforma, cadastra a própria empresa, e só depois disso pode montar orçamentos e gerar PDFs, sempre com o próprio nome, logo e contatos.

É um site estático (HTML, CSS e JavaScript puros, sem build e sem servidor). Os dados ficam no navegador de quem usa.

## Primeiro acesso

1. A plataforma abre na tela **Cadastre a sua empresa**. O menu fica escondido e não existe botão de PDF até o cadastro terminar.
2. Obrigatórios: nome da empresa, seu nome (quem assina os orçamentos), cidade e WhatsApp ou e-mail. Logo, cor, frase, CPF/CNPJ, Instagram, site, impressora, Pix e ponto de retirada são opcionais.
3. Quem já usa em outro aparelho clica em **Importar arquivo** e escolhe o backup ou a configuração da empresa.
4. Depois do cadastro, tudo pode ser mudado em **Empresa e equipe**. Se o nome, a cidade ou o contato forem apagados, os PDFs e as mensagens ficam bloqueados até completar de novo.

**Para a Scapus Lab:** importe o arquivo `scapus-configuracao.json` (entregue à parte) na tela de cadastro. Ele já traz o nome, o logo, a cor, o Instagram, o site, a tabela de preços e a Bambu Lab A1. Falta só preencher seu nome e o WhatsApp. **Esse arquivo não vai para o GitHub**: o `.gitignore` já impede.

Quem tinha dados da versão anterior (que vinha com a identidade da Scapus de fábrica) passa pelo cadastro uma vez. O nome, o logo, o Instagram e o site padrão são apagados; o histórico, o WhatsApp e o que tiver sido digitado continuam.

## O que tem

- **Orçamento** em três blocos, como o site da Scapus divide o trabalho: peças impressas (prototipagem e confecção), modelagem 3D (serviço) e entrega/pagamento. Avisa quando o material não é recomendado para a máquina (ABS na A1, por exemplo) e quando a peça não cabe na mesa.
- **Quem fez o orçamento**: o campo "Feito por" escolhe uma pessoa da equipe. O nome, a função e o contato dela saem no PDF ("Orçamento feito por") e assinam a mensagem do WhatsApp.
- **Prévia do PDF** antes de salvar, com o logo e o número da empresa cadastrada (ex.: SCP-2026-0001), cliente, responsável, tabelas de peças e de modelagem, condições, validade, campo de aceite e rodapé com WhatsApp, Instagram e site. Sem logo, usa as iniciais; sem cor escolhida, sai em tons neutros.
- **Resumo ao vivo**: total, composição do preço em camadas, "Como chegamos neste valor" passo a passo e um bloco só seu com custo, lucro e preço por grama.
- **Antes de enviar**: lista o que falta (nome do cliente, tempo da peça, frete, chave Pix) e leva direto ao campo. O PDF e a mensagem só saem quando o essencial está preenchido.
- **Salvamento automático** no histórico, com número e horário à vista. Orçamentos já enviados reabrem **travados** com os valores que o cliente recebeu.
- **Histórico** com busca, status (enviado, aprovado, em produção, entregue, recusado), taxa de aprovação e lembrete de backup.
- **Tabela de preços** editável e **tabela rápida** de peças típicas (avulso, sem mínimo, lote de 10), com PDF.
- **Impressoras**: catálogo de referência com 28 modelos populares e o custo por hora de cada máquina.
- **Materiais** com preço do kg e compatibilidade com cada impressora.
- **Empresa e equipe**: identidade, equipe, contatos, Pix, prazo, ajustes inclusos, "Aprove a primeira peça", entrega e a página "O que atendemos" (PDF ou texto).
- **Backup** (tudo, com histórico) e **configuração** (só empresa e tabela, sem clientes) em arquivo JSON, para guardar ou levar a outro aparelho. Opção de apagar os dados do navegador.

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

## Valores padrão da tabela (novembro de 2026)

A tabela de preços vem preenchida com valores de referência para uma Bambu Lab A1 em Belo Horizonte. São só um ponto de partida: cada empresa troca pelos próprios custos.

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
| Prevenção de erros | Cadastro obrigatório da empresa antes do primeiro orçamento; bloqueia PDF e mensagem sem dados da empresa, nome do cliente, responsável ou peça válida; avisa material incompatível, peça maior que a mesa, preço abaixo do custo; orçamentos enviados ficam travados; apagar dados pede confirmação |
| Reconhecer em vez de lembrar | Clientes anteriores aparecem como sugestão e preenchem o contato; responsável lembrado; materiais marcam "não recomendado" na própria lista |
| Flexibilidade e eficiência | Duplicar orçamento ou peça, tabela rápida para responder no WhatsApp, abrir o WhatsApp do cliente já com a mensagem |
| Estética e minimalismo | Campos avançados (acabamento, extras, tamanho) recolhidos; detalhes do cálculo só quando pedidos |
| Recuperar de erros | Mensagens dizem o que houve e como resolver ("Não entendi. Escreva como 2h35m…") e levam ao campo |
| Ajuda e documentação | Cadastro guiado na primeira vez, com "Falta preencher" ao vivo; dicas em cada campo; "Como chegamos neste valor" |

## Rodar no computador

Basta abrir `public/index.html` no navegador. Para testar como no servidor:

```bash
npx serve public
```

Testes do cálculo (Node 18 ou mais novo):

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

Testado no emulador oficial do Cloudflare (`wrangler pages dev`) com o `_headers` deste projeto: orçamento, prévia do PDF, WhatsApp, logo, backup e histórico funcionam sem nenhum bloqueio de segurança.

Há dois caminhos. Escolha um, porque um projeto criado por arrastar arquivos **não pode ser ligado ao GitHub depois**.

### Caminho A: pelo GitHub (recomendado)

Cada `git push` ou arquivo editado no GitHub publica o site de novo sozinho.

1. Suba o projeto no GitHub (seção anterior).
2. Em dash.cloudflare.com, abra **Workers & Pages** e clique em **Create application**.
3. Na parte de Pages, escolha **Import an existing Git repository** (ou **Connect to Git**), autorize o GitHub e escolha o repositório `orcamento3d`, branch `main`.
4. Em **Build settings**: Framework preset **None**, Build command **vazio**, Build output directory **`public`**.
5. Clique em **Save and Deploy**. O site fica em `NOME-DO-PROJETO.pages.dev`.

### Caminho B: arrastar o pacote, sem GitHub

1. Em **Workers & Pages**, clique em **Create application**, depois em **Get started** em Pages e em **Drag and drop your files**.
2. Dê um nome ao projeto (ex.: `scapus-orcamentos`) e arraste o arquivo **`scapus-orcamentos-cloudflare.zip`**. Ele tem o `index.html` na raiz, que é o que o Cloudflare espera. Não arraste o zip do projeto inteiro: nele o site fica dentro de `public/` e o endereço abriria uma página de erro.
3. Clique em **Deploy site**. Para atualizar depois: no projeto, **Create a new deployment** e arraste o zip novo.

Pelo terminal, o equivalente é `npx wrangler pages deploy public --project-name scapus-orcamentos`.

### Depois de publicar

- **Use sempre o mesmo endereço.** Os dados ficam no navegador, separados por endereço. O endereço principal (`scapus-orcamentos.pages.dev`), os links de prévia (`abc123.scapus-orcamentos.pages.dev`) e um domínio próprio guardam cada um a sua cópia. Ao trocar de endereço, exporte o backup no antigo e importe no novo.
- **Domínio próprio** (ex.: `orcamento.scapus.com.br`): no projeto, abra **Custom domains** e siga os passos.
- O `_headers` aplica os cabeçalhos de segurança descritos abaixo.

### Atualizações e cache

Cada `git push` publica uma versão nova de uma vez (o Cloudflare troca todos os arquivos juntos). O HTML e os arquivos saem com `Cache-Control: public, max-age=0, must-revalidate`: a cada visita o navegador pergunta se mudou algo e recebe `304` (nada mudou, usa o que tem) ou a versão nova. Não fica versão velha presa no navegador, e quem estiver com a página aberta pega a nova ao recarregar. Os dados de cada um continuam no navegador; quando o formato muda entre versões, a plataforma converte sozinha.

Endereços que não existem (ex.: `/qualquer-coisa`) mostram uma página 404 com o link para a plataforma.

## Onde ficam os dados

Tudo fica no navegador onde a plataforma é usada: empresa, equipe, tabela, impressoras e histórico. A plataforma não tem servidor, banco de dados nem login, e não envia nada para lugar nenhum: o Cloudflare só entrega os arquivos do site e o GitHub só guarda o código. Quem abre o mesmo link vê a plataforma vazia e cadastra a própria empresa.

- **Backup:** limpar os dados do navegador apaga tudo. Use **Empresa e equipe → Exportar backup** de vez em quando (o Histórico lembra). No iPhone, o Safari pode apagar dados de sites que ficam mais de uma semana sem uso; a plataforma pede ao navegador para guardar os dados de forma permanente, mas o backup é a garantia.
- **Espaço:** os navegadores guardam alguns megabytes por site (o Safari é o mais limitado). Cada orçamento ocupa pouco mais de 1 KB, o que dá cerca de 2 mil orçamentos. O Histórico avisa quando o espaço passa de 60%.
- **Computador compartilhado:** em **Empresa e equipe → Backup e dados**, a opção "Apagar os dados deste navegador" zera tudo.

Se um dia quiser sincronizar entre aparelhos ou ter login para uma equipe, o caminho natural no Cloudflare é um banco D1 com uma Pages Function.

## Segurança

| Risco | Como está tratado |
|---|---|
| Alguém gerar orçamento com o seu logo e os seus dados | O código público não tem nome, logo nem contato de nenhuma empresa. Cada navegador começa vazio e exige o cadastro antes do primeiro orçamento. Os seus dados só existem no seu navegador e nos arquivos de backup ou configuração que você guardar. |
| Alguém na internet ver seus orçamentos | Os dados nunca saem do navegador. Não existe servidor nem banco para invadir. |
| Sessão roubada, senha vazada | Não há login, sessão nem cookie: não existe sessão para roubar. Quem usa o computador é responsável pelo acesso a ele (senha do sistema). |
| Backup ou configuração adulterados injetarem código | Todo arquivo importado é conferido campo por campo, e o texto é sempre escapado antes de aparecer na tela. Testado com arquivos maliciosos, com e sem os cabeçalhos do Cloudflare: nada é injetado nem executado. |
| Scripts e conteúdo de terceiros | Nada vem de fora: a fonte Inter é servida pelo próprio site. A Content-Security-Policy só permite arquivos do próprio endereço, sem scripts nem estilos embutidos. |
| Site aberto dentro de outro site (clickjacking), sniffing, HTTP | `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, HSTS, `Referrer-Policy: no-referrer`, `Cross-Origin-Opener-Policy`. |
| Alguém alterar o site | O site só muda por um commit no GitHub. **Ative a verificação em duas etapas (2FA) no GitHub e no Cloudflare**: é a única porta para mexer no código publicado. |
| Backup com dados de clientes (LGPD) | O backup tem nomes e telefones de clientes: guarde em lugar seguro. A **configuração** não tem clientes e é a que serve para preparar outro aparelho. |
| Aparecer no Google | `noindex` na página e no cabeçalho `X-Robots-Tag`. Para a ferramenta aparecer em buscas, tire o `noindex` do `index.html` e o `X-Robots-Tag` do `_headers`. |

Uma limitação de qualquer ferramenta: ninguém impede alguém de digitar o nome de outra empresa e baixar um logo de um site público. A plataforma só garante que nada da sua empresa vem pronto e que os seus dados não saem do seu navegador.

## Estrutura

```
public/
  index.html         página única
  404.html           página para endereços inexistentes
  _headers           cabeçalhos de segurança e cache (Cloudflare)
  assets/
    app.js           interface, cadastro e armazenamento
    calc.js          cálculo de preço (funções puras, testadas)
    data.js          catálogo de impressoras e tabela padrão (sem dados de empresa)
    styles.css       visual e layout do PDF
    favicon.svg
    fonts/           Inter (licença OFL em OFL.txt)
tests/
  calc.test.js       testes do cálculo
```

## Licença

MIT. Use, adapte e distribua à vontade.
