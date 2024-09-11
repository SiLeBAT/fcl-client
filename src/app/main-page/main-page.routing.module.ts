import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {DashboardContainerComponent} from './container/dashboard-container/dashboard-container.component';
import {environment} from '../../environments/environment';
import {AuthGuard} from '../user/guards/auth.guard';

const mainPageRoutes: Routes = [
  {
    path: '',
    redirectTo: 'users/login',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    component: DashboardContainerComponent,
    canActivate: environment.serverless ? undefined : [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(mainPageRoutes)],
  exports: [RouterModule],
})
export class MainPageRoutingModule {}
