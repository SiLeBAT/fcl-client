import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainDashComponent } from './main-dash/main-dash.component';
import { MainPageRoutingModule } from './main-page.routing.module';

@NgModule({
    imports: [
        CommonModule,
        MainPageRoutingModule
    ],
    declarations: [
        MainDashComponent
    ],
    exports: []
})
export class MainPageModule { }
