import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MdDialogModule, MdMenuModule, MdSliderModule} from '@angular/material';
import {FormsModule} from '@angular/forms';
import {TracingService} from '../tracing/tracing.service';

import {GraphComponent} from './graph.component';

describe('GraphComponent', () => {
  let component: GraphComponent;
  let fixture: ComponentFixture<GraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, MdDialogModule, MdMenuModule, MdSliderModule],
      declarations: [GraphComponent],
      providers: [TracingService]
    }).compileComponents().then();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
