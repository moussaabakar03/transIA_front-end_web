import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Vehicule, VehiculePayload } from '../../partages/models/vehicule';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class VehiculeService {
  
  constructor(private http: HttpClient){}

  getAll(): Observable<Vehicule[]>{
    return this.http.get<Vehicule[]>(`${environment.backendurl}/vehicule`);
  }

  create(payload: VehiculePayload): Observable<Vehicule> {
    return this.http.post<Vehicule>(`${environment.backendurl}/vehicule`, payload);
  }

  update(id: string, payload: VehiculePayload): Observable<Vehicule> {
    return this.http.put<Vehicule>(`${environment.backendurl}/vehicule/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.backendurl}/vehicule/${id}`);
  }

  getById(id: string): Observable<Vehicule> {
    return this.http.get<Vehicule>(`${environment.backendurl}/vehicule/${id}`);
  }

  getDisponibles(): Observable<Vehicule[]> {
    return this.http.get<Vehicule[]>(`${environment.backendurl}/vehicule/disponible`);
  }
    
}
