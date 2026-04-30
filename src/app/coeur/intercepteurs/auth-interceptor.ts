import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth-service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRedirecting = false;

  constructor(private authService: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();

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
        const isLoginRequest = req.url.includes('/login');

        if (error.status === 401 && !isLoginRequest && !this.isRedirecting) {
          // Seulement rediriger une seule fois pour éviter les redirections en cascade
          this.isRedirecting = true;
          this.authService.clearSession();
          this.router.navigate(['/login']).then(() => {
            this.isRedirecting = false;
          });
        }

        return throwError(() => error);
      })
    );
  }
}
