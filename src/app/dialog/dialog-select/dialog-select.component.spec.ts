import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {MdCheckboxModule, MdDialogRef, MD_DIALOG_DATA} from '@angular/material';

import {DialogSelectComponent, DialogSelectData} from './dialog-select.component';

describe('DialogSelectComponent', () => {
  let component: DialogSelectComponent;
  let fixture: ComponentFixture<DialogSelectComponent>;

  beforeEach(async(() => {
    const data: DialogSelectData = {
      title: 'Prompt',
      options: [{name: 'Eins', selected: true}, {name: 'Zwei', selected: false}, {name: 'Drei', selected: true}]
    };

    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        MdCheckboxModule
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
