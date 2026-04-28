import { Component, OnInit, HostListener } from '@angular/core';
import { forkJoin } from 'rxjs';
import { TrajetService } from '../../../../coeur/services/trajet-service';
import { VilleService } from '../../../../coeur/services/ville-service';
import { VehiculeService } from '../../../../coeur/services/vehicule-service';
import { Trajet, StatutTrajet } from '../../../../partages/models/trajet';
import { Ville } from '../../../../partages/models/ville';
import { Vehicule } from '../../../../partages/models/vehicule';
import { ChangeDetectorRef } from '@angular/core';
import { User } from '../../../../partages/models/users';
import { UserService } from '../../../../coeur/services/user-service';

interface TrajetForm {
  villeDepartId: string;
  villeArriveeId: string;
  vehiculeId: string;
  distance: number | null;
  dureeEstimee: string;
  tarif: number | null;
  dateDepart: string;
  heureDepart: string;
  statut: string;
  chauffeurId: number;
}

// interface FormErrors {
//   villeDepart: string;
//   villeArrivee: string;
//   vehicule: string;
//   distance?: string;
//   dureeEstimee?: string;
//   tarif?: string;
//   dateDepart?: string;
//   heureDepart?: string;
//   statut?: string;
// }
interface FormErrors {
  villeDepartId?: string;
  villeArriveeId?: string;
  vehiculeId?: string;
  distance?: string;
  dureeEstimee?: string;
  tarif?: string;
  dateDepart?: string;
  heureDepart?: string;
  statut?: string;
  chauffeurId?: string;
}

enum ModalMode {
  AJOUT = 'ajout',
  MODIFICATION = 'modification',
  VISUALISATION = 'visualisation'
}

@Component({
  selector: 'app-liste-trajet-compent',
  standalone: false,
  templateUrl: './liste-trajet-compent.html',
  styleUrl: './liste-trajet-compent.scss',
})
export class ListeTrajetCompent implements OnInit {

  // ── Liste ─────────────────────────────────────────────────
  trajets: Trajet[] = [];
  filteredTrajets: Trajet[] = [];
  villes: Ville[] = [];
  vehicules: Vehicule[] = [];
  chauffeurs: User[] = [];      

  isLoading = true;
  errorMessage = '';

   // ── Filtres ───────────────────────────────────────────────
  searchTerm = '';
  filterDateDebut = '';
  filterDateFin = '';
  filterStatut = '';

  // ── Modal ─────────────────────────────────────────────────
  isModalOpen = false;
  isSubmitting = false;
  formError = '';
  formSuccess = '';
  formErrors: FormErrors = {};

  modalMode: ModalMode = ModalMode.AJOUT;
  editingTrajetId: string | null = null;

  trajetForm: TrajetForm = this.emptyForm();

  statusOptions = [
    { value: 'PROGRAMME', label: 'Programmé', numeric: StatutTrajet.PROGRAMME },
    { value: 'EN_COURS', label: 'En cours', numeric: StatutTrajet.EN_COURS },
    { value: 'TERMINE', label: 'Terminé', numeric: StatutTrajet.TERMINE },
    { value: 'ANNULE', label: 'Annulé', numeric: StatutTrajet.ANNULE },
  ];


  constructor(
    private trajetService: TrajetService,
    private villeService: VilleService,
    private vehiculeService: VehiculeService,
    private cd: ChangeDetectorRef,
    private userService: UserService

  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  // ── Chargement ────────────────────────────────────────────
  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Charger trajets, villes et véhicules en parallèle avec forkJoin
    forkJoin({
      trajets: this.trajetService.getAll(),
      villes: this.villeService.getAllVilles(),
      vehicules: this.vehiculeService.getDisponibles(),
      chauffeurs: this.userService.getChauffeurs()   
    }).subscribe({
      next: (results) => {
        this.trajets = results.trajets || [];
        this.villes = results.villes || [];
        this.vehicules = results.vehicules || [];
        this.chauffeurs = results.chauffeurs || [];  
        
        console.log('Trajets chargés:', this.trajets);
        console.log('Villes chargées:', this.villes);
        console.log('Véhicules chargés:', this.vehicules);
        console.log('Chauffeurs chargés:', this.chauffeurs); 

        this.filterTrajets();

        this.isLoading = false;

        this.cd.detectChanges(); // TRÈS IMPORTANT
      },
      error: (err) => {
        console.error('Erreur chargement données:', err);
        this.errorMessage = 'Impossible de charger les trajets.';
        this.isLoading = false;
      }
    });
  }


