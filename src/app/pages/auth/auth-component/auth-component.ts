import { Component } from '@angular/core';
import { AuthService } from '../../../coeur/services/auth-service';
import { Router } from '@angular/router';
import { LoginForm } from '../../../partages/models/auth.model';

@Component({
  selector: 'app-auth-component',
  standalone: false,
  templateUrl: './auth-component.html',
  styleUrl: './auth-component.scss',
})
export class AuthComponent {
 
  // ── Champs du formulaire ──────────────────────────────────
  username: string = '';
  password: string = '';
 
  // ── États UI ─────────────────────────────────────────────
  showPassword: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
 
  // ── Année courante (footer) ───────────────────────────────
  currentYear: number = new Date().getFullYear();
 
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
 
  /** Bascule la visibilité du mot de passe */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
 
  /** Soumission du formulaire de connexion */
  onSubmit(): void {
    // Réinitialiser l'erreur précédente
    this.errorMessage = '';
 
    // Validation basique côté client
    if (!this.username.trim()) {
      this.errorMessage = 'Veuillez saisir votre identifiant.';
      return;
    }
    if (!this.password.trim()) {
      this.errorMessage = 'Veuillez saisir votre mot de passe.';
      return;
    }
 
    this.isLoading = true;
 
     const payload: LoginForm = {
      username: this.username.trim(),
      password: this.password
    };

    // Appel au service d'authentification
    this.authService.login(payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        // Redirection vers le tableau de bord après connexion réussie
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        // Gestion des erreurs HTTP Spring Boot
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
}
