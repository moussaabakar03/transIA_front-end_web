import { Vehicule } from "./vehicule";
import { Ville } from "./ville";

export enum StatutTrajet {
    PROGRAMME,
    EN_COURS,
    TERMINE,
    ANNULE
}


export interface Trajet {
    id?: string;
    villeDepart: Ville;
    villeArrivee: Ville;
    vehicule: Vehicule;
    distance: number;
    dureeEstimee: string;
    tarif: number;
    dateDepart: string; 
    heureDepart: string; 
    statut: StatutTrajet;
}