import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { VehiculeService } from '../../../../coeur/services/vehicule-service';
import { Vehicule } from '../../../../partages/models/vehicule';

@Component({
  selector: 'app-liste-vehicule-component',
  standalone: false,
  templateUrl: './liste-vehicule-component.html',
  styleUrls: ['./liste-vehicule-component.scss']
})
export class ListeVehiculeComponent implements OnInit {
  vehicules: Vehicule[] = [];
  filteredVehicules: Vehicule[] = [];
  isLoading: boolean = true;
  searchTerm: string = '';
  errorMessage: string = '';

  constructor(
    private vehiculeService: VehiculeService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.isLoading = false;
      return;
    }

    this.loadVehicules();
  }

  loadVehicules(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.vehiculeService.getAll().pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (data) => {
        this.vehicules = data;
        this.applyFilter();
      },
      error: (err) => {
        this.errorMessage = 'Impossible de charger les vehicules. Veuillez reessayer.';
        console.error(err);
      }
    });
  }

  filterVehicules(): void {
    this.applyFilter();
  }

  private applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredVehicules = [...this.vehicules];
      return;
    }

    this.filteredVehicules = this.vehicules.filter((vehicule) =>
      String(vehicule.marque ?? '').toLowerCase().includes(term) ||
      String(vehicule.modele ?? '').toLowerCase().includes(term) ||
      String(vehicule.immatriculation ?? '').toLowerCase().includes(term)
    );
  }

  getStatusBadgeClass(status: number): string {
    switch (status) {
      case 1:
      case 2:
        return 'badge-soft-success';
      case 3:
      case 4:
        return 'badge-soft-warning';
      case 5:
      case 6:
        return 'badge-soft-danger';
      default:
        return 'badge-soft-secondary';
    }
  }

  onView(id: number): void {
    console.log('Voir le vehicule', id);
  }

  onEdit(id: number): void {
    console.log('Modifier le vehicule', id);
  }

  onDelete(id: number): void {
    if (confirm('Etes-vous sur de vouloir supprimer ce vehicule ?')) {
      console.log('Supprimer le vehicule', id);
    }
  }
}
