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
          clearAllLocalData();
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
      const res = await checkAndSyncCloudOnStartup();
      expect(res.status).toBe('disconnected');
    });

    it('8.4 checkAndSyncCloudOnStartup: atualiza sessão local quando a nuvem tiver dados mais novos', async () => {
      localStorage.setItem(STORAGE_KEYS.JSONBIN_KEY, 'key_123');
      localStorage.setItem(STORAGE_KEYS.JSONBIN_BIN_ID, 'bin_456');

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

      const result = await checkAndSyncCloudOnStartup({ silent: true, showNotification: false });
      expect(result.status).toBe('updated_from_cloud');
      expect(Financas.AppState.categories.length).toBe(1);
      expect(Financas.AppState.categories[0].name).toBe('Investimentos');
      expect(Financas.AppState.transactions.length).toBe(1);
      expect(Financas.AppState.transactions[0].description).toBe('Dividendos');
      expect(Financas.AppState.lastUpdated).toBe(2000000);

      global.fetch = originalFetch;
    });
  });

  // ===========================================================================
  // 9. EXECUTOR PRINCIPAL (RUNNER) & FORMATAÇÃO VISUAL DO CONSOLE
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
