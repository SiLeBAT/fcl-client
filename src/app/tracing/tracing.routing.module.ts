import { NgModule } from "@angular/core";
import { Routes, RouterModule, mapToCanActivate } from "@angular/router";

import { AuthGuard } from "./../user/guards/auth.guard";
import { MainTracingComponent } from "./components/main-tracing.component";
import { environment } from "./../../environments/environment";

const tracingRoutes: Routes = [
    {
        path: "tracing",
        component: MainTracingComponent,
        canActivate: environment.serverless
            ? undefined
            : mapToCanActivate([AuthGuard]),
    },
];

@NgModule({
    imports: [RouterModule.forChild(tracingRoutes)],
    exports: [RouterModule],
})
export class TracingRoutingModule {}
