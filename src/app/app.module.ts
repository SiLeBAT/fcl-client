import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {MaterialModule} from '@angular/material';
import {NgxDatatableModule} from '@swimlane/ngx-datatable';

import {AppComponent} from './app.component';
import {GraphComponent} from './graph/graph.component';
import {TableComponent} from './table/table.component';
import {DialogActionsComponent} from './dialog/dialog-actions/dialog-actions.component';
import {DialogAlertComponent} from './dialog/dialog-alert/dialog-alert.component';
import {DialogPromptComponent} from './dialog/dialog-prompt/dialog-prompt.component';
import {DialogSelectComponent} from './dialog/dialog-select/dialog-select.component';

import {DataService} from './util/data.service';
import {UtilService} from './util/util.service';
import {TracingService} from './graph/tracing.service';

import {FruchtermanLayout} from './graph/fruchterman_reingold';
import {Legend} from './graph/legend';

declare const cytoscape: any;

@NgModule({
  declarations: [
    AppComponent,
    GraphComponent,
    TableComponent,
    DialogActionsComponent,
    DialogAlertComponent,
    DialogPromptComponent,
    DialogSelectComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpModule,
    MaterialModule,
    NgxDatatableModule
  ],
  providers: [
    DataService,
    UtilService,
    TracingService
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    DialogActionsComponent,
    DialogAlertComponent,
    DialogPromptComponent,
    DialogSelectComponent
  ]
})
export class AppModule {

  constructor() {
    cytoscape('core', 'legend', Legend);
    cytoscape('layout', 'fruchterman', FruchtermanLayout);
  }
}
