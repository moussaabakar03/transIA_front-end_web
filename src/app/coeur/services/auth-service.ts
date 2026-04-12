import { HttpClient } from '@angular/common/http';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
  
  constructor(private http: HttpClient, private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {}

  // POST /api/token/
  login(credentials: LoginForm): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.backendurl}/login`, credentials).pipe(
      // tap(res => {
      //   localStorage.setItem(TOKEN_KEY, res.access);
      //   localStorage.setItem(REFRESH_KEY, res.refresh);
      //   localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      //   localStorage.setItem(ROLE_KEY, res.user.role.label)
      // })

      // tap(res => {
      //   if (res && res.access) {
      //       localStorage.setItem(TOKEN_KEY, res.access);
      //       localStorage.setItem(REFRESH_KEY, res.refresh);
      //       // console.log("le res::: ", res);
      //       if (res.user) {
      //           localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      //           // Ajoute une sécurité ici :
      //           if (res.user.role) {
      //               localStorage.setItem(ROLE_KEY, res.user.role.label);
      //           }
      //       }
      //   }
      // })

      tap(res => {
        if (res && res.accessToken) {
          localStorage.setItem(TOKEN_KEY, res.accessToken);
          localStorage.setItem(USER_KEY, JSON.stringify(res)); // On stocke tout l'objet comme "user"
          localStorage.setItem(ROLE_KEY, res.roles[0]); // On prend le premier rôle
        }
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

  // getToken(): string | null {
  //   return localStorage.getItem(TOKEN_KEY);
  // }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }

  // Fais la même chose pour toutes les méthodes qui utilisent localStorage
  isLoggedIn(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!this.getToken();
    }
    return false;
  }


  getUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  getRole(): string | null {
    return localStorage.getItem(ROLE_KEY);
  }

  // Dans auth-service.ts
  getUserName(): string | null {
    const userJson = localStorage.getItem('user'); // La clé USER_KEY que tu as définie
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        return user.username; // On retourne le champ 'username' du JSON reçu de Spring
      } catch (e) {
        return null;
      }
    }
    return null;
  }


  // isLoggedIn(): boolean {
  //   return !!this.getToken();
  // }



}
