export const contentPathsSegments = {
    content: 'content',
    faq: 'faq',
    dataProtectionDeclaration: 'dataprotectiondeclaration',
    dataProtectionNotice: 'dataprotectionnotice'
};

export const contentPaths = {
    faq: '/' + contentPathsSegments.content + '/' + contentPathsSegments.faq,
    dataProtectionDeclaration:  '/' + contentPathsSegments.content + '/' + contentPathsSegments.dataProtectionDeclaration,
    dataProtectionNotice: '/' + contentPathsSegments.content + '/' + contentPathsSegments.dataProtectionNotice
};
