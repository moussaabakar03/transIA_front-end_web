import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Trajet } from '../../partages/models/trajet';
import { Reservation } from '../../partages/models/reservation.model';
import { TrajetService } from '../../coeur/services/trajet-service';
import { ReservationService } from '../../coeur/services/reservation-service';

@Component({
  selector: 'app-dashboard-component',
  standalone: false,
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.scss',
})
export class DashboardComponent implements OnInit {
  // KPI
  tauxOccupation: number = 0;
  trajetsDuJour: Trajet[] = [];
  reservationsEnAttente: Reservation[] = [];
  revenuMois: number = 0;

  // Graphiques
  repartitionTrajets: { label: string; count: number; percent: number; color: string }[] = [];
  prochainsDeparts: Trajet[] = [];
  placesDisponiblesParTrajet: { [id: string]: number } = {};
  dernieresReservations: Reservation[] = [];

  // Données brutes
  trajets: Trajet[] = [];
  reservations: Reservation[] = [];

  isLoading = true;

  constructor(
    private trajetService: TrajetService,
    private reservationService: ReservationService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    forkJoin({
      trajets: this.trajetService.getAll(),
      reservations: this.reservationService.getAll()
    }).subscribe({
      next: ({ trajets, reservations }) => {
        this.trajets = trajets || [];
        this.reservations = reservations || [];
        this.calculateKPIs();
        this.calculateRepartition();
        this.calculateProchainsDeparts();
        this.calculateDernieresReservations();
        this.isLoading = false;
        this.cd.detectChanges();
      },
      error: err => {
        console.error('Erreur chargement dashboard', err);
        this.isLoading = false;
      }
    });
  }

  private calculateKPIs(): void {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Trajets du jour
    this.trajetsDuJour = this.trajets.filter(t => t.dateDepart === todayStr);

    // Réservations en attente
    this.reservationsEnAttente = this.reservations.filter(r => r.statut === 'EN_ATTENTE');

    // Taux d'occupation global (places réservées / capacité totale sur tous les trajets)
    let totalPlacesReservees = 0;
    let totalCapacite = 0;
    this.trajets.forEach(t => {
      if (t.vehicule && t.vehicule.capacite) {
        totalCapacite += t.vehicule.capacite;
        const reservTrajet = this.reservations.filter(r => r.trajetId === t.id && r.statut !== 'ANNULEE');
        reservTrajet.forEach(r => totalPlacesReservees += r.nombrePlace);
      }
    });
    this.tauxOccupation = totalCapacite > 0 ? (totalPlacesReservees / totalCapacite) * 100 : 0;

    // Revenu du mois (réservations confirmées + trajets du mois courant)
    this.revenuMois = 0;
    const reservationsConfirmées = this.reservations.filter(r => {
      if (r.statut !== 'CONFIRMEE' && r.statut !== 'EN_ATTENTE') return false; // Adapter selon votre logique métier (paiement validé)
      const dateResa = new Date(r.dateReservation);
      return dateResa.getMonth() === currentMonth && dateResa.getFullYear() === currentYear;
    });
    reservationsConfirmées.forEach(r => {
      const trajet = this.trajets.find(t => t.id === r.trajetId);
      if (trajet) {
        this.revenuMois += (trajet.tarif || 0) * r.nombrePlace;
      }
    });

    // Pour plus de précision, utilisez le PaiementService si disponible.
  }

  private calculateRepartition(): void {
    const counts = { 'Programmé': 0, 'En cours': 0, 'Terminé': 0, 'Annulé': 0 };
    this.trajets.forEach(t => {
      switch (t.statut) {
        case 0: counts['Programmé']++; break;
        case 1: counts['En cours']++; break;
        case 2: counts['Terminé']++; break;
        case 3: counts['Annulé']++; break;
      }
    });
    const total = this.trajets.length || 1;
    this.repartitionTrajets = [
      { label: 'Programmé', count: counts['Programmé'], color: '#3b82f6', percent: (counts['Programmé'] / total) * 100 },
      { label: 'En cours', count: counts['En cours'], color: '#f59e0b', percent: (counts['En cours'] / total) * 100 },
      { label: 'Terminé', count: counts['Terminé'], color: '#10b981', percent: (counts['Terminé'] / total) * 100 },
      { label: 'Annulé', count: counts['Annulé'], color: '#ef4444', percent: (counts['Annulé'] / total) * 100 }
    ];
  }

  private calculateProchainsDeparts(): void {
    const maintenant = new Date();
    // Trajets dont la dateDepart >= aujourd'hui, triés par date + heure
    this.prochainsDeparts = this.trajets
      .filter(t => {
        const [year, month, day] = t.dateDepart.split('-').map(Number);
        const dateTrajet = new Date(year, month - 1, day);
        // Ajout de l'heure pour comparaison précise
        if (t.heureDepart) {
          const [h, m] = t.heureDepart.split(':').map(Number);
          dateTrajet.setHours(h, m);
        }
        return dateTrajet >= maintenant;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.dateDepart}T${a.heureDepart || '00:00'}`);
        const dateB = new Date(`${b.dateDepart}T${b.heureDepart || '00:00'}`);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 5);

    // Récupération des places disponibles
    this.placesDisponiblesParTrajet = {};
    this.prochainsDeparts.forEach(t => {
      this.reservationService.getPlacesTrajet(t.id!).subscribe({
        next: (occupe) => {
          const capacite = t.vehicule?.capacite || 0;
          this.placesDisponiblesParTrajet[t.id!] = capacite - occupe;
        },
        error: () => {
          this.placesDisponiblesParTrajet[t.id!] = t.vehicule?.capacite || 0;
        }
      });
    });
  }

  private calculateDernieresReservations(): void {
    // 5 dernières réservations par date de création décroissante
    this.dernieresReservations = [...this.reservations]
      .sort((a, b) => new Date(b.dateReservation).getTime() - new Date(a.dateReservation).getTime())
      .slice(0, 5);
  }

  getTrajetDescription(trajetId: string): string {
    const t = this.trajets.find(tr => tr.id === trajetId);
    return t ? `${t.villeDepart?.nomVille} → ${t.villeArrivee?.nomVille}` : 'Inconnu';
  }

  getTrajet(trajetId: string): Trajet | undefined {
    return this.trajets.find(t => t.id === trajetId);
  }
}