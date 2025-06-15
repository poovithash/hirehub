import { Component, OnInit,ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule],
  providers: [CurrencyPipe],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css'],
  encapsulation:ViewEncapsulation.None
})
export class UserDashboardComponent implements OnInit {
  isAuthenticated: boolean = false;
  userName: string = '';
  profilePhoto: string = '../../../assets/profile-placeholder.png';
  jobs: any[] = [];
  isSearched: boolean = false;
  message: string = '';
  isError: boolean = false;
  showModal: boolean = false;
  resumeFile: File | null = null;
  currentJobId: string | null = null;
  searchCriteria: { title: string; location: string; experience: string } = {
    title: '',
    location: '',
    experience: '',
  };
  private apiUrl = 'http://localhost:3000/api/jobs/search';

  constructor(
    private router: Router,
    private authService: AuthService,
    private location: Location,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe((status) => {
      this.isAuthenticated = status;
      if (!status) {
        this.router.navigate(['/login']);
      }
    });
    this.authService.userName$.subscribe((name) => {
      this.userName = name;
    });
  }

  navigateToJobListing() {
    this.router.navigate(['/job-listing']);
  }

  navigateToAllApplns() {
    this.router.navigate(['/all-jobs']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']).then(() => {
      this.location.replaceState('/login');
    });
  }

  searchJobs() {
    this.isSearched = true;
    this.message = '';
    this.isError = false;
    this.http.post<any[]>(this.apiUrl, this.searchCriteria).subscribe({
      next: (jobs) => {
        this.jobs = jobs;
        if (jobs.length === 0) {
          this.message = 'No jobs found for the given criteria.';
          this.isError = true;
        }
      },
      error: (err) => {
        console.error('Error fetching jobs:', err);
        this.jobs = [];
        this.message = 'Failed to fetch jobs. Please try again later.';
        this.isError = true;
      },
    });
  }

  openModal(jobId: string) {
    this.currentJobId = jobId;
    this.resumeFile = null;
    this.showModal = true;
    this.message = '';
    const fileInput = document.getElementById('resume') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  closeModal() {
    this.showModal = false;
    this.resumeFile = null;
    this.currentJobId = null;
    const fileInput = document.getElementById('resume') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  onResumeSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type !== 'application/pdf') {
        this.message = 'Only PDF files are allowed for resumes.';
        this.isError = true;
        this.resumeFile = null;
        input.value = '';
      } else {
        this.resumeFile = file;
        this.message = '';
        this.isError = false;
      }
    } else {
      this.resumeFile = null;
    }
  }

  applyJob() {
    if (!this.resumeFile) {
      this.message = 'Please upload a resume before applying.';
      this.isError = true;
      return;
    }
    if (!this.currentJobId) {
      this.message = 'No job selected. Please try again.';
      this.isError = true;
      return;
    }

    const userId = this.authService.getUserId();
    const email = this.authService.getEmail();
    const phoneNumber = this.authService.getPhoneNumber();
    const userName = this.authService.getUserName();

    if (!userId || !email || !phoneNumber || !userName) {
      this.message = 'User details are incomplete. Please log in again.';
      this.isError = true;
      this.closeModal();
      return;
    }

    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('userName', userName);
    formData.append('email', email);
    formData.append('phoneNumber', phoneNumber);
    formData.append('jobId', this.currentJobId);
    formData.append('companyName', this.jobs.find(job => job._id === this.currentJobId)?.companyName || 'Unknown');
    formData.append('resume', this.resumeFile);

    this.http.post(`http://localhost:3000/api/jobs/${this.currentJobId}/apply`, formData, {
      headers: { Authorization: `Bearer ${this.authService.getToken()}` }
    }).subscribe({
      next: () => {
        this.message = 'Application submitted successfully!';
        this.isError = false;
        this.closeModal();
      },
      error: (err) => {
        console.error('Error applying for job:', err);
        this.message = err.error?.error || 'Failed to submit application. Please try again.';
        this.isError = true;
        this.closeModal();
      },
    });
  }
}