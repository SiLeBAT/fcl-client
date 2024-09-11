import {TestBed, waitForAsync} from '@angular/core/testing';
import {of} from 'rxjs';
import {ContentService} from '../services/content.service';
import {FaqService} from './faq.service';

describe('FaqService', () => {
  const mockContentService: Partial<ContentService> = {
    getFaq: () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const data = require('../../../assets/faq.json');
      return of(data);
    },
  };

  let faqService: FaqService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        FaqService,
        {
          provide: ContentService,
          useValue: mockContentService as ContentService,
        },
      ],
    });
    faqService = TestBed.inject(FaqService);
  }));

  it('should instantiate the io service', () => {
    expect(faqService).toBeTruthy();
  });

  // eslint-disable-next-line arrow-body-style
  it('should load faq data correctly', async () => {
    return faqService
      .getFaq()
      .toPromise()
      .then(faq => {
        expect(faq).toBeTruthy();
        expect(faq.sections.length).toBeGreaterThan(0);
        const emptySectionTitleExist = faq.sections.some(
          s => (s.title || '').length === 0
        );
        expect(emptySectionTitleExist).toBe(false);

        const emptyUrlFragmentExist = faq.sections.some(
          s => (s.urlFragment || '').length === 0
        );
        expect(emptyUrlFragmentExist).toBe(false);

        const sectionWoQuestionExist = faq.sections.some(
          s => s.entries.length === 0
        );
        expect(sectionWoQuestionExist).toBe(false);

        const emptyQuestionsExist = faq.sections.some(s =>
          s.entries.some(e => (e.question || '').length === 0)
        );
        expect(emptyQuestionsExist).toBe(false);

        const emptyAnswersExist = faq.sections.some(s =>
          s.entries.some(e => (e.answer || '').length === 0)
        );
        expect(emptyAnswersExist).toBe(false);
      })
      .catch(error => {
        throw error;
      });
  });
});
