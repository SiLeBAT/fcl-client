import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MaterialModule} from '@angular/material';
import {TracingService} from './tracing.service';

import {GraphComponent} from './graph.component';

describe('GraphComponent', () => {
  let component: GraphComponent;
  let fixture: ComponentFixture<GraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [MaterialModule],
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
