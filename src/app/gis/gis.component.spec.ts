import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {GisComponent} from './gis.component';

describe('GisComponent', () => {
  let component: GisComponent;
  let fixture: ComponentFixture<GisComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [GisComponent]
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
