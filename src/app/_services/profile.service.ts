
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProfileUpdateRequest } from '../_models/profile';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiBaseUrl = 'http://localhost:8081'; // Base API URL
  private apiUrl = `${this.apiBaseUrl}/api/profiles`; // Full profiles endpoint

  constructor(private http: HttpClient) { }

  getProfile(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${userId}`);
  }

  updateProfile(userId: number, profileUpdateRequest: ProfileUpdateRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/${userId}`, profileUpdateRequest);
  }

  uploadProfilePicture(userId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/${userId}/picture`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  getFullImageUrl(relativePath: string | null | undefined): string {
    if (!relativePath) {
      return 'assets/default-avatar.png';
    }

    // If already absolute URL
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }

    // Handle cases where backend might return full URL or relative path
    if (relativePath.startsWith(this.apiBaseUrl)) {
      return relativePath;
    }

    // For relative paths from backend
    return `${this.apiBaseUrl}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
  }


  checkBioCorrection(bio: string): Observable<string> {
    return this.http.post(`${this.apiUrl}/bio-check`, { bio }, { responseType: 'text' });
  }




}
