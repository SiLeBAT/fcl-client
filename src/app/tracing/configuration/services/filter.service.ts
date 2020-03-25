import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class FilterService {
    private standardFilterTermSubject = new BehaviorSubject<string>('');
    standardFilterTerm$: Observable<string> = this.standardFilterTermSubject
        .asObservable()
        .pipe(
            debounceTime(100),
            distinctUntilChanged()
        );

    constructor() { }

    processStandardFilterTerm(filterTerm: string) {
        this.standardFilterTermSubject.next(filterTerm);
    }
}
