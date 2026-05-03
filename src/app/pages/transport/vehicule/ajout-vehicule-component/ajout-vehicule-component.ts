import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { VehiculeService } from '../../../../coeur/services/vehicule-service';
import { VehiculePayload } from '../../../../partages/models/vehicule';

// ← Déclaration de l'interface des erreurs (chaque champ peut avoir un message)
interface FormErrors {
  marque?: string;
  modele?: string;
  immatriculation?: string;
  capacite?: string;
  statut?: string;
}

@Component({
  selector: 'app-ajout-vehicule-component',
  standalone: false,
  templateUrl: './ajout-vehicule-component.html',
  styleUrls: ['./ajout-vehicule-component.scss'],
})
export class AjoutVehiculeComponent {
  vehiculeForm: VehiculePayload = {
    marque: '',
    modele: '',
    immatriculation: '',
    capacite: 4,
    statut: 1,
    image: ''
  };

  isSubmitting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // ✅ Propriété pour les erreurs par champ
  formErrors: FormErrors = {};

  readonly statusOptions = [
    { value: 1, label: 'Disponible', numeric: 1 },
    { value: 2, label: 'En_Service', numeric: 2 },
    { value: 3, label: 'En_maintenance', numeric: 3 },
    { value: 4, label: 'Indisponible', numeric: 4 }
  ];

  constructor(
    private vehiculeService: VehiculeService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  // ✅ Méthode appelée à chaque changement dans un champ
  onFieldChange(field: keyof FormErrors): void {
    if (this.formErrors[field]) {
      delete this.formErrors[field];
    }
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.formErrors = {};       // ✅ réinitialisation des erreurs

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

    const validationError = this.validate(payload);

    if (validationError) {
      this.errorMessage = validationError;
      return;
    }

    this.isSubmitting = true;

    this.vehiculeService.create(payload).pipe(
      finalize(() => {
        this.isSubmitting = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.successMessage = 'Véhicule ajouté avec succès.';
        this.resetForm();
        setTimeout(() => this.router.navigate(['/vehicules/liste']), 600);
      },
      error: (err) => {
        if (err.status === 400) {
          this.errorMessage = 'Les informations du véhicule sont invalides.';
        } else if (err.status === 409) {
          this.errorMessage = "Cette immatriculation existe déjà.";
        } else if (err.status === 0) {
          this.errorMessage = 'Impossible de joindre le serveur.';
        } else {
          this.errorMessage = "Une erreur est survenue lors de l'ajout du véhicule.";
        }
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/vehicules/liste']);
  }

  private validate(payload: VehiculePayload): string {
    if (!payload.marque) return 'Veuillez saisir la marque du véhicule.';
    if (!payload.modele) return 'Veuillez saisir le modèle du véhicule.';
    if (!payload.immatriculation) return "Veuillez saisir l'immatriculation.";
    if (!Number.isFinite(payload.capacite) || payload.capacite <= 0) return 'Veuillez saisir une capacité valide.';
    if (!Number.isFinite(payload.statut)) return 'Veuillez choisir un statut.';
    return '';
  }

  private resetForm(): void {
    this.vehiculeForm = {
      marque: '',
      modele: '',
      immatriculation: '',
      capacite: 4,
      statut: 1,
      image: ''
    };
  }
}