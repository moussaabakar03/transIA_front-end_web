import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth-service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object

  ) {}

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    return this.checkAccess(state.url);
  }

  canActivateChild(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    return this.checkAccess(state.url);
  }

  private checkAccess(targetUrl: string): boolean | UrlTree {
    // Only check authentication in browser environment
    if (!isPlatformBrowser(this.platformId)) {
      return true;
    }

    // Always allow login page
    if (targetUrl === '/login' || targetUrl.startsWith('/login?')) {
      return true;
    }

    // Check if user is logged in
    if (this.authService.isLoggedIn()) {
      return true;
    }

    // Redirect to login with return URL for protected routes
    return this.router.createUrlTree(['/login'], {
      queryParams: { returnUrl: targetUrl }
    });
  }
}
