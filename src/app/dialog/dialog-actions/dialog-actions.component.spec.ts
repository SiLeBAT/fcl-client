import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MD_DIALOG_DATA, MdDialogModule, MdDialogRef} from '@angular/material';

import {DialogActionsComponent, DialogActionsData} from './dialog-actions.component';

describe('DialogActionsComponent', () => {
  let component: DialogActionsComponent;
  let fixture: ComponentFixture<DialogActionsComponent>;

  beforeEach(async(() => {
    const data: DialogActionsData = {
      title: 'Actions',
      actions: [{name: 'action1', action: () => void(0)}]
    };

    TestBed.configureTestingModule({
      imports: [MdDialogModule],
      declarations: [DialogActionsComponent],
      providers: [
        {provide: MdDialogRef, useValue: {}},
        {provide: MD_DIALOG_DATA, useValue: data}
      ]
    }).compileComponents().then();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render title', () => {
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('.mat-dialog-title').textContent).toContain('Actions');
  });
});
