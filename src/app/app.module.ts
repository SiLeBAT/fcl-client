import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app.routing.module';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { EffectsModule } from '@ngrx/effects';

import { ScrollbarHelper } from '@swimlane/ngx-datatable/release/services/scrollbar-helper.service';

import { UserModule } from './user/user.module';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { GraphEditorModule } from './graph-editor/graph-editor.module';
import { TracingModule } from './tracing/tracing.module';

import { AppComponent } from './app.component';
import { environment } from '../environments/environment';
import { MainPageModule } from './main-page/main-page.module';

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        GraphEditorModule,
        TracingModule,
        FlexLayoutModule,
        MainPageModule,
        UserModule,
        CoreModule,
        SharedModule,
        StoreModule.forRoot({}),
        EffectsModule.forRoot([]),
        StoreDevtoolsModule.instrument({
            name: 'FCL Devtools',
            maxAge: 25,
            logOnly: environment.production
        }),
        // AppRoutingModule needs to be at the end
        AppRoutingModule
    ],
    providers: [
        // {
        //     provide: LocationStrategy,
        //     useClass: HashLocationStrategy
        // },
        ScrollbarHelper
    ],
    bootstrap: [
        AppComponent
    ]
})
export class AppModule {
}
