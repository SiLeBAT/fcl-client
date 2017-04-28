import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MdDialogModule, MdDialogRef, MD_DIALOG_DATA} from '@angular/material';

import {StationPropertiesComponent, StationPropertiesData} from './station-properties.component';
import {D3Service} from 'd3-ng2-service';

describe('StationPropertiesComponent', () => {
  let component: StationPropertiesComponent;
  let fixture: ComponentFixture<StationPropertiesComponent>;

  beforeEach(async(() => {
    const data: StationPropertiesData = {
      station: {
        id: null, name: null, incoming: [], outgoing: [], connections: [], invisible: null, contained: null, contains: null, selected: null,
        observed: null, forward: null, backward: null, outbreak: null, score: null, commonLink: null, position: null,
        positionRelativeTo: null, properties: []
      },
      connectedDeliveries: []
    };

    TestBed.configureTestingModule({
      imports: [MdDialogModule],
      declarations: [StationPropertiesComponent],
      providers: [
        {provide: MdDialogRef, useValue: {}},
        {provide: MD_DIALOG_DATA, useValue: data},
        D3Service
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
