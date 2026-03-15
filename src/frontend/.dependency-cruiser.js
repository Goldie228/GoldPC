/**
 * Dependency Cruiser Configuration
 * Предотвращает spaghetti-код в frontend архитектуре
 * 
 * @see https://dependency-cruiser.js.org/
 */

/** @type {import('dependency-cruiser').IConfiguration} */
export default {
  forbidden: [
    /**
     * Правило 1: Запрет циклических зависимостей
     * Циклические зависимости усложняют понимание кода и замедляют сборку
     */
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Циклические зависимости запрещены. Они замедляют сборку и усложняют понимание кода. Рассмотрите возможность рефакторинга для разрыва цикла.',
      rule: {
        type: 'no-circular'
      }
    },

    /**
     * Правило 2: Компоненты не должны импортировать store напрямую
     * Компоненты должны использовать hooks для доступа к состоянию
     */
    {
      name: 'components-not-import-store',
      severity: 'error',
      comment: 'Компоненты должны использовать hooks (например, useSelector, useDispatch) для доступа к store, а не импортировать store напрямую. Это улучшает тестируемость и изоляцию.',
      rule: {
        type: 'no-external-to',
        from: {
          path: '^src/components/'
        },
        to: {
          path: '^src/store/',
          pathNot: '^src/store/hooks/'
        }
      }
    },

    /**
     * Правило 3: API клиенты должны вызываться только из services
     * Это обеспечивает правильную слоистую архитектуру
     */
    {
      name: 'api-only-from-services',
      severity: 'error',
      comment: 'API модуль должен использоваться только из service слоя. Компоненты и страницы должны работать с данными через services, а не напрямую с API.',
      rule: {
        type: 'no-external-to',
        from: {
          pathNot: [
            '^src/services/',
            '^src/api/',  // API может импортировать сам себя
            '^src/mocks/',  // Mocks могут использовать API types
            '^src/test/'   // Test utilities могут использовать API
          ]
        },
        to: {
          path: '^src/api/'
        }
      }
    }
  ],

  options: {
    // Не следовать в node_modules
    doNotFollow: {
      path: 'node_modules'
    },

    // TypeScript pre-compilation dependencies
    tsPreCompilationDeps: true,

    // TypeScript конфигурация
    tsConfig: {
      fileName: './tsconfig.json'
    },

    // Настройки отчётов
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+'
      },
      archi: {
        collapsePattern: ['src/[^/]+', 'node_modules/[^/]+']
      }
    },

    // Базовые настройки валидации
    enhancedResolveOptions: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
    }
  },

  // Разрешённые зависимости (whitelist)
  allowed: [],

  // Порядок проверки: сначала запрещённые, потом разрешённые
  required: []
};