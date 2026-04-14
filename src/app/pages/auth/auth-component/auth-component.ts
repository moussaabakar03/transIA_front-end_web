import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { AuthService } from '../../../coeur/services/auth-service';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginForm } from '../../../partages/models/auth.model';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-auth-component',
  standalone: false,
  templateUrl: './auth-component.html',
  styleUrl: './auth-component.scss',
})
export class AuthComponent implements OnInit{
 
  //  Champs du formulaire 
  username: string = '';
  password: string = '';
 
  //  États UI 
  showPassword: boolean = false;
  isLoading: boolean    = false;
  errorMessage: string  = '';
 
  //  Année courante (footer) 
  currentYear: number = new Date().getFullYear();
 
  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
 
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
 
  onSubmit(): void {
    this.errorMessage = '';
 
    if (!this.username.trim()) {
      this.errorMessage = 'Veuillez saisir votre identifiant.';
      return;
    }
    if (!this.password.trim()) {
      this.errorMessage = 'Veuillez saisir votre mot de passe.';
      return;
    }
 
    this.isLoading = true;
 
    //  CORRECTION : on passe un objet LoginForm, pas deux strings séparées
    const credentials: LoginForm = {
      username: this.username.trim(),
      password: this.password
    };
 
    this.authService.login(credentials).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        if (err.status === 401) {
          this.errorMessage = 'Identifiant ou mot de passe incorrect.';
        } else if (err.status === 403) {
          this.errorMessage = 'Accès refusé. Contactez votre administrateur.';
        } else if (err.status === 0) {
          this.errorMessage = 'Impossible de joindre le serveur. Vérifiez votre connexion.';
        } else {
          this.errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
        }

      }
    });


  }
  
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId) && this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }
}
