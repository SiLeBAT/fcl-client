import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {MaterialModule, MdDialogRef, MD_DIALOG_DATA} from '@angular/material';

import {DialogSelectComponent} from './dialog-select.component';
import {DialogSelectData} from './dialog-select.data';

describe('DialogSelectComponent', () => {
  let component: DialogSelectComponent;
  let fixture: ComponentFixture<DialogSelectComponent>;

  beforeEach(async(() => {
    const data: DialogSelectData = {
      title: 'Prompt',
      options: ['Eins', 'Zwei', 'Drei']
    };

    TestBed.configureTestingModule({
      imports: [
        MaterialModule,
        FormsModule
      ],
      declarations: [DialogSelectComponent],
      providers: [
        {provide: MdDialogRef, useValue: {}},
        {provide: MD_DIALOG_DATA, useValue: data}
      ]
    }).compileComponents().then();
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
