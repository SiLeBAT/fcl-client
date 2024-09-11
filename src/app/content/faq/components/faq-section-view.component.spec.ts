import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {CUSTOM_ELEMENTS_SCHEMA, SecurityContext} from '@angular/core';

import {FaqSectionViewComponent} from './faq-section-view.component';
import {MaterialModule} from '../../../shared/material.module';
import {FaqSection} from '../faq.model';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {DomSanitizer, SafeValue} from '@angular/platform-browser';

describe('FaqSectionViewComponent', () => {
  const mockDomSanitzer: Partial<DomSanitizer> = {
    sanitize: (context: SecurityContext, value: string | SafeValue | null) =>
      (value || '') as string,
  };

  const faqSection: Omit<FaqSection, 'urlFragment'> = {
    title: 'Section A',
    entries: [
      {question: 'Q1', answer: 'A1'},
      {question: 'Q2', answer: 'A2'},
    ],
  };

  let component: FaqSectionViewComponent;
  let fixture: ComponentFixture<FaqSectionViewComponent>;

  beforeEach(waitForAsync(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    TestBed.configureTestingModule({
      declarations: [FaqSectionViewComponent],
      imports: [MaterialModule, NoopAnimationsModule],
      providers: [
        {
          provide: DomSanitizer,
          useValue: mockDomSanitzer as DomSanitizer,
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(FaqSectionViewComponent);
        component = fixture.componentInstance;
        component.title = faqSection.title;
        component.entries = faqSection.entries;
        fixture.detectChanges();
      });
  }));

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the component correctly', () => {
    expect(fixture).toMatchSnapshot();
  });
});
