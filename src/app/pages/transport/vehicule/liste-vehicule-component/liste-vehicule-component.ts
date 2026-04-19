// liste-vehicule-component.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { VehiculeService } from '../../../../coeur/services/vehicule-service';
import { Vehicule, VehiculePayload } from '../../../../partages/models/vehicule';

interface VehiculeForm {
  marque:         string;
  modele:         string;
  immatriculation:string;
  capacite:       number | null;
  statut:         string;
  image:          string;
}

interface FormErrors {
  marque?: string;
  modele?: string;
  immatriculation?: string;
  capacite?: string;
  statut?: string;
  image?: string;
}

enum ModalMode {
  AJOUT = 'ajout',
  MODIFICATION = 'modification'
}

@Component({
  selector: 'app-liste-vehicule-component',
  standalone: false,
  templateUrl: './liste-vehicule-component.html',
  styleUrl: './liste-vehicule-component.scss',
})
export class ListeVehiculeComponent implements OnInit {

  // ── Liste ─────────────────────────────────────────────────
  vehicules:         Vehicule[] = [];
  filteredVehicules: Vehicule[] = [];
  searchTerm  = '';
  isLoading   = true;
  errorMessage = '';

  // ── Modal ─────────────────────────────────────────────────
  isModalOpen  = false;
  isSubmitting = false;
  formError    = '';
  formSuccess  = '';
  formErrors: FormErrors = {};
  modalMode: ModalMode = ModalMode.AJOUT;
  editingVehiculeId: number | null = null;

  vehiculeForm: VehiculeForm = this.emptyForm();

  statusOptions = [
    { value: 'ACTIF',       label: 'Actif',       numeric: 1 },
    { value: 'MAINTENANCE', label: 'En maintenance', numeric: 2 },
    { value: 'INACTIF',     label: 'Inactif',     numeric: 3 },
  ];

  constructor(private vehiculeService: VehiculeService) {}

  ngOnInit(): void {
    this.loadVehicules();
  }

  // ── Chargement ────────────────────────────────────────────
  loadVehicules(): void {
    this.isLoading   = true;
    this.errorMessage = '';

    this.vehiculeService.getAll().subscribe({
      next: (data) => {
        this.filteredVehicules = data;
        this.vehicules = data;
        // Appliquer le filtre actuel ou afficher tout si pas de recherche
        this.filterVehicules();
        // console.log('Véhicules chargés:', this.vehicules);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement véhicules:', err);
        this.errorMessage = 'Impossible de charger les véhicules.';
        // this.vehicules = [];
        // this.filteredVehicules = [];
        this.isLoading = false;
      }
    });
  }

  //   loadVehicules(): void {
  //   this.isLoading   = true;
  //   this.errorMessage = '';

  //   this.vehiculeService.getAll().subscribe({
  //     next: (data) => {
  //       this.vehicules         = data;
  //       this.filteredVehicules = data;
  //       this.isLoading         = false;
  //     },
  //     error: () => {
  //       this.errorMessage = 'Impossible de charger les véhicules.';
  //       this.isLoading    = false;
  //     }
  //   });
  // }

  // ── Filtre ────────────────────────────────────────────────
  filterVehicules(): void {
    const t = this.searchTerm.toLowerCase().trim();
    if (!t) {
      this.filteredVehicules = [...this.vehicules];
    } else {
      this.filteredVehicules = this.vehicules.filter(v =>
        v.marque.toLowerCase().includes(t)           ||
        v.modele.toLowerCase().includes(t)           ||
        v.immatriculation.toLowerCase().includes(t)
      );
    }
  }


  // ── Actions tableau ───────────────────────────────────────// Actions tableau
  onView(id: number): void {
    // TODO : ouvrir modal détail ou naviguer
  }

  onEdit(id: number): void {
    const vehicule = this.vehicules.find(v => v.id === id);
    if (!vehicule) return;

    this.editingVehiculeId = id;
    this.modalMode = ModalMode.MODIFICATION;
    
    // Convertir le statut numérique en chaîne pour le formulaire
    const statutString = this.statusOptions.find(opt => opt.numeric === vehicule.status)?.value || 'ACTIF';
    
    this.vehiculeForm = {
      marque: vehicule.marque,
      modele: vehicule.modele,
      immatriculation: vehicule.immatriculation,
      capacite: vehicule.capacite,
      statut: statutString,
      image: vehicule.image || ''
    };
    
    this.formError = '';
    this.formSuccess = '';
    this.formErrors = {};
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  onDelete(id: number): void {
    const vehicule = this.vehicules.find(v => v.id === id);
    if (!vehicule) return;

    if (!confirm(`Supprimer le véhicule "${vehicule.marque} ${vehicule.modele}" (${vehicule.immatriculation}) ? Cette action est irréversible.`)) return;

    // TODO: Appeler le service de suppression quand il sera disponible
    // this.vehiculeService.delete(id).subscribe({...});
    
    // Pour l'instant, suppression locale
    this.vehicules = this.vehicules.filter(v => v.id !== id);
    this.filteredVehicules = this.filteredVehicules.filter(v => v.id !== id);
  }

  // ── Modal : ouverture / fermeture ─────────────────────────
  openModal(): void {
    this.modalMode = ModalMode.AJOUT;
    this.editingVehiculeId = null;
    this.vehiculeForm = this.emptyForm();
    this.formError    = '';
    this.formSuccess  = '';
    this.formErrors   = {};
    this.isModalOpen  = true;
    document.body.style.overflow = 'hidden'; // bloquer le scroll de la page
  }

  closeModal(): void {
    if (this.isSubmitting) return;
    this.isModalOpen = false;
    document.body.style.overflow = '';
  }

  // Fermer si clic sur l'overlay (pas sur la boîte)
  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }

