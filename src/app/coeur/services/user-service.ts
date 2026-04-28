import { Injectable } from '@angular/core';
import { User } from '../../partages/models/users';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private http: HttpClient) {}

  // Endpoint qui renvoie tous les utilisateurs ayant le rôle de chauffeur
  getChauffeurs(): Observable<User[]> {
    return this.http.get<User[]>(`${environment.backendurl}/users`);
  }
}
