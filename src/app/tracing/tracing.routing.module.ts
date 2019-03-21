
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from './../user/guards/auth.guard';
import { TracingComponent } from './tracing/tracing.component';
import { environment } from './../../environments/environment';

const tracingRoutes: Routes = [
    {
        path: 'tracing',
        component: TracingComponent,
        canActivate:  environment.serverless ? null : [AuthGuard]
    }
];

@NgModule({
    imports: [
        RouterModule.forChild(tracingRoutes)
    ],
    exports: [
        RouterModule
    ]
})
export class TracingRoutingModule {}
