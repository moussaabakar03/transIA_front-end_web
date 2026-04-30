import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Billet, Reservation, StatutReservation } from '../../../partages/models/reservation.model';
import { Trajet } from '../../../partages/models/trajet';
import { User } from '../../../partages/models/users';
import { ReservationService } from '../../../coeur/services/reservation-service';
import { TrajetService } from '../../../coeur/services/trajet-service';
import { UserService } from '../../../coeur/services/user-service';

interface ReservationFormInterface {
  userId: number | null;
  trajetId: string;
  nombrePlace: number;
  nomResponsable: string;
  nomsPassagers: string[];   // stocké comme une chaîne séparée par des virgules dans le formulaire
  passagersText: string;     // pour l'édition facile
}

interface FormErrors {
  trajetId?: string;
  nombrePlace?: string;
  nomResponsable?: string;
}

enum ModalMode {
  AJOUT = 'ajout',
  MODIFICATION = 'modification',
  VISUALISATION = 'visualisation'
}

@Component({
  selector: 'app-liste-reservation-component',
  standalone: false,
  templateUrl: './liste-reservation-component.html',
  styleUrl: './liste-reservation-component.scss',
})
export class ListeReservationComponent implements OnInit {
  reservations: Reservation[] = [];
  filteredReservations: Reservation[] = [];
  trajets: Trajet[] = [];
  users: User[] = [];

  isLoading = true;
  errorMessage = '';

  searchTerm = '';

  isModalOpen = false;
  isSubmitting = false;
  formError = '';
  formSuccess = '';
  formErrors: FormErrors = {};

  modalMode: ModalMode = ModalMode.AJOUT;
  editingId: string | null = null;

  form: ReservationFormInterface = this.emptyForm();

  statutOptions = [
    { value: StatutReservation.EN_ATTENTE, label: 'En attente' },
    { value: StatutReservation.CONFIRMEE, label: 'Confirmée' },
    { value: StatutReservation.ANNULEE, label: 'Annulée' },
    { value: StatutReservation.EXPIREE, label: 'Expirée' },
  ];

