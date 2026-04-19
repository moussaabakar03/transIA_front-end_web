export enum StatutTrajet {
    PROGRAMME,
    EN_COURS,
    TERMINE,
    ANNULE
}


export interface Trajet {
    id?: string;
    villeDepartId: string;
    villeArriveeId: string;
    vehiculeId: string;
    distance: number;
    dureeEstimee: string;
    tarif: number;
    dateDepart: string; 
    heureDepart: string; 
    statut: StatutTrajet;
}