  // Fermer avec Escape
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isModalOpen) this.closeModal();
  }

  // ── Soumission ────────────────────────────────────────────
  submitForm(): void {
    this.formError    = '';
    this.formSuccess  = '';
    this.formErrors   = {};

    // Validation par champ
    let hasError = false;

    if (!this.vehiculeForm.marque.trim()) {
      this.formErrors.marque = 'La marque est obligatoire.';
      hasError = true;
    }

    if (!this.vehiculeForm.modele.trim()) {
      this.formErrors.modele = 'Le modèle est obligatoire.';
      hasError = true;
    }

    if (!this.vehiculeForm.immatriculation.trim()) {
      this.formErrors.immatriculation = "L'immatriculation est obligatoire.";
      hasError = true;
    } else if (!/^[A-Z]{2}-\d{3}-[A-Z]{2}$/i.test(this.vehiculeForm.immatriculation.trim())) {
      this.formErrors.immatriculation = "Format invalide (ex: LT-245-AB).";
      hasError = true;
    }

    if (!this.vehiculeForm.capacite || this.vehiculeForm.capacite < 1) {
      this.formErrors.capacite = 'La capacité doit être supérieure à 0.';
      hasError = true;
    }

    if (hasError) return;

    this.isSubmitting = true;

    // Conversion du statut string vers nombre
    const statutOption = this.statusOptions.find(opt => opt.value === this.vehiculeForm.statut);
    const statutNumeric = statutOption ? statutOption.numeric : 1;

    const payload: VehiculePayload = {
      marque: this.vehiculeForm.marque.trim(),
      modele: this.vehiculeForm.modele.trim(),
      immatriculation: this.vehiculeForm.immatriculation.trim().toUpperCase(),
      capacite: Number(this.vehiculeForm.capacite),
      statut: statutNumeric,
      image: this.vehiculeForm.image?.trim() || null
    };

    if (this.modalMode === ModalMode.AJOUT) {
      // Création
      this.vehiculeService.create(payload).subscribe({
        next: (nouveau) => {
          this.isSubmitting = false;
          this.formSuccess  = 'Véhicule enregistré avec succès !';
          this.vehicules.push(nouveau);
          this.filteredVehicules = [...this.vehicules];
          setTimeout(() => this.closeModal(), 1200);
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Erreur création véhicule:', err);
          this.formError = "Erreur lors de l'enregistrement. Veuillez réessayer.";
        }
      });
    } else {
      // Modification
      if (!this.editingVehiculeId) return;
      
      const updatePayload = { ...payload, id: this.editingVehiculeId };
      
      // TODO: Implémenter la méthode update dans le service
      // this.vehiculeService.update(updatePayload).subscribe({
      //   next: (modifie) => {
      //     this.isSubmitting = false;
      //     this.formSuccess = 'Véhicule modifié avec succès !';
      //     
      //     // Mettre à jour le véhicule dans la liste
      //     const index = this.vehicules.findIndex(v => v.id === this.editingVehiculeId);
      //     if (index !== -1) {
      //       this.vehicules[index] = modifie;
      //       this.filteredVehicules = [...this.vehicules];
      //     }
      //     
      //     setTimeout(() => this.closeModal(), 1200);
      //   },
      //   error: (err) => {
      //     this.isSubmitting = false;
      //     console.error('Erreur modification véhicule:', err);
      //     this.formError = "Erreur lors de la modification. Veuillez réessayer.";
      //   }
      // });
      
      // Pour l'instant, simulation de modification
      const index = this.vehicules.findIndex(v => v.id === this.editingVehiculeId);
      if (index !== -1) {
        this.vehicules[index] = { 
          ...this.vehicules[index], 
          ...payload,
          image: payload.image || ''
        };
        this.filteredVehicules = [...this.vehicules];
        this.isSubmitting = false;
        this.formSuccess = 'Véhicule modifié avec succès !';
        setTimeout(() => this.closeModal(), 1200);
      }
    }
  }

  // ── Helpers ───────────────────────────────────────────────
  private emptyForm(): VehiculeForm {
    return { marque: '', modele: '', immatriculation: '', capacite: null, statut: 'ACTIF', image: '' };
  }

  // Nettoyer les erreurs d'un champ quand il est modifié
  onFieldChange(field: keyof FormErrors): void {
    if (this.formErrors[field]) {
      delete this.formErrors[field];
    }
  }
}
