import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class DataRequestService {

    constructor(private httpClient: HttpClient) { }

    post<T, S>(url: string, body: S): Observable<T> {
        return this.httpClient.post<T>(url, body);
    }
    patch<T, S>(url: string, body: S): Observable<T> {
        return this.httpClient.patch<T>(url, body);
    }
    put<T, S>(url: string, body: S): Observable<T> {
        return this.httpClient.put<T>(url, body);
    }

    get<T>(url: string): Observable<T> {
        return this.httpClient.get<T>(url);
    }

}
