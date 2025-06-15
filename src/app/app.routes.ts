import { Routes } from '@angular/router';
import { HomeComponent } from './Components/home/home.component';
import { RegisterComponent } from './Components/register/register.component';
import { LoginComponent } from './Components/login/login.component';
import { RecruiterLoginComponent } from './Components/recruiter-login/recruiter-login.component';
import { RecruiterSignupComponent } from './Components/recruiter-signup/recruiter-signup.component';
import { PostJobComponent } from './Components/post-job/post-job.component';
import { RecruiterDashboardComponent } from './Components/recruiter-dashboard/recruiter-dashboard.component';
import { EditJobComponent } from './Components/edit-job/edit-job.component';
import { JobListingComponent } from './Components/job-listing/job-listing.component';
import { UserDashboardComponent } from './Components/user-dashboard/user-dashboard.component';
import { AllJobsComponent } from './Components/all-jobs/all-jobs.component';
import { ViewApplicantsComponent } from './Components/view-applicants/view-applicants.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {path: 'home', component: HomeComponent},
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent }, 
  { path: 'recruiter-login', component: RecruiterLoginComponent },
  { path: 'recruiter-signup', component: RecruiterSignupComponent },
  { path: 'post-job', component: PostJobComponent },
  { path: 'edit-job/:jobId', component: EditJobComponent },
  { path: 'recruiter-dashboard', component: RecruiterDashboardComponent},
  { path: 'job-listing', component: JobListingComponent},
  { path: 'user-dashboard', component: UserDashboardComponent},
  { path: 'all-jobs', component: AllJobsComponent},
  { path: 'view-applicants', component: ViewApplicantsComponent},
  { path: 'view-applicants/:jobId', component: ViewApplicantsComponent },

];