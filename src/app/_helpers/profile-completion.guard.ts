import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProfileService } from '../_services/profile.service';
import { TokenService } from '../_services/token.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileCompletionGuard implements CanActivate {
  constructor(
    private profileService: ProfileService,
    private tokenService: TokenService,
    private router: Router
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const userId = this.tokenService.getUser().id;
    return this.profileService.getProfile(userId).pipe(
      map(profile => {
        if (!profile?.completedSteps?.profile) {
          this.router.navigate(['/profile-wizard']);
          return false;
        }
        return true;
      })
    );
  }
}
