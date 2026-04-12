import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth-service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();

    // Cloner la requête et ajouter le header Authorization si le token existe
    let authReq = req;
    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si le serveur renvoie 401 (non autorisé), on nettoie la session
        if (error.status === 401) {
          this.authService.clearSession();
          
          // Rediriger vers la page de connexion ou session expirée
          const currentUrl = this.router.url;
          if (!currentUrl.includes('/login') && !currentUrl.includes('/session-expired')) {
            this.router.navigate(['/session-expired']);
          }
        }
        return throwError(() => error);
      })
    );
  }
}