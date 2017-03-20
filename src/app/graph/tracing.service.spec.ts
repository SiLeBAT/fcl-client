/* tslint:disable:no-unused-variable */

import {TestBed, inject} from '@angular/core/testing';
import {TracingService} from './tracing.service';

describe('TracingService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TracingService]
    });
  });

  it('should ...', inject([TracingService], (service: TracingService) => {
    expect(service).toBeTruthy();
  }));
});
