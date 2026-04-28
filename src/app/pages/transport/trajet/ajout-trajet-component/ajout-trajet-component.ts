import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { TrajetService } from '../../../../coeur/services/trajet-service';
import { VilleService } from '../../../../coeur/services/ville-service';
import { VehiculeService } from '../../../../coeur/services/vehicule-service';
import { StatutTrajet } from '../../../../partages/models/trajet';
import { Ville } from '../../../../partages/models/ville';
import { Vehicule } from '../../../../partages/models/vehicule';
import { User } from '../../../../partages/models/users';
import { UserService } from '../../../../coeur/services/user-service';

interface TrajetPayload {
  villeDepartId: string;
  villeArriveeId: string;
  vehiculeId: string;
  distance: number;
  dureeEstimee: string;
  tarif: number;
  dateDepart: string;
  heureDepart: string;
  statut: StatutTrajet;
  chauffeurId: number | null;
}

@Component({
  selector: 'app-ajout-trajet-component',
  standalone: false,
  templateUrl: './ajout-trajet-component.html',
  styleUrl: './ajout-trajet-component.scss',
})
export class AjoutTrajetComponent implements OnInit {
  trajetForm: TrajetPayload = {
    villeDepartId: '',
    villeArriveeId: '',
    vehiculeId: '',
    distance: 0,
    dureeEstimee: '',
    tarif: 0,
    dateDepart: '',
    heureDepart: '',
    statut: StatutTrajet.PROGRAMME,
    chauffeurId: null           
  };
  chauffeurs: User[] = []; 

  villes: Ville[] = [];
  vehicules: Vehicule[] = [];

  isSubmitting: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  readonly statusOptions = [
    { value: StatutTrajet.PROGRAMME, label: 'Programmé' },
    { value: StatutTrajet.EN_COURS, label: 'En cours' },
    { value: StatutTrajet.TERMINE, label: 'Terminé' },
    { value: StatutTrajet.ANNULE, label: 'Annulé' }
  ];

  constructor(
    private trajetService: TrajetService,
    private villeService: VilleService,
    private vehiculeService: VehiculeService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    // this.isLoading = true; 
    
    this.villeService.getAllVilles().subscribe({
      next: (data) => {
        this.villes = data || [];
        this.isLoading = false;
        this.cdr.detectChanges(); // Forcer la détection de changement après chargement
      },
      error: (err: any) => {
        console.error('Erreur chargement villes:', err);
        this.isLoading = false;
        this.cdr.detectChanges(); // Forcer la détection de changement en cas d'erreur
      }
    });

    this.vehiculeService.getDisponibles().subscribe({
      next: (data) => {
        this.vehicules = data || [];
        this.isLoading = false;
        this.cdr.detectChanges(); // Forcer la détection de changement après chargement

      },
      error: (err: any) => {
        console.error('Erreur chargement véhicules:', err);
        this.isLoading = false;
      }
    });

     this.userService.getChauffeurs().subscribe({
      next: (data) => {
        this.chauffeurs = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur chargement chauffeurs', err)
    });


  }

  getChauffeurNom(chauffeurId: number | null): string {
    const c = this.chauffeurs.find(ch => ch.id === chauffeurId);
    return c ? `${c.fullName || ''} ${c.username}` : '';
  }

  getVilleNom(villeId: string): string {
    return this.villes.find(v => v.id === villeId)?.nomVille || '';
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const payload = this.buildPayload();
    const validationError = this.validate(payload);

    if (validationError) {
      this.errorMessage = validationError;
      return;
    }

    this.isSubmitting = true;

    this.trajetService.create(payload).pipe(
      finalize(() => {
        this.isSubmitting = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.successMessage = 'Trajet ajouté avec succès.';
        this.resetForm();
        setTimeout(() => this.router.navigate(['/trajets/liste']), 600);
      },
      error: (err) => {
        if (err.status === 400) {
          this.errorMessage = 'Les informations du trajet sont invalides.';
        } else if (err.status === 409) {
          this.errorMessage = 'Ce trajet existe déjà.';
        } else if (err.status === 0) {
          this.errorMessage = 'Impossible de joindre le serveur.';
        } else {
          this.errorMessage = 'Une erreur est survenue lors de l\'ajout du trajet.';
        }
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/trajets/liste']);
  }

  private buildPayload(): TrajetPayload {
    return {
      villeDepartId: this.trajetForm.villeDepartId.trim(),
      villeArriveeId: this.trajetForm.villeArriveeId.trim(),
      vehiculeId: this.trajetForm.vehiculeId.trim(),
      distance: Number(this.trajetForm.distance),
      dureeEstimee: this.trajetForm.dureeEstimee.trim(),
      tarif: Number(this.trajetForm.tarif),
      dateDepart: this.trajetForm.dateDepart,
      heureDepart: this.trajetForm.heureDepart,
      statut: Number(this.trajetForm.statut),
      chauffeurId: this.trajetForm.chauffeurId 
    };
  }

  private validate(payload: TrajetPayload): string {
    if (!payload.villeDepartId) {
      return 'La ville de départ est obligatoire.';
    }

    if (!payload.villeArriveeId) {
      return 'La ville d\'arrivée est obligatoire.';
    }

    if (payload.villeDepartId === payload.villeArriveeId) {
      return 'Les villes de départ et d\'arrivée doivent être différentes.';
    }

    if (!payload.vehiculeId) {
      return 'Le véhicule est obligatoire.';
    }

    if (!Number.isFinite(payload.distance) || payload.distance <= 0) {
      return 'La distance doit être supérieure à 0.';
    }

    if (!payload.dureeEstimee) {
      return 'La durée estimée est obligatoire.';
    }

    if (!Number.isFinite(payload.tarif) || payload.tarif <= 0) {
      return 'Le tarif doit être supérieur à 0.';
    }

    if (!payload.dateDepart) {
      return 'La date de départ est obligatoire.';
    }

    if (!payload.heureDepart) {
      return 'L\'heure de départ est obligatoire.';
    }

    if (!payload.chauffeurId) {
      return 'Le chauffeur est obligatoire.';
    }

    return '';
  }

  private resetForm(): void {
    this.trajetForm = {
      villeDepartId: '',
      villeArriveeId: '',
      vehiculeId: '',
      distance: 0,
      dureeEstimee: '',
      tarif: 0,
      dateDepart: '',
      heureDepart: '',
      statut: StatutTrajet.PROGRAMME,
       chauffeurId: null
    };
  }
}
