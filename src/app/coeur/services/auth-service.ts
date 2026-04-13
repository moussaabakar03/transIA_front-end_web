import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { LoginForm, LoginResponse } from '../../partages/models/auth.model';

const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';
const USER_KEY = 'user';
const ROLE_KEY = 'user_role';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  login(credentials: LoginForm): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.backendurl}/login`, credentials).pipe(
      tap((res) => {
        if (res?.accessToken) {
          this.setStorageItem(TOKEN_KEY, res.accessToken);
          this.setStorageItem(USER_KEY, JSON.stringify(res));
          this.setStorageItem(ROLE_KEY, res.roles?.[0] ?? '');
        }
      })
    );
  }

  clearSession(): void {
    this.removeStorageItem(TOKEN_KEY);
    this.removeStorageItem(REFRESH_KEY);
    this.removeStorageItem(USER_KEY);
    this.removeStorageItem(ROLE_KEY);
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.getStorageItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getSession(): LoginResponse | null {
    const raw = this.getStorageItem(USER_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as LoginResponse;
    } catch {
      return null;
    }
  }

  getUser(): LoginResponse | null {
    return this.getSession();
  }

  getRole(): string | null {
    return this.getStorageItem(ROLE_KEY);
  }

  getUserName(): string | null {
    const session = this.getSession();
    return session?.username || session?.fullName || null;
  }

  private getStorageItem(key: string): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(key);
    }

    return null;
  }

  private setStorageItem(key: string, value: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(key, value);
    }
  }

  private removeStorageItem(key: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(key);
    }
  }
}
