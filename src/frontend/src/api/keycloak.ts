/**
 * Keycloak Service - для интеграции с Keycloak IdP
 */
import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: (typeof import.meta.env?.VITE_KEYCLOAK_URL === 'string' && import.meta.env.VITE_KEYCLOAK_URL !== '') ? import.meta.env.VITE_KEYCLOAK_URL : 'https://auth.goldpc.by',
  realm: (typeof import.meta.env?.VITE_KEYCLOAK_REALM === 'string' && import.meta.env.VITE_KEYCLOAK_REALM !== '') ? import.meta.env.VITE_KEYCLOAK_REALM : 'goldpc',
  clientId: (typeof import.meta.env?.VITE_KEYCLOAK_CLIENT_ID === 'string' && import.meta.env.VITE_KEYCLOAK_CLIENT_ID !== '') ? import.meta.env.VITE_KEYCLOAK_CLIENT_ID : 'goldpc-frontend',
};

const keycloak = new Keycloak(keycloakConfig);

export const initKeycloak = (onAuthenticatedCallback: () => void): void => {
  keycloak
    .init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      pkceMethod: 'S256',
    })
    .then((authenticated) => {
      if (authenticated) {
        localStorage.setItem('accessToken', keycloak.token ?? '');
        localStorage.setItem('refreshToken', keycloak.refreshToken ?? '');
      }
      onAuthenticatedCallback();
    })
    .catch(console.error);
};

export const doLogin = (): Promise<void> => keycloak.login();
export const doLogout = (redirectUri?: string): Promise<void> => keycloak.logout({ redirectUri });
export const getToken = (): string | undefined => keycloak.token;
export const updateToken = (successCallback: () => void): Promise<boolean> =>
  keycloak.updateToken(5).then(successCallback).catch(() => { void doLogin(); return false; }) as Promise<boolean>;
export const getUsername = (): string | undefined => (keycloak.tokenParsed as Record<string, unknown> | undefined)?.preferred_username as string | undefined;
export const hasRole = (roles: string[]): boolean => roles.some((role) => keycloak.hasRealmRole(role));

export default keycloak;
