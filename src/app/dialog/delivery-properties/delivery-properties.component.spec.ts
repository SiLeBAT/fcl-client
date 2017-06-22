import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MD_DIALOG_DATA, MdDialogModule, MdDialogRef} from '@angular/material';

import {DeliveryPropertiesComponent, DeliveryPropertiesData} from './delivery-properties.component';

describe('DeliveryPropertiesComponent', () => {
  let component: DeliveryPropertiesComponent;
  let fixture: ComponentFixture<DeliveryPropertiesComponent>;

  beforeEach(async(() => {
    const data: DeliveryPropertiesData = {
      delivery: {
        id: null, name: null, lot: null, date: null, source: null, target: null, originalSource: null, originalTarget: null,
        invisible: null, selected: null, observed: null, forward: null, backward: null, score: null, properties: []
      }
    };

    TestBed.configureTestingModule({
      imports: [MdDialogModule],
      declarations: [DeliveryPropertiesComponent],
      providers: [
        {provide: MdDialogRef, useValue: {updatePosition: () => void(0)}},
        {provide: MD_DIALOG_DATA, useValue: data}
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
});
