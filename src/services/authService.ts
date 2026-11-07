import { User, LoginPayload, RegisterPayload } from '../types/auth';

const SESSION_KEY = 'web_mcu_studio_current_user';
const FALLBACK_USERS_KEY = 'web_mcu_studio_local_users';

export class AuthService {
  /**
   * Get currently logged-in user from session
   */
  static getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse current user from localStorage', e);
    }
    return null;
  }

  /**
   * Set user in session
   */
  static setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  /**
   * Register a new user and push into data/users.json
   */
  static async register(payload: RegisterPayload): Promise<{ success: boolean; user?: User; error?: string; message?: string }> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      this.setCurrentUser(data.user);
      return { success: true, user: data.user, message: data.message };
    } catch (err) {
      console.warn('Backend unavailable, using client-side JSON fallback', err);
      // Fallback to client-side localStorage simulation of users.json
      const localUsers = this.getFallbackUsers();
      if (localUsers.some(u => u.email.toLowerCase() === payload.email.toLowerCase())) {
        return { success: false, error: 'An account with this email address already exists.' };
      }

      const newUser: User = {
        id: `usr_${Date.now()}`,
        name: payload.name.trim(),
        email: payload.email.trim().toLowerCase(),
        role: payload.role || 'Automation Engineer',
        createdAt: new Date().toISOString()
      };

      localUsers.push({ ...newUser, password: payload.password });
      localStorage.setItem(FALLBACK_USERS_KEY, JSON.stringify(localUsers));
      this.setCurrentUser(newUser);

      return {
        success: true,
        user: newUser,
        message: 'User registered and saved to local users.json store.'
      };
    }
  }

  /**
   * Login user by email & password
   */
  static async login(payload: LoginPayload): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Invalid credentials' };
      }

      this.setCurrentUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      console.warn('Backend unavailable, validating against client fallback users', err);
      const localUsers = this.getFallbackUsers();
      const found = localUsers.find(
        (u: any) => u.email.toLowerCase() === payload.email.toLowerCase().trim() && u.password === payload.password
      );

      if (!found) {
        return { success: false, error: 'Invalid email or password.' };
      }

      const safeUser: User = {
        id: found.id,
        name: found.name,
        email: found.email,
        role: found.role,
        createdAt: found.createdAt
      };

      this.setCurrentUser(safeUser);
      return { success: true, user: safeUser };
    }
  }

  /**
   * Logout user
   */
  static logout(): void {
    this.setCurrentUser(null);
  }

  /**
   * Fetch all users from data/users.json
   */
  static async getUsers(): Promise<User[]> {
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        return data.users || [];
      }
    } catch (e) {
      console.warn('Could not fetch server users, using fallback', e);
    }
    return this.getFallbackUsers().map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt
    }));
  }

  private static getFallbackUsers(): any[] {
    try {
      const raw = localStorage.getItem(FALLBACK_USERS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      {
        id: 'usr_seed_1',
        name: 'Flora Greenwood',
        email: 'flora.greenwood@naturemcu.io',
        password: 'Password123!',
        role: 'IoT & Eco-Automation Engineer',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr_seed_2',
        name: 'Jean-Francois Simon',
        email: 'jfsimon1981@gmail.com',
        password: 'Password123!',
        role: 'PLC Automation Lead',
        createdAt: new Date().toISOString()
      }
    ];
  }
}
