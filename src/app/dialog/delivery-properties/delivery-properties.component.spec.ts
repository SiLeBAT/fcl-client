import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MdDialogModule, MdDialogRef, MD_DIALOG_DATA} from '@angular/material';

import {DeliveryPropertiesComponent, DeliveryPropertiesData} from './delivery-properties.component';

describe('DeliveryPropertiesComponent', () => {
  let component: DeliveryPropertiesComponent;
  let fixture: ComponentFixture<DeliveryPropertiesComponent>;

  beforeEach(async(() => {
    const data: DeliveryPropertiesData = {
      delivery: {data: {id: 1, name: 'Test'}}
    };

    TestBed.configureTestingModule({
      imports: [MdDialogModule],
      declarations: [DeliveryPropertiesComponent],
      providers: [
        {provide: MdDialogRef, useValue: {}},
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

  it('should render title', () => {
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('.mat-dialog-title').textContent).toContain('Delivery Properties');
  });
});
