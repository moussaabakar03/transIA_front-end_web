import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { Profile, Role, User } from '../../../partages/models/users';
import { UserService } from '../../../coeur/services/user-service';
import { ProfilService } from '../../../coeur/services/profil-service';

interface UserProfil extends User {
  profil?: Profile;
}

// interface FormErrors {
//   fullName?: string;
//   // etc.
// }

@Component({
  selector: 'app-liste-utilisateur-component',
  standalone: false,
  templateUrl: './liste-utilisateur-component.html',
  styleUrl: './liste-utilisateur-component.scss',
})
export class ListeUtilisateurComponent implements OnInit {
  users: UserProfil[] = [];
  filteredUsers: UserProfil[] = [];
  searchTerm = '';
  isLoading = true;
  errorMessage = '';

  // Modal
  isModalOpen = false;
  isSubmitting = false;
  formError = '';
  formSuccess = '';
  modalMode: 'add' | 'edit' = 'edit';
  selectedUser: UserProfil | null = null;

  roles: Role[] = [];
  selectedRoleId: number | null = null;

  editUser: any = {}; // objet éphémère pour le formulaire
  editProfile: any = {};

  roleOptions = ['ADMIN', 'AGENT_ACCUEIL', 'CHAUFFEUR', 'CLIENT'];

  constructor(
    private userService: UserService,
    private profilService: ProfilService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.userService.getAllUsers().subscribe({
      next: users => {
        this.users = users.map(u => ({ ...u, profil: undefined }));
        // this.users = users;
        this.loadProfilesForUsers();
      },
      error: err => {
        this.errorMessage = 'Impossible de charger les utilisateurs.';
        this.isLoading = false;
      }
    });
  }

  // loadRoles(): void {
  //   this.userService.getAllRoles().subscribe({
  //     next: roles =>{
  //        this.roles = roles;
  //        this.cd.detectChanges(),
  //         console.log('Rôles chargés :', this.roles);
  //     },
  //     error: err => console.error('Erreur chargement rôles', err)
  //   });
  // }

  loadRoles(): void {
    this.userService.getAllRoles().subscribe({
      next: (roles: any) => {
        this.roles = roles.data;                     
        if (this.roles.length > 0) {
          this.selectedRoleId = this.roles[0].id; // présélection
        }
        // console.log('Rôles chargés :', this.roles);
        this.cd.detectChanges();
      },
      error: (err) => console.error('Erreur chargement rôles', err)
    });
  }

  getRoleLabel(user: UserProfil): string {
    const roles = user.roles;
    if (!roles) return '—';
    if (Array.isArray(roles)) {
      return roles.map(r => r?.name || r).join(', ');
    }
    return (roles as any)?.name;
  }


