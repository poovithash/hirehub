import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-view-applicants',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './view-applicants.component.html',
  styleUrls: ['./view-applicants.component.css']
})
export class ViewApplicantsComponent implements OnInit {
  jobId: string = '';
  applicants: any[] = [];
  loading: boolean = true;
  error: string = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const token = localStorage.getItem('authToken');
    if (!token) {
      this.router.navigate(['/recruiter-login']);
      return;
    }
  
    this.jobId = this.route.snapshot.paramMap.get('jobId') || '';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  
    this.http
      .get<any[]>(`http://localhost:3000/api/jobs/${this.jobId}/applicants`, { headers })
      .subscribe({
        next: (response) => {
          console.log('API response for applicants:', response); // Debug log
          this.applicants = response || [];
          console.log('Applicants loaded:', this.applicants); // Debug log
          this.loading = false;
        },
        error: (error) => {
          console.error('Error fetching applicants:', error);
          this.error = 'Failed to load applicants.';
          this.loading = false;
          if (error.status === 401) {
            this.router.navigate(['/recruiter-login']);
          }
        },
      });
  }

  viewResume(resumeUrl: string) {
    const fullUrl = `http://localhost:3000/${resumeUrl}`;
    window.open(fullUrl, '_blank');
  }

  updateStatus(applicantId: string, status: string) {
    const token = localStorage.getItem('authToken');
    if (!token) {
      this.router.navigate(['/recruiter-login']);
      return;
    }
  
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  
    this.http
      .put(
        `http://localhost:3000/api/jobs/${this.jobId}/applicants/${applicantId}/status`,
        { status },
        { headers }
      )
      .subscribe({
        next: (response: any) => {
          const applicant = this.applicants.find((app) => app._id === applicantId);
          if (applicant) {
            applicant.status = response.application.status;
          }
  
          if (response.application.status === 'accepted') {
            this.sendEmailNotification(response.application.email, response.application.userName);
          }
        },
        error: (error) => {
          console.error('Error updating status:', error);
          const errorMessage =
            error.error?.message || 'Failed to update status. Please try again.';
          alert(errorMessage);
        },
        complete: () => {
          console.log('Status update request completed.');
        },
      });
  }
  
  sendEmailNotification(email: string, name: string) {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.post(`http://localhost:3000/api/send-email`, {
      to: email,
      subject: 'Application Status Update',
      body: `Dear ${name},\n\nCongratulations! Your resume has been shortlisted for the job you applied for. We will contact you soon with further details.\n\nBest regards,\nRecruitment Team`
    }, { headers })
      .toPromise()
      .then(() => {
       
      })
      .catch(error => {
        console.error('Error sending email:', error);
        
      });
  }

  backToDashboard() {
    this.router.navigate(['/recruiter-dashboard']);
  }
}