
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { RecoveryComponent } from './auth/recovery/recovery.component';
import { ResetComponent } from './auth/reset/reset.component';
import { HomeComponent } from './auth/home/home.component';
import { AuthGuard } from './auth/guards/auth.guard';
import { ActivateComponent } from './auth/activate/activate.component';
import { AdminActivateComponent } from './auth/admin-activate/admin-activate.component';
import { TracingComponent } from './tracing/tracing.component';


const routes: Routes = [
  {
    path: '',
    redirectTo: 'users/login',
    pathMatch: 'full'
  },
  {
    path: 'users/login',
    component: LoginComponent
  },
  {
    path: 'users/register',
    component: RegisterComponent
  },
  {
    path: 'users/recovery',
    component: RecoveryComponent
  },
  { path: 'users/reset/:id',
    component: ResetComponent
  },
  {
    path: 'main',
    component: HomeComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'users/activate/:id',
    component: ActivateComponent
  },
  {
    path: 'users/adminactivate/:id',
    component: AdminActivateComponent
  },
  {
    path: 'tracing',
    component: TracingComponent
  },
  // { path: '', component: AppComponent},


  // otherwise redirect to home
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  // imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule],
  providers: []
})
export class AppRoutingModule {}



