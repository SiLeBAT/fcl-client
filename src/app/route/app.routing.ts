import { Routes, RouterModule } from '@angular/router';

// import { HomeComponent } from '../auth/home/home.component';
import { LoginComponent } from '../auth/login/login.component';
// import { RegisterComponent } from '../auth/register/register.component';
// import { RecoveryComponent } from '../auth/recovery/recovery.component';
// import { ResetComponent } from '../auth/reset/reset.component';
// import { ActivateComponent } from '../auth/activate/activate.component';
// import { AuthGuard } from '../auth/guards/auth.guard';
// import { UploadComponent } from '../upload/upload.component';
// import { MainDashComponent } from '../main-dash/main-dash.component';
// import { MyaccountComponent } from '../myaccount/myaccount.component';
// import { UserdataComponent } from '../myaccount/userdata/userdata.component';
// import { ValidatorComponent } from '../validator/validator.component';
// import { AdminActivateComponent } from '../auth/admin-activate/admin-activate.component';
import { AppComponent } from '../app.component';
// import { CanDeactivateGuard } from '../can-deactivate/can-deactivate.guard';

const appRoutes: Routes = [
  { path: '', component: LoginComponent},
  // { path: '', component: AppComponent},
  // { path: 'main', component: HomeComponent, canActivate: [AuthGuard] },
  // { path: 'upload', component: UploadComponent},
  // { path: 'validate', component: ValidatorComponent, canDeactivate: [CanDeactivateGuard] },
  // { path: 'myaccount', component: MyaccountComponent, canActivate: [AuthGuard] },
  // { path: 'userdata', component: UserdataComponent, canActivate: [AuthGuard] },
  // { path: 'userdata/:index', component: UserdataComponent, canActivate: [AuthGuard] },
  // { path: 'users/login', component: LoginComponent },
  // { path: 'users/register', component: RegisterComponent },
  // { path: 'users/recovery', component: RecoveryComponent },
  // { path: 'users/reset/:id', component: ResetComponent },
  // { path: 'users/activate/:id', component: ActivateComponent },
  // { path: 'users/adminactivate/:id', component: AdminActivateComponent },

  // otherwise redirect to home
  { path: '**', redirectTo: '' }
];

export const routing = RouterModule.forRoot(appRoutes, {useHash: true});
// export const routing = RouterModule.forRoot(appRoutes);



