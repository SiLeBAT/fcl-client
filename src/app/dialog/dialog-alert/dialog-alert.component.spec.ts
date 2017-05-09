import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MD_DIALOG_DATA, MdDialogRef} from '@angular/material';

import {DialogAlertComponent, DialogAlertData} from './dialog-alert.component';

describe('DialogAlertComponent', () => {
  let component: DialogAlertComponent;
  let fixture: ComponentFixture<DialogAlertComponent>;

  beforeEach(async(() => {
    const data: DialogAlertData = {
      title: 'Alert',
      message: 'This is an alert!'
    };

    TestBed.configureTestingModule({
      imports: [],
      declarations: [DialogAlertComponent],
      providers: [
        {provide: MdDialogRef, useValue: {}},
        {provide: MD_DIALOG_DATA, useValue: data}
      ]
    }).compileComponents().then();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogAlertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
