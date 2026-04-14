import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { VehiculeService } from '../../../../coeur/services/vehicule-service';
import { VehiculePayload } from '../../../../partages/models/vehicule';

@Component({
  selector: 'app-ajout-vehicule-component',
  standalone: false,
  templateUrl: './ajout-vehicule-component.html',
  styleUrl: './ajout-vehicule-component.scss',
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

  readonly statusOptions = [
    { value: 1, label: 'Disponible' },
    { value: 2, label: 'En_Service' },
    { value: 3, label: 'En_maintenance' },
    { value: 4, label: 'Indisponible' }
  ];

  constructor(
    private vehiculeService: VehiculeService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

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

    this.vehiculeService.create(payload).pipe(
      finalize(() => {
        this.isSubmitting = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.successMessage = 'Vehicule ajoute avec succes.';
        this.resetForm();
        setTimeout(() => this.router.navigate(['/vehicules/liste']), 600);
      },
      error: (err) => {
        if (err.status === 400) {
          this.errorMessage = 'Les informations du vehicule sont invalides.';
        } else if (err.status === 409) {
          this.errorMessage = "Cette immatriculation existe deja.";
        } else if (err.status === 0) {
          this.errorMessage = 'Impossible de joindre le serveur.';
        } else {
          this.errorMessage = "Une erreur est survenue lors de l'ajout du vehicule.";
        }
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/vehicules/liste']);
  }

  private buildPayload(): VehiculePayload {
    return {
      marque: this.vehiculeForm.marque.trim(),
      modele: this.vehiculeForm.modele.trim(),
      immatriculation: this.vehiculeForm.immatriculation.trim().toUpperCase(),
      capacite: Number(this.vehiculeForm.capacite),
      statut: Number(this.vehiculeForm.statut),
      image: this.vehiculeForm.image?.trim() || null
    };
  }

  private validate(payload: VehiculePayload): string {
    if (!payload.marque) {
      return 'Veuillez saisir la marque du vehicule.';
    }

    if (!payload.modele) {
      return 'Veuillez saisir le modele du vehicule.';
    }

    if (!payload.immatriculation) {
      return "Veuillez saisir l'immatriculation.";
    }

    if (!Number.isFinite(payload.capacite) || payload.capacite <= 0) {
      return 'Veuillez saisir une capacite valide.';
    }

    if (!Number.isFinite(payload.statut)) {
      return 'Veuillez choisir un statut.';
    }

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
