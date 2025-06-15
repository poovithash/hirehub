import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private userNameSubject = new BehaviorSubject<string>('');
  private userIdSubject = new BehaviorSubject<string>('');
  private emailSubject = new BehaviorSubject<string>('');
  private phoneNumberSubject = new BehaviorSubject<string>('');
  private roleSubject = new BehaviorSubject<string>('');

  isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();
  userName$: Observable<string> = this.userNameSubject.asObservable();
  role$: Observable<string> = this.roleSubject.asObservable();
  email$: Observable<string> = this.emailSubject.asObservable();
  phoneNumber$: Observable<string> = this.phoneNumberSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkAuthOnInit();
  }

  login(email: string, password: string): Observable<any> {
    return this.http
      .post<{
        token: string;
        userId: string;
        name: string;
        email: string;
        phone: string;
      }>('http://localhost:3000/api/login', { email, password })
      .pipe(
        tap((response) => {
          localStorage.setItem('token', response.token);
          localStorage.setItem('userId', response.userId);
          localStorage.setItem('userName', response.name);
          localStorage.setItem('email', response.email);
          localStorage.setItem('phoneNumber', response.phone);
          localStorage.setItem('role', 'user');
          this.isAuthenticatedSubject.next(true);
          this.userIdSubject.next(response.userId);
          this.userNameSubject.next(response.name);
          this.emailSubject.next(response.email);
          this.phoneNumberSubject.next(response.phone);
          this.roleSubject.next('user');
        })
      );
  }

  recruiterLogin(email: string, password: string): Observable<any> {
    return this.http
      .post<{
        token: string;
        userId: string;
        name: string;
        email: string;
        phoneNumber: string;
      }>('http://localhost:3000/api/recruiter-login', { email, password })
      .pipe(
        tap((response) => {
          localStorage.setItem('token', response.token);
          localStorage.setItem('userId', response.userId);
          localStorage.setItem('userName', response.name);
          localStorage.setItem('email', response.email);
          localStorage.setItem('phoneNumber', response.phoneNumber);
          localStorage.setItem('role', 'recruiter');
          this.isAuthenticatedSubject.next(true);
          this.userIdSubject.next(response.userId);
          this.userNameSubject.next(response.name);
          this.emailSubject.next(response.email);
          this.phoneNumberSubject.next(response.phoneNumber);
          this.roleSubject.next('recruiter');
        })
      );
  }

  recruiterRegister(
    email: string,
    password: string,
    companyName: string,
    websiteLink: string,
    companyDescription: string,
    companyLogo: File,
    phone: string,
    address: string,
    industry: string
  ): Observable<any> {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('companyName', companyName);
    formData.append('websiteLink', websiteLink);
    formData.append('companyDescription', companyDescription);
    formData.append('companyLogo', companyLogo);
    formData.append('phone', phone);
    formData.append('address', address);
    formData.append('industry', industry);

    return this.http.post('http://localhost:3000/api/recruiter-register', formData);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('email');
    localStorage.removeItem('phoneNumber');
    localStorage.removeItem('role');
    this.isAuthenticatedSubject.next(false);
    this.userIdSubject.next('');
    this.userNameSubject.next('');
    this.emailSubject.next('');
    this.phoneNumberSubject.next('');
    this.roleSubject.next('');
  }

  checkAuthOnInit() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId') || '';
    const userName = localStorage.getItem('userName') || '';
    const email = localStorage.getItem('email') || '';
    const phoneNumber = localStorage.getItem('phoneNumber') || '';
    const role = localStorage.getItem('role') || '';
    if (token && userId && userName) {
      this.isAuthenticatedSubject.next(true);
      this.userIdSubject.next(userId);
      this.userNameSubject.next(userName);
      this.emailSubject.next(email);
      this.phoneNumberSubject.next(phoneNumber);
      this.roleSubject.next(role);
    }
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getUserId(): string {
    return this.userIdSubject.value;
  }

  getUserName(): string {
    return this.userNameSubject.value;
  }

  getEmail(): string {
    return this.emailSubject.value;
  }

  getPhoneNumber(): string {
    return this.phoneNumberSubject.value;
  }

  getRole(): string {
    return this.roleSubject.value;
  }

  getToken(): string {
    return localStorage.getItem('token') || '';
  }
}