import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { forkJoin } from 'rxjs';
import { TrajetService } from '../../../../coeur/services/trajet-service';
import { VilleService } from '../../../../coeur/services/ville-service';
import { VehiculeService } from '../../../../coeur/services/vehicule-service';
import { UserService } from '../../../../coeur/services/user-service';
import { Trajet, StatutTrajet } from '../../../../partages/models/trajet';
import { Ville } from '../../../../partages/models/ville';
import { Vehicule } from '../../../../partages/models/vehicule';
import { User } from '../../../../partages/models/users';
import { Reservation } from '../../../../partages/models/reservation.model';
import { ReservationService } from '../../../../coeur/services/reservation-service';

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
  chauffeurId: number;   // 0 signifie non sélectionné
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

enum ModalMode {
  AJOUT = 'ajout',
  MODIFICATION = 'modification',
  VISUALISATION = 'visualisation'
}

@Component({
  selector: 'app-liste-trajet-compent',
  standalone: false,
  templateUrl: './liste-trajet-compent.html',
  styleUrls: ['./liste-trajet-compent.scss']
})
export class ListeTrajetCompent implements OnInit {

  trajets: Trajet[] = [];
  filteredTrajets: Trajet[] = [];
  villes: Ville[] = [];
  vehicules: Vehicule[] = [];
  chauffeurs: User[] = [];

  reservationsTrajet: Reservation[] = [];
  loadingReservations = false;

  isLoading = true;
  errorMessage = '';

