import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
    HTTP_INTERCEPTORS,
    provideHttpClient,
    withInterceptorsFromDi,
} from "@angular/common/http";

import { TokenInterceptor } from "./services/token-interceptor.service";
import { JwtInterceptor } from "./services/jwt-interceptor.service";

@NgModule({
    imports: [CommonModule],
    declarations: [],
    providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: TokenInterceptor,
            multi: true,
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: JwtInterceptor,
            multi: true,
        },
        provideHttpClient(withInterceptorsFromDi()),
    ],
    exports: [],
})
export class CoreModule {}
