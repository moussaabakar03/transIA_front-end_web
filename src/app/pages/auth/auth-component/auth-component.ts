import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../coeur/services/auth-service';
import { Router } from '@angular/router';
import { LoginForm } from '../../../partages/models/auth.model';

@Component({
  selector: 'app-auth-component',
  standalone: false,
  templateUrl: './auth-component.html',
  styleUrl: './auth-component.scss',
})
export class AuthComponent implements OnInit{
 
  username: string = '';
  password: string = '';
 
  showPassword: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
 
  currentYear: number = new Date().getFullYear();
 
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
 
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
 
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
        console.log("1. Connexion Reuçue.... ", response.accessToken);
        console.log("2. Connexion Reuçue.... ", response.fullName);
        console.log("3. Connexion Reuçue.... ", response.roles);
        console.log("4. Connexion Reuçue.... ", response);
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
        } else if (err.status === 500) {
          this.errorMessage = 'Erreur côté serveur.';
        } else if (err.status === 0) {
          this.errorMessage = 'Impossible de joindre le serveur. Vérifiez votre connexion.';
        } else {
          this.errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
        }
      }
    });
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }
}
