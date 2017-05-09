import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MD_DIALOG_DATA, MdDialogModule, MdDialogRef} from '@angular/material';

import {DeliveryPropertiesComponent, DeliveryPropertiesData} from './delivery-properties.component';
import {D3Service} from 'd3-ng2-service';

describe('DeliveryPropertiesComponent', () => {
  let component: DeliveryPropertiesComponent;
  let fixture: ComponentFixture<DeliveryPropertiesComponent>;

  beforeEach(async(() => {
    const data: DeliveryPropertiesData = {
      delivery: {
        id: null, source: null, target: null, originalSource: null, originalTarget: null, incoming: null, outgoing: null, invisible: null,
        selected: null, observed: null, forward: null, backward: null, score: null, properties: []
      }
    };

    TestBed.configureTestingModule({
      imports: [MdDialogModule],
      declarations: [DeliveryPropertiesComponent],
      providers: [
        {provide: MdDialogRef, useValue: {}},
        {provide: MD_DIALOG_DATA, useValue: data},
        D3Service
      ]
    }).compileComponents().then();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeliveryPropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render title', () => {
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('.mat-dialog-title').textContent).toContain('Delivery Properties');
  });
});
