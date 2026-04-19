import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Ville } from '../../partages/models/ville';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class VilleService {
  
  
  constructor(private http: HttpClient) { }
  
  getAllVilles(): Observable<Ville[]> {
    return this.http.get<Ville[]>(`${environment.backendurl}/ville`);
  }
  
  getVilleById(id: number): Observable<Ville> {
    return this.http.get<Ville>(`${environment.backendurl}/ville/${id}`);
  }

  
  createVille(ville: Ville): Observable<Ville> {
    return this.http.post<Ville>(`${environment.backendurl}/ville`, ville);
  }

  
  updateVille(ville: Ville): Observable<Ville> {
    return this.http.put<Ville>(`${environment.backendurl}/ville`, ville);
  }
  
  deleteVille(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.backendurl}/ville/${id}`);
  }
  

}
