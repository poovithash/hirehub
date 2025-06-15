import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule,Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

interface Job {
  _id: string;
  title: string;
  description: string;
  experience: string;
  salary: string;
  location: string;
  recruiterId: string;
  companyName: string;
  logoPath: string;
  isApplied?: boolean;
}

@Component({
  selector: 'app-job-listing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './job-listing.component.html',
  styleUrls: ['./job-listing.component.css'],
})
export class JobListingComponent implements OnInit {
  jobs: Job[] = [];
  isAuthenticated: boolean = false;
  loading: boolean = false;
  error: string = '';
  showApplyModal: boolean = false;
  selectedJobId: string = '';
  selectedJobTitle: string = ''; // New property for job title
  selectedFile: File | null = null;
  modalError: string = '';

  constructor(private http: HttpClient, private authService: AuthService,   private router: Router) {}

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe((status) => {
      this.isAuthenticated = status;
      if (status) {
        this.fetchJobs();
      }
    });
  }

  fetchJobs(): void {
    this.loading = true;
    this.error = '';
    this.http.get<Job[]>('http://localhost:3000/api/alljobs').subscribe({
      next: (jobs) => {
        this.jobs = jobs;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load jobs. Please try again later.';
        this.loading = false;
        console.error('Error fetching jobs:', err);
      },
    });
  }

  openApplyModal(jobId: string): void {
    if (!this.isAuthenticated) {
      this.error = 'Please log in to apply for jobs.';
      return;
    }
    this.selectedJobId = jobId;
    // Find the job title
    const job = this.jobs.find((j) => j._id === jobId);
    this.selectedJobTitle = job ? job.title : 'Job';
    this.showApplyModal = true;
    this.selectedFile = null;
    this.modalError = '';
  }

  closeApplyModal(): void {
    this.showApplyModal = false;
    this.selectedJobId = '';
    this.selectedJobTitle = ''; // Reset title
    this.selectedFile = null;
    this.modalError = '';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      if (this.selectedFile.type !== 'application/pdf') {
        this.modalError = 'Please upload a PDF file.';
        this.selectedFile = null;
      } else if (this.selectedFile.size > 5 * 1024 * 1024) {
        this.modalError = 'File size must be less than 5MB.';
        this.selectedFile = null;
      } else {
        this.modalError = '';
      }
    }
  }

  submitApplication(): void {
    if (!this.selectedFile || !this.selectedJobId) {
      this.modalError = 'Please select a resume.';
      return;
    }

    const token = this.authService.getToken();
    const userId = this.authService.getUserId();
    const userName = this.authService.getUserName();
    const email = this.authService.getEmail();
    const phoneNumber = this.authService.getPhoneNumber();
    const selectedJob = this.jobs.find((j) => j._id === this.selectedJobId);
    console.log(userName);
    console.log(email);
    console.log(phoneNumber);
    
    if (!userName || !email || !phoneNumber || !selectedJob) {
      this.modalError = 'Missing user or job details.';
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('userName', userName);
    formData.append('email', email);
    formData.append('phoneNumber', phoneNumber);
    formData.append('jobId', this.selectedJobId);
    formData.append('companyName', selectedJob.companyName);
    formData.append('resume', this.selectedFile);
    console.log(selectedJob.companyName)
    console.log(selectedJob)
    
    this.http
      .post(`http://localhost:3000/api/jobs/${this.selectedJobId}/apply`, formData, {
        headers,
      })
      .subscribe({
        next: () => {
          const job = this.jobs.find((j) => j._id === this.selectedJobId);
          if (job) {
            job.isApplied = true;
          }
          this.closeApplyModal();
        },
        error: (err) => {
          this.modalError = 'You have already applied for this job.';
          console.error('Error applying for job:', err);
        },
      });
  }
  navigateBack() {
    this.router.navigate(['/user-dashboard']);
  }
}