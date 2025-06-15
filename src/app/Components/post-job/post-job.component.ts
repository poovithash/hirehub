import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-post-job',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post-job.component.html',
  styleUrls: ['./post-job.component.css']
})
export class PostJobComponent implements OnInit {
  job = {
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
  isEditing = false;
  jobId: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const token = localStorage.getItem('authToken');
    if (!token) {
      this.errorMessage = 'No authentication token found. Please log in.';
      this.router.navigate(['/recruiter-login']);
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    // Fetch company name
    this.http.get<{ companyName: string }>('http://localhost:3000/api/company', { headers, responseType: 'json' }).subscribe({
      next: (response) => {
        this.job.companyName = response.companyName;
      },
      error: (error) => {
        this.errorMessage = 'Failed to fetch company name.';
        console.error('Error fetching company name:', error);
      }
    });

    // Check if editing
    this.jobId = this.route.snapshot.paramMap.get('id');
    if (this.jobId) {
      this.isEditing = true;
      this.http.get(`http://localhost:3000/api/jobs/${this.jobId}`, { headers }).subscribe({
        next: (job: any) => {
          this.job = { ...job };
        },
        error: (error) => {
          this.errorMessage = 'Failed to fetch job details.';
          console.error('Error fetching job:', error);
        }
      });
    }
  }

  submitJob() {
    this.errorMessage = null;
    const token = localStorage.getItem('authToken');
    if (!token) {
      this.errorMessage = 'No authentication token found. Please log in.';
      this.router.navigate(['/recruiter-login']);
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const jobData = {
      title: this.job.title,
      description: this.job.description,
      companyName: this.job.companyName,
      location: this.job.location,
      salary: this.job.salary,
      type: this.job.type,
      experience: this.job.experience,
      status: this.job.status
    };

    if (this.isEditing && this.jobId) {
      this.http.put(`http://localhost:3000/api/jobs/${this.jobId}`, jobData, { headers }).subscribe({
        next: () => {
          this.router.navigate(['/recruiter-dashboard']);
        },
        error: (error) => {
          this.errorMessage = 'Failed to update job.';
          console.error('Error updating job:', error);
        }
      });
    } else {
      this.http.post('http://localhost:3000/api/jobs', jobData, { headers, responseType: 'json' }).subscribe({
        next: () => {
          this.router.navigate(['/recruiter-dashboard']);
        },
        error: (error) => {
          this.errorMessage = 'Failed to post job.';
          console.error('Error posting job:', error);
        }
      });
    }
  }

  cancel() {
    this.router.navigate(['/recruiter-dashboard']);
  }

  navigateToDashboard() {
    this.router.navigate(['/recruiter-dashboard']);
  }
}