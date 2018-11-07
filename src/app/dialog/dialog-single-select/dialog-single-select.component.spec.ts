import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {MAT_DIALOG_DATA, MatCheckboxModule, MatDialogRef} from '@angular/material';

import {DialogSingleSelectComponent, DialogSingleSelectData} from './dialog-single-select.component';

describe('DialogSingleSelectComponent', () => {
  let component: DialogSingleSelectComponent;
  let fixture: ComponentFixture<DialogSingleSelectComponent>;

  beforeEach(async(() => {
    const data: DialogSingleSelectData = {
      title: 'Prompt',
      message: '',
      options: [
        {value: 'Eins', viewValue: 'Eins', toolTip: null},
        {value: 'Zwei', viewValue: 'Zwei', toolTip: null},
        {value: 'Drei', viewValue: 'Drei', toolTip: null}
      ],
      value: 'Eins'
    };

    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        MatCheckboxModule
      ],
      declarations: [DialogSingleSelectComponent],
      providers: [
        {provide: MatDialogRef, useValue: {}},
        {provide: MAT_DIALOG_DATA, useValue: data}
      ]
    }).compileComponents().then();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogSingleSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
