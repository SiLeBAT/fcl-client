import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { SharedModule } from '../shared/shared.module';

import { SpinnerLoaderComponent } from './spinner-loader/spinner-loader.component';
import { MainDashComponent } from './main-dash/main-dash.component';
import { AlertComponent } from './alert/alert.component';
import { TokenInterceptor } from './services/token-interceptor.service';
import { JwtInterceptor } from './services/jwt-interceptor.service';

const coreModules = [
    HttpClientModule
];

const coreComponents = [
    SpinnerLoaderComponent,
    MainDashComponent,
    AlertComponent
];

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        RouterModule.forChild([]),
        FlexLayoutModule,
        ...coreModules
    ],
    exports: [
        ...coreComponents,
        ...coreModules
    ],
    declarations: [
        ...coreComponents
    ],
    providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: TokenInterceptor,
            multi: true
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: JwtInterceptor,
            multi: true
        }
    ]
})
export class CoreModule {}
