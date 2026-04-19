import { Component, OnInit, HostListener } from '@angular/core';
import { Ville } from '../../../../partages/models/ville';
import { VilleService } from '../../../../coeur/services/ville-service';


interface VilleForm {
  nomVille: string;
  region: string;
}

interface FormErrors {
  nomVille?: string;
  region?: string;
}

enum ModalMode {
  AJOUT = 'ajout',
  MODIFICATION = 'modification'
}

@Component({
  selector: 'app-liste-ville-component',
  standalone: false,
  templateUrl: './liste-ville-component.html',
  styleUrl: './liste-ville-component.scss',
})
export class ListeVilleComponent implements OnInit {

  // Liste
  villes: Ville[] = [];
  filteredVilles: Ville[] = [];
  searchTerm = '';
  isLoading = true;
  errorMessage = '';

  // Modal
  isModalOpen = false;
  isSubmitting = false;
  formError = '';
  formSuccess = '';
  formErrors: FormErrors = {};
  modalMode: ModalMode = ModalMode.AJOUT;
  editingVilleId: string | null = null;

  villeForm: VilleForm = this.emptyForm();

  regionOptions = [
    'Centre', 'Sud', 'Est', 'Ouest', 'Ennedi'
  ];

  constructor(private villeService: VilleService) {}

  ngOnInit(): void {
    this.loadVilles();
  }

  // Chargement
  loadVilles(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.villeService.getAllVilles().subscribe({
      next: (data) => {
        this.villes = data || [];
        this.filterVilles();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement villes:', err);
        this.errorMessage = 'Impossible de charger les villes.';
        this.villes = [];
        this.filteredVilles = [];
        this.isLoading = false;
      }
    });
  }

  // Filtre
  filterVilles(): void {
    const t = this.searchTerm.toLowerCase().trim();
    if (!t) {
      this.filteredVilles = [...this.villes];
    } else {
      this.filteredVilles = this.villes.filter(v =>
        v.nomVille.toLowerCase().includes(t) ||
        v.region.toLowerCase().includes(t)
      );
    }
  }

  // Actions tableau
  onView(id: string): void {
    // TODO : ouvrir modal détail ou naviguer
  }

  onEdit(id: string): void {
    const ville = this.villes.find(v => v.id === id);
    if (!ville) return;

    this.editingVilleId = id;
    this.modalMode = ModalMode.MODIFICATION;
    this.villeForm = {
      nomVille: ville.nomVille,
      region: ville.region
    };
    this.formError = '';
    this.formSuccess = '';
    this.formErrors = {};
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  onDelete(id: string): void {
    const ville = this.villes.find(v => v.id === id);
    if (!ville) return;

    if (!confirm(`Supprimer la ville "${ville.nomVille}" ? Cette action est irréversible.`)) return;

    // Convertir l'ID en number si nécessaire
    const villeId = id;
    
    this.villeService.deleteVille(villeId).subscribe({
      next: () => {
        this.villes = this.villes.filter(v => v.id !== id);
        this.filteredVilles = this.filteredVilles.filter(v => v.id !== id);
        // Optionnel: afficher un message de succès
      },
      error: (err) => {
        console.error('Erreur suppression ville:', err);
        // alert('Erreur lors de la suppression de la ville.');
      }
    });
  }

  // Modal : ouverture / fermeture
  openModal(): void {
    this.modalMode = ModalMode.AJOUT;
    this.editingVilleId = null;
    this.villeForm = this.emptyForm();
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

  // Fermer si clic sur l'overlay
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

  // Soumission
  submitForm(): void {
    this.formError = '';
    this.formSuccess = '';
    this.formErrors = {};

    // Validation par champ
    let hasError = false;

    if (!this.villeForm.nomVille.trim()) {
      this.formErrors.nomVille = 'Le nom de la ville est obligatoire.';
      hasError = true;
    }

    if (!this.villeForm.region.trim()) {
      this.formErrors.region = 'La région est obligatoire.';
      hasError = true;
    }

    if (hasError) return;

    this.isSubmitting = true;

    const payload = {
      nomVille: this.villeForm.nomVille.trim(),
      region: this.villeForm.region.trim()
    };

    if (this.modalMode === ModalMode.AJOUT) {
      // Création
      this.villeService.createVille(payload).subscribe({
        next: (nouvelle) => {
          this.isSubmitting = false;
          this.formSuccess = 'Ville enregistrée avec succès !';
          this.villes.push(nouvelle);
          this.filteredVilles = [...this.villes];
          setTimeout(() => this.closeModal(), 1200);
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Erreur création ville:', err);
          this.formError = "Erreur lors de l'enregistrement. Veuillez réessayer.";
        }
      });
    } else {
      // Modification
      if (!this.editingVilleId) return;
      
      const updatePayload = { ...payload, id: this.editingVilleId };
      
      this.villeService.updateVille(updatePayload).subscribe({
        next: (modifiee) => {
          this.isSubmitting = false;
          this.formSuccess = 'Ville modifiée avec succès !';
          
          // Mettre à jour la ville dans la liste
          const index = this.villes.findIndex(v => v.id === this.editingVilleId);
          if (index !== -1) {
            this.villes[index] = modifiee;
            this.filteredVilles = [...this.villes];
          }
          
          setTimeout(() => this.closeModal(), 1200);
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Erreur modification ville:', err);
          this.formError = "Erreur lors de la modification. Veuillez réessayer.";
        }
      });
    }
  }

  // Helpers
  private emptyForm(): VilleForm {
    return { nomVille: '', region: '' };
  }

  // Nettoyer les erreurs d'un champ quand il est modifié
  onFieldChange(field: keyof FormErrors): void {
    if (this.formErrors[field]) {
      delete this.formErrors[field];
    }
  }
}
