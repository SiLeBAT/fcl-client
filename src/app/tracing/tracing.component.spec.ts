import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  MatCheckboxModule,
  MatDialogModule,
  MatIconModule,
  MatInputModule,
  MatMenuModule,
  MatRadioModule,
  MatSelectModule,
  MatSidenavModule,
  MatSliderModule,
  MatToolbarModule
} from '@angular/material';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { ScrollbarHelper } from '@swimlane/ngx-datatable/release/services/scrollbar-helper.service';
import { GraphComponent } from '../graph/graph.component';
import { GisComponent } from '../gis/gis.component';
import { TableComponent } from '../table/table.component';
import { DataService } from '../util/data.service';
import { TracingService } from '../tracing/tracing.service';

import { TracingComponent } from './tracing.component';

describe('TracingComponent', () => {
    let component: TracingComponent;
    let fixture: ComponentFixture<TracingComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [
                BrowserAnimationsModule,
                FormsModule,
                HttpClientModule,
                MatCheckboxModule,
                MatDialogModule,
                MatIconModule,
                MatInputModule,
                MatMenuModule,
                MatRadioModule,
                MatSelectModule,
                MatSidenavModule,
                MatSliderModule,
                MatToolbarModule,
                NgxDatatableModule
            ],
            declarations: [
                TracingComponent,
                GraphComponent,
                GisComponent,
                TableComponent
            ],
            providers: [
                DataService,
                ScrollbarHelper,
                TracingService
            ]
        }).compileComponents().then().catch();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TracingComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render title in a mat-toolbar', () => {
        const compiled = fixture.debugElement.nativeElement;
        expect(compiled.querySelector('mat-toolbar').textContent).toContain('FoodChain-Lab');
    });
});
