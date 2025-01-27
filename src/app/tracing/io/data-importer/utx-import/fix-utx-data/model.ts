export interface ErrorFix {
    path: string;
    issueMsg?: string;
    isCleaningFix?: false;
    fix: string;
    fixDetails?: string;
}

export interface CleaningFix {
    path: string;
    isCleaningFix: true;
    cleanedValue: string;
}

export type IssueFix = ErrorFix | CleaningFix;
