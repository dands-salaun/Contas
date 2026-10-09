/**
 * =============================================================================
 * SISTEMA FINANCEIRO - SUÍTE DE TESTES UNITÁRIOS (VANILLA JS)
 * QA & Frontend Sênior - Testes de Negócio Isolados do DOM
 * =============================================================================
 * 
 * Áreas Críticas Testadas:
 * 1. Lógica de Parcelamento e Virada de Ano (Multi-Ano: mês 11/2026 -> mês 0/2027)
 * 2. Exclusão e Edição em Cascata (groupId) com Mock de window.confirm (true e false)
 * 3. Cálculos e Filtros Baseados em Ano e Mês (cruzamento monthIndex + year)
 * 4. Manipulação Segura e Mock do localStorage
 * 
 * Como executar:
 * Abra o DevTools (F12) no navegador e execute: runTests()
 * =============================================================================
 */

(function (global) {
  'use strict';

  // ===========================================================================
  // 1. MICRO-FRAMEWORK DE TESTES UNITÁRIOS COM ASSERTIONS & LIFECYCLE
  // ===========================================================================

  class TestSuite {
    constructor() {
      this.suites = [];
      this.currentSuite = null;
      this.beforeEachHooks = [];
      this.afterEachHooks = [];
    }

    describe(name, fn) {
      const suite = {
        name,
        tests: [],
        beforeEachHooks: [...this.beforeEachHooks],
        afterEachHooks: [...this.afterEachHooks]
      };
      const previousSuite = this.currentSuite;
      this.currentSuite = suite;
      this.suites.push(suite);

      try {
        fn();
      } finally {
        this.currentSuite = previousSuite;
      }
    }

    test(name, fn) {
      if (!this.currentSuite) {
        this.describe('Suíte Padrão', () => this.test(name, fn));
        return;
      }
      this.currentSuite.tests.push({ name, fn });
    }

    beforeEach(fn) {
      if (this.currentSuite) {
        this.currentSuite.beforeEachHooks.push(fn);
      } else {
        this.beforeEachHooks.push(fn);
      }
    }

    afterEach(fn) {
      if (this.currentSuite) {
        this.currentSuite.afterEachHooks.push(fn);
      } else {
        this.afterEachHooks.push(fn);
      }
    }
  }

  const testRunner = new TestSuite();
  const describe = (name, fn) => testRunner.describe(name, fn);
  const it = (name, fn) => testRunner.test(name, fn);
  const test = it;
  const beforeEach = (fn) => testRunner.beforeEach(fn);
  const afterEach = (fn) => testRunner.afterEach(fn);

  function deepEqual(a, b) {
    if (a === b) return true;
    if (a === null || typeof a !== 'object' || b === null || typeof b !== 'object') {
      return false;
    }
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
        return false;
      }
    }
    return true;
  }

  function expect(actual) {
    return {
      toBe(expected) {
        if (actual !== expected) {
          throw new Error(`Esperado: [${JSON.stringify(expected)}], mas recebeu: [${JSON.stringify(actual)}]`);
        }
      },
      not: {
        toBe(expected) {
          if (actual === expected) {
            throw new Error(`Esperado NÃO ser: [${JSON.stringify(expected)}], mas recebeu: [${JSON.stringify(actual)}]`);
          }
        },
        toEqual(expected) {
          if (deepEqual(actual, expected)) {
            throw new Error(`Esperado NÃO ser equivalente a: [${JSON.stringify(expected)}]`);
          }
        },
        toThrow() {
          let threw = false;
          try {
            if (typeof actual === 'function') actual();
          } catch (e) {
            threw = true;
          }
          if (threw) {
            throw new Error('Esperado NÃO lançar exceção, mas uma exceção foi disparada.');
          }
        }
      },
      toEqual(expected) {
        if (!deepEqual(actual, expected)) {
          throw new Error(`Objetos/Arrays não são equivalentes.\nEsperado: ${JSON.stringify(expected, null, 2)}\nRecebido: ${JSON.stringify(actual, null, 2)}`);
        }
      },
      toBeCloseTo(expected, precision = 2) {
        const diff = Math.abs(Number(actual) - Number(expected));
        const tolerance = Math.pow(10, -precision) / 2;
        if (diff > tolerance) {
          throw new Error(`Valor [${actual}] não está próximo de [${expected}] com precisão de ${precision} casas (diferença: ${diff})`);
        }
      },
      toBeTruthy() {
        if (!actual) {
          throw new Error(`Esperado valor Truthy, mas recebeu: [${actual}]`);
        }
      },
      toBeFalsy() {
        if (actual) {
          throw new Error(`Esperado valor Falsy, mas recebeu: [${actual}]`);
        }
      },
      toBeNull() {
        if (actual !== null) {
          throw new Error(`Esperado null, mas recebeu: [${actual}]`);
        }
      },
      toHaveLength(expectedLength) {
        const length = actual && actual.length;
        if (length !== expectedLength) {
          throw new Error(`Esperado comprimento ${expectedLength}, mas recebeu: ${length}`);
        }
      },
      toContain(item) {
        if (!Array.isArray(actual) && typeof actual !== 'string') {
          throw new Error(`Target não é Array nem String: ${actual}`);
        }
        if (!actual.includes(item)) {
          throw new Error(`Coleção não contém o item esperado: [${JSON.stringify(item)}]`);
        }
      },
      toThrow(expectedMessageOrRegex) {
        if (typeof actual !== 'function') {
          throw new Error('O argumento para toThrow deve ser uma função.');
        }
        let threw = false;
        let caughtError = null;
        try {
          actual();
        } catch (e) {
          threw = true;
          caughtError = e;
        }

        if (!threw) {
          throw new Error('Esperava que a função lançasse um erro, mas ela executou com sucesso.');
        }

        if (expectedMessageOrRegex) {
          const msg = caughtError.message || String(caughtError);
          if (expectedMessageOrRegex instanceof RegExp) {
            if (!expectedMessageOrRegex.test(msg)) {
              throw new Error(`Mensagem de erro "${msg}" não corresponde ao padrão ${expectedMessageOrRegex}`);
            }
          } else if (!msg.includes(expectedMessageOrRegex)) {
            throw new Error(`Mensagem de erro "${msg}" não contém "${expectedMessageOrRegex}"`);
          }
        }
      }
    };
  }

  // ===========================================================================
  // 2. MOCKS DE LOCALSTORAGE E WINDOW.CONFIRM
  // ===========================================================================

  class MockStorage {
    constructor() {
      this._store = new Map();
    }
    getItem(key) {
      const val = this._store.get(String(key));
      return val !== undefined ? val : null;
    }
    setItem(key, value) {
      this._store.set(String(key), String(value));
    }
    removeItem(key) {
      this._store.delete(String(key));
    }
    clear() {
      this._store.clear();
    }
    key(index) {
      const keys = Array.from(this._store.keys());
      return keys[index] || null;
    }
    get length() {
      return this._store.size;
    }
  }

  const MockEnvironment = {
    originalLocalStorage: null,
    originalSessionStorage: null,
    originalConfirm: null,
    mockLocal: null,
    mockSession: null,
    confirmReturnValue: true,

    setup() {
      this.originalLocalStorage = global.localStorage;
      this.originalSessionStorage = global.sessionStorage;
      this.originalConfirm = global.confirm;

      this.mockLocal = new MockStorage();
      this.mockSession = new MockStorage();

      try {
        Object.defineProperty(global, 'localStorage', {
          value: this.mockLocal,
          configurable: true,
          writable: true
        });
        Object.defineProperty(global, 'sessionStorage', {
          value: this.mockSession,
          configurable: true,
          writable: true
        });
      } catch (e) {
        global.localStorage = this.mockLocal;
        global.sessionStorage = this.mockSession;
      }

      // Mock não bloqueante de window.confirm
      global.confirm = () => this.confirmReturnValue;
    },

    setConfirmReturn(val) {
      this.confirmReturnValue = Boolean(val);
      global.confirm = () => this.confirmReturnValue;
    },

    teardown() {
      try {
        Object.defineProperty(global, 'localStorage', {
          value: this.originalLocalStorage,
          configurable: true,
          writable: true
        });
        Object.defineProperty(global, 'sessionStorage', {
          value: this.originalSessionStorage,
          configurable: true,
          writable: true
        });
      } catch (e) {
        global.localStorage = this.originalLocalStorage;
        global.sessionStorage = this.originalSessionStorage;
      }

      global.confirm = this.originalConfirm;
    }
  };

  // ===========================================================================
  // 3. RECUPERAÇÃO DAS FUNÇÕES DO DOMÍNIO DA SPA
  // ===========================================================================

  const Financas = global.Financas || {};
  const {
    STORAGE_KEYS = { CATEGORIES: 'financas_categorias', TRANSACTIONS: 'financas_lancamentos' },
    DEFAULT_TAGS,
    StorageEngine,
    loadCategories,
    saveCategories,
    loadTransactions,
    saveTransactions,
    loadTags,
    saveTags,
    generateTransactionsMultiYear,
    createExpenseWithRepasseMirror,
    deleteTransactionCascade,
    updateTransactionCascade,
    calculateTotalsByMonthAndYear,
    normalizeCategory,
    normalizeTransaction,
    clearAllLocalData,
    areStatesEqual,
    checkAndSyncCloudOnStartup
  } = Financas;

  // ===========================================================================
  // 4. SUÍTES DE TESTE UNITÁRIO
  // ===========================================================================

  // ---------------------------------------------------------------------------
  // ÁREA 1: LÓGICA DE PARCELAMENTO & TRANSIÇÃO DE ANO
  // ---------------------------------------------------------------------------
  describe('1. Lógica de Parcelamento e Virada de Ano (Multi-Ano)', () => {

    it('1.1 String "1/5" iniciando em Janeiro/2026 deve gerar 5 parcelas em 2026 com o mesmo groupId', () => {
      const items = generateTransactionsMultiYear({
        description: 'Notebook Dell',
        value: 500,
        installment: '1/5',
        monthIndex: 0, // Jan
        year: 2026,
        categoryName: 'Cartão de Crédito',
        categoryType: 'Cartão de Crédito'
      });

      expect(items).toHaveLength(5);
      const gid = items[0].groupId;
      expect(Boolean(gid)).toBe(true);

      for (let i = 0; i < 5; i++) {
        expect(items[i].groupId).toBe(gid);
        expect(items[i].monthIndex).toBe(i);
        expect(items[i].year).toBe(2026);
        expect(items[i].installment).toBe(`${i + 1}/5`);
        expect(items[i].value).toBe(500);
      }
    });

    it('1.2 PONTO CRÍTICO: Virada de ano em parcelamento - "1/4" em Novembro/2026 (mês 10) deve virar para Janeiro/2027 (mês 0)', () => {
      const items = generateTransactionsMultiYear({
        description: 'Seguro Auto',
        value: 300,
        installment: '1/4',
        monthIndex: 10, // Novembro (mês 10)
        year: 2026,
        categoryName: 'Cartão de Crédito',
        categoryType: 'Cartão de Crédito'
      });

      expect(items).toHaveLength(4);

      // Parcela 1/4 -> Nov/2026
      expect(items[0].monthIndex).toBe(10);
      expect(items[0].year).toBe(2026);
      expect(items[0].installment).toBe('1/4');

      // Parcela 2/4 -> Dez/2026
      expect(items[1].monthIndex).toBe(11);
      expect(items[1].year).toBe(2026);
      expect(items[1].installment).toBe('2/4');

      // Parcela 3/4 -> VIRADA: Jan/2027 (mês 0)
      expect(items[2].monthIndex).toBe(0);
      expect(items[2].year).toBe(2027);
      expect(items[2].installment).toBe('3/4');

      // Parcela 4/4 -> Fev/2027 (mês 1)
      expect(items[3].monthIndex).toBe(1);
      expect(items[3].year).toBe(2027);
      expect(items[3].installment).toBe('4/4');

      // Todas compartilham o mesmo groupId
      expect(items.every(item => item.groupId === items[0].groupId)).toBe(true);
    });

    it('1.3 Transição direta a partir de Dezembro/2026 (mês 11): "1/3" deve jogar as próximas para Jan/2027 e Fev/2027', () => {
      const items = generateTransactionsMultiYear({
        description: 'Ceia de Natal',
        value: 150,
        installment: '1/3',
        monthIndex: 11, // Dezembro
        year: 2026,
        categoryName: 'Variável',
        categoryType: 'Cartão de Crédito'
      });

      expect(items).toHaveLength(3);
      expect(items[0].monthIndex).toBe(11);
      expect(items[0].year).toBe(2026);

      expect(items[1].monthIndex).toBe(0);
      expect(items[1].year).toBe(2027);

      expect(items[2].monthIndex).toBe(1);
      expect(items[2].year).toBe(2027);
    });

    it('1.4 Projeção de Conta Fixa limitando a Dezembro (sem cruzar o ano)', () => {
      const items = generateTransactionsMultiYear({
        description: 'Aluguel Apartamento',
        value: 2000,
        installment: '-',
        monthIndex: 8, // Setembro (mês 8)
        year: 2026,
        categoryName: 'Aluguel',
        categoryType: 'Conta Fixa'
      });

      // Regra de negócio: Conta Fixa para em Dezembro (índice 11) do ano de criação.
      // De Setembro (8) a Dezembro (11) = 4 meses (8, 9, 10, 11).
      expect(items).toHaveLength(4);
      const gid = items[0].groupId;
      expect(Boolean(gid)).toBe(true);

      // Setembro (8), Outubro (9), Novembro (10), Dezembro (11) de 2026
      expect(items[0].monthIndex).toBe(8);
      expect(items[0].year).toBe(2026);
      expect(items[1].monthIndex).toBe(9);
      expect(items[1].year).toBe(2026);
      expect(items[2].monthIndex).toBe(10);
      expect(items[2].year).toBe(2026);
      expect(items[3].monthIndex).toBe(11);
      expect(items[3].year).toBe(2026);

      // Garante que nenhum item avançou para 2027
      expect(items.every(t => t.year === 2026)).toBe(true);

      // Todos com o mesmo groupId
      expect(items.every(t => t.groupId === gid)).toBe(true);
    });

    it('1.4.1 Projeção de Repasse limitando estritamente a Dezembro (sem cruzar o ano)', () => {
      const items = generateTransactionsMultiYear({
        description: 'Repasse Sócios',
        value: 1200,
        installment: '-',
        monthIndex: 9, // Outubro (mês 9)
        year: 2026,
        categoryName: 'Repasses Empresa',
        categoryType: 'Repasse',
        shouldPropagate: true
      });

      // Outubro (9), Novembro (10), Dezembro (11) = 3 lançamentos
      expect(items).toHaveLength(3);
      const gid = items[0].groupId;
      expect(Boolean(gid)).toBe(true);

      expect(items[0].monthIndex).toBe(9);
      expect(items[0].year).toBe(2026);
      expect(items[1].monthIndex).toBe(10);
      expect(items[1].year).toBe(2026);
      expect(items[2].monthIndex).toBe(11);
      expect(items[2].year).toBe(2026);

      // Garante que não vazou para o ano seguinte
      expect(items.every(t => t.year === 2026)).toBe(true);
      expect(items.every(t => t.groupId === gid)).toBe(true);
    });

    it('1.5 Parcela intermediária: "3/5" iniciando no mês 11 de 2026 gera apenas 3 parcelas (3/5 em 2026, 4/5 e 5/5 em 2027)', () => {
      const items = generateTransactionsMultiYear({
        description: 'Curso',
        value: 100,
        installment: '3/5',
        monthIndex: 11,
        year: 2026,
        categoryName: 'Educação',
        categoryType: 'Cartão de Crédito'
      });

      expect(items).toHaveLength(3);
      expect(items[0].installment).toBe('3/5');
      expect(items[0].year).toBe(2026);
      expect(items[0].monthIndex).toBe(11);

      expect(items[1].installment).toBe('4/5');
      expect(items[1].year).toBe(2027);
      expect(items[1].monthIndex).toBe(0);

      expect(items[2].installment).toBe('5/5');
      expect(items[2].year).toBe(2027);
      expect(items[2].monthIndex).toBe(1);
    });

    it('1.6 Lançamento avulso (não parcelado e não fixo) gera 1 item com groupId nulo', () => {
      const items = generateTransactionsMultiYear({
        description: 'Venda de Item Usado',
        value: 300,
        installment: '-',
        monthIndex: 4,
        year: 2026,
        categoryName: 'Despesas Gerais',
        categoryType: 'Despesa Comum'
      });

      expect(items).toHaveLength(1);
      expect(items[0].groupId).toBeNull();
      expect(items[0].year).toBe(2026);
      expect(items[0].monthIndex).toBe(4);
    });

    it('1.7 Validação de erros: parcelas impossíveis ("6/5", "0/5", "3/0") disparam exceção', () => {
      expect(() => {
        generateTransactionsMultiYear({
          description: 'Erro',
          value: 100,
          installment: '6/5',
          monthIndex: 0,
          year: 2026
        });
      }).toThrow('A parcela atual não pode ser maior que o total.');

      expect(() => {
        generateTransactionsMultiYear({
          description: 'Erro Zero',
          value: 100,
          installment: '0/5',
          monthIndex: 0,
          year: 2026
        });
      }).toThrow('Os números da parcela devem ser maiores que zero.');
    });
  });

  // ---------------------------------------------------------------------------
  // ÁREA 2: EXCLUSÃO E EDIÇÃO EM CASCATA (GROUPID) & WINDOW.CONFIRM
  // ---------------------------------------------------------------------------
  describe('2. Exclusão e Edição em Cascata (groupId & Mock de window.confirm)', () => {

    beforeEach(() => {
      MockEnvironment.setup();
    });

    afterEach(() => {
      MockEnvironment.teardown();
    });

    it('2.1 Exclusão com confirm = true: exclui o lançamento atual E todas as ocorrências futuras do mesmo groupId', () => {
      MockEnvironment.setConfirmReturn(true);

      const groupId = 'grp_internet_123';
      const transactions = [
        { id: 't_out_2026', groupId, description: 'Internet Fibra', value: 120, monthIndex: 9, year: 2026 },
        { id: 't_nov_2026', groupId, description: 'Internet Fibra', value: 120, monthIndex: 10, year: 2026 },
        { id: 't_dez_2026', groupId, description: 'Internet Fibra', value: 120, monthIndex: 11, year: 2026 },
        { id: 't_jan_2027', groupId, description: 'Internet Fibra', value: 120, monthIndex: 0, year: 2027 },
        { id: 't_fev_2027', groupId, description: 'Internet Fibra', value: 120, monthIndex: 1, year: 2027 },
        { id: 't_outro', groupId: 'outro_grupo', description: 'Outro Lançamento', value: 50, monthIndex: 11, year: 2026 }
      ];

      // Exclui a partir de Dezembro/2026 (mês 11, ano 2026) com confirm = true
      const shouldDeleteSubsequent = global.confirm();
      expect(shouldDeleteSubsequent).toBe(true);

      const result = deleteTransactionCascade(transactions, 't_dez_2026', shouldDeleteSubsequent);

      // t_out_2026 e t_nov_2026 (passados) DEVEM PERMANECER
      expect(result.transactions.some(t => t.id === 't_out_2026')).toBe(true);
      expect(result.transactions.some(t => t.id === 't_nov_2026')).toBe(true);

      // t_dez_2026 (alvo), t_jan_2027 e t_fev_2027 (futuros do grupo) DEVEM SER EXCLUÍDOS
      expect(result.transactions.some(t => t.id === 't_dez_2026')).toBe(false);
      expect(result.transactions.some(t => t.id === 't_jan_2027')).toBe(false);
      expect(result.transactions.some(t => t.id === 't_fev_2027')).toBe(false);

      // Item de outro grupo permanece intacto
      expect(result.transactions.some(t => t.id === 't_outro')).toBe(true);
      expect(result.deletedCount).toBe(3); // Dez/26 + Jan/27 + Fev/27
    });

    it('2.2 Exclusão com confirm = false: afeta APENAS o mês atual; meses passados e futuros permanecem intactos', () => {
      MockEnvironment.setConfirmReturn(false);

      const groupId = 'grp_academia_456';
      const transactions = [
        { id: 't_nov_2026', groupId, description: 'Academia', value: 90, monthIndex: 10, year: 2026 },
        { id: 't_dez_2026', groupId, description: 'Academia', value: 90, monthIndex: 11, year: 2026 },
        { id: 't_jan_2027', groupId, description: 'Academia', value: 90, monthIndex: 0, year: 2027 },
        { id: 't_fev_2027', groupId, description: 'Academia', value: 90, monthIndex: 1, year: 2027 }
      ];

      const shouldDeleteSubsequent = global.confirm();
      expect(shouldDeleteSubsequent).toBe(false);

      // Exclui apenas Dezembro/2026
      const result = deleteTransactionCascade(transactions, 't_dez_2026', shouldDeleteSubsequent);

      expect(result.deletedCount).toBe(1);
      expect(result.transactions.some(t => t.id === 't_dez_2026')).toBe(false);

      // Meses anterior e posteriores continuam na lista!
      expect(result.transactions.some(t => t.id === 't_nov_2026')).toBe(true);
      expect(result.transactions.some(t => t.id === 't_jan_2027')).toBe(true);
      expect(result.transactions.some(t => t.id === 't_fev_2027')).toBe(true);
      expect(result.transactions).toHaveLength(3);
    });

    it('2.3 Edição com confirm = true: atualiza descrição e valor do mês atual e de todos os meses futuros do mesmo groupId', () => {
      MockEnvironment.setConfirmReturn(true);

      const groupId = 'grp_condominio_789';
      const transactions = [
        { id: 'c_out_2026', groupId, description: 'Condomínio', value: 400, monthIndex: 9, year: 2026 },
        { id: 'c_nov_2026', groupId, description: 'Condomínio', value: 400, monthIndex: 10, year: 2026 },
        { id: 'c_dez_2026', groupId, description: 'Condomínio', value: 400, monthIndex: 11, year: 2026 },
        { id: 'c_jan_2027', groupId, description: 'Condomínio', value: 400, monthIndex: 0, year: 2027 }
      ];

      const propagate = global.confirm();
      expect(propagate).toBe(true);

      // Edita a partir de Novembro/2026 para valor 450 e nova descrição
      const result = updateTransactionCascade(
        transactions,
        'c_nov_2026',
        { description: 'Condomínio Reajustado', value: 450 },
        propagate
      );

      // Outubro/2026 (passado) DEVE MANTER 400 e descrição antiga
      const out26 = result.transactions.find(t => t.id === 'c_out_2026');
      expect(out26.value).toBe(400);
      expect(out26.description).toBe('Condomínio');

      // Novembro/2026 (editado), Dezembro/2026 e Janeiro/2027 DEVEM TER 450
      const nov26 = result.transactions.find(t => t.id === 'c_nov_2026');
      const dez26 = result.transactions.find(t => t.id === 'c_dez_2026');
      const jan27 = result.transactions.find(t => t.id === 'c_jan_2027');

      expect(nov26.value).toBe(450);
      expect(nov26.description).toBe('Condomínio Reajustado');
      expect(dez26.value).toBe(450);
      expect(dez26.description).toBe('Condomínio Reajustado');
      expect(jan27.value).toBe(450);
      expect(jan27.description).toBe('Condomínio Reajustado');
      expect(result.updatedCount).toBe(3);
    });

    it('2.4 Edição com confirm = false: afeta APENAS o mês atual; meses futuros mantêm o valor e descrição originais', () => {
      MockEnvironment.setConfirmReturn(false);

      const groupId = 'grp_energia_111';
      const transactions = [
        { id: 'e_nov_2026', groupId, description: 'Energia', value: 150, monthIndex: 10, year: 2026 },
        { id: 'e_dez_2026', groupId, description: 'Energia', value: 150, monthIndex: 11, year: 2026 },
        { id: 'e_jan_2027', groupId, description: 'Energia', value: 150, monthIndex: 0, year: 2027 }
      ];

      const propagate = global.confirm();
      expect(propagate).toBe(false);

      // Edita apenas Dezembro/2026
      const result = updateTransactionCascade(
        transactions,
        'e_dez_2026',
        { description: 'Energia com Bandeira Vermelha', value: 230 },
        propagate
      );

      expect(result.updatedCount).toBe(1);

      const dez26 = result.transactions.find(t => t.id === 'e_dez_2026');
      expect(dez26.value).toBe(230);
      expect(dez26.description).toBe('Energia com Bandeira Vermelha');

      // Novembro/2026 e Janeiro/2027 mantêm 150
      expect(result.transactions.find(t => t.id === 'e_nov_2026').value).toBe(150);
      expect(result.transactions.find(t => t.id === 'e_jan_2027').value).toBe(150);
    });

    it('2.5 Edição de lançamento sem groupId atualiza apenas o próprio item', () => {
      const transactions = [
        { id: 't_avulso_1', groupId: null, description: 'Manutenção Única', value: 80, monthIndex: 5, year: 2026 },
        { id: 't_avulso_2', groupId: null, description: 'Outro', value: 100, monthIndex: 5, year: 2026 }
      ];

      const result = updateTransactionCascade(
        transactions,
        't_avulso_1',
        { description: 'Manutenção Concluída', value: 95 },
        true
      );

      expect(result.updatedCount).toBe(1);
      expect(result.transactions.find(t => t.id === 't_avulso_1').value).toBe(95);
      expect(result.transactions.find(t => t.id === 't_avulso_2').value).toBe(100);
    });

    it('2.6 Exclusão com linkedId: ao excluir um item, o par vinculado pelo linkedId também é excluído', () => {
      const linkId = 'link_sofisa_francisca_1';
      const transactions = [
        { id: 't_despesa_cartao', linkedId: linkId, description: 'Tênis Nike', value: 300, monthIndex: 5, year: 2026 },
        { id: 't_receita_repasse', linkedId: linkId, description: 'Tênis Nike (Origem: Sofisa)', value: 300, monthIndex: 5, year: 2026 },
        { id: 't_outro', linkedId: null, description: 'Mercado', value: 150, monthIndex: 5, year: 2026 }
      ];

      // Exclui a despesa do cartão
      const result = deleteTransactionCascade(transactions, 't_despesa_cartao', false);

      expect(result.deletedCount).toBe(2);
      expect(result.transactions.some(t => t.id === 't_despesa_cartao')).toBe(false);
      expect(result.transactions.some(t => t.id === 't_receita_repasse')).toBe(false);
      expect(result.transactions.some(t => t.id === 't_outro')).toBe(true);
    });

    it('2.7 Exclusão de compras parceladas vinculadas com linkedId e groupId: apaga parcelas e receitas correspondentes', () => {
      const link1 = 'link_p1';
      const link2 = 'link_p2';
      const groupDesp = 'grp_cartao_10x';
      const groupRep = 'grp_repasse_10x';

      const transactions = [
        { id: 'd_1', groupId: groupDesp, linkedId: link1, description: 'Celular 1/2', value: 500, monthIndex: 3, year: 2026 },
        { id: 'r_1', groupId: groupRep, linkedId: link1, description: 'Celular 1/2 (Origem: Nubank)', value: 500, monthIndex: 3, year: 2026 },
        { id: 'd_2', groupId: groupDesp, linkedId: link2, description: 'Celular 2/2', value: 500, monthIndex: 4, year: 2026 },
        { id: 'r_2', groupId: groupRep, linkedId: link2, description: 'Celular 2/2 (Origem: Nubank)', value: 500, monthIndex: 4, year: 2026 },
        { id: 'outro', groupId: null, linkedId: null, description: 'Luz', value: 100, monthIndex: 3, year: 2026 }
      ];

      // Exclui a partir da parcela 1 com cascata futura
      const result = deleteTransactionCascade(transactions, 'd_1', true);

      expect(result.deletedCount).toBe(4); // d_1, r_1, d_2, r_2
      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].id).toBe('outro');
    });
  });

  // ---------------------------------------------------------------------------
  // ÁREA 3: CÁLCULOS E FILTROS BASEADOS EM ANO E MÊS (monthIndex & year)
  // ---------------------------------------------------------------------------
  describe('3. Cálculos e Filtros Baseados em Ano/Mês (monthIndex e year)', () => {

    const categories = [
      { id: 'c1', name: 'Salário', type: 'Receita' },
      { id: 'c2', name: 'Aluguel', type: 'Conta Fixa' },
      { id: 'c3', name: 'Cartão Black', type: 'Cartão de Crédito' },
      { id: 'c4', name: 'Supermercado', type: 'Variável Prevista' }
    ];

    it('3.1 Totalização deve filtrar estritamente monthIndex E year (Janeiro/2026 vs Janeiro/2027 não se misturam)', () => {
      const transactions = [
        { categoryName: 'Salário', value: 5000, monthIndex: 0, year: 2026 },
        { categoryName: 'Aluguel', value: 1500, monthIndex: 0, year: 2026 },
        // Mesmo mês (Janeiro), mas em 2027:
        { categoryName: 'Salário', value: 6500, monthIndex: 0, year: 2027 },
        { categoryName: 'Aluguel', value: 1800, monthIndex: 0, year: 2027 }
      ];

      const summary2026 = calculateTotalsByMonthAndYear(transactions, categories, 0, 2026);
      expect(summary2026.totalReceitas).toBe(5000);
      expect(summary2026.totalDespesas).toBe(1500);
      expect(summary2026.saldoPrevisto).toBe(3500);
      expect(summary2026.totalLancamentos).toBe(2);

      const summary2027 = calculateTotalsByMonthAndYear(transactions, categories, 0, 2027);
      expect(summary2027.totalReceitas).toBe(6500);
      expect(summary2027.totalDespesas).toBe(1800);
      expect(summary2027.saldoPrevisto).toBe(4700);
      expect(summary2027.totalLancamentos).toBe(2);
    });

    it('3.2 Lançamentos de outros meses no mesmo ano não contaminam o mês de referência', () => {
      const transactions = [
        { categoryName: 'Salário', value: 5000, monthIndex: 5, year: 2026 },
        { categoryName: 'Aluguel', value: 1200, monthIndex: 5, year: 2026 },
        { categoryName: 'Cartão Black', value: 800, monthIndex: 6, year: 2026 }, // Mês 6
        { categoryName: 'Supermercado', value: 400, monthIndex: 7, year: 2026 } // Mês 7
      ];

      const summaryJun = calculateTotalsByMonthAndYear(transactions, categories, 5, 2026);
      expect(summaryJun.totalReceitas).toBe(5000);
      expect(summaryJun.totalDespesas).toBe(1200);
      expect(summaryJun.saldoPrevisto).toBe(3800);
      expect(summaryJun.totalLancamentos).toBe(2);
    });

    it('3.3 Saldo previsto negativo é calculado com exatidão', () => {
      const transactions = [
        { categoryName: 'Salário', value: 2000, monthIndex: 2, year: 2026 },
        { categoryName: 'Aluguel', value: 1500, monthIndex: 2, year: 2026 },
        { categoryName: 'Cartão Black', value: 1200, monthIndex: 2, year: 2026 }
      ];

      const summary = calculateTotalsByMonthAndYear(transactions, categories, 2, 2026);
      expect(summary.totalReceitas).toBe(2000);
      expect(summary.totalDespesas).toBe(2700);
      expect(summary.saldoPrevisto).toBe(-700);
    });

    it('3.4 categoryTotals calcula o total individual de cada categoria no mês e ano selecionados', () => {
      const transactions = [
        { categoryName: 'Cartão Black', value: 250.50, monthIndex: 3, year: 2026 },
        { categoryName: 'Cartão Black', value: 149.50, monthIndex: 3, year: 2026 },
        { categoryName: 'Aluguel', value: 1200, monthIndex: 3, year: 2026 },
        { categoryName: 'Cartão Black', value: 500, monthIndex: 3, year: 2027 } // Outro ano
      ];

      const summary = calculateTotalsByMonthAndYear(transactions, categories, 3, 2026);
      expect(summary.categoryTotals.get('cartão black')).toBe(400.00);
      expect(summary.categoryTotals.get('aluguel')).toBe(1200.00);
    });

    it('3.5 Período sem lançamentos retorna valores zerados sem gerar NaN', () => {
      const summary = calculateTotalsByMonthAndYear([], categories, 11, 2028);
      expect(summary.totalReceitas).toBe(0);
      expect(summary.totalDespesas).toBe(0);
      expect(summary.saldoPrevisto).toBe(0);
      expect(summary.totalLancamentos).toBe(0);
    });

    it('3.6 Controle de ponto flutuante IEEE-754 (ex: 0.10 + 0.20 = 0.30)', () => {
      const transactions = [
        { categoryName: 'Salário', value: 0.10, monthIndex: 0, year: 2026 },
        { categoryName: 'Salário', value: 0.20, monthIndex: 0, year: 2026 }
      ];

      const summary = calculateTotalsByMonthAndYear(transactions, categories, 0, 2026);
      expect(summary.totalReceitas).toBe(0.30);
    });

    it('3.7 Estornos e créditos negativos abatem corretamente as despesas e totais da categoria', () => {
      const transactions = [
        { categoryName: 'Cartão Black', value: 350.00, monthIndex: 4, year: 2026 },
        { categoryName: 'Cartão Black', value: -50.00, monthIndex: 4, year: 2026 }, // Estorno de cartão
        { categoryName: 'Salário', value: 4000.00, monthIndex: 4, year: 2026 }
      ];

      const summary = calculateTotalsByMonthAndYear(transactions, categories, 4, 2026);
      expect(summary.totalReceitas).toBe(4000.00);
      expect(summary.totalDespesas).toBe(300.00); // 350 - 50 = 300
      expect(summary.saldoPrevisto).toBe(3700.00); // 4000 - 300 = 3700
      expect(summary.categoryTotals.get('cartão black')).toBe(300.00);
    });

    it('3.8 Repasses manuais comportam-se como valores a receber (somam em Receitas e no Saldo Previsto, NUNCA em Despesas)', () => {
      const catsWithRepasse = [
        { id: 'c_sal', name: 'Salário', type: 'Receita' },
        { id: 'c_luz', name: 'Luz', type: 'Conta Fixa' },
        { id: 'c_rep', name: 'Francisca', type: 'Repasse' }
      ];

      const transactions = [
        { categoryName: 'Salário', value: 3000.00, monthIndex: 2, year: 2026 },
        { categoryName: 'Luz', value: 200.00, monthIndex: 2, year: 2026 },
        { categoryName: 'Francisca', value: 500.00, monthIndex: 2, year: 2026 } // Repasse manual
      ];

      const summary = calculateTotalsByMonthAndYear(transactions, catsWithRepasse, 2, 2026);
      
      // Receitas devem incluir o salário (3000) e o repasse a receber (500) = 3500
      expect(summary.totalReceitas).toBe(3500.00);
      // Despesas devem conter apenas a conta de Luz = 200 (Repasse NUNCA infla despesas)
      expect(summary.totalDespesas).toBe(200.00);
      // Saldo Previsto = 3500 - 200 = 3300
      expect(summary.saldoPrevisto).toBe(3300.00);
    });

    it('3.9 Filtro de parcelas: classifica "1x" e "à vista" como compras únicas e "1/3" ou "2x" como parceladas', () => {
      const isParcelada = (installment) => {
        if (!installment) return false;
        const clean = String(installment).trim();
        if (!clean || clean === '-') return false;
        if (/^1\s*x$/i.test(clean)) return false;
        if (/^(à\s*vista|a\s*vista|vista|única|unica)$/i.test(clean)) return false;
        return clean.includes('/') || /^([2-9]|\d{2,})\s*x$/i.test(clean);
      };

      const items = [
        { desc: 'Item 1', installment: '-' },
        { desc: 'Item 2', installment: '1x' },
        { desc: 'Item 3', installment: 'à vista' },
        { desc: 'Item 4', installment: '1/3' },
        { desc: 'Item 5', installment: '2x' }
      ];

      const unicas = items.filter(t => !isParcelada(t.installment));
      const parceladas = items.filter(t => isParcelada(t.installment));

      expect(unicas.map(t => t.desc)).toEqual(['Item 1', 'Item 2', 'Item 3']);
      expect(parceladas.map(t => t.desc)).toEqual(['Item 4', 'Item 5']);
    });

    it('3.10 Lançamentos órfãos sem categoria válida são desconsiderados nos totais do Dashboard', () => {
      const activeCats = [
        { id: 'c_mercado', name: 'Mercado', type: 'Cartão de Crédito' }
      ];
      const transactions = [
        { categoryId: 'c_mercado', categoryName: 'Mercado', value: 200, monthIndex: 5, year: 2026 },
        { categoryId: 'c_orfao', categoryName: 'Categoria Apagada', value: 999, monthIndex: 5, year: 2026 }
      ];

      const summary = calculateTotalsByMonthAndYear(transactions, activeCats, 5, 2026);
      expect(summary.totalLancamentos).toBe(1);
      expect(summary.totalDespesas).toBe(200.00);
      expect(summary.categoryTotals.get('categoria apagada')).toBe(undefined);
    });
  });

  // ---------------------------------------------------------------------------
  // ÁREA 4: MANIPULAÇÃO E MOCK DO LOCALSTORAGE
  // ---------------------------------------------------------------------------
  describe('4. Manipulação e Mocking do localStorage', () => {

    beforeEach(() => {
      MockEnvironment.setup();
      if (StorageEngine && typeof StorageEngine.init === 'function') {
        StorageEngine.init();
      }
    });

    afterEach(() => {
      MockEnvironment.teardown();
      if (StorageEngine && typeof StorageEngine.init === 'function') {
        StorageEngine.init();
      }
    });

    it('4.1 StorageEngine persiste e lê objetos complexos do mock sem tocar no localStorage real', () => {
      const payload = { config: 'teste', ano: 2026, flag: true };
      StorageEngine.set('__financas_teste__', payload);

      const loaded = StorageEngine.get('__financas_teste__');
      expect(loaded).toEqual(payload);
      expect(MockEnvironment.mockLocal.getItem('__financas_teste__')).toBe(JSON.stringify(payload));
    });

    it('4.2 saveCategories e loadCategories operam corretamente com o storage em memória', () => {
      const testCats = [
        { id: 'c_1', name: 'Nubank', type: 'Cartão de Crédito' },
        { id: 'c_2', name: 'Salário', type: 'Receita' }
      ];

      saveCategories(testCats);
      const loaded = loadCategories();

      expect(loaded).toHaveLength(2);
      expect(loaded[0].name).toBe('Nubank');
      expect(loaded[1].type).toBe('Receita');
    });

    it('4.2.1 Permite categorias com o mesmo nome em tipos distintos (ex: "Francisca" em Repasses e em Variáveis Previstas)', () => {
      const testCats = [
        { id: 'cat_rep_1', name: 'Francisca', type: 'Repasse' },
        { id: 'cat_var_2', name: 'Francisca', type: 'Variável Prevista' }
      ];

      saveCategories(testCats);
      const loaded = loadCategories();

      expect(loaded).toHaveLength(2);
      expect(loaded[0].name).toBe('Francisca');
      expect(loaded[0].type).toBe('Repasse');
      expect(loaded[1].name).toBe('Francisca');
      expect(loaded[1].type).toBe('Variável Prevista');
      expect(loaded[0].id).not.toBe(loaded[1].id);
    });

    it('4.3 saveTransactions e loadTransactions preservam groupId, year e monthIndex', () => {
      const testTrans = [
        { id: 't_1', groupId: 'grp_abc', categoryName: 'Nubank', year: 2027, monthIndex: 0, description: 'Notebook', installment: '2/5', value: 450, isPaid: true }
      ];

      saveTransactions(testTrans);
      const loaded = loadTransactions();

      expect(loaded).toHaveLength(1);
      expect(loaded[0].groupId).toBe('grp_abc');
      expect(loaded[0].year).toBe(2027);
      expect(loaded[0].monthIndex).toBe(0);
      expect(loaded[0].value).toBe(450);
      expect(loaded[0].isPaid).toBe(true);
    });

    it('4.4 loadCategories e loadTransactions retornam array vazio [] quando o storage estiver limpo', () => {
      MockEnvironment.mockLocal.clear();
      expect(loadCategories()).toEqual([]);
      expect(loadTransactions()).toEqual([]);
    });

    it('4.5 Isolamento: o localStorage original do navegador não é alterado pelos testes', () => {
      expect(global.localStorage).toBe(MockEnvironment.mockLocal);
      expect(MockEnvironment.originalLocalStorage).not.toBe(MockEnvironment.mockLocal);
    });
  });

  // ---------------------------------------------------------------------------
  // ÁREA 5: CLASSIFICAÇÃO / TAGS DINÂMICAS
  // ---------------------------------------------------------------------------
  describe('5. Classificação / Tags Dinâmicas dos Lançamentos', () => {

    beforeEach(() => {
      MockEnvironment.setup();
    });

    afterEach(() => {
      MockEnvironment.teardown();
    });

    it('5.1 loadTags inicializa com lista vazia [] caso o storage esteja vazio', () => {
      MockEnvironment.mockLocal.clear();
      const tags = loadTags();
      expect(tags).toHaveLength(0);
      expect(tags).toEqual([]);
    });

    it('5.2 saveTags persiste nova tag no localStorage com sucesso', () => {
      const novasTags = ['Alimentação', 'Tecnologia', 'Streaming'];
      saveTags(novasTags, true);
      const res = loadTags();
      expect(res).toHaveLength(3);
      expect(res).toContain('Streaming');
    });

    it('5.3 normalizeTransaction preserva a propriedade tag e mapeia aliases', () => {
      const t1 = normalizeTransaction({ description: 'Almoço', tag: 'Alimentação' });
      expect(t1.tag).toBe('Alimentação');

      const t2 = normalizeTransaction({ description: 'Cinema', classificacao: 'Lazer' });
      expect(t2.tag).toBe('Lazer');

      const t3 = normalizeTransaction({ description: 'Sem tag' });
      expect(t3.tag).toBe('');
    });

    it('5.4 generateTransactionsMultiYear replica a tag para todas as parcelas geradas', () => {
      const parcelas = generateTransactionsMultiYear({
        description: 'iPhone',
        value: 1000,
        installment: '1/3',
        monthIndex: 0,
        year: 2026,
        tag: 'Tecnologia'
      });

      expect(parcelas).toHaveLength(3);
      parcelas.forEach(p => {
        expect(p.tag).toBe('Tecnologia');
      });
    });

    it('5.5 generateTransactionsMultiYear replica a tag na propagação até Dezembro', () => {
      const fixas = generateTransactionsMultiYear({
        description: 'Internet Fibra',
        value: 120,
        installment: '-',
        monthIndex: 9, // Outubro
        year: 2026,
        categoryType: 'Conta Fixa',
        shouldPropagate: true,
        tag: 'Moradia'
      });

      expect(fixas).toHaveLength(3); // Out, Nov, Dez
      fixas.forEach(f => {
        expect(f.tag).toBe('Moradia');
      });
    });

    it('5.6 updateTransactionCascade propaga a alteração de tag para meses seguintes do mesmo groupId', () => {
      const items = [
        { id: 't1', groupId: 'g1', year: 2026, monthIndex: 2, description: 'Luz', value: 100, installment: '-', categoryType: 'Conta Fixa', tag: 'Moradia' },
        { id: 't2', groupId: 'g1', year: 2026, monthIndex: 3, description: 'Luz', value: 100, installment: '-', categoryType: 'Conta Fixa', tag: 'Moradia' },
        { id: 't3', groupId: 'g1', year: 2026, monthIndex: 4, description: 'Luz', value: 100, installment: '-', categoryType: 'Conta Fixa', tag: 'Moradia' }
      ];

      const res = updateTransactionCascade(items, 't2', { tag: 'Serviços' }, true);
      const atualizados = res.transactions;

      expect(atualizados.find(t => t.id === 't1').tag).toBe('Moradia'); // Mês anterior mantido
      expect(atualizados.find(t => t.id === 't2').tag).toBe('Serviços'); // Alvo atualizado
      expect(atualizados.find(t => t.id === 't3').tag).toBe('Serviços'); // Futuro atualizado
    });

    it('5.7 Exclusão de tag na lista não afeta os lançamentos antigos que utilizavam essa tag', () => {
      // Tags ativas: Alimentação e Transporte
      saveTags(['Alimentação', 'Transporte'], true);
      
      // Lançamentos existentes com a tag Alimentação
      const lancamentos = [
        { id: 'l1', description: 'Supermercado', value: 200, tag: 'Alimentação', year: 2026, monthIndex: 0, categoryName: 'Cartão' },
        { id: 'l2', description: 'Metrô', value: 50, tag: 'Transporte', year: 2026, monthIndex: 0, categoryName: 'Cartão' }
      ];
      saveTransactions(lancamentos, true);

      // Exclui 'Alimentação' da lista de tags disponíveis
      const novasTags = loadTags().filter(t => t !== 'Alimentação');
      saveTags(novasTags, true);

      // As tags disponíveis agora têm apenas 'Transporte'
      expect(loadTags()).toEqual(['Transporte']);

      // Lançamento antigo preserva rigorosamente a tag 'Alimentação'
      const transCarregadas = loadTransactions();
      expect(transCarregadas.find(t => t.id === 'l1').tag).toBe('Alimentação');
      expect(transCarregadas.find(t => t.id === 'l2').tag).toBe('Transporte');
    });

    it('5.8 renderTagSelectOptions sem argumentos preserva a classificação selecionada no formulário', () => {
      saveTags(['Alimentação', 'Saúde'], true);
      Financas.AppState.tags = ['Alimentação', 'Saúde'];

      if (Financas.DOM.itemTag) {
        Financas.renderTagSelectOptions('Saúde');
        expect(Financas.DOM.itemTag.value).toBe('Saúde');

        // Simula o fechamento do modal chamando sem argumentos
        Financas.renderTagSelectOptions();

        // O valor NÃO deve ser limpo
        expect(Financas.DOM.itemTag.value).toBe('Saúde');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // ÁREA 6: REPASSES COM LANÇAMENTO DUPLO, VINCULAÇÃO (linkedId), DELEÇÃO E EDIÇÃO SINCRONIZADA
  // ---------------------------------------------------------------------------
  describe('6. Repasses com Lançamento Duplo e Pares Vinculados (linkedId)', () => {

    beforeEach(() => {
      MockEnvironment.setup();
    });

    afterEach(() => {
      MockEnvironment.teardown();
    });

    const cardCategory = { id: 'cat_card_1', name: 'Cartão Sofisa', type: 'Cartão de Crédito' };
    const repasseCategory = { id: 'cat_rep_1', name: 'Francisca', type: 'Repasse' };

    it('6.1 createExpenseWithRepasseMirror cria dois lançamentos simultâneos vinculados por linkedId único', () => {
      const result = createExpenseWithRepasseMirror({
        description: 'Almoço Executivo',
        value: 120.50,
        installment: '-',
        monthIndex: 4,
        year: 2026,
        cardCategory,
        repasseCategory,
        tag: 'Alimentação'
      });

      expect(result.expenses).toHaveLength(1);
      expect(result.revenues).toHaveLength(1);
      expect(result.all).toHaveLength(2);

      const exp = result.expenses[0];
      const rev = result.revenues[0];

      // Ambos devem compartilhar o mesmo linkedId
      expect(exp.linkedId).toBeTruthy();
      expect(exp.linkedId).toBe(rev.linkedId);

      // Valores idênticos
      expect(exp.value).toBe(120.50);
      expect(rev.value).toBe(120.50);

      // Despesa no cartão vs Receita no repasse
      expect(exp.categoryType).toBe('Cartão de Crédito');
      expect(exp.categoryId).toBe('cat_card_1');

      expect(rev.categoryType).toBe('Repasse');
      expect(rev.categoryId).toBe('cat_rep_1');
      expect(rev.isRevenue).toBe(true);

      // Rastreabilidade visual no repasse
      expect(rev.description).toBe('Almoço Executivo ( Cartão Sofisa )');
      expect(exp.tag).toBe('Alimentação');
      expect(rev.tag).toBe('Alimentação');
    });

    it('6.2 createExpenseWithRepasseMirror suporta parcelamento (1/3) gerando pares vinculados individualmente', () => {
      const result = createExpenseWithRepasseMirror({
        description: 'Celular Novo',
        value: 300,
        installment: '1/3',
        monthIndex: 0,
        year: 2026,
        cardCategory,
        repasseCategory,
        tag: 'Tecnologia'
      });

      expect(result.expenses).toHaveLength(3);
      expect(result.revenues).toHaveLength(3);
      expect(result.all).toHaveLength(6);

      for (let i = 0; i < 3; i++) {
        const expParcel = result.expenses[i];
        const revParcel = result.revenues[i];

        expect(expParcel.linkedId).toBeTruthy();
        expect(expParcel.linkedId).toBe(revParcel.linkedId);
        expect(expParcel.installment).toBe(`${i + 1}/3`);
        expect(revParcel.installment).toBe(`${i + 1}/3`);
        expect(revParcel.isRevenue).toBe(true);
        expect(revParcel.description).toBe('Celular Novo ( Cartão Sofisa )');
      }

      // Garante que parcelas diferentes não têm o mesmo linkedId entre si
      expect(result.expenses[0].linkedId).not.toBe(result.expenses[1].linkedId);
    });

    it('6.3 Exclusão em cascata (deleteTransactionCascade): apagar a despesa do cartão apaga o repasse vinculado', () => {
      const pair = createExpenseWithRepasseMirror({
        description: 'Jantar',
        value: 90,
        monthIndex: 5,
        year: 2026,
        cardCategory,
        repasseCategory
      });

      const initialTransactions = [...pair.all];
      expect(initialTransactions).toHaveLength(2);

      const cardExpense = pair.expenses[0];
      const res = deleteTransactionCascade(initialTransactions, cardExpense.id, false);

      // Ambos foram excluídos (restam 0)
      expect(res.transactions).toHaveLength(0);
      expect(res.deletedCount).toBe(2);
    });

    it('6.4 Exclusão a partir do repasse apaga simetricamente a despesa do cartão associada', () => {
      const pair = createExpenseWithRepasseMirror({
        description: 'Farmácia',
        value: 45,
        monthIndex: 3,
        year: 2026,
        cardCategory,
        repasseCategory
      });

      const initial = [...pair.all];
      const repasseRev = pair.revenues[0];
      const res = deleteTransactionCascade(initial, repasseRev.id, false);

      expect(res.transactions).toHaveLength(0);
      expect(res.deletedCount).toBe(2);
    });

    it('6.5 Exclusão com propagação futura de parcelas vinculadas remove as parcelas futuras de ambos os lados', () => {
      const pair = createExpenseWithRepasseMirror({
        description: 'Monitor',
        value: 200,
        installment: '1/3',
        monthIndex: 2,
        year: 2026,
        cardCategory,
        repasseCategory
      });

      const initial = [...pair.all];
      expect(initial).toHaveLength(6);

      // Exclui a partir da parcela 2/3 (mês index 3) com shouldDeleteSubsequent = true
      const expParcela2 = pair.expenses[1];
      const res = deleteTransactionCascade(initial, expParcela2.id, true);

      // Restam apenas a parcela 1/3 do cartão e a 1/3 do repasse (total 2)
      expect(res.transactions).toHaveLength(2);
      expect(res.transactions.every(t => t.installment === '1/3')).toBe(true);
      expect(res.deletedCount).toBe(4); // Excluídas 2 do cartão + 2 do repasse
    });

    it('6.6 Edição (updateTransactionCascade): alterar valor da despesa no cartão sincroniza a receita espelhada', () => {
      const pair = createExpenseWithRepasseMirror({
        description: 'Mercado',
        value: 100,
        monthIndex: 1,
        year: 2026,
        cardCategory,
        repasseCategory,
        tag: 'Alimentação'
      });

      const initial = [...pair.all];
      const cardExp = pair.expenses[0];

      // Edita valor para 150 e descrição para 'Supermercado'
      const res = updateTransactionCascade(initial, cardExp.id, {
        value: 150,
        description: 'Supermercado'
      }, false);

      const expAtualizado = res.transactions.find(t => t.id === cardExp.id);
      const revAtualizado = res.transactions.find(t => t.id === pair.revenues[0].id);

      expect(expAtualizado.value).toBe(150);
      expect(expAtualizado.description).toBe('Supermercado');

      // Receita espelhada tem valor atualizado para 150 e preserva o sufixo "( Cartão Sofisa )"
      expect(revAtualizado.value).toBe(150);
      expect(revAtualizado.description).toBe('Supermercado ( Cartão Sofisa )');
      expect(res.updatedCount).toBe(2);
    });

    it('6.7 Edição com propagação futura sincroniza parcelas futuras do cartão e do repasse espelho', () => {
      const pair = createExpenseWithRepasseMirror({
        description: 'Curso',
        value: 100,
        installment: '1/3',
        monthIndex: 0,
        year: 2026,
        cardCategory,
        repasseCategory
      });

      const initial = [...pair.all];
      const expParcela2 = pair.expenses[1];

      // Atualiza a partir da parcela 2 com propagação futura
      const res = updateTransactionCascade(initial, expParcela2.id, {
        value: 125,
        description: 'Curso Avançado'
      }, true);

      const items = res.transactions;

      // Parcela 1/3 mantida em 100
      expect(items.find(t => t.id === pair.expenses[0].id).value).toBe(100);
      expect(items.find(t => t.id === pair.revenues[0].id).value).toBe(100);

      // Parcelas 2/3 e 3/3 do cartão atualizadas para 125
      expect(items.find(t => t.id === pair.expenses[1].id).value).toBe(125);
      expect(items.find(t => t.id === pair.expenses[2].id).value).toBe(125);

      // Parcelas 2/3 e 3/3 do repasse sincronizadas para 125
      expect(items.find(t => t.id === pair.revenues[1].id).value).toBe(125);
      expect(items.find(t => t.id === pair.revenues[2].id).value).toBe(125);
    });

    it('6.8 Neutralidade Financeira no Dashboard: Par de Cartão + Repasse gera impacto neutro no Saldo Previsto', () => {
      const pair = createExpenseWithRepasseMirror({
        description: 'Presente Amigo',
        value: 250,
        monthIndex: 7,
        year: 2026,
        cardCategory,
        repasseCategory
      });

      const categories = [cardCategory, repasseCategory];
      const summary = calculateTotalsByMonthAndYear(pair.all, categories, 7, 2026);

      // Despesa do Cartão = 250
      expect(summary.totalDespesas).toBe(250);
      // Receita do Repasse = 250
      expect(summary.totalReceitas).toBe(250);
      // Saldo Previsto permanece exatamente 0 (neutro)
      expect(summary.saldoPrevisto).toBe(0);
    });

    it('6.9 Edição a partir do repasse (updateTransactionCascade) sincroniza a despesa do cartão sem vazar o sufixo', () => {
      const pair = createExpenseWithRepasseMirror({
        description: 'Almoço Executivo',
        value: 120,
        monthIndex: 4,
        year: 2026,
        cardCategory,
        repasseCategory
      });

      const initial = [...pair.all];
      const repasseRev = pair.revenues[0];

      // Edita a partir do repasse, mantendo o sufixo no input
      const res = updateTransactionCascade(initial, repasseRev.id, {
        description: 'Almoço de Negócios ( Cartão Sofisa )',
        value: 140
      }, false);

      const expAtualizado = res.transactions.find(t => t.id === pair.expenses[0].id);
      const revAtualizado = res.transactions.find(t => t.id === repasseRev.id);

      // O repasse mantém o sufixo
      expect(revAtualizado.description).toBe('Almoço de Negócios ( Cartão Sofisa )');
      expect(revAtualizado.value).toBe(140);

      // O cartão recebe a descrição limpa SEM o sufixo "( Cartão Sofisa )"
      expect(expAtualizado.description).toBe('Almoço de Negócios');
      expect(expAtualizado.value).toBe(140);
    });

    it('6.10 Edição a partir do repasse sem sufixo no input preserva o sufixo no repasse e atualiza o cartão limpamente', () => {
      const pair = createExpenseWithRepasseMirror({
        description: 'Mercado Semanal',
        value: 80,
        monthIndex: 2,
        year: 2026,
        cardCategory,
        repasseCategory
      });

      const initial = [...pair.all];
      const repasseRev = pair.revenues[0];

      // Usuário editou o repasse digitando apenas o texto base
      const res = updateTransactionCascade(initial, repasseRev.id, {
        description: 'Supermercado Mensal',
        value: 95
      }, false);

      const expAtualizado = res.transactions.find(t => t.id === pair.expenses[0].id);
      const revAtualizado = res.transactions.find(t => t.id === repasseRev.id);

      // O repasse preserva o sufixo original do cartão
      expect(revAtualizado.description).toBe('Supermercado Mensal ( Cartão Sofisa )');
      expect(revAtualizado.value).toBe(95);

      // O cartão recebe o texto limpo
      expect(expAtualizado.description).toBe('Supermercado Mensal');
      expect(expAtualizado.value).toBe(95);
    });

    it('6.11 deleteCategory apaga a categoria e também limpa simetricamente as transações vinculadas por linkedId em outras categorias', () => {
      const pair = createExpenseWithRepasseMirror({
        description: 'Compra Especial',
        value: 500,
        monthIndex: 6,
        year: 2026,
        cardCategory,
        repasseCategory
      });

      Financas.AppState.categories = [
        { ...cardCategory },
        { ...repasseCategory }
      ];
      Financas.AppState.transactions = [...pair.all];

      const originalConfirm = global.confirm;
      global.confirm = () => true;

      try {
        // Exclui a categoria do Cartão
        Financas.deleteCategory(cardCategory.id);

        // A categoria do cartão foi excluída
        expect(Financas.AppState.categories.find(c => c.id === cardCategory.id)).toBe(undefined);
        // A categoria de Repasse permanece
        expect(Financas.AppState.categories.find(c => c.id === repasseCategory.id)).toBeTruthy();

        // Ambas as transações (do cartão e do repasse vinculado) foram excluídas, evitando órfãos
        expect(Financas.AppState.transactions).toHaveLength(0);
      } finally {
        global.confirm = originalConfirm;
      }
    });

    it('6.11 Edição em cascata (updateTransactionCascade): expande série de parcelas e atualiza frações para meses seguintes', () => {
      const groupId = 'grp_moveis_123';
      const initial = [
        { id: 't1', groupId, description: 'Mesa', value: 100, installment: '1/2', monthIndex: 0, year: 2026, categoryName: 'Móveis' },
        { id: 't2', groupId, description: 'Mesa', value: 100, installment: '2/2', monthIndex: 1, year: 2026, categoryName: 'Móveis' }
      ];

      // Altera a série de 2 para 4 parcelas
      const res = updateTransactionCascade(initial, 't1', {
        installment: '1/4',
        value: 100,
        description: 'Mesa de Jantar'
      }, true);

      expect(res.transactions).toHaveLength(4);
      expect(res.transactions[0].installment).toBe('1/4');
      expect(res.transactions[1].installment).toBe('2/4');
      expect(res.transactions[2].installment).toBe('3/4');
      expect(res.transactions[2].monthIndex).toBe(2);
      expect(res.transactions[3].installment).toBe('4/4');
      expect(res.transactions[3].monthIndex).toBe(3);
    });
  });

  // ---------------------------------------------------------------------------
  // ÁREA 7: ZONA DE PERIGO & SEGURANÇA (EXCLUSÃO TOTAL DE DADOS E CREDENCIAIS)
  // ---------------------------------------------------------------------------
  describe('7. Segurança e Zona de Perigo (Exclusão Completa de Dados e Credenciais)', () => {
    it('7.1 Exclui categorias, lançamentos, tags, lastUpdated E credenciais da nuvem (API Key e Bin ID)', () => {
      const originalPrompt = global.prompt;
      global.prompt = () => 'APAGAR';

      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify([{ id: 'c1', name: 'Aluguel' }]));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([{ id: 't1', value: 1000 }]));
      localStorage.setItem(STORAGE_KEYS.JSONBIN_KEY, 'secret-key-test');
      localStorage.setItem(STORAGE_KEYS.JSONBIN_BIN_ID, 'bin-id-test');

      try {
        if (typeof clearAllLocalData === 'function') {
          clearAllLocalData({ skipReload: true });
        }
      } catch (e) {
        // window.location.reload pode falhar em mock
      }

      expect(localStorage.getItem(STORAGE_KEYS.CATEGORIES)).toBe(null);
      expect(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)).toBe(null);
      expect(localStorage.getItem(STORAGE_KEYS.JSONBIN_KEY)).toBe(null);
      expect(localStorage.getItem(STORAGE_KEYS.JSONBIN_BIN_ID)).toBe(null);

      global.prompt = originalPrompt;
    });
  });

  // ---------------------------------------------------------------------------
  // ÁREA 8: SINCRONIZAÇÃO AUTOMÁTICA NA INICIALIZAÇÃO (STARTUP SYNC)
  // ---------------------------------------------------------------------------
  describe('8. Verificação e Sincronização Inteligente na Inicialização (Startup Sync)', () => {
    it('8.1 areStatesEqual: retorna true quando local e remoto possuem o mesmo conteúdo', () => {
      const local = {
        categories: [{ id: 'c1', name: 'Salário', type: 'Receita' }],
        transactions: [{ id: 't1', value: 5000, monthIndex: 0, year: 2026, description: 'Salário Mensal', installment: '-', isPaid: true, tag: 'Trabalho' }],
        tags: ['Trabalho', 'Alimentação']
      };
      const remote = {
        categorias: [{ id: 'c1', name: 'Salário', type: 'Receita' }],
        lancamentos: [{ id: 't1', value: 5000, monthIndex: 0, year: 2026, description: 'Salário Mensal', installment: '-', isPaid: true, tag: 'Trabalho' }],
        tags: ['Trabalho', 'Alimentação']
      };
      expect(areStatesEqual(local, remote)).toBe(true);
    });

    it('8.2 areStatesEqual: retorna false quando houver diferença de valor, status ou tag', () => {
      const local = {
        categories: [{ id: 'c1', name: 'Mercado', type: 'Variável Prevista' }],
        transactions: [{ id: 't1', value: 150, monthIndex: 5, year: 2026, description: 'Feira', installment: '-', isPaid: false, tag: '' }],
        tags: []
      };
      const remote = {
        categorias: [{ id: 'c1', name: 'Mercado', type: 'Variável Prevista' }],
        lancamentos: [{ id: 't1', value: 180, monthIndex: 5, year: 2026, description: 'Feira', installment: '-', isPaid: true, tag: 'Alimentação' }],
        tags: ['Alimentação']
      };
      expect(areStatesEqual(local, remote)).toBe(false);
    });

    it('8.3 checkAndSyncCloudOnStartup: se não configurado, retorna status disconnected', async () => {
      localStorage.removeItem(STORAGE_KEYS.JSONBIN_KEY);
      localStorage.removeItem(STORAGE_KEYS.JSONBIN_BIN_ID);
      const res = await checkAndSyncCloudOnStartup({ force: true });
      expect(res.status).toBe('disconnected');
    });

    it('8.4 checkAndSyncCloudOnStartup: atualiza sessão local quando a nuvem tiver dados mais novos', async () => {
      localStorage.setItem(STORAGE_KEYS.JSONBIN_KEY, 'key_123');
      localStorage.setItem(STORAGE_KEYS.JSONBIN_BIN_ID, 'bin_456');

      if (typeof Financas.resetStartupSyncLock === 'function') {
        Financas.resetStartupSyncLock();
      }

      const originalFetch = global.fetch;
      const remoteData = {
        lastUpdated: 2000000,
        categorias: [{ id: 'cat_cloud', name: 'Investimentos', type: 'Receita' }],
        lancamentos: [{ id: 'lanc_cloud', categoryId: 'cat_cloud', categoryName: 'Investimentos', value: 300, monthIndex: 2, year: 2026, description: 'Dividendos', installment: '-', isPaid: true }],
        tags: ['Renda Passiva']
      };

      global.fetch = async () => ({
        ok: true,
        json: async () => ({ record: remoteData })
      });

      Financas.AppState.lastUpdated = 1000000;
      Financas.AppState.categories = [];
      Financas.AppState.transactions = [];

      const result = await checkAndSyncCloudOnStartup({ silent: true, showNotification: false, force: true });
      expect(result.status).toBe('updated_from_cloud');
      expect(Financas.AppState.categories.length).toBe(1);
      expect(Financas.AppState.categories[0].name).toBe('Investimentos');
      expect(Financas.AppState.transactions.length).toBe(1);
      expect(Financas.AppState.transactions[0].description).toBe('Dividendos');
      expect(Financas.AppState.lastUpdated).toBe(2000000);

      global.fetch = originalFetch;
    });

    it('8.5 importBackup atualiza lastUpdated para o timestamp atual, impedindo que checkAndSyncCloudOnStartup sobrescreva a restauração', async () => {
      localStorage.setItem(STORAGE_KEYS.JSONBIN_KEY, 'key_123');
      localStorage.setItem(STORAGE_KEYS.JSONBIN_BIN_ID, 'bin_456');

      if (typeof Financas.resetStartupSyncLock === 'function') {
        Financas.resetStartupSyncLock();
      }

      const cloudTimestamp = 1500000;
      const remoteData = {
        lastUpdated: cloudTimestamp,
        categorias: [{ id: 'cat_cloud_old', name: 'Antiga', type: 'Conta Fixa' }],
        lancamentos: [],
        tags: []
      };

      const originalFetch = global.fetch;
      global.fetch = async () => ({
        ok: true,
        json: async () => ({ record: remoteData })
      });

      const backupAntigo = {
        lastUpdated: 1000000,
        categorias: [{ id: 'cat_backup', name: 'Backup Restaurado', type: 'Receita' }],
        lancamentos: [{ id: 'lanc_backup', categoryId: 'cat_backup', categoryName: 'Backup Restaurado', value: 999, monthIndex: 0, year: 2026, description: 'Item Restaurado' }],
        tags: ['Backup']
      };

      const mockEvent = {
        target: {
          files: [
            new Blob([JSON.stringify(backupAntigo)], { type: 'application/json' })
          ],
          value: 'fake.json'
        }
      };

      Financas.importBackup(mockEvent);

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(Financas.AppState.lastUpdated > cloudTimestamp).toBe(true);

      const checkResult = await checkAndSyncCloudOnStartup({ silent: true, showNotification: false, force: true });
      expect(checkResult.status).toBe('sync_to_cloud_triggered');

      expect(Financas.AppState.categories[0].name).toBe('Backup Restaurado');
      expect(Financas.AppState.transactions[0].description).toBe('Item Restaurado');

      global.fetch = originalFetch;
    });
  });

  // ---------------------------------------------------------------------------
  // ÁREA 9: VISUALIZAÇÃO GRÁFICA E AGRUPAMENTO (MENSAL E ANUAL)
  // ---------------------------------------------------------------------------
  describe('9. Visualização Gráfica e Análise de Despesas (Mensal e Anual)', () => {
    const testCategories = [
      { id: 'c_salario', name: 'Salário', type: 'Receita' },
      { id: 'c_aluguel', name: 'Aluguel', type: 'Conta Fixa' },
      { id: 'c_mercado', name: 'Mercado', type: 'Variável Prevista' },
      { id: 'c_cartao', name: 'Cartão Black', type: 'Cartão de Crédito' }
    ];

    const testTransactions = [
      // 2026 - Mês 0 (Janeiro)
      { id: 't1', categoryId: 'c_salario', value: 5000, monthIndex: 0, year: 2026, description: 'Salário', tag: 'Trabalho' },
      { id: 't2', categoryId: 'c_aluguel', value: 2000, monthIndex: 0, year: 2026, description: 'Aluguel Jan', tag: 'Moradia' },
      { id: 't3', categoryId: 'c_mercado', value: 800, monthIndex: 0, year: 2026, description: 'Compras Jan', tag: 'Alimentação' },
      { id: 't4', categoryId: 'c_cartao', value: 1200, monthIndex: 0, year: 2026, description: 'Fatura Jan', tag: '' },

      // 2026 - Mês 1 (Fevereiro)
      { id: 't5', categoryId: 'c_aluguel', value: 2000, monthIndex: 1, year: 2026, description: 'Aluguel Fev', tag: 'Moradia' },
      { id: 't6', categoryId: 'c_mercado', value: 1000, monthIndex: 1, year: 2026, description: 'Compras Fev', tag: 'Alimentação' },

      // 2027 - Mês 0 (Outro ano - não deve entrar em 2026)
      { id: 't7', categoryId: 'c_aluguel', value: 2500, monthIndex: 0, year: 2027, description: 'Aluguel 2027', tag: 'Moradia' }
    ];

    it('9.1 calculateExpensesChartData: filtra por mês e ano selecionados, ignora receitas e calcula percentuais', () => {
      const data = Financas.calculateExpensesChartData(testTransactions, testCategories, {
        periodMode: 'month',
        groupMode: 'category',
        monthIndex: 0,
        year: 2026
      });

      // Total esperado de despesas em Janeiro/2026: 2000 (aluguel) + 800 (mercado) + 1200 (cartão) = 4000
      // Salário (5000) deve ser ignorado por ser Receita
      expect(data.totalExpenses).toBe(4000);
      expect(data.items.length).toBe(3);

      // Primeiro item deve ser o maior: Aluguel (2000 / 4000 = 50%)
      expect(data.items[0].label).toBe('Aluguel');
      expect(data.items[0].total).toBe(2000);
      expect(Math.round(data.items[0].percentage)).toBe(50);

      // Segundo: Cartão Black (1200 / 4000 = 30%)
      expect(data.items[1].label).toBe('Cartão Black');
      expect(data.items[1].total).toBe(1200);
      expect(Math.round(data.items[1].percentage)).toBe(30);

      // Terceiro: Mercado (800 / 4000 = 20%)
      expect(data.items[2].label).toBe('Mercado');
      expect(data.items[2].total).toBe(800);
      expect(Math.round(data.items[2].percentage)).toBe(20);

      // Soma dos percentuais deve ser 100%
      const sumPct = data.items.reduce((acc, c) => acc + c.percentage, 0);
      expect(Math.round(sumPct)).toBe(100);
    });

    it('9.2 calculateExpensesChartData: modo anual soma os 12 meses do ano e isola outros anos', () => {
      const data = Financas.calculateExpensesChartData(testTransactions, testCategories, {
        periodMode: 'year',
        groupMode: 'category',
        year: 2026
      });

      // Em 2026 completo:
      // Jan: 2000 + 800 + 1200 = 4000
      // Fev: 2000 + 1000 = 3000
      // Total 2026: 7000 (O lançamento de 2500 de 2027 NÃO pode entrar)
      expect(data.totalExpenses).toBe(7000);

      const aluguelItem = data.items.find(i => i.label === 'Aluguel');
      expect(aluguelItem.total).toBe(4000); // 2000 Jan + 2000 Fev

      const mercadoItem = data.items.find(i => i.label === 'Mercado');
      expect(mercadoItem.total).toBe(1800); // 800 Jan + 1000 Fev
    });

    it('9.3 calculateExpensesChartData: agrupa corretamente por Tipo e por Tag', () => {
      // Agrupamento por Tipo em Janeiro/2026
      const byType = Financas.calculateExpensesChartData(testTransactions, testCategories, {
        periodMode: 'month',
        groupMode: 'type',
        monthIndex: 0,
        year: 2026
      });
      expect(byType.items.length).toBe(3);
      const fixa = byType.items.find(i => i.label === 'Conta Fixa');
      expect(fixa.total).toBe(2000);

      // Agrupamento por Tag em Janeiro/2026
      const byTag = Financas.calculateExpensesChartData(testTransactions, testCategories, {
        periodMode: 'month',
        groupMode: 'tag',
        monthIndex: 0,
        year: 2026
      });
      const moradiaTag = byTag.items.find(i => i.label === 'Moradia');
      expect(moradiaTag.total).toBe(2000);
      const semClassifTag = byTag.items.find(i => i.label === 'Sem Classificação');
      expect(semClassifTag.total).toBe(1200); // Cartão Black não tinha tag
    });

    it('9.4 calculateMonthlyEvolutionData: retorna os 12 meses com despesas, receitas e maxExpense', () => {
      const evo = Financas.calculateMonthlyEvolutionData(testTransactions, testCategories, 2026);
      expect(evo.monthlyTotals.length).toBe(12);
      expect(evo.monthlyTotals[0].monthName).toBe('Janeiro');
      expect(evo.monthlyTotals[0].expenses).toBe(4000);
      expect(evo.monthlyTotals[0].revenues).toBe(5000);
      expect(evo.monthlyTotals[1].expenses).toBe(3000);
      expect(evo.monthlyTotals[1].revenues).toBe(0);
      expect(evo.maxExpense).toBe(4000);
    });

    it('9.5 renderDonutChartSVG: renderiza SVG válido e lida com estado vazio sem quebrar', () => {
      const emptySVG = Financas.renderDonutChartSVG([], 0);
      expect(emptySVG.includes('<svg')).toBe(true);
      expect(emptySVG.includes('Sem Gastos')).toBe(true);

      const filledItems = [
        { label: 'Aluguel', total: 2000, percentage: 66.7, color: '#3b82f6' },
        { label: 'Mercado', total: 1000, percentage: 33.3, color: '#ef4444' }
      ];
      const filledSVG = Financas.renderDonutChartSVG(filledItems, 3000);
      expect(filledSVG.includes('<svg')).toBe(true);
      expect(filledSVG.includes('donut-slice')).toBe(true);
      expect(filledSVG.includes('Total Gasto')).toBe(true);
    });

    it('9.6 onChartMonthChange: altera mês ativo, atualiza AppState.selectedMonthIndex e recalcula dados do gráfico', () => {
      Financas.AppState.selectedMonthIndex = 0; // Janeiro
      Financas.onChartMonthChange(5); // Muda para Junho (índice 5)
      expect(Financas.AppState.selectedMonthIndex).toBe(5);

      Financas.onChartMonthChange(10); // Muda para Novembro (índice 10)
      expect(Financas.AppState.selectedMonthIndex).toBe(10);
    });

    it('9.7 Gráficos aceitam estornos e valores negativos, deduzindo corretamente do total de despesas', () => {
      const transComEstorno = [
        { id: 't1', categoryId: 'c_mercado', value: 300, monthIndex: 0, year: 2026, description: 'Supermercado' },
        { id: 't2', categoryId: 'c_mercado', value: -50, monthIndex: 0, year: 2026, description: 'Estorno Item Devolvido' }
      ];

      const data = Financas.calculateExpensesChartData(transComEstorno, testCategories, {
        periodMode: 'month',
        groupMode: 'category',
        monthIndex: 0,
        year: 2026
      });

      // Total deve ser 300 - 50 = 250
      expect(data.totalExpenses).toBe(250);
      expect(data.count).toBe(2);
      expect(data.items[0].total).toBe(250);

      // Na evolução mensal, mês 0 deve ter 250 de despesa
      const evo = Financas.calculateMonthlyEvolutionData(transComEstorno, testCategories, 2026);
      expect(evo.monthlyTotals[0].expenses).toBe(250);
    });

    it('9.8 Categorias com mesmo nome e tipos diferentes são mapeadas sem colisão', () => {
      const collisionCategories = [
        { id: 'c_mercado_cartao', name: 'Mercado', type: 'Cartão de Crédito' },
        { id: 'c_mercado_fixa', name: 'Mercado', type: 'Conta Fixa' }
      ];

      const trans = [
        { id: 't1', categoryId: 'c_mercado_cartao', categoryName: 'Mercado', categoryType: 'Cartão de Crédito', value: 100, monthIndex: 0, year: 2026 },
        { id: 't2', categoryId: 'c_mercado_fixa', categoryName: 'Mercado', categoryType: 'Conta Fixa', value: 200, monthIndex: 0, year: 2026 }
      ];

      const byType = Financas.calculateExpensesChartData(trans, collisionCategories, {
        periodMode: 'month',
        groupMode: 'type',
        monthIndex: 0,
        year: 2026
      });

      const cartaoGroup = byType.items.find(i => i.label === 'Cartão de Crédito');
      const fixaGroup = byType.items.find(i => i.label === 'Conta Fixa');

      expect(cartaoGroup.total).toBe(100);
      expect(fixaGroup.total).toBe(200);
    });

    it('9.9 Geração de parcelas adota estritamente o formato fracionário X/Y (ex: 1/3) e ignora Nx', () => {
      const resFrac = Financas.generateTransactionsMultiYear({
        description: 'Teclado Mecânico',
        value: 150,
        installment: '1/3',
        monthIndex: 0,
        year: 2026,
        categoryType: 'Cartão de Crédito'
      });

      expect(resFrac).toHaveLength(3);
      expect(resFrac[0].installment).toBe('1/3');
      expect(resFrac[1].installment).toBe('2/3');
      expect(resFrac[2].installment).toBe('3/3');

      // Formato '3x' não é mais expandido automaticamente como série, tratando-se como lançamento avulso
      const resNx = Financas.generateTransactionsMultiYear({
        description: 'Mouse Sem Fio',
        value: 100,
        installment: '3x',
        monthIndex: 0,
        year: 2026,
        categoryType: 'Cartão de Crédito'
      });

      expect(resNx).toHaveLength(1);
      expect(resNx[0].installment).toBe('3x');
    });

    it('9.10 Edição em cascata estendendo parcelas preserva o sufixo e descrição do espelho repasse', () => {
      const pair = Financas.createExpenseWithRepasseMirror({
        description: 'Monitor',
        value: 200,
        installment: '1/2',
        monthIndex: 0,
        year: 2026,
        cardCategory: { id: 'c_card', name: 'Nubank', type: 'Cartão de Crédito' },
        repasseCategory: { id: 'c_rep', name: 'João', type: 'Repasse' }
      });

      const updated = Financas.updateTransactionCascade(
        pair.all,
        pair.expenses[0].id,
        { description: 'Monitor 4K', value: 250, installment: '1/3' },
        true
      );

      const newExpenseThird = updated.transactions.find(t => t.categoryId === 'c_card' && t.installment === '3/3');
      const newMirrorThird = updated.transactions.find(t => t.categoryId === 'c_rep' && t.installment === '3/3');

      expect(newExpenseThird).toBeTruthy();
      expect(newExpenseThird.description).toBe('Monitor 4K');
      expect(newMirrorThird).toBeTruthy();
      expect(newMirrorThird.description).toBe('Monitor 4K ( Nubank )');
    });

    it('9.11 areStatesEqual detecta alteração de categoria ou receita em lançamento', () => {
      const localState = {
        categories: [{ id: 'c1', name: 'Alimentação', type: 'Conta Fixa' }],
        tags: [],
        transactions: [{ id: 't1', value: 50, monthIndex: 0, year: 2026, description: 'Lanche', installment: '-', isPaid: false, tag: '', groupId: null, linkedId: null, categoryId: 'c1', categoryName: 'Alimentação', categoryType: 'Conta Fixa', isRevenue: false }]
      };

      const remoteRecord = {
        categorias: [{ id: 'c1', name: 'Alimentação', type: 'Conta Fixa' }],
        tags: [],
        lancamentos: [{ id: 't1', value: 50, monthIndex: 0, year: 2026, description: 'Lanche', installment: '-', isPaid: false, tag: '', groupId: null, linkedId: null, categoryId: 'c2', categoryName: 'Outros', categoryType: 'Conta Fixa', isRevenue: false }]
      };

      const isEqual = Financas.areStatesEqual(localState, remoteRecord);
      expect(isEqual).toBe(false);
    });

    it('9.12 Edição em parcela intermediária com propagação alinha o denominador das parcelas anteriores do mesmo grupo', () => {
      const gId = 'grp_teste_alinhamento';
      const initialSeries = [
        { id: 'tx_p1', groupId: gId, description: 'Notebook', value: 1000, installment: '1/3', monthIndex: 0, year: 2026, categoryName: 'Eletrônicos', categoryType: 'Cartão de Crédito' },
        { id: 'tx_p2', groupId: gId, description: 'Notebook', value: 1000, installment: '2/3', monthIndex: 1, year: 2026, categoryName: 'Eletrônicos', categoryType: 'Cartão de Crédito' },
        { id: 'tx_p3', groupId: gId, description: 'Notebook', value: 1000, installment: '3/3', monthIndex: 2, year: 2026, categoryName: 'Eletrônicos', categoryType: 'Cartão de Crédito' }
      ];

      // Usuário edita a parcela 2 (mês 1), estendendo para 5 parcelas no total
      const res = Financas.updateTransactionCascade(
        initialSeries,
        'tx_p2',
        { installment: '2/5', value: 1000, description: 'Notebook Dell' },
        true
      );

      // Deve ter 5 parcelas agora
      expect(res.transactions).toHaveLength(5);

      // A parcela 1 (anterior ao mês editado) deve ter sido alinhada para 1/5 em vez de ficar como 1/3
      const p1 = res.transactions.find(t => t.id === 'tx_p1');
      expect(p1.installment).toBe('1/5');

      // As parcelas seguintes devem estar com denominador /5
      const p2 = res.transactions.find(t => t.id === 'tx_p2');
      expect(p2.installment).toBe('2/5');
      const p3 = res.transactions.find(t => t.id === 'tx_p3');
      expect(p3.installment).toBe('3/5');

      const p4 = res.transactions.find(t => t.installment === '4/5');
      expect(p4).toBeTruthy();
      expect(p4.monthIndex).toBe(3);

      const p5 = res.transactions.find(t => t.installment === '5/5');
      expect(p5).toBeTruthy();
      expect(p5.monthIndex).toBe(4);
    });

    it('9.13 calculateExpensesChartData alinha o total de despesas com o Dashboard quando uma categoria fica zerada ou negativa por estorno', () => {
      const cats = [
        { id: 'c_mercado', name: 'Supermercado', type: 'Cartão de Crédito' },
        { id: 'c_roupas', name: 'Roupas', type: 'Cartão de Crédito' }
      ];

      const trans = [
        { id: 't1', categoryId: 'c_mercado', value: 300, monthIndex: 0, year: 2026 },
        { id: 't2', categoryId: 'c_roupas', value: 100, monthIndex: 0, year: 2026 },
        { id: 't3', categoryId: 'c_roupas', value: -100, monthIndex: 0, year: 2026 } // Devolução anulou a categoria
      ];

      // Dashboard
      const dash = Financas.calculateTotalsByMonthAndYear(trans, cats, 0, 2026);
      expect(dash.totalDespesas).toBe(300);

      // Gráficos
      const chart = Financas.calculateExpensesChartData(trans, cats, {
        periodMode: 'month',
        groupMode: 'category',
        monthIndex: 0,
        year: 2026
      });

      // Total de despesas deve bater exatamente com o Dashboard (300)
      expect(chart.totalExpenses).toBe(dash.totalDespesas);
      // Itens positivos no Donut é apenas Supermercado (Roupas zerou e não tem fatia positiva)
      expect(chart.items).toHaveLength(1);
      expect(chart.items[0].label).toBe('Supermercado');
      expect(chart.items[0].total).toBe(300);
    });

    it('9.14 onChartMonthChange e changeYear encerram edição pendente e sincronizam estado', () => {
      Financas.AppState.editingTransactionId = 'fake_edit_id';

      // Muda o ano via changeYear
      Financas.changeYear(1);
      expect(Financas.AppState.editingTransactionId).toBe(null);

      // Seta novamente para testar troca de mês no gráfico
      Financas.AppState.editingTransactionId = 'fake_edit_id_2';
      Financas.onChartMonthChange(3);
      expect(Financas.AppState.editingTransactionId).toBe(null);
      expect(Financas.AppState.selectedMonthIndex).toBe(3);

      // Verifica se updateMonthTotal e isParcelada estão exportados em window.Financas
      expect(typeof Financas.updateMonthTotal).toBe('function');
      expect(typeof Financas.isParcelada).toBe('function');
    });

    it('9.15 handleTransactionSubmit em modo de edição atualiza o lançamento sem ReferenceError (existing)', () => {
      const catId = 'cat_test_edit';
      Financas.AppState.categories = [{ id: catId, name: 'Aluguel', type: 'Conta Fixa' }];
      Financas.AppState.transactions = [{
        id: 'tx_edit_test',
        groupId: null,
        linkedId: null,
        categoryId: catId,
        categoryName: 'Aluguel',
        categoryType: 'Conta Fixa',
        description: 'Aluguel Antigo',
        installment: '-',
        value: 1200,
        year: 2026,
        monthIndex: 0,
        isPaid: false,
        tag: ''
      }];
      Financas.AppState.activeCategoryId = catId;
      Financas.AppState.editingTransactionId = 'tx_edit_test';

      // Cria ou obtém os inputs no DOM
      let descInput = document.getElementById('transDescription');
      if (!descInput) {
        descInput = document.createElement('input');
        descInput.id = 'transDescription';
        document.body.appendChild(descInput);
      }
      descInput.value = 'Aluguel Novo';

      let valInput = document.getElementById('transValue');
      if (!valInput) {
        valInput = document.createElement('input');
        valInput.id = 'transValue';
        document.body.appendChild(valInput);
      }
      valInput.value = 'R$ 1.350,00';

      let instInput = document.getElementById('transInstallment');
      if (!instInput) {
        instInput = document.createElement('input');
        instInput.id = 'transInstallment';
        document.body.appendChild(instInput);
      }
      instInput.value = '-';

      // Executa submissão da edição (não deve lançar ReferenceError)
      let erroLancado = null;
      try {
        Financas.handleTransactionSubmit({ preventDefault: () => {} });
      } catch (err) {
        erroLancado = err;
      }

      expect(erroLancado).toBe(null);
      const atualizado = Financas.AppState.transactions.find(t => t.id === 'tx_edit_test');
      expect(atualizado).toBeTruthy();
      expect(atualizado.description).toBe('Aluguel Novo');
      expect(atualizado.value).toBe(1350);
      expect(Financas.AppState.editingTransactionId).toBe(null);
    });

    it('9.16 updateTransactionCascade valida fração e lança erro se parcela atual for maior que o total ou menor igual a zero', () => {
      const items = [{
        id: 'tx_frac_test',
        groupId: 'grp_frac_1',
        description: 'Celular',
        installment: '1/3',
        value: 500,
        monthIndex: 0,
        year: 2026,
        categoryName: 'Compras',
        categoryType: 'Cartão de Crédito'
      }];

      // 5/2 deve lançar erro
      expect(() => {
        Financas.updateTransactionCascade(items, 'tx_frac_test', { installment: '5/2' }, true);
      }).toThrow('A parcela atual não pode ser maior que o total.');

      // 0/3 deve lançar erro
      expect(() => {
        Financas.updateTransactionCascade(items, 'tx_frac_test', { installment: '0/3' }, true);
      }).toThrow('Os números da parcela devem ser maiores que zero.');

      // 2/0 deve lançar erro
      expect(() => {
        Financas.updateTransactionCascade(items, 'tx_frac_test', { installment: '2/0' }, true);
      }).toThrow('Os números da parcela devem ser maiores que zero.');
    });

    it('9.17 handleTransactionSubmit não exclui lançamento ao receber fração inválida (5/2) em modo de edição e exibe erro', () => {
      const catId = 'cat_protect_test';
      Financas.AppState.categories = [{ id: catId, name: 'Compras', type: 'Cartão de Crédito' }];
      Financas.AppState.transactions = [{
        id: 'tx_protect_1',
        groupId: 'grp_protect_1',
        linkedId: null,
        categoryId: catId,
        categoryName: 'Compras',
        categoryType: 'Cartão de Crédito',
        description: 'Smartphone',
        installment: '1/3',
        value: 500,
        year: 2026,
        monthIndex: 0,
        isPaid: false,
        tag: ''
      }];
      Financas.AppState.activeCategoryId = catId;
      Financas.AppState.editingTransactionId = 'tx_protect_1';

      let descInput = document.getElementById('transDescription');
      if (!descInput) {
        descInput = document.createElement('input');
        descInput.id = 'transDescription';
        document.body.appendChild(descInput);
      }
      descInput.value = 'Smartphone';

      let valInput = document.getElementById('transValue');
      if (!valInput) {
        valInput = document.createElement('input');
        valInput.id = 'transValue';
        document.body.appendChild(valInput);
      }
      valInput.value = 'R$ 500,00';

      let instInput = document.getElementById('transInstallment');
      if (!instInput) {
        instInput = document.createElement('input');
        instInput.id = 'transInstallment';
        document.body.appendChild(instInput);
      }
      instInput.value = '5/2'; // Fração inválida

      // Submete formulário
      Financas.handleTransactionSubmit({ preventDefault: () => {} });

      // O lançamento original NÃO pode ter sido excluído!
      const original = Financas.AppState.transactions.find(t => t.id === 'tx_protect_1');
      expect(original).toBeTruthy();
      expect(original.description).toBe('Smartphone');

      // O erro deve ser registrado no campo de erro
      const errEl = document.getElementById('transInstallmentError');
      if (errEl) {
        expect(errEl.textContent).toContain('A parcela atual não pode ser maior que o total');
      }
    });

    it('9.18 deleteTransaction aborta com segurança ao clicar em Cancelar na primeira confirmação', () => {
      const initial = [
        { id: 'tx_cancel_1', groupId: 'grp_c_1', description: 'Monitor', installment: '1/3', value: 800, monthIndex: 0, year: 2026 },
        { id: 'tx_cancel_2', groupId: 'grp_c_1', description: 'Monitor', installment: '2/3', value: 800, monthIndex: 1, year: 2026 }
      ];
      Financas.AppState.transactions = [...initial];

      // Simula o usuário clicando em "Cancelar" no confirm
      const originalConfirm = window.confirm;
      window.confirm = () => false;

      try {
        Financas.deleteTransaction('tx_cancel_1');
        // Nenhum lançamento deve ter sido excluído!
        expect(Financas.AppState.transactions).toHaveLength(2);
        expect(Financas.AppState.transactions.find(t => t.id === 'tx_cancel_1')).toBeTruthy();
      } finally {
        window.confirm = originalConfirm;
      }
    });

    it('9.19 deleteTransaction com confirmação parcial exclui apenas o mês e mantém ocorrências futuras', () => {
      const initial = [
        { id: 'tx_parc_1', groupId: 'grp_p_1', description: 'Cadeira', installment: '1/3', value: 300, monthIndex: 0, year: 2026 },
        { id: 'tx_parc_2', groupId: 'grp_p_1', description: 'Cadeira', installment: '2/3', value: 300, monthIndex: 1, year: 2026 }
      ];
      Financas.AppState.transactions = [...initial];

      const originalConfirm = window.confirm;
      let confirmCallCount = 0;
      // Primeiro confirm (Deseja realmente excluir?) => true
      // Segundo confirm (Excluir também meses seguintes?) => false (apenas este mês)
      window.confirm = () => {
        confirmCallCount++;
        return confirmCallCount === 1;
      };

      try {
        Financas.deleteTransaction('tx_parc_1');
        expect(Financas.AppState.transactions).toHaveLength(1);
        expect(Financas.AppState.transactions[0].id).toBe('tx_parc_2');
      } finally {
        window.confirm = originalConfirm;
      }
    });

    it('9.20 deleteCategory preserva e desvincula faturas de Cartão de Crédito ao excluir categoria de Repasse', () => {
      const cardCategory = { id: 'cat_cartao_test', name: 'Nubank', type: 'Cartão de Crédito' };
      const repasseCategory = { id: 'cat_repasse_test', name: 'Repasse João', type: 'Repasse' };

      const cardTx = {
        id: 'tx_card_1',
        categoryId: cardCategory.id,
        categoryName: cardCategory.name,
        categoryType: cardCategory.type,
        description: 'Jantar',
        value: 120,
        linkedId: 'link_repasse_123',
        monthIndex: 0,
        year: 2026
      };
      const repasseTx = {
        id: 'tx_repasse_1',
        categoryId: repasseCategory.id,
        categoryName: repasseCategory.name,
        categoryType: repasseCategory.type,
        description: 'Jantar ( Nubank )',
        value: 120,
        linkedId: 'link_repasse_123',
        isRevenue: true,
        monthIndex: 0,
        year: 2026
      };

      Financas.AppState.categories = [{ ...cardCategory }, { ...repasseCategory }];
      Financas.AppState.transactions = [{ ...cardTx }, { ...repasseTx }];

      const originalConfirm = window.confirm;
      let promptMessage = '';
      window.confirm = (msg) => {
        promptMessage = msg;
        return true;
      };

      try {
        Financas.deleteCategory(repasseCategory.id);

        // A categoria de Repasse foi excluída
        expect(Financas.AppState.categories.find(c => c.id === repasseCategory.id)).toBe(undefined);
        // A categoria do Cartão foi mantida
        expect(Financas.AppState.categories.find(c => c.id === cardCategory.id)).toBeTruthy();

        // O lançamento do Cartão de Crédito NÃO foi excluído, mas teve o linkedId limpo (desvinculado)
        expect(Financas.AppState.transactions).toHaveLength(1);
        const remainingCardTx = Financas.AppState.transactions[0];
        expect(remainingCardTx.id).toBe('tx_card_1');
        expect(remainingCardTx.linkedId).toBe(null);
        expect(remainingCardTx.categoryId).toBe(cardCategory.id);

        // O prompt de confirmação orientou o usuário sobre a preservação
        expect(promptMessage.includes('mantidas e desvinculadas automaticamente')).toBe(true);
      } finally {
        window.confirm = originalConfirm;
      }
    });

    it('9.21 updateTransactionCascade não aplica lógica de sufixo de repasse a receitas legítimas com parênteses', () => {
      const recCategory = { id: 'cat_rec_1', name: 'Salário', type: 'Receita' };
      const recTx = {
        id: 'tx_rec_1',
        categoryId: recCategory.id,
        categoryName: recCategory.name,
        categoryType: recCategory.type,
        description: 'Salário (Bônus)',
        value: 6000,
        installment: '-',
        isRevenue: true,
        monthIndex: 1,
        year: 2026
      };

      Financas.AppState.categories = [{ ...recCategory }];
      Financas.AppState.transactions = [{ ...recTx }];

      // 1. Edita a receita removendo o texto entre parênteses
      const res1 = Financas.updateTransactionCascade(
        Financas.AppState.transactions,
        'tx_rec_1',
        { description: 'Salário Fixo' },
        false
      );

      const txAtualizada1 = res1.transactions.find(t => t.id === 'tx_rec_1');
      expect(txAtualizada1).toBeTruthy();
      // O sistema NÃO pode reinserir o sufixo "(Bônus)"!
      expect(txAtualizada1.description).toBe('Salário Fixo');

      // 2. Edita adicionando outra anotação em parênteses
      const res2 = Financas.updateTransactionCascade(
        res1.transactions,
        'tx_rec_1',
        { description: 'Salário Fixo (Adiantamento)' },
        false
      );

      const txAtualizada2 = res2.transactions.find(t => t.id === 'tx_rec_1');
      expect(txAtualizada2.description).toBe('Salário Fixo (Adiantamento)');
    });

    it('9.22 renderDashboardMetrics e applyTypeFilters sincronizam métricas do topo com os tipos filtrados no Drawer', () => {
      const catFixa = { id: 'cat_f1', name: 'Aluguel', type: 'Conta Fixa' };
      const catVar = { id: 'cat_v1', name: 'Supermercado', type: 'Variável Prevista' };
      const catRec = { id: 'cat_r1', name: 'Salário', type: 'Receita' };

      Financas.AppState.categories = [{ ...catFixa }, { ...catVar }, { ...catRec }];
      Financas.AppState.transactions = [
        { id: 't1', categoryId: 'cat_f1', categoryName: 'Aluguel', categoryType: 'Conta Fixa', value: 1500, monthIndex: 0, year: 2026 },
        { id: 't2', categoryId: 'cat_v1', categoryName: 'Supermercado', categoryType: 'Variável Prevista', value: 600, monthIndex: 0, year: 2026 },
        { id: 't3', categoryId: 'cat_r1', categoryName: 'Salário', categoryType: 'Receita', value: 5000, isRevenue: true, monthIndex: 0, year: 2026 }
      ];
      Financas.AppState.selectedMonthIndex = 0;
      Financas.AppState.selectedYear = 2026;
      Financas.AppState.selectedTypeFilters = new Set();

      // 1. Sem filtros: métricas consolidadas globais
      const metricsGlobal = Financas.renderDashboardMetrics(0, 2026);
      expect(metricsGlobal.totalReceitas).toBe(5000);
      expect(metricsGlobal.totalDespesas).toBe(2100);
      expect(metricsGlobal.saldoPrevisto).toBe(2900);
      expect(metricsGlobal.totalLancamentos).toBe(3);

      // 2. Filtra estritamente por "Conta Fixa"
      Financas.AppState.selectedTypeFilters.add('Conta Fixa');
      const metricsFixa = Financas.renderDashboardMetrics(0, 2026);
      expect(metricsFixa.totalReceitas).toBe(0);
      expect(metricsFixa.totalDespesas).toBe(1500);
      expect(metricsFixa.saldoPrevisto).toBe(-1500);
      expect(metricsFixa.totalLancamentos).toBe(1);

      // 3. Filtra por "Conta Fixa" e "Receita"
      Financas.AppState.selectedTypeFilters.add('Receita');
      const metricsFixaEReceita = Financas.renderDashboardMetrics(0, 2026);
      expect(metricsFixaEReceita.totalReceitas).toBe(5000);
      expect(metricsFixaEReceita.totalDespesas).toBe(1500);
      expect(metricsFixaEReceita.saldoPrevisto).toBe(3500);
      expect(metricsFixaEReceita.totalLancamentos).toBe(2);

      // 4. Limpa os filtros
      Financas.AppState.selectedTypeFilters.clear();
      const metricsRestauradas = Financas.renderDashboardMetrics(0, 2026);
      expect(metricsRestauradas.totalReceitas).toBe(5000);
      expect(metricsRestauradas.totalDespesas).toBe(2100);
      expect(metricsRestauradas.totalLancamentos).toBe(3);
    });

    it('9.23 Gráfico Donut e ranking não excedem 100% nem produzem stroke-dasharray negativo em meses com estornos', () => {
      const cats = [
        { id: 'c_mercado', name: 'Mercado', type: 'Conta Fixa' },
        { id: 'c_farmacia', name: 'Farmácia', type: 'Conta Fixa' }
      ];
      const transComEstorno = [
        { id: 't1', categoryId: 'c_mercado', categoryName: 'Mercado', categoryType: 'Conta Fixa', value: 300, monthIndex: 0, year: 2026 },
        { id: 't2', categoryId: 'c_farmacia', categoryName: 'Farmácia', categoryType: 'Conta Fixa', value: -100, monthIndex: 0, year: 2026 }
      ];

      const data = Financas.calculateExpensesChartData(transComEstorno, cats, {
        periodMode: 'month',
        groupMode: 'category',
        monthIndex: 0,
        year: 2026
      });

      // Total líquido de despesas no centro deve ser 200
      expect(data.totalExpenses).toBe(200);
      expect(data.items).toHaveLength(1);
      // O percentual não pode ser 150%; deve ser 100%
      expect(data.items[0].percentage).toBe(100);

      // SVG do Donut
      const svg = Financas.renderDonutChartSVG(data.items, data.totalExpenses);
      expect(svg.includes('donut-slice')).toBe(true);
      // Confirma que não há valores negativos no stroke-dasharray
      const dasharrayMatch = svg.match(/stroke-dasharray="([^"]+)"/);
      expect(dasharrayMatch).toBeTruthy();
      const [dashVal, remainVal] = dasharrayMatch[1].split(' ').map(Number);
      expect(dashVal >= 0).toBe(true);
      expect(remainVal >= 0).toBe(true);

      // Ranking HTML não tem largura maior que 100%
      const rankingHtml = Financas.renderRankingListHTML(data.items, data.totalExpenses);
      expect(rankingHtml.includes('width: 100.0%')).toBe(true);
    });

    it('9.24 Relatórios gráficos aplicam normalizeCategoryType ignorando receitas com variações e unificando tipos', () => {
      const cats = [
        { id: 'c_rec_var', name: 'Freelance', type: 'receitas' },
        { id: 'c_fixa_1', name: 'Internet', type: 'fixa' },
        { id: 'c_fixa_2', name: 'Condomínio', type: 'Conta Fixa' }
      ];

      const trans = [
        { id: 't1', categoryId: 'c_rec_var', categoryName: 'Freelance', categoryType: 'receitas', value: 2000, monthIndex: 0, year: 2026 },
        { id: 't2', categoryId: 'c_fixa_1', categoryName: 'Internet', categoryType: 'fixa', value: 120, monthIndex: 0, year: 2026 },
        { id: 't3', categoryId: 'c_fixa_2', categoryName: 'Condomínio', categoryType: 'Conta Fixa', value: 500, monthIndex: 0, year: 2026 }
      ];

      // 1. calculateExpensesChartData deve ignorar a receita com tipo 'receitas'
      const chartData = Financas.calculateExpensesChartData(trans, cats, {
        periodMode: 'month',
        groupMode: 'type',
        monthIndex: 0,
        year: 2026
      });

      // Apenas Internet (120) e Condomínio (500) devem ser computados como despesa
      expect(chartData.totalExpenses).toBe(620);
      expect(chartData.items).toHaveLength(1);
      // As categorias 'fixa' e 'Conta Fixa' devem ser unificadas sob o mesmo tipo normalizado 'Conta Fixa'
      expect(chartData.items[0].label).toBe('Conta Fixa');
      expect(chartData.items[0].total).toBe(620);

      // 2. calculateMonthlyEvolutionData deve computar 'receitas' em revenues e não em expenses
      const evo = Financas.calculateMonthlyEvolutionData(trans, cats, 2026);
      expect(evo.monthlyTotals[0].revenues).toBe(2000);
      expect(evo.monthlyTotals[0].expenses).toBe(620);
    });

    it('9.25 loadCloudCredentials define status inicial transparente e exportBackup agenda limpeza de Blob', () => {
      const doc = (typeof document !== 'undefined') ? document : (typeof global !== 'undefined' && global.document ? global.document : null);

      // 1. Sem credenciais: status 'disconnected'
      localStorage.removeItem(STORAGE_KEYS.JSONBIN_KEY);
      localStorage.removeItem(STORAGE_KEYS.JSONBIN_BIN_ID);
      Financas.loadCloudCredentials();
      let text = doc && typeof doc.getElementById === 'function' ? doc.getElementById('cloudStatusText') : null;
      if (text && text.textContent) {
        expect(text.textContent.includes('Desconectada')).toBe(true);
      }

      // 2. Com credenciais: status 'syncing' ("Conectando...") até validação de rede
      localStorage.setItem(STORAGE_KEYS.JSONBIN_KEY, 'key_abc');
      localStorage.setItem(STORAGE_KEYS.JSONBIN_BIN_ID, 'bin_xyz');
      Financas.loadCloudCredentials();
      if (text && text.textContent) {
        expect(text.textContent.includes('Conectando')).toBe(true);
      }

      // 3. exportBackup executa e agenda limpeza sem erros síncronos
      let exportThrew = false;
      if (typeof Blob !== 'undefined' && doc && doc.body) {
        try {
          Financas.exportBackup();
        } catch (e) {
          exportThrew = true;
        }
      }
      expect(exportThrew).toBe(false);
    });

    it('9.26 Edição de Categoria atualiza lançamentos vinculados e anotações de repasse sem perda de dados', () => {
      Financas.AppState.categories = [
        { id: 'cat_cc1', name: 'Nubank', type: 'Cartão de Crédito' },
        { id: 'cat_rep1', name: 'Amigo', type: 'Repasse' }
      ];

      Financas.AppState.transactions = [
        {
          id: 'tx_cc1',
          categoryId: 'cat_cc1',
          categoryName: 'Nubank',
          categoryType: 'Cartão de Crédito',
          description: 'Restaurante',
          value: 150,
          monthIndex: 0,
          year: 2026,
          linkedId: 'link_test_1',
          isRevenue: false
        },
        {
          id: 'tx_rep1',
          categoryId: 'cat_rep1',
          categoryName: 'Amigo',
          categoryType: 'Repasse',
          description: 'Restaurante ( Nubank )',
          value: 150,
          monthIndex: 0,
          year: 2026,
          linkedId: 'link_test_1',
          isRevenue: true
        }
      ];

      // 1. Iniciar edição
      Financas.startEditingCategory('cat_cc1');
      expect(Financas.AppState.editingCategoryId).toBe('cat_cc1');

      // 2. Atualizar categoria (renomear para "Nubank Black")
      Financas.updateCategory('cat_cc1', 'Nubank Black', 'Cartão de Crédito');

      // Categoria atualizada
      const updatedCat = Financas.AppState.categories.find(c => c.id === 'cat_cc1');
      expect(updatedCat.name).toBe('Nubank Black');
      expect(Financas.AppState.editingCategoryId).toBe(null);

      // Transação no Cartão de Crédito deve ter atualizado o categoryName
      const updatedTxCC = Financas.AppState.transactions.find(t => t.id === 'tx_cc1');
      expect(updatedTxCC.categoryName).toBe('Nubank Black');

      // Transação espelhada no Repasse deve ter atualizado a anotação na descrição
      const updatedTxRep = Financas.AppState.transactions.find(t => t.id === 'tx_rep1');
      expect(updatedTxRep.description).toBe('Restaurante ( Nubank Black )');

      // 3. Cancelar edição restaura estado
      Financas.startEditingCategory('cat_rep1');
      expect(Financas.AppState.editingCategoryId).toBe('cat_rep1');
      Financas.cancelEditingCategory();
      expect(Financas.AppState.editingCategoryId).toBe(null);
    });
  });

  // ===========================================================================
  // 10. EXECUTOR PRINCIPAL (RUNNER) & FORMATAÇÃO VISUAL DO CONSOLE
  // ===========================================================================

  async function runTests() {
    const startTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    let totalTests = 0;
    let passedCount = 0;
    let failedCount = 0;
    const testResultsSummary = [];

    console.clear();
    console.log(
      '%c 🧪 SUÍTE DE TESTES UNITÁRIOS - FINANÇASPRO (SPA) %c\n%cQA & Frontend Sênior - Testes de Negócio Isolados do DOM (Multi-Ano, groupId & Storage)%c',
      'background: #1e293b; color: #38bdf8; font-weight: bold; font-size: 14px; padding: 6px 12px; border-radius: 4px;',
      '',
      'color: #64748b; font-size: 11px;',
      ''
    );

    for (const suite of testRunner.suites) {
      console.group(`%c📁 ${suite.name}`, 'color: #6366f1; font-weight: bold; font-size: 12px;');

      for (const t of suite.tests) {
        totalTests++;

        for (const hook of suite.beforeEachHooks) {
          try {
            await hook();
          } catch (hookErr) {
            console.error('Erro no hook beforeEach:', hookErr);
          }
        }

        let passed = false;
        let errorMessage = null;

        try {
          await t.fn();
          passed = true;
          passedCount++;
          console.log(`%c  ✓ PASS %c${t.name}`, 'color: #10b981; font-weight: bold;', 'color: #e2e8f0;');
        } catch (err) {
          failedCount++;
          errorMessage = err.message || String(err);
          console.group(`%c  ✗ FAIL %c${t.name}`, 'color: #ef4444; font-weight: bold;', 'color: #fca5a5;');
          console.error('Motivo da falha:', errorMessage);
          if (err.stack) console.debug(err.stack);
          console.groupEnd();
        }

        for (const hook of suite.afterEachHooks) {
          try {
            await hook();
          } catch (hookErr) {
            console.error('Erro no hook afterEach:', hookErr);
          }
        }

        testResultsSummary.push({
          Suite: suite.name.split('(')[0].trim(),
          Teste: t.name,
          Status: passed ? '✓ PASSOU' : '✗ FALHOU',
          Detalhes: errorMessage || 'OK'
        });
      }

      console.groupEnd();
    }

    const endTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const duration = Math.round(endTime - startTime);

    console.log('\n');
    console.table(testResultsSummary.map(r => ({
      'Suíte': r.Suite,
      'Caso de Teste': r.Teste,
      'Resultado': r.Status
    })));

    if (failedCount === 0) {
      console.log(
        `%c 🎉 SUCESSO: Todos os ${passedCount}/${totalTests} testes unitários passaram com êxito! (${duration}ms) `,
        'background: #064e3b; color: #34d399; font-weight: bold; font-size: 13px; padding: 6px 12px; border-radius: 4px;'
      );
    } else {
      console.log(
        `%c ⚠️ ATENÇÃO: ${failedCount} de ${totalTests} testes falharam! Verifique os detalhes acima. (${duration}ms) `,
        'background: #7f1d1d; color: #fca5a5; font-weight: bold; font-size: 13px; padding: 6px 12px; border-radius: 4px;'
      );
    }

    return {
      totalSuites: testRunner.suites.length,
      totalTests,
      passed: passedCount,
      failed: failedCount,
      durationMs: duration,
      results: testResultsSummary
    };
  }

  // ===========================================================================
  // 6. EXPORTAÇÃO GLOBAL
  // ===========================================================================

  global.runTests = runTests;
  global.TestRunner = {
    testRunner,
    describe,
    it,
    test,
    expect,
    MockEnvironment,
    runTests
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      runTests,
      describe,
      it,
      test,
      expect,
      MockEnvironment
    };
  }

  console.log(
    '%c[FinançasPro Test Runner Pronto]%c Digite %crunTests()%c no console para executar a bateria de testes unitários.',
    'color: #3b82f6; font-weight: bold;',
    'color: inherit;',
    'background: #1e293b; color: #38bdf8; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
    'color: inherit;'
  );

})(typeof window !== 'undefined' ? window : globalThis);
