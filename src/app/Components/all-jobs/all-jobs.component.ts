import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-all-jobs',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
  providers: [CurrencyPipe],
  templateUrl: './all-jobs.component.html',
  styleUrls: ['./all-jobs.component.css'],
})
export class AllJobsComponent implements OnInit {
  applications: any[] = [];
  isAuthenticated: boolean = false;
  message: string = '';
  isError: boolean = false;
  private apiUrl = 'http://localhost:3000/api/applications/user';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private currencyPipe: CurrencyPipe
  ) {}

  ngOnInit(): void {
    console.log('Token:', this.authService.getToken());
    this.authService.isAuthenticated$.subscribe((status) => {
      this.isAuthenticated = status;
      if (!status) {
        this.router.navigate(['/login']);
      } else {
        this.fetchApplications();
      }
    });
  }

  fetchApplications() {
    this.message = '';
    this.isError = false;
    this.http
      .get<any[]>(this.apiUrl, {
        headers: { Authorization: `Bearer ${this.authService.getToken()}` },
      })
      .subscribe({
        next: (applications) => {
          console.log('Raw API response:', applications);
          this.applications = applications.map((app) => ({
            ...app,
            salary: this.currencyPipe.transform(app.salary, 'INR', 'symbol', '1.0-0'),
            statusEmoji: this.getStatusEmoji(app.status),
          }));
          if (applications.length === 0) {
            this.message = 'You have not applied to any jobs yet.';
            this.isError = true;
          }
        },
        error: (err) => {
          console.error('API error:', err);
          this.applications = [];
          this.message = 'Failed to fetch applications. Please try again later.';
          this.isError = true;
        },
      });
  }

  getStatusEmoji(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return '⏳';
      case 'accepted':
        return '✅';
      case 'rejected':
        return '❌';
      default:
        return 'ℹ️';
    }
  }

  navigateBack() {
    this.router.navigate(['/user-dashboard']);
  }
}