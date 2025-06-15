import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: true,
  imports: [FormsModule,CommonModule]
})
export class RegisterComponent {
  errorMessage: string = '';
  successMessage: string = '';
  isSubmitting: boolean = false;

  constructor(private router: Router, private http: HttpClient) {}

  onSubmit(form: any) {
    if (form.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.http.post('http://localhost:3000/api/register', form.value)
        .subscribe({
          next: (response: any) => {
            this.isSubmitting = false;
            this.successMessage = response.message;
             Swal.fire({
                         title: 'Registered Successfully!',
                         text: 'Welcome, Start your job hunt!',
                          icon: 'success',
                          confirmButtonText: 'Ok'
                      });
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000);
          },
          error: (error) => {
            this.isSubmitting = false;
            this.errorMessage = error.error.message || 'Registration failed. Please try again.';
             Swal.fire({
                          title: 'Registration Failed!',
                          text: this.errorMessage,
                          icon: 'error',
                          confirmButtonText: 'Try Again'
                        });
          }
        });
    }
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
  navigateToHome() {
    this.router.navigate(['/home']);
  }
}