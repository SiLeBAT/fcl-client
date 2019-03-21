
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainDashComponent } from './main-dash/main-dash.component';

const mainPageRoutes: Routes =
    [{
        path: '',
        component: MainDashComponent
    }];

@NgModule({
    imports: [
        RouterModule.forChild(mainPageRoutes)
    ],
    exports: [
        RouterModule
    ]
})

export class MainPageRoutingModule {}
