# 💰 Sistema Financeiro - SPA

Uma aplicação web moderna, rápida e autossuficiente (Single Page Application - SPA) para controle e planejamento financeiro pessoal, desenvolvida para rodar diretamente no navegador, inclusive offline e via protocolo local (`file:///`), sem necessidade de servidores ou banco de dados tradicional.

---

## 📌 Sobre o Projeto

Este é um **projeto estritamente pessoal**, construído sob medida para atender às minhas necessidades reais de organização e visão financeira do dia a dia.

O desenvolvimento foi realizado em pair programming com um **agente de inteligência artificial ([Antigravity](https://deepmind.google/technologies/))**, que projetou, estruturou o código, implementou regras de negócio, criou a suíte de testes unitários e refinou a interface seguindo detalhadamente minhas orientações, regras e preferências de uso.

---

## 🎯 Filosofia e Decisões de Design (Arquitetura)

Durante o desenvolvimento, algumas decisões centrais foram tomadas para priorizar simplicidade, controle total e estabilidade:

1. **Zero Dependências Externas (Vanilla JS & CSS Puro):**
   * Não utiliza frameworks pesados (como React, Angular ou Vue). Todo o código é JavaScript puro nativo com manipulação de DOM reativa e modular.
   * Os gráficos (Donut Chart, Ranking de Despesas e Evolução Anual) foram codificados em **SVG puro**, garantindo carregamento instantâneo e total independência de bibliotecas de terceiros (sem Chart.js ou D3.js).

2. **Início Sempre no Mês Seguinte (Planejamento Futuro):**
   * Por padrão, a aplicação sempre abre posicionada no **próximo mês** em relação à data atual (e em Dezembro, ela avança para Janeiro do ano seguinte).
   * **Motivo:** O foco da ferramenta é o **planejamento prévio**. A tomada de decisão financeira acontece olhando para a previsão de faturas e contas que vão vencer no mês que está chegando, e não apenas registrando o passado.

3. **Visão de Fluxo de Caixa Bruto (Todas as Entradas vs Todas as Saídas):**
   * O conceito de **Repasse** (quando você empresta seu cartão de crédito para terceiros e eles te reembolsam) é tratado como entrada integral e despesa integral vinculadas por espelhamento.
   * **Motivo:** A visão primordial é saber com precisão **tudo o que vai transitar pela conta bancária** (o que precisa ser pago na fatura cheia e o que deve cair na conta para cobrir), garantindo a sobra real no final do mês sem surpresas no saldo.

4. **Escopo Anual das Contas Fixas:**
   * Contas fixas geradas para o ano todo estendem-se até Dezembro do ano corrente.
   * **Motivo:** Evita projeções infinitas descontroladas no armazenamento local, permitindo revisar contratos e valores a cada virada de ano.

5. **Privacidade e Sincronização Opcional na Nuvem:**
   * Os dados residem primariamente no `localStorage` do seu navegador.
   * Há integração opcional com a nuvem via API do **JSONBin.io**, com salvamento em segundo plano (*auto-save*), envio forçado ao sair da página e travas de segurança contra sobrescrita acidental.

---

## 🚀 Funcionalidades Principais

### 1. 📊 Dashboard em Formato de Planilha Financeira
* **Cartões de Métricas:** Exibição clara de *Total de Receitas*, *Total de Despesas*, *Saldo Previsto* e *Total de Lançamentos* no período.
* **Tabelas Agrupadas por Tipo:** Visualização organizada em blocos verticais:
  * Receitas
  * Contas Fixas
  * Cartões de Crédito
  * Variáveis Previstas
  * Repasses
  * Outras Despesas
* **Status em Lote (Checkbox de Situação):** Permite marcar todas as contas de uma categoria de uma vez como pagas/pendentes direto pela linha da tabela.
* **Drawer Lateral de Filtros:** Filtre a exibição e os cálculos do Dashboard pelos tipos de contas desejados com contadores dinâmicos.

### 2. 💳 Gestão de Lançamentos e Parcelamentos
* **Lançamentos Avulsos e Parcelados:** Suporte nativo à sintaxe de parcelas (`1/10`, `2/10`, etc.).
* **Virada de Ano Automática:** Compras parceladas que ultrapassam o ano (ex: compra em 5x feita em Novembro de 2026) são projetadas perfeitamente para os primeiros meses de 2027.
* **Propagação em Cascata:**
  * Ao criar uma conta fixa ou variável, você escolhe se deseja replicar para todos os meses do ano restante.
  * Ao editar o valor, descrição ou parcela de um lançamento pertencente a um grupo, você decide se deseja aplicar a alteração apenas no mês vigente ou propagar para os meses seguintes.
* **Edição de Valor Inline:** Nas contas fixas e variáveis, é possível alterar o valor do mês diretamente na célula da tabela com tecla Enter.

### 3. 🔄 Sistema de Repasses Espelhados (Empréstimo de Cartão)
* Ao lançar uma despesa no Cartão de Crédito, é possível selecionar uma categoria de Repasse (ex: o nome da pessoa que usará seu cartão).
* O sistema cria automaticamente:
  1. O gasto de cartão de crédito.
  2. Uma receita correspondente na categoria da pessoa com anotação automática: `Descrição ( Nome do Cartão )`.
* Ambos os lançamentos ficam vinculados por um identificador exclusivo. Ao excluir um lançamento vinculado, o sistema exibe um aviso claro alertando sobre a exclusão da ponta espelhada.

### 4. 🏷️ Classificação por Tags Personalizadas
* Criação e exclusão de tags temáticas (ex: *Alimentação*, *Saúde*, *Transporte*, *Lazer*, *Pets*, *Casa*).
* Modal dedicado para gerenciamento de tags sem interferir nas categorias existentes.

### 5. 📈 Modal de Gráficos Nativos (SVG)
* **Gráfico de Rosca (Donut):** Proporções visuais com hover interativo sincronizado entre a fatia e a lista de ranking.
* **Filtro de Agrupamento:** Analise seus gastos agrupados **Por Categoria**, **Por Tipo** ou **Por Tag**.
* **Evolução Anual (12 Meses):** Histórico de barras verticais comparando receitas e despesas de Janeiro a Dezembro.
* **Navegação Independente:** Mudar de mês dentro do gráfico não altera o mês selecionado no Dashboard principal.

### 6. ☁️ Sincronização em Nuvem (JSONBin.io) & Backups
* Sincronização remota automática com debounce e envio imediato ao trocar de aba ou fechar a janela.
* Proteção inteligente: antes de atualizar da nuvem ao retornar o foco, o sistema pergunta ao usuário se deseja restaurar a versão remota, evitando perdas locais.
* Exportação e Importação de arquivo JSON completo com validação e reconstrução de integridade.
* Botão de emergência na Zona de Perigo para exclusão total dos dados locais mediante confirmação por digitação (`APAGAR`).

---

## 📁 Estrutura de Arquivos

```text
├── index.html              # Interface visual completa (SPA sem frameworks)
├── style.css               # Estilos modernos, responsivos e tema Dark Mode
├── build.py                # Script de compilação/bundler Python
├── app.js                  # Bundle consolidado gerado automaticamente
├── app.test.js             # Suíte completa de testes unitários isolados
├── test-runner.html        # Interface gráfica para execução e visualização de testes
│
└── js/                     # Módulos desacoplados de desenvolvimento
    ├── constants.js        # Constantes, tipos de categoria e nomes de meses
    ├── dom.js              # Cache centralizado e seletores resilientes do DOM
    ├── normalization.js    # Normalizadores de categorias e transações
    ├── storage.js          # Motor de armazenamento seguro (localStorage / sessionStorage)
    ├── state.js            # Estado global reativo da aplicação (AppState)
    ├── utils.js            # Formatação monetária (BRL), debounce e toasts
    ├── calculations.js     # Regras de negócio puras (parcelamentos, cascatas, totais)
    ├── cloud.js            # Integração REST com JSONBin.io e auto-save
    ├── router.js           # Roteador SPA (Dashboard, Categorias, Configurações)
    ├── sidebar.js          # Sidebar dinâmica e contadores por grupo
    ├── dashboard.js        # Renderização das tabelas de planilha e drawer de filtros
    ├── charts.js           # Cálculos e geração dos gráficos vetoriais SVG
    ├── categories.js       # CRUD de categorias, backups e reset seguro
    └── transactions.js     # CRUD de lançamentos, inline edit e modal de tags
```

---

## 🛠️ Como Executar o Projeto

Como o projeto foi projetado para máxima portabilidade no Windows e navegadores modernos:

### 1. Abrir Diretamente no Navegador
Basta dar um **duplo clique no arquivo `index.html`** ou arrastá-lo para dentro do navegador (Chrome, Edge, Firefox, etc.). Ele funciona direto via `file:///`.

### 2. Compilar Alterações nos Módulos (`js/`)
Se fizer alterações nos arquivos individuais da pasta `js/`, execute o script bundler em Python para atualizar o `app.js`:

```powershell
python build.py
```

### 3. Executar os Testes Unitários
Abra o arquivo `test-runner.html` no navegador com duplo clique. A suíte completa de dezenas de testes unitários de negócio será executada automaticamente, exibindo o status visual detalhado de cada cenário testado.

---

## 🛡️ Licença e Uso

Este repositório é de uso pessoal. Fique à vontade para consultar as regras de parcelamento, a lógica de bundler simples em Python ou a arquitetura em SVG puro como referência de estudo ou inspiração para seus próprios projetos.
