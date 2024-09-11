import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { contentPathsSegments } from "./content.paths";
import { DataProtectionDeclarationComponent } from "./data-protection-declaration/data-protection-declaration.component";
import { DataProtectionNoticeComponent } from "./data-protection-notice/data-protection-notice.component";
import { FaqComponent } from "./faq/components/faq.component";
import { FaqResolverService } from "./faq/faq-resolver.service";

const contentRoutes: Routes = [
    {
        path: contentPathsSegments.content,
        children: [
            {
                path: contentPathsSegments.faq,
                component: FaqComponent,
                resolve: { faqCollection: FaqResolverService },
            },
            {
                path: contentPathsSegments.dataProtectionDeclaration,
                component: DataProtectionDeclarationComponent,
            },
            {
                path: contentPathsSegments.dataProtectionNotice,
                component: DataProtectionNoticeComponent,
            },
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(contentRoutes)],
    exports: [RouterModule],
})
export class ContentRoutingModule {}
