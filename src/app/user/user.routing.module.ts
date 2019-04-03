
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginViewComponent } from './presentation/login-view/login-view.component';
import { RegisterViewComponent } from './presentation/register-view/register-view.component';
import { RecoveryViewComponent } from './presentation/recovery-view/recovery-view.component';
import { ResetViewComponent } from './presentation/reset-view/reset-view.component';
import { ActivateViewComponent } from './presentation/activate-view/activate-view.component';
import { AdminActivateViewComponent } from './presentation/admin-activate-view/admin-activate-view.component';
import { ProfileContainerComponent } from './container/profile-container/profile-container.component';
import { environment } from './../../environments/environment';
import { AuthGuard } from './guards/auth.guard';

const userRoutes: Routes =
    [{
        path: 'users',
        children: [
            {
                path: 'profile',
                component: ProfileContainerComponent,
                canActivate: environment.serverless ? null : [AuthGuard]
            },
            {
                path: 'login',
                component: LoginViewComponent
            },
            {
                path: 'register',
                component: RegisterViewComponent
            },
            {
                path: 'recovery',
                component: RecoveryViewComponent
            },
            {
                path: 'reset/:id',
                component: ResetViewComponent
            },
            {
                path: 'activate/:id',
                component: ActivateViewComponent
            },
            {
                path: 'adminactivate/:id',
                component: AdminActivateViewComponent
            }
        ]
    }];

@NgModule({
    imports: [
        RouterModule.forChild(userRoutes)
    ],
    exports: [
        RouterModule
    ]
})
export class UserRoutingModule {}
