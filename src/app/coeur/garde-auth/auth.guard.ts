// src/app/core/guards/auth.guard.ts
// import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth-service';
// src/app/core/guards/auth.guard.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object

  ) {}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (!isPlatformBrowser(this.platformId)) {
      return true; 
    }
    if (this.authService.isLoggedIn()) {
      return true;
    } else {
      // Rediriger vers la page de connexion
      return this.router.createUrlTree(['/login']);
    }
  }
}



