import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const mainPageRoutes: Routes =
    [{
        path: '',
        redirectTo: 'users/login',
        pathMatch: 'full'
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
