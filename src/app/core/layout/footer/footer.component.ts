import {Component, Inject, OnInit, PLATFORM_ID} from '@angular/core';
import {TokenService} from '../../../_services/token.service';
import {isPlatformBrowser} from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: false,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent implements OnInit {
  isLoggedIn = false;

  constructor(private tokenService: TokenService,
              @Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit(): void {
    this.updateLoginStatus();
  }

  updateLoginStatus(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isLoggedIn = !!this.tokenService.getToken();
    }
  }
}
