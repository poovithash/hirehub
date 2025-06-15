import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import Swal from 'sweetalert2';

interface Job {
  _id: string;
  title: string;
  description: string;
  companyName: string;
  location: string;
  salary: number;
  type: string;
  experience: string;
  status: string;
}

@Component({
  selector: 'app-edit-job',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-job.component.html',
  styleUrls: ['./edit-job.component.css']
})
export class EditJobComponent implements OnInit {
  job: Job = {
    _id: '',
    title: '',
    description: '',
    companyName: '',
    location: '',
    salary: 0,
    type: 'Full-time',
    experience: '',
    status: 'Open'
  };
  isEditing: boolean = true;
  loading: boolean = true;
  error: string = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('authToken');
    if (!token) {
      this.router.navigate(['/recruiter-login']);
      return;
    }

    const jobId = this.route.snapshot.paramMap.get('jobId');
    if (!jobId) {
      this.error = 'Invalid job ID';
      this.loading = false;
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get<Job>(`http://localhost:3000/api/jobs/${jobId}`, { headers })
      .toPromise()
      .then((job) => {
        if (job) {
          this.job = job;
        } else {
          this.error = 'Job not found';
        }
        this.loading = false;
      })
      .catch((error) => {
        console.error('Error fetching job:', error);
        this.error = error.status === 401 ? 'Unauthorized access' : 'Failed to load job details';
        this.loading = false;
        if (error.status === 401) {
          this.router.navigate(['/recruiter-login']);
        }
      });
  }

  submitJob(): void {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log('No token, navigating to login');
      this.router.navigate(['/recruiter-login']);
      return;
    }
  
    console.log('Updating job:', this.job);
  
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  
    this.http.put(`http://localhost:3000/api/jobs/${this.job._id}`, this.job, { headers })
      .pipe(
        tap((response) => {
          console.log('Job updated successfully:', response);
          Swal.fire({
            title: 'Updated Successfully!',
            icon: 'success',
            confirmButtonText: 'OK'
          });
          this.router.navigate(['/recruiter-dashboard']).then((success) => {
            console.log('Navigation to dashboard succeeded:', success);
          }).catch((err) => {
            console.error('Navigation to dashboard failed:', err);
          });
        }),
        catchError((error) => {
          console.error('Error updating job:', error);
          console.log('Error response:', error.error);
          this.error = error.error?.message
            ? error.error.message
            : error.status === 404
            ? 'Job not found or you are not authorized to edit this job.'
            : error.status === 401
            ? 'Unauthorized access. Please log in again.'
            : 'Failed to update job. Please try again later.';
          if (error.status === 401) {
            console.log('Unauthorized, navigating to login');
            Swal.fire({
              title: 'Login Failed!',
              text: this.error,
              icon: 'error',
              confirmButtonText: 'Try Again'
            });
            this.router.navigate(['/recruiter-login']);
          }
          return throwError(() => error);
        })
      )
      .subscribe();
  }

  cancel(): void {
    this.router.navigate(['/recruiter-dashboard']);
  }
}