import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Billet, Reservation, StatutReservation, TypeReservation } from '../../../partages/models/reservation.model';
import { Trajet } from '../../../partages/models/trajet';
import { User } from '../../../partages/models/users';
import { ReservationService } from '../../../coeur/services/reservation-service';
import { TrajetService } from '../../../coeur/services/trajet-service';
import { UserService } from '../../../coeur/services/user-service';
import { PaiementService } from '../../../coeur/services/paiement-service';
import { ModePaiement } from '../../../partages/models/paiement';

interface ReservationFormInterface {
  userId: number | null;
  trajetId: string;
  nombrePlace: number;
  nomResponsable: string;
  nomsPassagers: string[];
  billets: Billet[];
  typeReservation: TypeReservation;
}

interface PaiementForm {
  montantVerse: number | null;
  reference: string;
  modePaiement: ModePaiement | '';
}

interface FormErrors {
  trajetId?: string;
  nombrePlace?: string;
  nomResponsable?: string;
}

interface PaiementErrors {
  montantVerse?: string;
  modePaiement?: string;
}

enum ModalMode {
  AJOUT          = 'ajout',
  MODIFICATION   = 'modification',
  VISUALISATION  = 'visualisation'
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

  // Plan de sièges
  siegesOccupes: string[] = [];
  siegesSelectionnes: string[] = [];
  capaciteVehicule: number = 0;
  siegesDisponibles: number[] = [];   


  isLoading    = true;
  errorMessage = '';
  searchTerm   = '';

  // ── Modal réservation ────────────────────────────────
  isModalOpen  = false;
  isSubmitting = false;
  formError    = '';
  formSuccess  = '';
  formErrors: FormErrors = {};
  modalMode: ModalMode   = ModalMode.AJOUT;
  editingId: string | null = null;

  saisirNomsPassagers: boolean | null = null;
  champsPassagers: string[] = [];

  form: ReservationFormInterface = this.emptyForm();

  // ── Modal paiement ───────────────────────────────────
  isPaiementModalOpen    = false;
  isPaiementSubmitting   = false;
  paiementError          = '';
  paiementSuccess        = '';
  paiementErrors: PaiementErrors = {};
  reservationEnCours: Reservation | null = null;

  paiementForm: PaiementForm = this.emptyPaiementForm();

  readonly ModePaiement = ModePaiement;

  modesPaiement = [
    { value: ModePaiement.ESPECES,      label: 'Espèces',       icon: 'la-money-bill-wave' },
    { value: ModePaiement.CARTE_BANCAIRE,        label: 'Carte bancaire', icon: 'la-credit-card'     },
    { value: ModePaiement.FLOOZ, label: 'FLOOZ',  icon: 'la-mobile-alt'      },
    { value: ModePaiement.TMONEY,     label: 'TMONEY',      icon: 'la-university'      },
  ];

  statutOptions = [
    { value: StatutReservation.EN_ATTENTE, label: 'En attente' },
    { value: StatutReservation.CONFIRMEE,  label: 'Confirmée'  },
    { value: StatutReservation.ANNULEE,    label: 'Annulée'    },
    { value: StatutReservation.EXPIREE,    label: 'Expirée'    },
  ];

