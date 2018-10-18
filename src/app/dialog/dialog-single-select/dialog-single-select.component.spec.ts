import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {MD_DIALOG_DATA, MdCheckboxModule, MdDialogRef} from '@angular/material';

import {DialogSingleSelectComponent, DialogSingleSelectData} from './dialog-single-select.component';

describe('DialogSingleSelectComponent', () => {
  let component: DialogSingleSelectComponent;
  let fixture: ComponentFixture<DialogSingleSelectComponent>;

  beforeEach(async(() => {
    const data: DialogSingleSelectData = {
      title: 'Prompt',
      options: [
        {value: 'Eins', viewValue: 'Eins'},
        {value: 'Zwei', viewValue: 'Zwei'},
        {value: 'Drei', viewValue: 'Drei'}
      ],
      value: 'Eins'
    };

    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        MdCheckboxModule
      ],
      declarations: [DialogSingleSelectComponent],
      providers: [
        {provide: MdDialogRef, useValue: {}},
        {provide: MD_DIALOG_DATA, useValue: data}
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
