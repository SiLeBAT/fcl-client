import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {MD_DIALOG_DATA, MdDialogRef, MdInputModule} from '@angular/material';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {DialogPromptComponent, DialogPromptData} from './dialog-prompt.component';

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
        BrowserAnimationsModule,
        FormsModule,
        MdInputModule
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