  searchTerm = '';
  filterDateDebut = '';
  filterDateFin = '';
  filterStatut = '';

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
    { value: 'EN_COURS',   label: 'En cours',  numeric: StatutTrajet.EN_COURS },
    { value: 'TERMINE',    label: 'Terminé',    numeric: StatutTrajet.TERMINE },
    { value: 'ANNULE',     label: 'Annulé',     numeric: StatutTrajet.ANNULE },
  ];

  constructor(
    private trajetService: TrajetService,
    private villeService: VilleService,
    private vehiculeService: VehiculeService,
    private userService: UserService,
    private cd: ChangeDetectorRef,
    private reservationService: ReservationService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      trajets: this.trajetService.getAll(),
      villes: this.villeService.getAllVilles(),
      vehicules: this.vehiculeService.getDisponibles(),
      chauffeurs: this.userService.getChauffeurs()
    }).subscribe({
      next: results => {
        this.trajets = results.trajets || [];
        this.villes = results.villes || [];
        this.vehicules = results.vehicules || [];
        this.chauffeurs = results.chauffeurs || [];
        this.filterTrajets();
        this.isLoading = false;
        this.cd.detectChanges();
      },
      error: err => {
        console.error('Erreur chargement données:', err);
        this.errorMessage = 'Impossible de charger les trajets.';
        this.isLoading = false;
      }
    });
  }

  filterTrajets(): void {
    const terme = this.searchTerm.toLowerCase().trim();
    const debut = this.filterDateDebut ? new Date(this.filterDateDebut) : null;
    const fin   = this.filterDateFin   ? new Date(this.filterDateFin)   : null;

    this.filteredTrajets = this.trajets.filter(tr => {
      if (terme) {
        const villeDep = this.getVilleNom(tr.villeDepart?.id ?? '').toLowerCase();
        const villeArr = this.getVilleNom(tr.villeArrivee?.id ?? '').toLowerCase();
        const vehicule = this.getVehiculeImmatriculation(tr.vehicule?.id ?? '').toLowerCase();
        if (!(villeDep.includes(terme) || villeArr.includes(terme) || vehicule.includes(terme) ||
              tr.distance.toString().includes(terme) || tr.tarif.toString().includes(terme)))
          return false;
      }
      if (debut && new Date(tr.dateDepart) < debut) return false;
      if (fin   && new Date(tr.dateDepart) > fin)   return false;
      if (this.filterStatut !== '') {
        const opt = this.statusOptions.find(o => o.value === this.filterStatut);
        if (opt && tr.statut !== opt.numeric) return false;
      }
      return true;
    });
  }

  resetFiltres(): void {
    this.searchTerm = '';
    this.filterDateDebut = '';
    this.filterDateFin = '';
    this.filterStatut = '';
    this.filterTrajets();
  }

  getVilleNom(id: string): string {
    return this.villes.find(v => String(v.id) === String(id))?.nomVille || 'Inconnue';
  }
  getVehiculeImmatriculation(id: string): string {
    return this.vehicules.find(v => String(v.id) === String(id))?.immatriculation || 'Inconnue';
  }
  getChauffeurNom(id: number): string {
    const c = this.chauffeurs.find(ch => ch.id === id);
    return c ? (c.fullName || c.username) : 'Inconnu';
  }

  getStatutLabel(statut: StatutTrajet | string): string {
    if (typeof statut === 'string') {
      return this.statusOptions.find(o => o.value === statut)?.label || statut;
    }
    return this.statusOptions.find(o => o.numeric === statut)?.label || 'Inconnu';
  }

  getStatutClass(statut: number) {
    return {
      'bg-primary': statut === 0,
      'bg-warning': statut === 1,
      'bg-success': statut === 2,
      'bg-danger': statut === 3
    };
  }

  // Actions
  onView(id: string): void {
    const t = this.trajets.find(tr => tr.id === id);
    if (!t) return;
    this.editingTrajetId = id;
    this.modalMode = ModalMode.VISUALISATION;
    this.trajetForm = this.trajetToForm(t);

    // Charger les réservations du trajet
    this.loadingReservations = true;
    this.reservationService.getByTrajet(id).subscribe({
      next: reservations => {
        this.reservationsTrajet = reservations;
        this.loadingReservations = false;
        this.cd.detectChanges();
      },
      error: err => {
        console.error('Erreur chargement réservations:', err);
        this.reservationsTrajet = [];
        this.loadingReservations = false;
        this.cd.detectChanges();
      }
    });

    this.openModalCommon();
  }

  onEdit(id: string): void {
    const t = this.trajets.find(tr => tr.id === id);
    if (!t) return;
    this.editingTrajetId = id;
    this.modalMode = ModalMode.MODIFICATION;
    this.trajetForm = this.trajetToForm(t);
    this.openModalCommon();
  }

  private trajetToForm(t: Trajet): TrajetForm {
    const statutStr = this.statusOptions.find(o => o.numeric === t.statut)?.value || 'PROGRAMME';
    return {
      villeDepartId: t.villeDepart?.id ?? '',
      villeArriveeId: t.villeArrivee?.id ?? '',
      vehiculeId: t.vehicule?.id ?? '',
      distance: t.distance,
      dureeEstimee: t.dureeEstimee,
      tarif: t.tarif,
      dateDepart: t.dateDepart,
      heureDepart: t.heureDepart,
      statut: statutStr,
      chauffeurId: t.chauffeurId || 0
    };
  }

  onDelete(id: string): void {
    const t = this.trajets.find(tr => tr.id === id);
    if (!t) return;
    const dep = this.getVilleNom(t.villeDepart?.id ?? '');
    const arr = this.getVilleNom(t.villeArrivee?.id ?? '');
    if (!confirm(`Supprimer le trajet ${dep} → ${arr} du ${t.dateDepart} ?`)) return;

    this.trajetService.delete(id).subscribe({
      next: () => {
        this.trajets = this.trajets.filter(tr => tr.id !== id);
        this.filterTrajets();
        this.cd.detectChanges();
      },
      error: err => {
        console.error('Erreur suppression:', err);
        alert('Erreur lors de la suppression.');
      }
    });
  }

  openModal(): void {
    this.modalMode = ModalMode.AJOUT;
    this.editingTrajetId = null;
    this.trajetForm = this.emptyForm();
    this.openModalCommon();
  }

  private openModalCommon(): void {
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
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) this.closeModal();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.isModalOpen) this.closeModal(); }

  submitForm(): void {
    this.formError = '';
    this.formSuccess = '';
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

    if (this.modalMode === ModalMode.AJOUT) {
      this.trajetService.create(payload).subscribe({
        next: nouveau => {
          this.isSubmitting = false;
          this.formSuccess = 'Trajet enregistré avec succès !';
          this.trajets.push(nouveau);
          this.filterTrajets();
          setTimeout(() => this.closeModal(), 1200);
        },
        error: err => {
          this.isSubmitting = false;
          console.error('Erreur création:', err);
          this.formError = 'Erreur lors de l\'enregistrement.';
        }
      });
    } else {
      if (!this.editingTrajetId) return;
      this.trajetService.update(this.editingTrajetId, payload).subscribe({
        next: updated => {
          this.isSubmitting = false;
          this.formSuccess = 'Trajet modifié avec succès !';
          const idx = this.trajets.findIndex(t => t.id === this.editingTrajetId);
          if (idx !== -1) this.trajets[idx] = updated;
          this.filterTrajets();
          setTimeout(() => this.closeModal(), 1200);
        },
        error: err => {
          this.isSubmitting = false;
          console.error('Erreur modification:', err);
          this.formError = 'Erreur lors de la modification.';
        }
      });
    }
  }

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
    if (this.formErrors[field]) delete this.formErrors[field];
  }
}