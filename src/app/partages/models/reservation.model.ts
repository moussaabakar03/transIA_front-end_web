export enum StatutReservation {
  EN_ATTENTE = 'EN_ATTENTE',
  CONFIRMEE = 'CONFIRMEE',
  ANNULEE = 'ANNULEE',
  EXPIREE = 'EXPIREE'
}


export interface Reservation {
  id?: string;
  dateReservation: string;
  statut: StatutReservation;
  nombrePlace: number;
  trajetId: string;
  nomResponsable?: string;   
  billets?: Billet[];
}


export interface Billet {
  id?: string;
  nomPassager: string;
  statut: string;
  qrCode?: string;
}