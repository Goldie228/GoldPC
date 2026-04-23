export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

export type AuthResponse = {
  token: string;
  user: User;
};