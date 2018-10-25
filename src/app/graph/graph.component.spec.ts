import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialogModule, MatMenuModule, MatSliderModule} from '@angular/material';
import {FormsModule} from '@angular/forms';
import {TracingService} from '../tracing/tracing.service';

import {GraphComponent} from './graph.component';

describe('GraphComponent', () => {
  let component: GraphComponent;
  let fixture: ComponentFixture<GraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, MatDialogModule, MatMenuModule, MatSliderModule],
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