  // ── Filtre ────────────────────────────────────────────────
  filterTrajets(): void {
    const terme = this.searchTerm.toLowerCase().trim();
    const debut = this.filterDateDebut ? new Date(this.filterDateDebut) : null;
    const fin   = this.filterDateFin   ? new Date(this.filterDateFin)   : null;

    this.filteredTrajets = this.trajets.filter(tr => {
      // Filtre texte
      if (terme) {
        const villeDep  = this.getVilleNom(tr.villeDepart.id? tr.villeDepart.id : '').toLowerCase();
        const villeArr  = this.getVilleNom(tr.villeArrivee.id? tr.villeArrivee.id : '').toLowerCase();
        const vehicule  = this.getVehiculeImmatriculation(tr.vehicule.id? tr.vehicule.id : '' ).toLowerCase();
        const match = villeDep.includes(terme)  ||
                      villeArr.includes(terme)  ||
                      vehicule.includes(terme)  ||
                      tr.distance.toString().includes(terme) ||
                      tr.tarif.toString().includes(terme);
        if (!match) return false;
      }

      // Filtre date de début
      if (debut) {
        const dateTrajet = new Date(tr.dateDepart);
        if (dateTrajet < debut) return false;
      }

      // Filtre date de fin
      if (fin) {
        const dateTrajet = new Date(tr.dateDepart);
        if (dateTrajet > fin) return false;
      }

      // Filtre statut
      if (this.filterStatut !== '') {
        const statutOpt = this.statusOptions.find(o => o.value === this.filterStatut);
        if (statutOpt && tr.statut !== statutOpt.numeric) return false;
      }

      return true;
    });
  }

  resetFiltres(): void {
    this.searchTerm     = '';
    this.filterDateDebut = '';
    this.filterDateFin   = '';
    this.filterStatut    = '';
    this.filterTrajets();
  }

  
  // ── Helpers pour l'affichage ──────────────────────────────

  
  getChauffeurNom(chauffeurId: number): string {
    const c = this.chauffeurs.find(ch => ch.id === chauffeurId);
    return c ? `${c.fullName || ''} ${c.username}` : 'Inconnu';
  }


  getVilleNom(villeId: string): any {
    return this.villes.find(v => String(v.id) === String(villeId))?.nomVille || 'Inconnue';
  }

  getVehiculeImmatriculation(vehiculeId: string): string {
    return this.vehicules.find(v => String(v.id) === String(vehiculeId))?.immatriculation || 'Inconnue';
  }

  getStatutLabel(statut: StatutTrajet | string): string {
    // Si c'est une chaîne, trouver le label correspondant
    if (typeof statut === 'string') {
      const option = this.statusOptions.find(opt => opt.value === statut);
      return option ? option.label : 'Inconnu';
    }
    // Si c'est un nombre, utiliser la logique existante
    const option = this.statusOptions.find(opt => opt.numeric === statut);
    return option ? option.label : 'Inconnu';
  }

  // component helper (keeps template tidy)
  getStatutClass(statut: number) {
    return {
      'bg-primary': statut === 0,
      'bg-warning': statut === 1,
      'bg-success': statut === 2,
      'bg-danger': statut === 3
    };
  }


