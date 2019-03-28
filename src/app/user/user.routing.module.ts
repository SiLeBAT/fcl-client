
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { RecoveryComponent } from './recovery/recovery.component';
import { ResetComponent } from './reset/reset.component';
import { ActivateComponent } from './activate/activate.component';
import { AdminActivateComponent } from './admin-activate/admin-activate.component';
import { ProfileComponent } from './profile/profile.component';
import { environment } from './../../environments/environment';
import { AuthGuard } from './guards/auth.guard';

const userRoutes: Routes =
    [{
        path: 'users',
        children: [
            {
                path: 'profile',
                component: ProfileComponent,
                canActivate: environment.serverless ? null : [AuthGuard]
            },
            {
                path: 'login',
                component: LoginComponent
            },
            {
                path: 'register',
                component: RegisterComponent
            },
            {
                path: 'recovery',
                component: RecoveryComponent
            },
            {
                path: 'reset/:id',
                component: ResetComponent
            },
            {
                path: 'activate/:id',
                component: ActivateComponent
            },
            {
                path: 'adminactivate/:id',
                component: AdminActivateComponent
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
