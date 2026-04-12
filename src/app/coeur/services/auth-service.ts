import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { LoginForm, LoginResponse, User } from '../../partages/models/auth.model';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';

const TOKEN_KEY   = 'access_token';
const REFRESH_KEY = 'refresh_token';
const USER_KEY    = 'user';
const ROLE_KEY    = 'user_role';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
  
  constructor(private http: HttpClient, private router: Router) {}

  // POST /api/token/
  login(credentials: LoginForm): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.backendurl}/login/`, credentials).pipe(
      tap(res => {
        localStorage.setItem(TOKEN_KEY, res.access);
        localStorage.setItem(REFRESH_KEY, res.refresh);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        localStorage.setItem(ROLE_KEY, res.user.role.label)

        // if (res.user?.roles?.length) {
        //   localStorage.setItem(ROLE_KEY, res.user.roles[0].label);
        // } else {
        //   localStorage.removeItem(ROLE_KEY);
        // }
 
      })
    );
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ROLE_KEY);
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  getRole(): string | null {
    return localStorage.getItem(ROLE_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // Vérifie si l'utilisateur possède au moins un des rôles demandés
  // hasRole(...roles: string[]): boolean {
  //   const user = this.getUser();
  //   if (!user) return false;
  //   const userRoles = user.roles.map(r => r.label);
  //   return roles.some(r => userRoles.includes(r));
  // }
}
