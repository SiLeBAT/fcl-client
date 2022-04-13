import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HTML_ERROR_CODE_UNPROCESSABLE_ENTITY } from '../html-error-codes.constants';
import { ServerInputValidationError, ServerInputValidationErrorDTO, SERVER_ERROR_CODE } from '../model';
import { InvalidServerInputHttpErrorResponse } from '../errors';

@Injectable({
    providedIn: 'root'
})
export class DataRequestService {

    constructor(private httpClient: HttpClient) { }

    post<T, S>(url: string, body: S): Observable<T> {
        return this.httpClient.post<T>(url, body)
            .pipe(catchError((err: any) => this.throwPostProcessedError(err, body)));
    }

    patch<T, S>(url: string, body: S): Observable<T> {
        return this.httpClient.patch<T>(url, body)
            .pipe(catchError((err: any) => this.throwPostProcessedError(err, body)));
    }
    put<T, S>(url: string, body: S): Observable<T> {
        return this.httpClient.put<T>(url, body);
    }

    get<T>(url: string): Observable<T> {
        return this.httpClient.get<T>(url);
    }

    private throwPostProcessedError<S>(error: Error, body: S): never {
        if (error instanceof HttpErrorResponse) {
            if (
                body instanceof Object &&
                error instanceof Object &&
                error.status === HTML_ERROR_CODE_UNPROCESSABLE_ENTITY &&
                error.error instanceof Object &&
                error.error.code === SERVER_ERROR_CODE.INVALID_INPUT &&
                error.error.errors instanceof Array &&
                this.isServerValidationResultValid(body, error.error.errors)
            ) {
                throw new InvalidServerInputHttpErrorResponse(
                    error.error.message, error.error.errors as ServerInputValidationError[]
                );
            }
        }
        throw error;
    }

    private isServerValidationResultValid<T>(serverInput: T, serverOutput: any): boolean {
        return (
            serverOutput instanceof Array &&
            serverOutput.every(item => {
                if (item instanceof Object) {
                    const error = item as ServerInputValidationErrorDTO;
                    return (
                        typeof error.code === 'string' && error.code !== '' &&
                        typeof error.message === 'string' && error.message !== ''
                    );
                }
                return false;
            })
        );
    }
}
