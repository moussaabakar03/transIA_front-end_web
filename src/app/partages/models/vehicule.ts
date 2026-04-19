export interface Vehicule {
  id?: number;
  marque: string;
  modele: string;
  immatriculation: string;
  capacite: number;
  status: number;
  image: string;
}

export interface VehiculePayload {
  marque: string;
  modele: string;
  immatriculation: string;
  capacite: number;
  statut: number;
  image?: string | null;
}
