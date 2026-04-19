import { Component, OnInit, HostListener } from '@angular/core';
import { TrajetService } from '../../../../coeur/services/trajet-service';
import { VilleService } from '../../../../coeur/services/ville-service';
import { VehiculeService } from '../../../../coeur/services/vehicule-service';
import { Trajet, StatutTrajet } from '../../../../partages/models/trajet';
import { Ville } from '../../../../partages/models/ville';
import { Vehicule } from '../../../../partages/models/vehicule';

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
}

enum ModalMode {
  AJOUT = 'ajout',
  MODIFICATION = 'modification'
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
  searchTerm = '';
  isLoading = true;
  errorMessage = '';

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
    private vehiculeService: VehiculeService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  // ── Chargement ────────────────────────────────────────────
  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Charger trajets, villes et véhicules en parallèle
    this.trajetService.getAll().subscribe({
      next: (data) => {
        this.trajets = data;
        this.filterTrajets();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement trajets:', err);
        this.errorMessage = 'Impossible de charger les trajets.';
        this.isLoading = false;
      }
    });

    this.villeService.getAllVilles().subscribe({
      next: (data) => {
        this.villes = data || [];
      },
      error: (err) => {
        console.error('Erreur chargement villes:', err);
      }
    });

    this.vehiculeService.getAll().subscribe({
      next: (data) => {
        this.vehicules = data || [];
      },
      error: (err) => {
        console.error('Erreur chargement véhicules:', err);
      }
    });
  }

  // ── Filtre ────────────────────────────────────────────────
  filterTrajets(): void {
    const t = this.searchTerm.toLowerCase().trim();
    if (!t) {
      this.filteredTrajets = [...this.trajets];
    } else {
      this.filteredTrajets = this.trajets.filter(tr => {
        const villeDep = this.villes.find(v => v.id === tr.villeDepartId)?.nomVille || '';
        const villeArr = this.villes.find(v => v.id === tr.villeArriveeId)?.nomVille || '';
        const vehicule = this.vehicules.find(v => String(v.id) === tr.vehiculeId)?.immatriculation || '';
        
        return villeDep.toLowerCase().includes(t) ||
               villeArr.toLowerCase().includes(t) ||
               vehicule.toLowerCase().includes(t) ||
               tr.distance.toString().includes(t) ||
               tr.tarif.toString().includes(t);
      });
    }
  }

  // ── Helpers pour l'affichage ──────────────────────────────
  getVilleNom(villeId: string): string {
    return this.villes.find(v => v.id === villeId)?.nomVille || 'Inconnue';
  }

  getVehiculeImmatriculation(vehiculeId: string): string {
    return this.vehicules.find(v => String(v.id) === vehiculeId)?.immatriculation || 'Inconnue';
  }

  getStatutLabel(statut: StatutTrajet): string {
    const option = this.statusOptions.find(opt => opt.numeric === statut);
    return option ? option.label : 'Inconnu';
  }

  // ── Actions tableau ───────────────────────────────────────
  onView(id: string): void {
    // TODO : ouvrir modal détail ou naviguer
  }

  onEdit(id: string): void {
    const trajet = this.trajets.find(t => t.id === id);
    if (!trajet) return;

    this.editingTrajetId = id;
    this.modalMode = ModalMode.MODIFICATION;

    const statutString = this.statusOptions.find(opt => opt.numeric === trajet.statut)?.value || 'PROGRAMME';

    this.trajetForm = {
      villeDepartId: trajet.villeDepartId,
      villeArriveeId: trajet.villeArriveeId,
      vehiculeId: trajet.vehiculeId,
      distance: trajet.distance,
      dureeEstimee: trajet.dureeEstimee,
      tarif: trajet.tarif,
      dateDepart: trajet.dateDepart,
      heureDepart: trajet.heureDepart,
      statut: statutString
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

    const villeDep = this.getVilleNom(trajet.villeDepartId);
    const villeArr = this.getVilleNom(trajet.villeArriveeId);

    if (!confirm(`Supprimer le trajet ${villeDep} → ${villeArr} du ${trajet.dateDepart} ? Cette action est irréversible.`)) return;

    this.trajets = this.trajets.filter(t => t.id !== id);
    this.filteredTrajets = this.filteredTrajets.filter(t => t.id !== id);
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

    if (hasError) return;

    this.isSubmitting = true;

    const statutOption = this.statusOptions.find(opt => opt.value === this.trajetForm.statut);
    const statutNumeric = statutOption ? statutOption.numeric : StatutTrajet.PROGRAMME;

    const payload = {
      villeDepartId: this.trajetForm.villeDepartId,
      villeArriveeId: this.trajetForm.villeArriveeId,
      vehiculeId: this.trajetForm.vehiculeId,
      distance: Number(this.trajetForm.distance),
      dureeEstimee: this.trajetForm.dureeEstimee.trim(),
      tarif: Number(this.trajetForm.tarif),
      dateDepart: this.trajetForm.dateDepart,
      heureDepart: this.trajetForm.heureDepart,
      statut: statutNumeric
    };

    if (this.modalMode === ModalMode.AJOUT) {
      this.trajetService.create(payload).subscribe({
        next: (nouveau) => {
          this.isSubmitting = false;
          this.formSuccess = 'Trajet enregistré avec succès !';
          this.trajets.push(nouveau);
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
      statut: 'PROGRAMME'
    };
  }

  onFieldChange(field: keyof FormErrors): void {
    if (this.formErrors[field]) {
      delete this.formErrors[field];
    }
  }
}
