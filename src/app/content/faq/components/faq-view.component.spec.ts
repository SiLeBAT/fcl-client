import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { CUSTOM_ELEMENTS_SCHEMA, SecurityContext } from "@angular/core";

import { FaqViewComponent } from "./faq-view.component";
import { FaqSectionViewComponent } from "./faq-section-view.component";
import { MaterialModule } from "../../../shared/material.module";
import { Faq } from "../faq.model";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { DomSanitizer, SafeValue } from "@angular/platform-browser";
import { RouterTestingModule } from "@angular/router/testing";

describe("FaqViewComponent", () => {
    const mockDomSanitzer: Partial<DomSanitizer> = {
        sanitize: (
            context: SecurityContext,
            value: string | SafeValue | null,
        ) => (value || "") as string,
    };

    const faq: Faq = {
        topEntries: [],
        sections: [
            {
                title: "Section A",
                urlFragment: "sectiona",
                entries: [
                    { question: "Q1", answer: "A1" },
                    { question: "Q2", answer: "A2" },
                ],
            },
            {
                title: "Section B",
                urlFragment: "sectionb",
                entries: [{ question: "Q3", answer: "A1" }],
            },
        ],
    };

    let component: FaqViewComponent;
    let fixture: ComponentFixture<FaqViewComponent>;

    beforeEach(waitForAsync(() => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        TestBed.configureTestingModule({
            declarations: [FaqViewComponent, FaqSectionViewComponent],
            imports: [
                RouterTestingModule,
                MaterialModule,
                NoopAnimationsModule,
            ],
            providers: [
                {
                    provide: DomSanitizer,
                    useValue: mockDomSanitzer as DomSanitizer,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        })
            .compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(FaqViewComponent);
                component = fixture.componentInstance;
                component.faq = faq;
                component.activeFragment = null;
                fixture.detectChanges();
            });
    }));

    it("should create the component", () => {
        expect(component).toBeTruthy();
    });

    it("should render the component correctly", () => {
        expect(fixture).toMatchSnapshot();
    });
});
