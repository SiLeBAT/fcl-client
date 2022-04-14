import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { InvalidServerInputHttpErrorResponse } from '../errors';
import { fromErrorExtractInvalidDataErrorDTO, isErrorWithInvalidDataErrorDTO } from '../server-response-mapping';

@Injectable({
    providedIn: 'root'
})
export class DataRequestService {

    constructor(private httpClient: HttpClient) { }

    post<T, S>(url: string, body: S): Observable<T> {
        return this.httpClient.post<T>(url, body)
            .pipe(catchError(this.handleError));
    }

    patch<T, S>(url: string, body: S): Observable<T> {
        return this.httpClient.patch<T>(url, body)
            .pipe(catchError(this.handleError));
    }
    put<T, S>(url: string, body: S): Observable<T> {
        return this.httpClient.put<T>(url, body)
            .pipe(catchError(this.handleError));
    }

    get<T>(url: string): Observable<T> {
        return this.httpClient.get<T>(url);
    }

    private handleError(error: unknown): never {
        if (isErrorWithInvalidDataErrorDTO(error)) {
            const invDataErrDTO = fromErrorExtractInvalidDataErrorDTO(error);
            throw new InvalidServerInputHttpErrorResponse(
                invDataErrDTO.message, invDataErrDTO.errors
            );
        }
        throw error;
    }
}
