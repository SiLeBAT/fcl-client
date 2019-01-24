import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatCheckboxModule, MatDialogRef } from '@angular/material';

import { DialogSelectComponent, DialogSelectData } from './dialog-select.component';

describe('DialogSelectComponent', () => {
    let component: DialogSelectComponent;
    let fixture: ComponentFixture<DialogSelectComponent>;

    beforeEach(async(() => {
        const data: DialogSelectData = {
            title: 'Prompt',
            options: [
        { value: 'Eins', viewValue: 'Eins', selected: true },
        { value: 'Zwei', viewValue: 'Zwei', selected: false },
        { value: 'Drei', viewValue: 'Drei', selected: true }
            ]
        };

        TestBed.configureTestingModule({
            imports: [
                FormsModule,
                MatCheckboxModule
            ],
            declarations: [DialogSelectComponent],
            providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: data }
            ]
        }).compileComponents().then().catch();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DialogSelectComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
