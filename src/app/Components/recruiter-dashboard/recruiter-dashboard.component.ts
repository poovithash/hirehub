import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-recruiter-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recruiter-dashboard.component.html',
  styleUrls: ['./recruiter-dashboard.component.css']
})
export class RecruiterDashboardComponent implements OnInit {
  companyName: string = '';
  jobs: any[] = [];
  loading: boolean = true;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    const token = localStorage.getItem('authToken');
    if (!token) {
      this.router.navigate(['/recruiter-login']);
      return;
    }
    
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    Promise.all([
      this.http.get<{ companyName: string }>('http://localhost:3000/api/company', { headers }).toPromise(),
      this.http.get<any[]>('http://localhost:3000/api/jobs', { headers }).toPromise()
    ])
      .then(([companyResponse, jobsResponse]) => {
        this.companyName = companyResponse?.companyName || '';
        this.jobs = jobsResponse || [];
        this.loading = false;
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        this.loading = false;
        if (error.status === 401) {
          this.router.navigate(['/recruiter-login']);
        }
      });
  }

  logout() {
    localStorage.removeItem('authToken');
    this.router.navigate(['/recruiter-login']);
  }

  postJob() {
    const token = localStorage.getItem('authToken');
    if (token) {
      this.router.navigate(['/post-job']);
    } else {
      this.router.navigate(['/recruiter-login']);
    }
  }

  editJob(jobId: string) {
    this.router.navigate([`/edit-job/${jobId}`]);
  }

  deleteJob(jobId: string) {
    if (!confirm("Do you want to delete this job")) {
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      this.router.navigate(['/recruiter-login']);
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.delete(`http://localhost:3000/api/jobs/${jobId}`, { headers })
    .subscribe({
      next: () => {
        this.jobs = this.jobs.filter(job => job._id !== jobId);
        Swal.fire('Deleted!', 'The job has been deleted.', 'success');
      },
      error: (error) => {
        console.error('Error deleting job:', error);
        Swal.fire('Error!', 'Failed to delete job. Please try again.', 'error');
      }
    });
  }

  viewApplicants(jobId: string) {
    this.router.navigate([`/view-applicants/${jobId}`]);
  }
}