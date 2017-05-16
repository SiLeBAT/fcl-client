import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {
  MdButtonModule,
  MdCardModule,
  MdCheckboxModule,
  MdDialogModule,
  MdIconModule,
  MdInputModule,
  MdMenuModule,
  MdRadioModule,
  MdSelectModule,
  MdSidenavModule,
  MdToolbarModule
} from '@angular/material';
import {NgxDatatableModule} from '@swimlane/ngx-datatable';
import {ScrollbarHelper} from '@swimlane/ngx-datatable/release/services/scrollbar-helper.service';
import {D3Service} from 'd3-ng2-service';

import {AppComponent} from './app.component';
import {GraphComponent} from './graph/graph.component';
import {TableComponent} from './table/table.component';
import {DialogActionsComponent} from './dialog/dialog-actions/dialog-actions.component';
import {DialogAlertComponent} from './dialog/dialog-alert/dialog-alert.component';
import {DialogPromptComponent} from './dialog/dialog-prompt/dialog-prompt.component';
import {DialogSelectComponent} from './dialog/dialog-select/dialog-select.component';
import {StationPropertiesComponent} from './dialog/station-properties/station-properties.component';
import {DeliveryPropertiesComponent} from './dialog/delivery-properties/delivery-properties.component';

import {DataService} from './util/data.service';
import {TracingService} from './graph/tracing.service';

@NgModule({
  declarations: [
    AppComponent,
    GraphComponent,
    TableComponent,
    DialogActionsComponent,
    DialogAlertComponent,
    DialogPromptComponent,
    DialogSelectComponent,
    StationPropertiesComponent,
    DeliveryPropertiesComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpModule,
    MdButtonModule,
    MdCardModule,
    MdCheckboxModule,
    MdDialogModule,
    MdIconModule,
    MdInputModule,
    MdMenuModule,
    MdRadioModule,
    MdSelectModule,
    MdSidenavModule,
    MdToolbarModule,
    NgxDatatableModule
  ],
  providers: [
    DataService,
    TracingService,
    ScrollbarHelper,
    D3Service
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    DialogActionsComponent,
    DialogAlertComponent,
    DialogPromptComponent,
    DialogSelectComponent,
    StationPropertiesComponent,
    DeliveryPropertiesComponent
  ]
})
export class AppModule {
}
