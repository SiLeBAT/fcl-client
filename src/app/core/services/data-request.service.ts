import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class DataRequestService {

    private readonly API_ROOT = "/api/v1"

    constructor(private httpClient: HttpClient) { }

    post<T, S>(url: string, body: S): Observable<T> {
        return this.httpClient.post<T>(this.API_ROOT + url, body);
    }
    patch<T, S>(url: string, body: S): Observable<T> {
        return this.httpClient.patch<T>(this.API_ROOT + url, body);
    }
    put<T, S>(url: string, body: S): Observable<T> {
        return this.httpClient.put<T>(this.API_ROOT + url, body);
    }

    get<T>(url: string): Observable<T> {
        return this.httpClient.get<T>(this.API_ROOT + url);
    }

}
