import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MdDialogModule, MdDialogRef, MD_DIALOG_DATA} from '@angular/material';

import {StationPropertiesComponent, StationPropertiesData} from './station-properties.component';

describe('StationPropertiesComponent', () => {
  let component: StationPropertiesComponent;
  let fixture: ComponentFixture<StationPropertiesComponent>;

  beforeEach(async(() => {
    const data: StationPropertiesData = {
      station: {data: {id: 1, name: 'Test'}}
    };

    TestBed.configureTestingModule({
      imports: [MdDialogModule],
      declarations: [StationPropertiesComponent],
      providers: [
        {provide: MdDialogRef, useValue: {}},
        {provide: MD_DIALOG_DATA, useValue: data}
      ]
    }).compileComponents().then();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StationPropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render title', () => {
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('.mat-dialog-title').textContent).toContain('Station Properties');
  });
});
