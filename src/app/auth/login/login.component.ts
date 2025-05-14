import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AuthService} from '../../_services/auth.service';
import {TokenService} from '../../_services/token.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoggedIn = false;
  isLoginFailed = false;
  errorMessage = '';
  successMessage = '';
  roles: string[] = [];
  showRoleMessage = false;
  unauthorizedRoleMessage = '';
  isNotRegistered = false;

  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private formBuilder: FormBuilder,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });

    if (this.tokenService.getToken()) {
      this.isLoggedIn = true;
      this.roles = this.tokenService.getUser().roles;
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    const { username, password } = this.loginForm.value;
    this.isNotRegistered = false;

    this.authService.login({ username, password }).subscribe({
      next: data => {
        this.tokenService.saveToken(data.token);
        this.tokenService.saveUser(data);

        this.isLoginFailed = false;
        this.isLoggedIn = true;
        this.roles = [data.role];
        this.unauthorizedRoleMessage = '';
        this.isNotRegistered = false;

        this.showRoleBasedMessage(data.role);

        if (![ 'RESPONSABLE', 'DIRECTEUR'].includes(data.role)) {
          this.tokenService.signOut();
          this.isLoggedIn = false;
          return;
        }

        setTimeout(() => {
          this.redirectBasedOnRole(data.role);
        }, 2000);
      },
      error: err => {
        if (err.status === 401) {
          this.errorMessage = 'Invalid username or password';
          this.isNotRegistered = true;
        } else if (err.status === 404) {
          this.errorMessage = 'Account not found. Please register first.';
          this.isNotRegistered = true;
        } else {
          this.errorMessage = err.error.message || 'Login failed';
        }
        this.isLoginFailed = true;
      }
    });
  }

  private showRoleBasedMessage(role: string): void {
    this.showRoleMessage = true;

    switch(role) {

      case 'RECRUTEUR':
        this.successMessage = 'Login successful as RECRUTEUR';
        break;
      case 'RESPONSABLE':
        this.successMessage = 'Login successful as RESPONSABLE';
        break;
      case 'DIRECTEUR':
        this.successMessage = 'Login successful as DIRECTEUR';
        break;
      // case 'USER':
      //   this.errorMessage = 'Sorry, you are still an USER. You should register again to benefit from this service.';
      //   this.tokenService.signOut();
      //   this.isLoginFailed = true;
      //   this.isLoggedIn = false;
      //   break;
      default:
        this.unauthorizedRoleMessage = 'Vous n\'êtes pas inscrit au programme. Vous devez d\'abord vous inscrire en tant qu\'apprenant pour profiter de ce service.';
        this.isLoginFailed = true;
    }
  }


  redirectBasedOnRole(role: string): void {
    switch (role) {
      // case 'APPRENANT':
      // case 'RECRUTEUR':
      //   this.router.navigateByUrl("/profile");
      //   break;
      case 'RESPONSABLE':
        this.router.navigate(['/profile']);
        break;
      case 'DIRECTEUR':
        this.router.navigate(['/dashboard']);
        break;
      default:
        this.router.navigate(['/home']);
    }
  }
}