  private loadProfilesForUsers(): void {
    const requests = this.users.map(user =>
      this.profilService.getProfilByUserId(user.id!).pipe(
        catchError(() => of(null))
      )
    );
    forkJoin(requests).subscribe(profiles => {
      this.users.forEach((user, i) => {
        user.profil = profiles[i] || undefined;
      });
      this.applyFilter();
      this.isLoading = false;
      this.cd.detectChanges();
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredUsers = term
      ? this.users.filter(u =>
          (u.profil?.nomComplet || u.fullName).toLowerCase().includes(term) ||
          u.username.toLowerCase().includes(term) ||
          // u.roles.toString().toLowerCase().includes(term) ||
          u.roles?.name?.toLowerCase().includes(term) ||
          // u.roles.some(r => r.name.toLowerCase().includes(term)) ||
          (u.profil?.telephone || '').includes(term)
        )
      : [...this.users];
  }

  getInitials(name: string): string {
    return name?.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2) || '?';
  }

  // openModal(mode: 'add' | 'edit' = 'edit', user?: UserProfil): void {
  //   this.modalMode = mode;
  //   this.selectedUser = user || null;
  //   if (mode === 'add') {
  //     this.editUser = { fullName: '', username: '', roles: 'CLIENT', enable: true };
  //     this.editProfile = { photoProfil: '', telephone: '', nomComplet: '', adresse: '' };
  //   } else if (user) {
  //     this.editUser = { fullName: user.fullName, username: user.username, roles: user.roles, enable: user.enable };
  //     this.editProfile = {
  //       photoProfil: user.profil?.photoProfil || '',
  //       telephone: user.profil?.telephone || '',
  //       nomComplet: user.profil?.nomComplet || '',
  //       adresse: user.profil?.adresse || ''
  //     };
  //   }
  //   this.formError = '';
  //   this.formSuccess = '';
  //   this.isModalOpen = true;
  // }

  onEdit(id: number): void {
    const user = this.users.find(u => u.id === id);
    if (user) this.openModal('edit', user);
  }

  onDisable(id: number): void {
    // Implémentez l'appel API pour désactiver
  }

  onEnable(id: number): void {
    // Implémentez l'appel API pour activer
  }

  closeModal(): void {
    if (this.isSubmitting) return;
    this.isModalOpen = false;
  }

  save(): void {
    if (this.modalMode === 'add') {
      this.createUserWithProfile();
    } else {
      this.updateUserProfile();
    }
  }

  private createUserWithProfile(): void {
    this.isSubmitting = true;
    this.formError = '';
    this.formSuccess = '';

    // 1. Créer l'utilisateur
    const newUser = {
      fullName: this.editUser.fullName,
      username: this.editUser.username,
      password: this.editUser.password,
      roles: { id: this.editUser.roleId },  // objet Role avec seulement l'id
      enable: this.editUser.enable ?? true
    };


    this.userService.saveUser(newUser).subscribe({
      next: (createdUser) => {
        console.log('Utilisateur créé – réponse complète :', createdUser);

        const userPublicId = createdUser.publicId;   


        // 2. Créer le profil avec l'ID de l'utilisateur
        const newProfile = {
          userId: createdUser.id,  // l'ID retourné par le backend
          ...this.editProfile
        };
        this.profilService.updateProfilByPublicId(createdUser.publicId, newProfile).subscribe({
          next: (savedProfile) => {
            // Ajouter à la liste locale
            const userWithProfile: UserProfil = {
              ...createdUser,
              profil: savedProfile
            };
            this.users.push(userWithProfile);
            this.applyFilter();
            this.isSubmitting = false;
            this.formSuccess = 'Utilisateur créé avec succès.';
            setTimeout(() => this.closeModal(), 1000);
          },
          error: (err) => {
            this.isSubmitting = false;
            this.formError = 'Utilisateur créé mais profil non enregistré. ' + (err.error?.message || '');
          }
        });
      },
      error: (err) => {
        this.isSubmitting = false;
        this.formError = 'Erreur création utilisateur : ' + (err.error?.message || err.message);
      }
    });
  }

  private updateUserProfile(): void {
    if (!this.selectedUser) return;
    this.isSubmitting = true;
    // Mettre à jour le profil (et éventuellement l'utilisateur)
    this.profilService.updateProfilByPublicId(this.selectedUser.publicId, this.editProfile).subscribe({
      next: () => {
        // Mise à jour locale
        const idx = this.users.findIndex(u => u.publicId === this.selectedUser!.publicId);
        if (idx !== -1) {
          this.users[idx].profil = { ...this.users[idx].profil, ...this.editProfile };
          this.users[idx].fullName = this.editUser.fullName;
          this.users[idx].roles = this.editUser.roles;
          this.users[idx].enable = this.editUser.enable;
          this.applyFilter();
        }
        this.isSubmitting = false;
        this.formSuccess = 'Profil mis à jour.';
        setTimeout(() => this.closeModal(), 1000);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.formError = 'Erreur lors de la mise à jour : ' + (err.error?.message || err.message);
      }
    });
  }

  // Mise à jour de openModal pour le mode add
  openModal(mode: 'add' | 'edit' = 'edit', user?: UserProfil): void {
    this.modalMode = mode;
    this.selectedUser = user || null;
    if (mode === 'add') {
      this.editUser = {
        fullName: '',
        username: '',
        password: '',
        roleId: this.roles.length > 0 ? this.roles[0].id : 1, // valeur par défaut
        enable: true
      };
      this.editProfile = { photoProfil: '', telephone: '', nomComplet: '', adresse: '' };
    } else if (user) {
        this.editUser = {
          fullName: user.fullName,
          username: user.username,
          roleId: user.roles?.id,          // on extrait l'id
          enable: user.enable
        };
        this.editProfile = {
          photoProfil: user.profil?.photoProfil || '',
          telephone: user.profil?.telephone || '',
          nomComplet: user.profil?.nomComplet || '',
          adresse: user.profil?.adresse || ''
        };
      }
    this.formError = '';
    this.formSuccess = '';
    this.isModalOpen = true;
  }


  // save(): void {
  //   if (!this.selectedUser && this.modalMode === 'add') {
  //     // Logique de création (non détaillée ici)
  //     return;
  //   }
  //   this.isSubmitting = true;
  //   // Mise à jour du profil
  //   this.profilService.updateProfil(this.selectedUser!.id!, this.editProfile).subscribe({
  //     next: () => {
  //       // Mise à jour locale
  //       const idx = this.users.findIndex(u => u.id === this.selectedUser!.id);
  //       if (idx !== -1) {
  //         this.users[idx].profil = { ...this.users[idx].profil, ...this.editProfile };
  //         this.users[idx].fullName = this.editUser.fullName;
  //         this.users[idx].roles = this.editUser.roles;
  //         this.users[idx].enable = this.editUser.enable;
  //         this.applyFilter();
  //       }
  //       this.isSubmitting = false;
  //       this.formSuccess = 'Profil mis à jour.';
  //       setTimeout(() => this.closeModal(), 1000);
  //     },
  //     error: (err: any) => {
  //       this.isSubmitting = false;
  //       console.error('Erreur complète', err);
  //       this.formError = err.error?.message || err.message || 'Erreur lors de la sauvegarde.';
  //     }
  //   });
  // }



}