  constructor(
    private reservationService: ReservationService,
    private trajetService: TrajetService,
    private userService: UserService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      reservations: this.reservationService.getAll(),
      trajets: this.trajetService.getAll(),
      users: this.userService.getChauffeurs()
    }).subscribe({
      next: results => {
        this.reservations = results.reservations || [];
        this.trajets = results.trajets || [];
        this.users = results.users || [];
        this.applyFilter();
        this.isLoading = false;
        this.cd.detectChanges();
      },
      error: err => {
        console.error(err);
        this.errorMessage = 'Erreur lors du chargement.';
        this.isLoading = false;
      }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredReservations = this.reservations.filter(r => {
      const trajet = this.getTrajet(r.trajetId);
      return !term ||
        trajet?.villeDepart?.nomVille?.toLowerCase().includes(term) ||
        trajet?.villeArrivee?.nomVille?.toLowerCase().includes(term) ||
        r.nomResponsable?.toLowerCase().includes(term);
    });
  }

  getNomResponsable(billets: Billet[] | undefined): string {
    if (!billets || billets.length === 0) return '—';
    const responsable = billets.find(b => b.statut === 'RESPONSABLE');
    return responsable ? responsable.nomPassager : billets[0].nomPassager;
  }

  getTrajet(trajetId: string): Trajet | undefined {
    return this.trajets.find(t => t.id === trajetId);
  }

  getTrajetDescription(trajetId: string): string {
    const t = this.getTrajet(trajetId);
    return t ? `${t.villeDepart?.nomVille} → ${t.villeArrivee?.nomVille}` : 'Inconnu';
  }

  getStatutLabel(statut: string): string {
    return this.statutOptions.find(o => o.value === statut)?.label || statut;
  }

  // Actions
  onView(id: string): void {
    const r = this.reservations.find(res => res.id === id);
    if (!r) return;
    this.editingId = id;
    this.modalMode = ModalMode.VISUALISATION;
    this.fillFormFromReservation(r);
    this.openModalCommon();
  }

  onEdit(id: string): void {
    const r = this.reservations.find(res => res.id === id);
    if (!r || r.statut !== StatutReservation.EN_ATTENTE) {
      alert('Seules les réservations en attente peuvent être modifiées.');
      return;
    }
    this.editingId = id;
    this.modalMode = ModalMode.MODIFICATION;
    this.fillFormFromReservation(r);
    this.openModalCommon();
  }

  onAnnuler(id: string): void {
    if (!confirm('Annuler cette réservation ?')) return;
    this.reservationService.annuler(id).subscribe({
      next: () => {
        const r = this.reservations.find(res => res.id === id);
        if (r) r.statut = StatutReservation.ANNULEE;
        this.applyFilter();
        this.cd.detectChanges();
      },
      error: err => alert('Erreur lors de l\'annulation.')
    });
  }

  private fillFormFromReservation(r: Reservation): void {
    this.form = {
      userId: null,  // pas stocké dans la réponse actuelle, à voir selon le besoin
      trajetId: r.trajetId,
      nombrePlace: r.nombrePlace,
      nomResponsable: r.nomResponsable || '',
      nomsPassagers: r.billets?.map(b => b.nomPassager).filter(name => name !== r.nomResponsable) || [],
      passagersText: r.billets?.map(b => b.nomPassager).filter(name => name !== r.nomResponsable).join(', ') || ''
    };
  }

  openModal(): void {
    this.modalMode = ModalMode.AJOUT;
    this.editingId = null;
    this.form = this.emptyForm();
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

  private emptyForm(): ReservationFormInterface {
    return {
      userId: null,
      trajetId: '',
      nombrePlace: 1,
      nomResponsable: '',
      nomsPassagers: [],
      passagersText: ''
    };
  }

  onFieldChange(field: keyof FormErrors): void {
    if (this.formErrors[field]) delete this.formErrors[field];
  }

  submitForm(): void {
    this.formError = '';
    this.formSuccess = '';
    this.formErrors = {};
    let hasError = false;

    if (!this.form.trajetId) { this.formErrors.trajetId = 'Obligatoire'; hasError = true; }
    if (!this.form.nombrePlace || this.form.nombrePlace < 1) { this.formErrors.nombrePlace = '≥ 1'; hasError = true; }
    if (!this.form.nomResponsable.trim()) { this.formErrors.nomResponsable = 'Obligatoire'; hasError = true; }

    // Construire la liste des passagers à partir du texte
    const nomsPassagersArray = this.form.passagersText
      .split(',')
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (this.form.nombrePlace !== (1 + nomsPassagersArray.length)) {
      this.formErrors.nombrePlace = `Le nombre de passagers saisis (${1 + nomsPassagersArray.length}) ne correspond pas au nombre de places (${this.form.nombrePlace})`;
      hasError = true;
    }

    if (hasError) return;

    this.isSubmitting = true;

    const payload = {
      userId: this.form.userId,
      trajetId: this.form.trajetId,
      nombrePlace: this.form.nombrePlace,
      nomResponsable: this.form.nomResponsable.trim(),
      nomsPassagers: nomsPassagersArray
    };

    if (this.modalMode === ModalMode.AJOUT) {
      this.reservationService.create(payload).subscribe({
        next: (nouvelle) => {
          this.isSubmitting = false;
          this.formSuccess = 'Réservation créée avec succès.';
          this.reservations.push(nouvelle);
          this.applyFilter();
          setTimeout(() => this.closeModal(), 1500);
        },
        error: err => {
          this.isSubmitting = false;
          this.formError = err.error?.message || 'Erreur lors de la création.';
        }
      });
    } else {
      if (!this.editingId) return;
      this.reservationService.update(this.editingId, payload).subscribe({
        next: (modifiee) => {
          this.isSubmitting = false;
          this.formSuccess = 'Réservation modifiée.';
          const index = this.reservations.findIndex(r => r.id === this.editingId);
          if (index !== -1) this.reservations[index] = modifiee;
          this.applyFilter();
          setTimeout(() => this.closeModal(), 1500);
        },
        error: err => {
          this.isSubmitting = false;
          this.formError = err.error?.message || 'Erreur lors de la modification.';
        }
      });
    }
  }
}