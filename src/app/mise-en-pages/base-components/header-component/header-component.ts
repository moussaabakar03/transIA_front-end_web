import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../coeur/services/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header-component',
  standalone: false,
  templateUrl: './header-component.html',
  styleUrl: './header-component.scss',
})
export class HeaderComponent implements OnInit {
  currentUsername: string | null = '';


  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  
  ngOnInit(): void {
    // Récupération du nom au chargement du composant
    this.currentUsername = this.authService.getUserName();
  }
  

  
  logout(): void {
    this.authService.logout();
    // Rediriger vers la page de connexion
    this.router.navigate(['login']);
  }
}
