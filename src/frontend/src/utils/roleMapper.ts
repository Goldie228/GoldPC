/**
 * Маппинг ролей между бэкендом (числа) и фронтендом (строки).
 *
 * Бэкенд возвращает роли как числа (enum UserRole):
 *   0 = Client, 1 = Manager, 2 = Master, 3 = Admin, 4 = Accountant
 *
 * Фронтенд ожидает строки: 'Client', 'Manager', 'Master', 'Admin', 'Accountant'
 */

export type FrontendRole = 'Client' | 'Manager' | 'Master' | 'Admin' | 'Accountant';

/** Числовой маппинг ролей с бэкенда */
export const BackendRole = {
  Client: 0,
  Manager: 1,
  Master: 2,
  Admin: 3,
  Accountant: 4,
} as const;

export type BackendRole = typeof BackendRole[keyof typeof BackendRole];

/** Маппинг число → строка */
const ROLE_NUMBER_TO_STRING: Record<number, FrontendRole> = {
  0: 'Client',
  1: 'Manager',
  2: 'Master',
  3: 'Admin',
  4: 'Accountant',
};

/** Маппинг строка → число */
const ROLE_STRING_TO_NUMBER: Record<FrontendRole, number> = {
  Client: 0,
  Manager: 1,
  Master: 2,
  Admin: 3,
  Accountant: 4,
};

/**
 * Конвертирует числовую роль бэкенда в строковую роль фронтенда.
 * Если значение уже строка — возвращает как есть.
 * Если неизвестное число — возвращает 'Client' по умолчанию.
 */
export function mapBackendRole(role: number | string | undefined | null): FrontendRole {
  if (role === undefined || role === null) return 'Client';
  if (typeof role === 'string') {
    // Уже строка — проверяем валидность
    if (ROLE_STRING_TO_NUMBER[role as FrontendRole] !== undefined) {
      return role as FrontendRole;
    }
    return 'Client';
  }
  // Число — маппим в строку
  return ROLE_NUMBER_TO_STRING[role] ?? 'Client';
}

/**
 * Конвертирует массив числовых ролей в массив строковых ролей.
 */
export function mapBackendRoles(roles: (number | string)[] | undefined | null): FrontendRole[] {
  if (roles == null || roles.length === 0) return ['Client'];
  return roles.map((r) => mapBackendRole(typeof r === 'number' ? r : r));
}

/**
 * Нормализует объект User, конвертируя числовые роли в строковые.
 * Возвращает новый объект (не мутирует исходный).
 */
export function normalizeUserRoles<T extends { role?: number | string; roles?: (number | string)[] }>(
  user: T | null | undefined
): T | null {
  if (user == null) return null;

  return {
    ...user,
    role: mapBackendRole(user.role),
    roles: mapBackendRoles(user.roles),
  };
}
