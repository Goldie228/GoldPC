/**
 * Keycloak Service - для интеграции с Keycloak IdP
 */
import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'https://auth.goldpc.by',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'goldpc',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'goldpc-frontend',
};

const keycloak = new Keycloak(keycloakConfig);

export const initKeycloak = (onAuthenticatedCallback: () => void) => {
  keycloak
    .init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      pkceMethod: 'S256',
    })
    .then((authenticated) => {
      if (authenticated) {
        localStorage.setItem('accessToken', keycloak.token || '');
        localStorage.setItem('refreshToken', keycloak.refreshToken || '');
      }
      onAuthenticatedCallback();
    })
    .catch(console.error);
};

export const doLogin = keycloak.login;
export const doLogout = keycloak.logout;
export const getToken = () => keycloak.token;
export const updateToken = (successCallback: () => void) =>
  keycloak.updateToken(5).then(successCallback).catch(doLogin);
export const getUsername = () => keycloak.tokenParsed?.preferred_username;
export const hasRole = (roles: string[]) => roles.some((role) => keycloak.hasRealmRole(role));

export default keycloak;
