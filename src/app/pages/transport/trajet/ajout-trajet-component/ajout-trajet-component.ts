import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { TrajetService } from '../../../../coeur/services/trajet-service';
import { VilleService } from '../../../../coeur/services/ville-service';
import { VehiculeService } from '../../../../coeur/services/vehicule-service';
import { UserService } from '../../../../coeur/services/user-service';
import { StatutTrajet } from '../../../../partages/models/trajet';
import { Ville } from '../../../../partages/models/ville';
import { Vehicule } from '../../../../partages/models/vehicule';
import { User } from '../../../../partages/models/users';

// Reprise du modèle de formulaire du composant liste (string pour statut, nombre pour chauffeur)
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
  chauffeurId: number;   // 0 = non sélectionné
}

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

@Component({
  selector: 'app-ajout-trajet-component',
  standalone: false,
  templateUrl: './ajout-trajet-component.html',
  styleUrls: ['./ajout-trajet-component.scss']
})
export class AjoutTrajetComponent implements OnInit {

  trajetForm: TrajetForm = {
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

  villes: Ville[] = [];
  vehicules: Vehicule[] = [];
  chauffeurs: User[] = [];

  isSubmitting = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  formErrors: FormErrors = {};

  statusOptions = [
    { value: 'PROGRAMME', label: 'Programmé', numeric: StatutTrajet.PROGRAMME },
    { value: 'EN_COURS',   label: 'En cours',  numeric: StatutTrajet.EN_COURS },
    { value: 'TERMINE',    label: 'Terminé',    numeric: StatutTrajet.TERMINE },
    { value: 'ANNULE',     label: 'Annulé',     numeric: StatutTrajet.ANNULE },
  ];

  constructor(
    private trajetService: TrajetService,
    private villeService: VilleService,
    private vehiculeService: VehiculeService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      villes: this.villeService.getAllVilles(),
      vehicules: this.vehiculeService.getDisponibles(),
      chauffeurs: this.userService.getChauffeurs()
    }).subscribe({
      next: results => {
        this.villes = results.villes || [];
        this.vehicules = results.vehicules || [];
        this.chauffeurs = results.chauffeurs || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Erreur chargement données', err);
        this.errorMessage = 'Impossible de charger les données nécessaires.';
        this.isLoading = false;
      }
    });
  }

  getVilleNom(villeId: string): string {
    return this.villes.find(v => String(v.id) === String(villeId))?.nomVille || 'Inconnue';
  }

  getChauffeurNom(id: number): string {
    const c = this.chauffeurs.find(ch => ch.id === id);
    return c ? (c.fullName || c.username) : 'Inconnu';
  }

  onFieldChange(field: keyof FormErrors): void {
    if (this.formErrors[field]) {
      delete this.formErrors[field];
    }
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.formErrors = {};

    let hasError = false;
    const v = this.trajetForm;

    if (!v.villeDepartId) { this.formErrors.villeDepartId = 'Obligatoire'; hasError = true; }
    if (!v.villeArriveeId) { this.formErrors.villeArriveeId = 'Obligatoire'; hasError = true; }
    if (v.villeDepartId && v.villeDepartId === v.villeArriveeId) {
      this.formErrors.villeArriveeId = 'Doivent être différentes'; hasError = true;
    }
    if (!v.vehiculeId)     { this.formErrors.vehiculeId     = 'Obligatoire'; hasError = true; }
    if (!v.distance || v.distance <= 0) { this.formErrors.distance = '> 0'; hasError = true; }
    if (!v.dureeEstimee)   { this.formErrors.dureeEstimee   = 'Obligatoire'; hasError = true; }
    if (!v.tarif || v.tarif <= 0)     { this.formErrors.tarif = '> 0'; hasError = true; }
    if (!v.dateDepart)     { this.formErrors.dateDepart     = 'Obligatoire'; hasError = true; }
    if (!v.heureDepart)    { this.formErrors.heureDepart    = 'Obligatoire'; hasError = true; }
    if (!v.chauffeurId)    { this.formErrors.chauffeurId    = 'Obligatoire'; hasError = true; }

    if (hasError) return;

    this.isSubmitting = true;

    const statutNumeric = this.statusOptions.find(o => o.value === v.statut)?.numeric ?? StatutTrajet.PROGRAMME;
    const payload = {
      villeDepartId: v.villeDepartId,
      villeArriveeId: v.villeArriveeId,
      vehiculeId: v.vehiculeId,
      distance: Number(v.distance),
      dureeEstimee: v.dureeEstimee.trim(),
      tarif: Number(v.tarif),
      dateDepart: v.dateDepart,
      heureDepart: v.heureDepart,
      statut: statutNumeric,
      chauffeurId: v.chauffeurId
    };

    this.trajetService.create(payload).pipe(
      finalize(() => {
        this.isSubmitting = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.successMessage = 'Trajet ajouté avec succès.';
        this.resetForm();
        setTimeout(() => this.router.navigate(['/trajets/liste']), 800);
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

  private resetForm(): void {
    this.trajetForm = {
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
}