  // ── Actions tableau ───────────────────────────────────────
  onView(id: string): void {
    const trajet = this.trajets.find(t => t.id === id);
    if (!trajet) return;

    this.editingTrajetId = id;
    this.modalMode = ModalMode.VISUALISATION;

    const statutString = this.statusOptions.find(opt => opt.numeric === trajet.statut)?.value || 'PROGRAMME';

    this.trajetForm = {
      villeDepartId: trajet.villeDepart.id? trajet.villeDepart.id : '',
      villeArriveeId: trajet.villeArrivee.id? trajet.villeArrivee.id : '',
      vehiculeId: trajet.vehicule.id? trajet.vehicule.id : '',
      distance: trajet.distance,
      dureeEstimee: trajet.dureeEstimee,
      tarif: trajet.tarif,
      dateDepart: trajet.dateDepart,
      heureDepart: trajet.heureDepart,
      statut: statutString,
      // chauffeurId: trajet.chauffeur.id? trajet.chauffeur.id : 0
      chauffeurId: trajet.chauffeurId || 0
    };

    this.formError = '';
    this.formSuccess = '';
    this.formErrors = {};
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  onEdit(id: string): void {
    const trajet = this.trajets.find(t => t.id === id);
    if (!trajet) return;

    this.editingTrajetId = id;
    this.modalMode = ModalMode.MODIFICATION;

    const statutString = this.statusOptions.find(opt => opt.numeric === trajet.statut)?.value || 'PROGRAMME';

    this.trajetForm = {
      villeDepartId: trajet.villeDepart.id? trajet.villeDepart.id : '',
      villeArriveeId: trajet.villeArrivee.id? trajet.villeArrivee.id : '',
      vehiculeId: trajet.vehicule.id? trajet.vehicule.id : '',
      distance: trajet.distance,
      dureeEstimee: trajet.dureeEstimee,
      tarif: trajet.tarif,
      dateDepart: trajet.dateDepart,
      heureDepart: trajet.heureDepart,
      statut: statutString,
      // chauffeurId: trajet.chauffeur.id? trajet.chauffeur.id : 0
      chauffeurId: trajet.chauffeurId || 0
    };

    this.formError = '';
    this.formSuccess = '';
    this.formErrors = {};
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  onDelete(id: string): void {
    const trajet = this.trajets.find(t => t.id === id);
    if (!trajet) return;

    const villeDep = this.getVilleNom(trajet.villeDepart.id?.toString() || '');
    const villeArr = this.getVilleNom(trajet.villeArrivee.id?.toString() || '');

    if (!confirm(`Supprimer le trajet ${villeDep} → ${villeArr} du ${trajet.dateDepart} ? Cette action est irréversible.`)) return;

    this.trajetService.delete(id).subscribe({
      next: () => {
        // Suppression locale UNIQUEMENT si la requête réussit
        this.trajets = this.trajets.filter(t => t.id !== id);
        this.filteredTrajets = this.filteredTrajets.filter(t => t.id !== id);
        this.cd.detectChanges(); 
      },
      error: (err) => {
        console.error('Erreur suppression trajet:', err);
        // Essayer de lire le message du serveur
        const serverMsg = err.error?.message || err.error?.error || err.statusText;
        alert(`Erreur lors de la suppression : ${serverMsg || 'Veuillez réessayer.'}`);
        this.cd.detectChanges(); 

      }
    });

  }

  // ── Modal : ouverture / fermeture ─────────────────────────
  openModal(): void {
    this.modalMode = ModalMode.AJOUT;
    this.editingTrajetId = null;
    this.trajetForm = this.emptyForm();
    this.formError = '';
    this.formSuccess = '';
    this.formErrors = {};
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    if (this.isSubmitting) return;
    this.isModalOpen = false;
    document.body.style.overflow = '';
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isModalOpen) this.closeModal();
  }

  // ── Soumission ────────────────────────────────────────────
  submitForm(): void {
    this.formError = '';
    this.formSuccess = '';
    this.formErrors = {};

    let hasError = false;

    if (!this.trajetForm.villeDepartId) {
      this.formErrors.villeDepartId = 'La ville de départ est obligatoire.';
      hasError = true;
    }

    if (!this.trajetForm.villeArriveeId) {
      this.formErrors.villeArriveeId = 'La ville d\'arrivée est obligatoire.';
      hasError = true;
    }

    if (this.trajetForm.villeDepartId === this.trajetForm.villeArriveeId) {
      this.formErrors.villeArriveeId = 'Les villes de départ et d\'arrivée doivent être différentes.';
      hasError = true;
    }

    if (!this.trajetForm.vehiculeId) {
      this.formErrors.vehiculeId = 'Le véhicule est obligatoire.';
      hasError = true;
    }

    if (!this.trajetForm.distance || this.trajetForm.distance <= 0) {
      this.formErrors.distance = 'La distance doit être supérieure à 0.';
      hasError = true;
    }

    if (!this.trajetForm.dureeEstimee) {
      this.formErrors.dureeEstimee = 'La durée estimée est obligatoire.';
      hasError = true;
    }

    if (!this.trajetForm.tarif || this.trajetForm.tarif <= 0) {
      this.formErrors.tarif = 'Le tarif doit être supérieur à 0.';
      hasError = true;
    }

    if (!this.trajetForm.dateDepart) {
      this.formErrors.dateDepart = 'La date de départ est obligatoire.';
      hasError = true;
    }

    if (!this.trajetForm.heureDepart) {
      this.formErrors.heureDepart = 'L\'heure de départ est obligatoire.';
      hasError = true;
    }

     if (!this.trajetForm.chauffeurId) {
      this.formErrors.chauffeurId = 'Le chauffeur est obligatoire.';
      hasError = true;
    }


    if (hasError) return;

    this.isSubmitting = true;

    const statutOption = this.statusOptions.find(opt => opt.value === this.trajetForm.statut);
    const statutNumeric = statutOption ? statutOption.numeric : StatutTrajet.PROGRAMME;

    const payload = {
      villeDepartId: this.trajetForm.villeDepartId || '',
      villeArriveeId: this.trajetForm.villeArriveeId || '',
      vehiculeId: this.trajetForm.vehiculeId || '',
      distance: Number(this.trajetForm.distance),
      dureeEstimee: this.trajetForm.dureeEstimee.trim(),
      tarif: Number(this.trajetForm.tarif),
      dateDepart: this.trajetForm.dateDepart,
      heureDepart: this.trajetForm.heureDepart,
      statut: statutNumeric,
      chauffeurId: this.trajetForm.chauffeurId? Number(this.trajetForm.chauffeurId) : undefined
    };

    if (this.modalMode === ModalMode.AJOUT) {
      this.trajetService.create(payload).subscribe({
        next: (nouveau) => {
          this.isSubmitting = false;
          this.formSuccess = 'Trajet enregistré avec succès !';
          this.trajets.push(nouveau);
          console.log('Trajet créé:', nouveau);
          console.log('Liste trajets après ajout:', this.trajets);
          this.filteredTrajets = [...this.trajets];
          setTimeout(() => this.closeModal(), 1200);
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Erreur création trajet:', err);
          this.formError = 'Erreur lors de l\'enregistrement. Veuillez réessayer.';
        }
      });
    } else {
      if (!this.editingTrajetId) return;

      const index = this.trajets.findIndex(t => t.id === this.editingTrajetId);
      if (index !== -1) {
        this.trajets[index] = {
          ...this.trajets[index],
          ...payload
        };
        this.filteredTrajets = [...this.trajets];
        this.isSubmitting = false;
        this.formSuccess = 'Trajet modifié avec succès !';
        setTimeout(() => this.closeModal(), 1200);
      }
    }
  }

  // ── Helpers ───────────────────────────────────────────────
  private emptyForm(): TrajetForm {
    return {
      villeDepartId: '',
      villeArriveeId: '',
      vehiculeId: '',
      distance: null,
      dureeEstimee: '',
      tarif: null,
      dateDepart: '',
      heureDepart: '',
      statut: 'PROGRAMME',
      chauffeurId: 0   
    };
  }

  onFieldChange(field: keyof FormErrors): void {
    if (this.formErrors[field]) {
      delete this.formErrors[field];
    }
  }
}
