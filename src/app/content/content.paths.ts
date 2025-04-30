export const contentPathsSegments = {
    content: "content",
    faq: "faq",
    help: "help",
    dataProtectionDeclaration: "dataprotectiondeclaration",
    dataProtectionNotice: "dataprotectionnotice",
};

export const contentPaths = {
    faq: "/" + contentPathsSegments.content + "/" + contentPathsSegments.faq,
    help: "/" + contentPathsSegments.content + "/" + contentPathsSegments.help,
    dataProtectionDeclaration:
        "/" +
        contentPathsSegments.content +
        "/" +
        contentPathsSegments.dataProtectionDeclaration,
    dataProtectionNotice:
        "/" +
        contentPathsSegments.content +
        "/" +
        contentPathsSegments.dataProtectionNotice,
};
