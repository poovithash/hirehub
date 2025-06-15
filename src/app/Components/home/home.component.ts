import { Component, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule],
  providers: [CurrencyPipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, AfterViewInit {
  jobs: any[] = [];
  errorMessage: string = '';
  isSearched: boolean = false;
  showAboutUsPopup: boolean = false;
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
    // No authentication subscriptions needed
  }

  ngAfterViewInit() {
    this.animateQuote();
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  navigateToRecLogin() {
    this.router.navigate(['/recruiter-login']);
  }

  searchJobs() {
    this.isSearched = true;
    this.errorMessage = '';
    this.http.post<any[]>(this.apiUrl, this.searchCriteria).subscribe({
      next: (jobs) => {
        this.jobs = jobs;
        if (jobs.length === 0) {
          this.errorMessage = 'No jobs found for the given criteria.';
        }
      },
      error: (err) => {
        console.error('Error fetching jobs:', err);
        this.jobs = [];
        this.errorMessage = 'Failed to fetch jobs. Please try again later.';
      },
    });
  }

  openAboutUsPopup() {
    this.showAboutUsPopup = true;
  }

  closeAboutUsPopup(event?: Event) {
    if (event && (event.target as HTMLElement).classList.contains('modal-content')) {
      return;
    }
    this.showAboutUsPopup = false;
  }

  private animateQuote() {
    const spans = document.querySelectorAll('.quote span');
    const cursor = document.querySelector('.cursor');
    const typeSpeed = 50;
    const pauseDuration = 300;
    const totalLetters = spans.length;

    const animate = async () => {
      for (let i = 0; i < totalLetters; i++) {
        (spans[i] as HTMLElement).classList.add('visible');
        const spanRect = (spans[i] as HTMLElement).getBoundingClientRect();
        const quoteRect = document.querySelector('.quote')!.getBoundingClientRect();
        (cursor as HTMLElement).style.left = `${spanRect.right - quoteRect.left}px`;
        (cursor as HTMLElement).style.top = `${spanRect.top - quoteRect.top + spanRect.height / 2}px`;
        await new Promise(resolve => setTimeout(resolve, typeSpeed));
      }

      await new Promise(resolve => setTimeout(resolve, pauseDuration));

      for (let i = totalLetters - 1; i >= 0; i--) {
        (spans[i] as HTMLElement).classList.remove('visible');
        if (i > 0) {
          const spanRect = (spans[i - 1] as HTMLElement).getBoundingClientRect();
          const quoteRect = document.querySelector('.quote')!.getBoundingClientRect();
          (cursor as HTMLElement).style.left = `${spanRect.right - quoteRect.left}px`;
          (cursor as HTMLElement).style.top = `${spanRect.top - quoteRect.top + spanRect.height / 2}px`;
        } else {
          (cursor as HTMLElement).style.left = '0px';
          (cursor as HTMLElement).style.top = `${(spans[0] as HTMLElement).getBoundingClientRect().top - document.querySelector('.quote')!.getBoundingClientRect().top + (spans[0] as HTMLElement).getBoundingClientRect().height / 2}px`;
        }
        await new Promise(resolve => setTimeout(resolve, typeSpeed));
      }

      await new Promise(resolve => setTimeout(resolve, pauseDuration));

      animate();
    };

    const firstSpanRect = (spans[0] as HTMLElement).getBoundingClientRect();
    const quoteRect = document.querySelector('.quote')!.getBoundingClientRect();
    (cursor as HTMLElement).style.left = '0px';
    (cursor as HTMLElement).style.top = `${firstSpanRect.top - quoteRect.top + firstSpanRect.height / 2}px`;
    animate();
  }
}