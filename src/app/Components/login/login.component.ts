import { Component,ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  encapsulation:ViewEncapsulation.None,
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(loginForm: NgForm) {
    if (loginForm.valid) {
      this.authService.login(this.email, this.password).subscribe({
        next: () => {
          // Show success alert
          Swal.fire({
            title: 'Login Successful!',
            text: 'Welcome to HireHub!',
            icon: 'success',
            confirmButtonText: 'OK'
          }).then(() => {
            this.router.navigate(['/user-dashboard']);
          });
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Login failed. Please try again.';
          
          // Show error alert
          Swal.fire({
            title: 'Login Failed!',
            text: this.errorMessage,
            icon: 'error',
            confirmButtonText: 'Try Again'
          });
        },
      });
    }
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  navigateToHome() {
    this.router.navigate(['/home']);
  }
}
