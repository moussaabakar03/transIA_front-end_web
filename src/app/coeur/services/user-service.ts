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

  //  private baseUrl = `${environment.backendurl}/utilisateur`;


  // getChauffeurs(): Observable<User[]> {
  //   return this.http.get<User[]>(`${this.baseUrl}/chauffeurs`);
  // }

  // Endpoint qui renvoie tous les utilisateurs ayant le rôle de chauffeur
  getChauffeurs(): Observable<User[]> {4
    return this.http.get<User[]>(`${environment.backendurl}/utilisateur/chauffeurs`);
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${environment.backendurl}/users`);
  }

  saveUser(user: any): Observable<User> {
    return this.http.post<User>(`${environment.backendurl}/users`, user);
  }

  getAllRoles(): Observable<any[]> {
    return this.http.get<any[]>("http://localhost:8181/api/roles/list");
  }

}
