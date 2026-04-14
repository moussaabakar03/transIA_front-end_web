import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../coeur/services/auth-service';

@Component({
  selector: 'app-header-component',
  standalone: false,
  templateUrl: './header-component.html',
  styleUrl: './header-component.scss',
})
export class HeaderComponent implements OnInit {
  currentUsername: string = '';


  constructor(
    private authService: AuthService
  ) {}

  
  ngOnInit(): void {
    // Récupération du nom au chargement du composant
    this.currentUsername = this.authService.getUserName() || 'Utilisateur';
  }
  

  
  logout(): void {
    this.authService.logout();
  }
}
