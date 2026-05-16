import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Profile } from '../../partages/models/users';

@Injectable({
  providedIn: 'root',
})
export class ProfilService {

  private baseUrl = `${environment.backendurl}/profil`;
  constructor(private http: HttpClient) {}

  getProfilByUserId(userId: number): Observable<Profile> {
    return this.http.get<Profile>(`${this.baseUrl}/${userId}`);
  }

  // updateProfil(userId: number, profil: Profile): Observable<Profile> {
  //   return this.http.put<Profile>(`${this.baseUrl}/${userId}`, profil);
  // }

  updateProfilByPublicId(publicId: string, profil: any): Observable<Profile> {
    return this.http.put<Profile>(`${this.baseUrl}/${publicId}`, profil);
  }
  
}
