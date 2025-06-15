import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-recruiter-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './recruiter-login.component.html',
  styleUrls: ['./recruiter-login.component.css'],
})
export class RecruiterLoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(loginForm: NgForm) {
    if (loginForm.valid) {
      this.authService.recruiterLogin(this.email, this.password).subscribe({
        next: (response) => {
          console.log('Recruiter login response:', response);
          if (response && response.token) {
            localStorage.setItem('authToken', response.token);
            console.log('Token stored:', response.token);
            this.router.navigate(['/recruiter-dashboard']);
          } else {
            this.errorMessage = 'No token received from server';
            console.error('No token in response:', response);
          }
        },
        error: (error) => {
          console.error('Recruiter login error:', error);
          this.errorMessage = error.error?.message || 'Login failed. Please try again.';
        }
      });
    } else {
      this.errorMessage = 'Please fill in all required fields correctly.';
    }
  }

  navigateToRecRegister() {
    this.router.navigate(['/recruiter-signup']);
  }
  navigateToHome() {
    localStorage.removeItem('authToken');
    this.router.navigate(['/home']);
  }
}