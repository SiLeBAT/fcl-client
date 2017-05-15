import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MD_DIALOG_DATA, MdDialogModule, MdDialogRef} from '@angular/material';

import {StationPropertiesComponent, StationPropertiesData} from './station-properties.component';
import {D3Service} from 'd3-ng2-service';

describe('StationPropertiesComponent', () => {
  let component: StationPropertiesComponent;
  let fixture: ComponentFixture<StationPropertiesComponent>;

  beforeEach(async(() => {
    const data: StationPropertiesData = {
      station: {
        id: null, name: null, incoming: [], outgoing: [], connections: [], invisible: null, contained: null, contains: null, selected: null,
        observed: null, forward: null, backward: null, outbreak: null, crossContamination: null, score: null, commonLink: null,
        position: null, positionRelativeTo: null, properties: []
      },
      deliveries: new Map()
    };

    TestBed.configureTestingModule({
      imports: [MdDialogModule],
      declarations: [StationPropertiesComponent],
      providers: [
        {provide: MdDialogRef, useValue: {updatePosition: () => void(0)}},
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
});
