import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { AuthService } from '../../../coeur/services/auth-service';
import { LoginResponse, User } from '../../../partages/models/auth.model';

@Component({
  selector: 'app-header-component',
  standalone: false,
  templateUrl: './header-component.html',
  styleUrl: './header-component.scss',
})
export class HeaderComponent implements OnInit {
  currentUsername: string = '';
  isUserMenuOpen = false;

  utilisateurConnecter?: LoginResponse | null;

  utilisateurConnecter?: LoginResponse | null;


  constructor(
    private authService: AuthService,
    private elementRef: ElementRef<HTMLElement>
  ) {}

  
  ngOnInit(): void {
    // Récupération du nom au chargement du composant
    this.currentUsername = this.authService.getUserName() || 'Utilisateur';

    this.utilisateurConnecter = this.authService.getUser();
  }
  

  
  logout(): void {
    this.isUserMenuOpen = false;
    this.authService.logout();
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as Node | null;

    if (!target) {
      return;
    }

    if (!this.elementRef.nativeElement.contains(target)) {
      this.isUserMenuOpen = false;
    }
  }
}
