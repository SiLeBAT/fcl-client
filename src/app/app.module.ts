import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app.routing.module';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { FlexLayoutModule } from '@angular/flex-layout';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { EffectsModule } from '@ngrx/effects';

import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { ScrollbarHelper } from '@swimlane/ngx-datatable/release/services/scrollbar-helper.service';
import { PasswordStrengthMeterModule } from 'angular-password-strength-meter';

import { UserModule } from './user/user.module';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { MaterialModule } from './shared/material.module';
import { GraphEditorModule } from './graph-editor/graph-editor.module';

import { AppComponent } from './app.component';
import { TracingComponent } from './tracing/tracing.component';
import { GraphComponent } from './graph/graph.component';
import { GisComponent } from './gis/gis.component';
import { TableComponent } from './table/table.component';
import { DialogActionsComponent } from './dialog/dialog-actions/dialog-actions.component';
import { DialogAlertComponent } from './dialog/dialog-alert/dialog-alert.component';
import { DialogPromptComponent } from './dialog/dialog-prompt/dialog-prompt.component';
import { DialogSelectComponent } from './dialog/dialog-select/dialog-select.component';
import { DialogSingleSelectComponent } from './dialog/dialog-single-select/dialog-single-select.component';
import { StationPropertiesComponent } from './dialog/station-properties/station-properties.component';
import { DeliveryPropertiesComponent } from './dialog/delivery-properties/delivery-properties.component';
import { environment } from '../environments/environment';
import { TokenInterceptor } from './core/services/token-interceptor.service';
import { JwtInterceptor } from './core/services/jwt-interceptor.service';

@NgModule({
    declarations: [
        AppComponent,
        TracingComponent,
        GraphComponent,
        GisComponent,
        TableComponent,
        DialogActionsComponent,
        DialogAlertComponent,
        DialogPromptComponent,
        DialogSelectComponent,
        DialogSingleSelectComponent,
        StationPropertiesComponent,
        DeliveryPropertiesComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MaterialModule,
        NgxDatatableModule,
        GraphEditorModule,
        FlexLayoutModule,
        PasswordStrengthMeterModule,
        UserModule,
        CoreModule,
        SharedModule,
        MaterialModule,
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
        {
            provide: HTTP_INTERCEPTORS,
            useClass: TokenInterceptor,
            multi: true
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: JwtInterceptor,
            multi: true
        },
        ScrollbarHelper,
        {
            provide: LocationStrategy,
            useClass: HashLocationStrategy
        }
    ],
    bootstrap: [
        AppComponent
    ],
    entryComponents: [
        DialogActionsComponent,
        DialogAlertComponent,
        DialogPromptComponent,
        DialogSelectComponent,
        DialogSingleSelectComponent,
        StationPropertiesComponent,
        DeliveryPropertiesComponent
    ]
})
export class AppModule {
}
