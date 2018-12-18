
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from './user/guards/auth.guard';
import { TracingComponent } from './tracing/tracing.component';
import { MainDashComponent } from './core/main-dash/main-dash.component';
import { environment } from './../environments/environment';

const routes: Routes = [
    {
        path: '',
        component: MainDashComponent
    },
    {
        path: 'tracing',
        component: TracingComponent,
        canActivate:  environment.serverless ? null : [AuthGuard]
    },
    // otherwise redirect to home
    { path: '**', redirectTo: '' }
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes)
    ],
    exports: [
        RouterModule
    ]
})
export class AppRoutingModule {}
