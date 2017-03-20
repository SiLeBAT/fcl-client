import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {MaterialModule, MdDialogRef, MD_DIALOG_DATA} from '@angular/material';

import {DialogPromptComponent} from './dialog-prompt.component';
import {DialogPromptData} from './dialog-prompt.data';

describe('DialogPromptComponent', () => {
  let component: DialogPromptComponent;
  let fixture: ComponentFixture<DialogPromptComponent>;

  beforeEach(async(() => {
    const data: DialogPromptData = {
      title: 'Prompt',
      message: 'Please input value for test:',
      placeholder: 'test'
    };

    TestBed.configureTestingModule({
      imports: [
        MaterialModule,
        FormsModule
      ],
      declarations: [DialogPromptComponent],
      providers: [
        {provide: MdDialogRef, useValue: {}},
        {provide: MD_DIALOG_DATA, useValue: data}
      ]
    }).compileComponents().then();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogPromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
