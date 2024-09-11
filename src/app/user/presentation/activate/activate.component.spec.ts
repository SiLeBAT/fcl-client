import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';

import {ActivateComponent} from './activate.component';
import {MaterialModule} from '../../../shared/material.module';
import {SharedModule} from '../../../shared/shared.module';
import {RouterTestingModule} from '@angular/router/testing';

describe('ActivateComponent', () => {
  let component: ActivateComponent;
  let fixture: ComponentFixture<ActivateComponent>;

  beforeEach(async(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    TestBed.configureTestingModule({
      declarations: [ActivateComponent],
      imports: [MaterialModule, SharedModule, RouterTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(ActivateComponent);
        component = fixture.componentInstance;
      });
  }));

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the component correctly', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should display the app name if token is valid', () => {
    const tokenValid = true;
    const appName = 'test';
    component.tokenValid = tokenValid;
    component.appName = appName;
    fixture.detectChanges();

    expect(fixture.nativeElement.outerHTML).toContain('test');
    expect(fixture).toMatchSnapshot();
  });

  it('should not display the app name if token is invalid', () => {
    const tokenValid = false;
    const appName = 'test';
    component.tokenValid = tokenValid;
    component.appName = appName;
    fixture.detectChanges();

    expect(fixture.nativeElement.outerHTML).not.toContain('test');
    expect(fixture).toMatchSnapshot();
  });
});
