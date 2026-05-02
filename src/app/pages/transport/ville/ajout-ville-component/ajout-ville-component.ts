import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { VilleService } from '../../../../coeur/services/ville-service';
import { Ville } from '../../../../partages/models/ville';

interface VillePayload {
  nomVille: string;
  region: string;
}

@Component({
  selector: 'app-ajout-ville-component',
  standalone: false,
  templateUrl: './ajout-ville-component.html',
  styleUrl: './ajout-ville-component.scss',
})
export class AjoutVilleComponent implements OnInit {
  villeForm: VillePayload = {
    nomVille: '',
    region: ''
  };

  regionOptions = [
    'Centre', 'Sud', 'Est', 'Ouest', 'Ennedi'
  ];

  isSubmitting: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private villeService: VilleService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Pas de données à charger pour l'ajout de ville
    this.isLoading = false;
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

    this.villeService.createVille(payload).pipe(
      finalize(() => {
        this.isSubmitting = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.successMessage = 'Ville ajoutée avec succès.';
        this.resetForm();
        setTimeout(() => this.router.navigate(['/villes/liste']), 600);
      },
      error: (err) => {
        if (err.status === 400) {
          this.errorMessage = 'Les informations de la ville sont invalides.';
        } else if (err.status === 409) {
          this.errorMessage = 'Cette ville existe déjà.';
        } else if (err.status === 0) {
          this.errorMessage = 'Impossible de joindre le serveur.';
        } else {
          this.errorMessage = 'Une erreur est survenue lors de l\'ajout de la ville.';
        }
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/villes/liste']);
  }

  private buildPayload(): VillePayload {
    return {
      nomVille: this.villeForm.nomVille.trim(),
      region: this.villeForm.region.trim()
    };
  }

  private validate(payload: VillePayload): string {
    if (!payload.nomVille) {
      return 'Le nom de la ville est obligatoire.';
    }

    if (payload.nomVille.length < 2) {
      return 'Le nom de la ville doit contenir au moins 2 caractères.';
    }

    if (!payload.region) {
      return 'La région est obligatoire.';
    }

    if (!this.regionOptions.includes(payload.region)) {
      return 'La région sélectionnée n\'est pas valide.';
    }

    return '';
  }

  private resetForm(): void {
    this.villeForm = {
      nomVille: '',
      region: ''
    };
  }
}
