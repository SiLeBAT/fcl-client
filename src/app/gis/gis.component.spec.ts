import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MdDialogModule, MdMenuModule, MdSliderModule} from '@angular/material';
import {TracingService} from '../tracing/tracing.service';

import {GisComponent} from './gis.component';

describe('GisComponent', () => {
  let component: GisComponent;
  let fixture: ComponentFixture<GisComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [MdDialogModule, MdMenuModule, MdSliderModule],
      declarations: [GisComponent],
      providers: [TracingService]
    }).compileComponents().then();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
