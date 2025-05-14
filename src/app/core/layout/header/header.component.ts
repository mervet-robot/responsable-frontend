import {Component, Inject, OnInit, PLATFORM_ID} from '@angular/core';
import {TokenService} from '../../../_services/token.service';
import {Router} from '@angular/router';
import {isPlatformBrowser} from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  isLoggedIn = false;
  username?: string;
  role?: string;

  constructor(private tokenService: TokenService, private router: Router,
              @Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit(): void {
    this.updateLoginStatus();
    if (isPlatformBrowser(this.platformId)) {
      // Check if user is logged in
      this.isLoggedIn = !!this.tokenService.getToken();

      // Example of other window-dependent operations
      const userAgent = window.navigator.userAgent;
      console.log('User Agent:', userAgent);    }
  }

  updateLoginStatus(): void {
    this.isLoggedIn = !!this.tokenService.getToken();
    if (this.isLoggedIn) {
      const user = this.tokenService.getUser();
      this.username = user.username;
      this.role = user.role;
    }
  }

  logout(): void {
    this.tokenService.signOut();
    this.router.navigate(['/login']).then(() => {
      window.location.reload();
    });
  }
}