  constructor(
    private reservationService: ReservationService,
    private trajetService: TrajetService,
    private userService: UserService,
    private paiementService: PaiementService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      reservations: this.reservationService.getAll(),
      trajets:      this.trajetService.getAll(),
      users:        this.userService.getChauffeurs()
    }).subscribe({
      next: results => {
        this.reservations = results.reservations || [];
        this.trajets      = results.trajets      || [];
        this.users        = results.users        || [];
        this.applyFilter();
        this.isLoading = false;
        this.cd.detectChanges();
      },
      error: err => {
        console.error(err);
        this.errorMessage = 'Erreur lors du chargement.';
        this.isLoading    = false;
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

  // Méthode appelée quand le trajet change
 // Méthode appelée quand le trajet change (à brancher sur le select)
onTrajetChange(): void {
  this.siegesSelectionnes = [];
  this.siegesOccupes = [];
  this.siegesDisponibles = [];
  if (this.form.trajetId) {
    const trajet = this.trajets.find(t => t.id === this.form.trajetId);
    if (trajet && trajet.vehicule) {
      // Générer le tableau des sièges de 1 à la capacité du véhicule
      this.siegesDisponibles = Array.from({ length: trajet.vehicule.capacite }, (_, i) => i + 1);
    }
    // Charger les sièges déjà occupés pour ce trajet
    this.reservationService.getOccupiedSeats(this.form.trajetId).subscribe({
      next: (sieges) => this.siegesOccupes = sieges,
      error: () => this.siegesOccupes = []
    });
  }
}

  // Méthode pour convertir un numéro de siège en chaîne (pour les comparaisons)
  siegeToString(num: number): string {
    return String(num);
  }

  // Sélection / désélection d'un siège
  toggleSiege(siegeNum: number): void {
    const siegeStr = this.siegeToString(siegeNum);
    if (this.siegesOccupes.includes(siegeStr)) return; // occupé

    const index = this.siegesSelectionnes.indexOf(siegeStr);
    if (index >= 0) {
      this.siegesSelectionnes.splice(index, 1);
    } else {
      if (this.siegesSelectionnes.length >= this.form.nombrePlace) {
        // Optionnel : afficher un message ou empêcher
        return;
      }
      this.siegesSelectionnes.push(siegeStr);
    }
  }

  // ── Helpers ──────────────────────────────────────────
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

  /** Calcule le montant total attendu pour la réservation en cours */
  get montantAttendu(): number {
    if (!this.reservationEnCours) return 0;
    const trajet = this.getTrajet(this.reservationEnCours.trajetId);
    return (trajet?.tarif || 0) * (this.reservationEnCours.nombrePlace || 0);
  }

  /** Calcule la monnaie à rendre */
  get monnaieARendre(): number {
    return Math.max(0, (this.paiementForm.montantVerse || 0) - this.montantAttendu);
  }

  /** True si le montant versé couvre le montant attendu */
  get montantSuffisant(): boolean {
    return (this.paiementForm.montantVerse || 0) >= this.montantAttendu;
  }

  // ── Passagers (formulaire réservation) ───────────────
  get nombrePassagersSupplementaires(): number {
    return Math.max(0, (this.form.nombrePlace || 1) - 1);
  }

  onNombrePlaceChange(): void {
    const n = this.nombrePassagersSupplementaires;
    if (this.champsPassagers.length < n) {
      while (this.champsPassagers.length < n) this.champsPassagers.push('');
    } else {
      this.champsPassagers = this.champsPassagers.slice(0, n);
    }
    if (n === 0) { this.saisirNomsPassagers = null; this.champsPassagers = []; }
    this.onFieldChange('nombrePlace');
  }

  onChoixSaisie(choix: boolean): void {
    this.saisirNomsPassagers = choix;
    if (choix) {
      const n = this.nombrePassagersSupplementaires;
      if (this.champsPassagers.length !== n) this.champsPassagers = Array(n).fill('');
    } else {
      this.champsPassagers = [];
    }
  }

  supprimerChampPassager(index: number): void { this.champsPassagers.splice(index, 1); }

  ajouterChampPassager(): void {
    if (this.champsPassagers.length < this.nombrePassagersSupplementaires)
      this.champsPassagers.push('');
  }

  // ── Actions tableau ───────────────────────────────────
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
      error: () => alert('Erreur lors de l\'annulation.')
    });
  }

  // ── Paiement ─────────────────────────────────────────
  onPayer(id: string): void {
    const r = this.reservations.find(res => res.id === id);
    if (!r) return;

    this.reservationEnCours  = r;
    this.paiementForm        = this.emptyPaiementForm();
    this.paiementError       = '';
    this.paiementSuccess     = '';
    this.paiementErrors      = {};
    this.isPaiementModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closePaiementModal(): void {
    if (this.isPaiementSubmitting) return;
    this.isPaiementModalOpen = false;
    this.reservationEnCours  = null;
    document.body.style.overflow = '';
  }

  /** Remplit automatiquement le montant exact */
  remplirMontantExact(): void {
    this.paiementForm.montantVerse = this.montantAttendu;
    if (this.paiementErrors.montantVerse) delete this.paiementErrors.montantVerse;
  }

  submitPaiement(): void {
    this.paiementError   = '';
    this.paiementSuccess = '';
    this.paiementErrors  = {};
    let hasError = false;

    if (!this.paiementForm.montantVerse || this.paiementForm.montantVerse <= 0) {
      this.paiementErrors.montantVerse = 'Le montant versé est obligatoire.';
      hasError = true;
    } else if (this.paiementForm.montantVerse < this.montantAttendu) {
      this.paiementErrors.montantVerse =
        `Montant insuffisant. Minimum requis : ${this.montantAttendu.toLocaleString()} FCFA.`;
      hasError = true;
    }

    if (!this.paiementForm.modePaiement) {
      this.paiementErrors.modePaiement = 'Le mode de paiement est obligatoire.';
      hasError = true;
    }

    if (hasError) return;

    this.isPaiementSubmitting = true;

    const payload = {
      reservationId:  { id: this.reservationEnCours?.id || '' },
      montantVerse:   this.paiementForm.montantVerse!,
      reference:      this.paiementForm.reference.trim() || this.genererReference(),
      modePaiement:   this.paiementForm.modePaiement as ModePaiement,

    };

    this.paiementService.payer(payload).subscribe({
      next: () => {
        this.isPaiementSubmitting = false;
        this.paiementSuccess = 'Paiement enregistré ! Billets confirmés.';

        // Mise à jour locale du statut
        const r = this.reservations.find(res => res.id === this.reservationEnCours!.id);
        if (r) r.statut = StatutReservation.CONFIRMEE;
        this.applyFilter();
        this.cd.detectChanges();

        setTimeout(() => this.closePaiementModal(), 2000);
      },
      error: err => {
        this.isPaiementSubmitting = false;
        this.paiementError = err.error?.message || err.error || 'Erreur lors du paiement.';
      }
    });
  }

  private genererReference(): string {
    return 'REF-' + Date.now().toString(36).toUpperCase();
  }

  // ── Formulaires ──────────────────────────────────────
  private fillFormFromReservation(r: Reservation): void {
    const autres = r.billets
      ?.map(b => b.nomPassager)
      .filter(name => name !== r.nomResponsable) || [];
    this.form = {
      userId: null, trajetId: r.trajetId, nombrePlace: r.nombrePlace,
      nomResponsable: r.nomResponsable || '', nomsPassagers: autres,
      billets: r.billets || [], typeReservation: r.typeReservation || TypeReservation.PRESENTIEL
    };
    if (autres.length > 0) {
      this.saisirNomsPassagers = true;
      this.champsPassagers = [...autres];
    } else {
      this.saisirNomsPassagers = null;
      this.champsPassagers = [];
    }
  }

  openModal(): void {
    this.modalMode = ModalMode.AJOUT;
    this.editingId = null;
    this.form = this.emptyForm();
    this.saisirNomsPassagers = null;
    this.champsPassagers = [];
    this.openModalCommon();
  }

  private openModalCommon(): void {
    this.formError = ''; this.formSuccess = ''; this.formErrors = {};
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    if (this.isSubmitting) return;
    this.isModalOpen = false;
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isPaiementModalOpen) { this.closePaiementModal(); return; }
    if (this.isModalOpen) this.closeModal();
  }

  private emptyForm(): ReservationFormInterface {
    return {
      userId: null, trajetId: '', nombrePlace: 1, nomResponsable: '',
      nomsPassagers: [], billets: [], typeReservation: TypeReservation.PRESENTIEL
    };
  }

  private emptyPaiementForm(): PaiementForm {
    return { montantVerse: null, reference: '', modePaiement: '' };
  }

  onFieldChange(field: keyof FormErrors): void {
    if (this.formErrors[field]) delete this.formErrors[field];
  }

  submitForm(): void {
    this.formError = ''; this.formSuccess = ''; this.formErrors = {};
    let hasError = false;
    if (!this.form.trajetId)             { this.formErrors.trajetId      = 'Le trajet est obligatoire.';         hasError = true; }
    if (!this.form.nombrePlace || this.form.nombrePlace < 1)
                                          { this.formErrors.nombrePlace   = 'Au moins 1 place requise.';          hasError = true; }
    if (!this.form.nomResponsable.trim()) { this.formErrors.nomResponsable = 'Le nom du responsable est requis.'; hasError = true; }
    if (hasError) return;

    let nomsPassagers: string[] = [];
    if (this.saisirNomsPassagers === true)
      nomsPassagers = this.champsPassagers.map(n => n.trim());

    this.isSubmitting = true;
    const payload = {
      userId: this.form.userId, trajetId: this.form.trajetId,
      nombrePlace: this.form.nombrePlace,
      nomResponsable: this.form.nomResponsable.trim(),
      nomsPassagers, typeReservation: TypeReservation.PRESENTIEL,
      siegesChoisis: this.siegesSelectionnes.length > 0 ? this.siegesSelectionnes : undefined
    };

    if (this.modalMode === ModalMode.AJOUT) {
      this.reservationService.create(payload).subscribe({
        next: (nouvelle) => {
          this.isSubmitting = false;
          this.formSuccess  = 'Réservation créée avec succès.';
          this.reservations.push(nouvelle);
          this.applyFilter();
          setTimeout(() => this.closeModal(), 1500);
        },
        error: err => { this.isSubmitting = false; this.formError = err.error?.message || 'Erreur.'; }
      });
    } else {
      if (!this.editingId) return;
      this.reservationService.update(this.editingId, payload).subscribe({
        next: (modifiee) => {
          this.isSubmitting = false;
          this.formSuccess  = 'Réservation modifiée.';
          const index = this.reservations.findIndex(r => r.id === this.editingId);
          if (index !== -1) this.reservations[index] = modifiee;
          this.applyFilter();
          setTimeout(() => this.closeModal(), 1500);
        },
        error: err => { this.isSubmitting = false; this.formError = err.error?.message || 'Erreur.'; }
      });
    }
  }
}