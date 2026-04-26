import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Trajet } from '../../partages/models/trajet';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class TrajetService {
  
  constructor(private http: HttpClient) {}

  getAll(): Observable<Trajet[]> {
    return this.http.get<Trajet[]>(`${environment.backendurl}/trajet`);
  }

  getTrajetById(id: string): Observable<Trajet> {
    return this.http.get<Trajet>(`${environment.backendurl}/trajet/${id}`);
  }

  create(payload: any): Observable<Trajet> {
    return this.http.post<Trajet>(`${environment.backendurl}/trajet`, payload);
  }

  update(id: string, payload: Trajet): Observable<Trajet> {
    return this.http.put<Trajet>(`${environment.backendurl}/trajet/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.backendurl}/trajet/${id}`);
  }
}
