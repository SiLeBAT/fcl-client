import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MaterialModule, MdDialogRef, MD_DIALOG_DATA} from '@angular/material';

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
      imports: [MaterialModule],
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

  it('should render title in a md-toolbar', async(() => {
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('.mat-dialog-title').textContent).toContain('Actions');
  }));
});
