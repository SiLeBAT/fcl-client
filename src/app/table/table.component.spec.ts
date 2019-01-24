import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { ScrollbarHelper } from '@swimlane/ngx-datatable/release/services/scrollbar-helper.service';
import { MatCheckboxModule, MatInputModule } from '@angular/material';
import { FormsModule } from '@angular/forms';

import { TableComponent } from './table.component';

describe('TableComponent', () => {
    let component: TableComponent;
    let fixture: ComponentFixture<TableComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [
                BrowserAnimationsModule,
                FormsModule,
                MatCheckboxModule,
                MatInputModule,
                NgxDatatableModule
            ],
            declarations: [
                TableComponent
            ],
            providers: [
                ScrollbarHelper
            ]
        }).compileComponents().then().catch();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
