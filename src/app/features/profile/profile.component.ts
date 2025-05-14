import {Component, OnInit} from '@angular/core';
import {TokenService} from '../../_services/token.service';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  currentUser: any;

  constructor(private tokenService: TokenService) { }

  ngOnInit(): void {
    this.currentUser = this.tokenService.getUser();
  }
}
