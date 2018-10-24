import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app.routing.module';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FlexLayoutModule } from '@angular/flex-layout';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';

import {NgxDatatableModule} from '@swimlane/ngx-datatable';
import {ScrollbarHelper} from '@swimlane/ngx-datatable/release/services/scrollbar-helper.service';
import { PasswordStrengthMeterModule } from 'angular-password-strength-meter';

import { MaterialModule } from './shared/material.module';

import {AppComponent} from './app.component';
import { TracingComponent } from './tracing/tracing.component';
import {GraphComponent} from './graph/graph.component';
import {TableComponent} from './table/table.component';
import {DialogActionsComponent} from './dialog/dialog-actions/dialog-actions.component';
import {DialogAlertComponent} from './dialog/dialog-alert/dialog-alert.component';
import {DialogPromptComponent} from './dialog/dialog-prompt/dialog-prompt.component';
import {DialogSelectComponent} from './dialog/dialog-select/dialog-select.component';
import {DialogSingleSelectComponent} from './dialog/dialog-single-select/dialog-single-select.component';
import {StationPropertiesComponent} from './dialog/station-properties/station-properties.component';
import {DeliveryPropertiesComponent} from './dialog/delivery-properties/delivery-properties.component';

import { TokenInterceptor } from './auth/interceptors/token.interceptor';
import { JwtInterceptor } from './auth/interceptors/jwt.interceptor';

import {DataService} from './util/data.service';
import {TracingService} from './tracing/tracing.service';
import {GisComponent} from './gis/gis.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { RecoveryComponent } from './auth/recovery/recovery.component';
import { HomeComponent } from './auth/home/home.component';
import { ResetComponent } from './auth/reset/reset.component';
import { ActivateComponent } from './auth/activate/activate.component';
import { AdminActivateComponent } from './auth/admin-activate/admin-activate.component';
import { AuthGuard } from './auth/guards/auth.guard';
import { AuthService } from './auth/services/auth.service';
import { AlertService } from './auth/services/alert.service';
import { UserService } from './auth/services/user.service';
import { SpinnerLoaderService } from './shared/spinner-loader/spinner-loader.service';
import { SpinnerLoaderComponent } from './shared/spinner-loader/spinner-loader.component';
import { AppService } from './app.service';

import { AlertComponent } from './auth/alert/alert.component';
import { MainDashComponent } from './main-dash/main-dash.component';

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
    DeliveryPropertiesComponent,
    LoginComponent,
    AlertComponent,
    SpinnerLoaderComponent,
    RegisterComponent,
    RecoveryComponent,
    ResetComponent,
    HomeComponent,
    ActivateComponent,
    AdminActivateComponent,
    MainDashComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    HttpModule,
    MaterialModule,
    NgxDatatableModule,
    AppRoutingModule,
    FlexLayoutModule,
    PasswordStrengthMeterModule
  ],
  providers: [
    DataService,
    TracingService,
    ScrollbarHelper,
    AuthService,
    AlertService,
    UserService,
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
    // {
    //   provide: LocationStrategy,
    //   useClass: HashLocationStrategy
    // },
    SpinnerLoaderService,
    AuthGuard,
    AppService
  ],
  bootstrap: [AppComponent],
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
