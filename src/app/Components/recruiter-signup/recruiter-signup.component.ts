import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-recruiter-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './recruiter-signup.component.html',
  styleUrls: ['./recruiter-signup.component.css'],
})
export class RecruiterSignupComponent {
  email: string = '';
  password: string = '';
  companyName: string = '';
  websiteLink: string = '';
  companyDescription: string = '';
  companyLogo: File | null = null;
  phone: string = '';
  address: string = '';
  industry: string = '';
  errorMessage: string = '';
  fileError: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      const validTypes = ['image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        this.fileError = 'Please upload a PNG or JPG image';
        this.companyLogo = null;
      } else if (file.size > 2 * 1024 * 1024) {
        this.fileError = 'Image size must be less than 2MB';
        this.companyLogo = null;
      } else {
        this.fileError = '';
        this.companyLogo = file;
      }
    }
  }

  onSubmit(registerForm: NgForm) {
    if (registerForm.valid && this.companyLogo) {
      this.authService
        .recruiterRegister(
          this.email,
          this.password,
          this.companyName,
          this.websiteLink,
          this.companyDescription,
          this.companyLogo,
          this.phone,
          this.address,
          this.industry
        )
        .subscribe({
          next: () => {
            Swal.fire({
                       title: 'Registered Successfully!',
                       text: 'Welcome, Get talented employees!',
                       icon: 'success',
                       confirmButtonText: 'Ok'
                     });
            this.router.navigate(['/recruiter-login']);
          },
          error: (error) => {
            this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
             Swal.fire({
                        title: 'Registration Failed!',
                        text: this.errorMessage,
                        icon: 'error',
                        confirmButtonText: 'Try Again'
                      });
          },
        });
    } else {
      this.errorMessage = 'Please complete all required fields and upload a valid logo.';
    }
  }

  navigateToLogin() {
    this.router.navigate(['/recruiter-login']);
  }
  navigateToHome() {
    this.router.navigate(['/home']);
  }
}