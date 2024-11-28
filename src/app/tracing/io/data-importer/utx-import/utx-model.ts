export type Uuid = string;
export type ActivityId = string;
export type ContactId = string;
export type FboId = string;
export type InformationSourceId = string;
export type InvestigationId = string;
export type LogisticUnitId = string;
export type RegistrationSchemeId = string;
export type SampleId = string;
export type StationId = string;
export type ProductId = string;
export type LotId = string;
export type TruId = string;
export type UTXPortalLoginId = string;
export type CV_AddressCounty = string;
export type CV_AddressCountry = string;
export type CV_AmbientControl = string;
export type CV_AuditOutcomeClassification = string;
export type CV_ContaminationType = string;
export type CV_DocumentType = string;
export type CV_FboSector = string;
export type CV_FoodEx2Code = string;
export type CV_InvestigationType = string;
export type CV_InvestigationStatusType = string;
export type CV_ProductPackageType = string;
export type CV_ReferenceActivityType = string;
export type CV_FoodChainStage = string;
export type CV_StationClass = string;
export type CV_FoodChainSector = string;
export type CV_StorageRotationRules = string;
export type CV_StorageSeparation = string;
export type CV_TransportationMean = string;
export type CV_ProductionMethod = string;
export type CV_AmountUnit = string;
export type CV_ExpiryDateType = string;
export type CV_PointType = string;
export type CV_ActivityPrimaryType = string;
export type CV_ProcessingStep = string;
export type CV_FoodSafetyChange = string;
export type CV_BorderEu = string;
export type CV_LogisticUnitType = string;
export type CV_ProtectionType = string;
export type CV_RegistrationType = "Individual" | "Cooperative";
export type CV_RegistrationLevel = "FBO" | "Station" | "ProductionLine";
export type CV_ContactType = "Station" | "FBO" | "Personal";

export type FK_UTXPortalLoginName = string;
export type FK_UTXPortalLoginInstitution = string;
export type FK_UTXPortalLoginUnit = string;
export type FK_UTXPortalLoginContact = string;

export type DateTime = string; // 'yyyy-MM-dd HH:mm' ?? 'yyyy[-MM[-dd[ HH:mm]]]'
export type DateType = string; // 'yyyy-MM-dd'
export type Url = string;
export type Duration1 = string; // 'MM-dd'
export type Phone = string;
export type Email = string;

export type Duration2 = string;
export type NonNegInteger = number;

export type FboKey = keyof Fbo;
export type StationKey = keyof Station;
export type ProductKey = keyof Product;
export type ContactKey = keyof Contact;
export type LotKey = keyof Lot;
export type UtxRevId = string;

export type HistoryRecord<T> = ActiveRecord<T> | DeletionRecord;

export interface ActiveChange {
    correctionOf: Uuid[];
    correctionType: "edit" | "merge" | "split" | "undelete";
    correctionReason?: string;
}

export type ActiveRecord<T> = T | (T & ActiveChange);
export interface DeletionRecord
    extends Pick<Fbo, "id" | "lastEvaluationAt" | "informationSources">,
        Omit<ActiveChange, "correctionType"> {
    correctionType: "delete";
}

interface ActiveAndHistoryRecords<T> {
    current?: ActiveRecord<T>[];
    history?: HistoryRecord<T>[];
}

export interface UtxCore {
    fbo?: ActiveAndHistoryRecords<Fbo>;
    station?: ActiveAndHistoryRecords<Station>;
    activity?: ActiveAndHistoryRecords<Activity>;
    product?: ActiveAndHistoryRecords<Product>;
    lot?: ActiveAndHistoryRecords<Lot>;
    tru?: ActiveAndHistoryRecords<Tru>;
    logisticUnit?: ActiveAndHistoryRecords<LogisticUnit>;
    informationSource?: ActiveAndHistoryRecords<InformationSource>;
    investigation?: ActiveAndHistoryRecords<Investigation>;
    contact?: ActiveAndHistoryRecords<Contact>;
    registrationScheme?: ActiveAndHistoryRecords<RegistrationScheme>;
}

export interface UtxData {
    utxCore: UtxCore;
}

export interface Registration {
    registrationScheme?: RegistrationSchemeId;
    registrationNumber?: string;
    registrationType?: CV_RegistrationType;
}

export interface Fbo {
    id: FboId;
    description?: string;
    fboNameAddress?: ContactId;
    website?: string;
    activityStart?: DateTime;
    activityEnd?: DateTime;
    registrations?: Registration[];
    personalContacts?: ContactId[];
    informationSources?: InformationSourceId[];
    comments?: string;
    investigations?: InvestigationId[];
    lastEvaluationAt?: DateTime;
}

export interface Station {
    id: StationId;
    description?: string;
    contactFbo?: FboId;
    nonFboContacts?: ContactId[];
    transportationMeanCV?: CV_TransportationMean[];
    transportationMeanFreeText?: string[];
    stationNameAddress?: ContactId;
    class?: CV_StationClass;
    sectorCV?: CV_FoodChainSector[];
    sectorFreeText?: string[];
    stageCV?: CV_FoodChainStage[];
    stageFreeText?: string[];
    pictures?: InformationSourceId[];
    activityStart?: DateTime;
    activityEnd?: DateTime;
    extent?: string;
    storageDescription?: string;
    transportDescription?: string;
    storageSeparationCV?: CV_StorageSeparation[];
    storageSeparationFreeText?: string[];
    ambientControlCV?: CV_AmbientControl[];
    ambientControlFreeText?: string[];
    storageRotationRulesCV?: CV_StorageRotationRules;
    storageRotationRulesFreeText?: string;
    cleaningPeriodDescription?: string;
    cleaningPeriodDays?: NonNegInteger;
    hygieneCriteria?: string;
    hygieneControlCompliance?: string;
    auditDate?: DateType;
    auditTraceability?: string;
    auditOutcomeSummary?: string;
    auditOutcomeClassification?: CV_AuditOutcomeClassification;
    registrations?: Registration[];
    informationSources?: InformationSourceId[];
    haccp?: InformationSourceId[];
    qualityPlan?: InformationSourceId[];
    hygieneMonitoring?: InformationSourceId[];
    storageMonitoring?: InformationSourceId[];
    comments?: string;
    investigations?: InvestigationId[];
    lastEvaluationAt?: DateTime;
}

export interface TruInput {
    truIds?: TruId[];
    quantityNumber?: number;
    quantityUnit?: CV_AmountUnit;
    isNetQuantity?: boolean;
    tradeUnitCount?: number;
    tradeUnits?: string[];
    useStart?: DateTime;
    useEnd?: DateTime;
    ambientControlCV?: CV_AmbientControl;
    ambientControlFreeText?: string;
    storageRotationRulesCV?: CV_StorageRotationRules;
    storageRotationRulesFreeText?: string;
    turnover?: Duration2;
}

interface TruOutput {
    truIds?: TruId[];
    quantityNumber?: number;
    quantityUnit?: CV_AmountUnit;
    isNetQuantity?: boolean;
    tradeUnitCount?: number;
    tradeUnits?: string[];
    useStart?: DateTime;
    useEnd?: DateTime;
    ambientControlCV?: CV_AmbientControl;
    ambientControlFreeText?: string;
    storageRotationRulesCV?: CV_StorageRotationRules;
    storageRotationRulesFreeText?: string;
}

export interface Activity {
    id: ActivityId;
    activityDescription?: string;
    stationId?: StationId;
    activityStart?: DateTime;
    activityEnd?: DateTime;
    activityPrimaryTypeCV?: CV_ActivityPrimaryType[];
    activityPrimaryTypeFreeText?: string[];
    truInput?: TruInput[];
    truOutput?: TruOutput[];
    productionLineDescription?: string;
    productionLinePictures?: InformationSourceId[];
    equipment?: string;
    cleaning?: DateTime;
    extent?: string;
    continuousActivity?: boolean;
    processingStepsCV?: CV_ProcessingStep[];
    processingStepsFreeText?: string[];
    foodSafetyChange?: CV_FoodSafetyChange;
    foodSafetyChangeReasoning?: string;
    hygiene?: string;
    qualityControlCompliance?: string;
    hygieneControlCompliance?: string;
    auditTraceability?: string;
    storageConditionsCompliance?: string;
    transportConditionsCompliance?: string;
    borderEu?: CV_BorderEu;
    informationSources?: InformationSourceId[];
    investigationId?: InvestigationId;
    documentation?: InformationSourceId[];
    monitoringQuality?: InformationSourceId[];
    monitoringHygiene?: InformationSourceId[];
    monitoringStorage?: InformationSourceId[];
    monitoringTransport?: InformationSourceId[];
    certificate?: InformationSourceId[];
    order?: InformationSourceId[];
    comments?: string;
    investigations?: InvestigationId[];
    lastEvaluationAt?: DateTime;
}

export interface Tru {
    id: TruId;
    statusDescription?: string;
    lotId?: LotId;
    luId?: LogisticUnitId;
    stationId?: StationId;
    statusStart?: DateTime;
    statusEnd?: DateTime;
    netAmountQuantity?: number;
    netAmountUnit?: CV_AmountUnit;
    tradeUnitCount?: number;
    tradeUnits?: string[];
    pointType?: CV_PointType;
    extent?: string;
    pictures?: InformationSourceId[];
    qualityControl?: string;
    hygieneControl?: string;
    storageConditionsCompliance?: string;
    transportConditionsCompliance?: string;
    imexportRegulationsCompliance?: string;
    informationSources?: InformationSourceId[];
    comments?: string;
    investigations?: InvestigationId[];
    lastEvaluationAt?: DateTime;
}

export interface Product {
    id: ProductId;
    description?: string;
    producer?: FboId;
    brandName?: string;
    labelName?: string;
    registrationScheme?: RegistrationSchemeId;
    registrationNumber?: string;
    productionPeriodFrom?: DateTime;
    productionPeriodUntil?: DateTime;
    packageTypeCV?: CV_ProductPackageType;
    packageTypeFreeText?: string;
    foodEx2Code?: CV_FoodEx2Code;
    isReadyToEat?: boolean;
    productionExtent?: string;
    productPictures?: InformationSourceId[];
    otherIdentifiers?: string;
    legalName?: string;
    speciesName?: string;
    productionMethods?: CV_ProductionMethod[];
    productionMethodsOther?: string;
    certificates?: string;
    countryOfOrigin?: CV_AddressCountry;
    lotQualityAndGrading?: string;
    typeOfTradeUnits?: string;
    tradeUnitNetAmountQuantity?: number;
    tradeUnitNetAmountUnit?: CV_AmountUnit;
    tradeUnitCode?: string;
    consumerUnitsPerTradeUnit?: number;
    typeOfConsumerUnits?: string;
    consumerUnitNetAmountQuantity?: number;
    consumerUnitNetAmountUnit?: CV_AmountUnit;
    consumerUnitCode?: string;
    productConditions?: string;
    durability?: Duration1;
    durabilityTypeCV?: CV_ExpiryDateType;
    durabilityTypeFreeText?: string;
    intendedUse?: string;
    storageRecommendationsForConsumer?: string;
    preparationRecommendationsForConsumer?: string;
    logisticUnitPackingInstructions?: string;
    storageMethod?: string;
    storageTemperature?: string;
    storageHumidity?: string;
    transportConditions?: string;
    qualityControlPhysicalParameter?: string;
    qualityControlMicrobialParameter?: string;
    ingredients?: Ingredient[];
    allergens?: Allergen[];
    informationSources?: InformationSourceId[];
    specification?: InformationSourceId[];
    comments?: string;
    investigations?: InvestigationId[];
    lastEvaluationAt?: DateTime;
}

export interface Lot {
    id: LotId;
    shortDescription?: string;
    lotIdentifier?: string;
    productId?: ProductId;
    netAmountQuantity?: number;
    netAmountUnit?: CV_AmountUnit;
    tradeUnitCount?: number;
    tradeUnits?: string[];
    labelPictures?: InformationSourceId[];
    productionPeriodStart?: DateTime;
    productionPeriodEnd?: DateTime;
    firstSaleOn?: DateTime;
    durabilityDate?: DateTime;
    durabilityTypeCV?: CV_ExpiryDateType;
    durabilityTypeFreeText?: string;
    productionMethodsClassCV?: CV_ProductionMethod[];
    productionMethodsClassFreeText?: string[];
    productionMethodDescription?: string;
    certificates?: string;
    countryOfOrigin?: CV_AddressCountry;
    qualityAndGradingClass?: string;
    additionalSpecifications?: string;
    informationSources?: InformationSourceId[];
    comments?: string;
    investigations?: InvestigationId[];
    lastEvaluationAt?: DateTime;
}

interface LogisticUnitTru {
    truId?: TruId;
    netAmountQuantity?: number;
    netAmountUnit?: CV_AmountUnit;
    tradeUnitCount?: number;
    tradeUnits?: string[];
}
export interface LogisticUnit {
    id: LogisticUnitId;
    typeCV?: CV_LogisticUnitType;
    typeFreeText?: string;
    logisticProvider?: FboId;
    registrationScheme?: RegistrationSchemeId;
    registrationNumber?: string;
    description?: string;
    pictures?: InformationSourceId[];
    loadingDate?: DateTime;
    unloadingDate?: DateTime;
    protectionTypeCV?: CV_ProtectionType;
    protectionTypeFreeText?: string;
    sealNumber?: string;
    trus?: LogisticUnitTru[];
    informationSources?: InformationSourceId[];
    packingList?: InformationSourceId;
    comments?: string;
    investigations?: InvestigationId[];
    lastEvaluationAt?: DateTime;
}

export interface InformationSource {
    id: InformationSourceId;
    dataInputByName?: string;
    dataInputByInstitution?: string;
    dataInputByUnit?: string;
    dataInputByEmail?: Email;
    dataInputByPhone?: Phone;
    dataInputTime?: DateTime;
    description?: string;
    informationOwner?: ContactId;
    informationNumber?: string;
    createdOn?: DateType;
    documentTypeCV?: CV_DocumentType;
    documentTypeFreeText?: string;
    updatedOn?: DateType;
    informationSources?: InformationSourceId[];
    webSourceUrl?: Url;
    webSourceAccessDetails?: string;
    fileSource?: string;
    comments?: string;
    investigations?: InvestigationId[];
    lastEvaluationAt?: DateTime;
}

export interface Investigation {
    id: InvestigationId;
    contextDescription?: string;
    contaminationDescription?: string;
    findings?: string;
    typeCV?: CV_InvestigationType[];
    typeFreeText?: string[];
    statusType?: CV_InvestigationStatusType;
    contaminationTypeCV?: CV_ContaminationType;
    contaminationTypeFreeText?: string;
    leadingAuthority?: string;
    contactDetails?: ContactId;
    referenceActivity?: CV_ReferenceActivityType;
    start?: DateTime;
    end?: DateTime;
    ecdcEpisId?: string;
    rasffNotifications?: RasffNotification[];
    informationSources?: InformationSourceId[];
    mandates?: InformationSourceId[];
    reports?: InformationSourceId[];
    comments?: string;
    lastEvaluationAt?: DateTime;
}

export interface RegistrationScheme {
    id: RegistrationSchemeId;
    name?: string;
    isLegalRegister?: boolean;
    levelOfRegistration?: CV_RegistrationLevel;
    description?: string;
    institution?: string;
    contact?: ContactId;
    informationSources?: InformationSourceId[];
    comments?: string;
    lastEvaluationAt?: DateTime;
}

export interface Contact {
    id: ContactId;
    name?: string;
    role?: string;
    contactType?: CV_ContactType;
    addressStreet?: string;
    addressNumber?: string;
    addressOther?: string;
    addressBuilding?: string;
    addressZip?: string;
    addressCity?: string;
    addressCounty?: CV_AddressCounty;
    addressCountry?: CV_AddressCountry;
    latitude?: number;
    longitude?: number;
    addressStreetVisitor?: string;
    addressNumberVisitor?: string;
    addressOtherVisitor?: string;
    addressBuildingVisitor?: string;
    addressZipVisitor?: string;
    addressCityVisitor?: string;
    addressCountyVisitor?: CV_AddressCounty;
    addressCountryVisitor?: CV_AddressCountry;
    phoneNumberWork?: Phone;
    phoneNumberMobile?: Phone;
    phoneNumber3?: Phone;
    phoneNumber4?: Phone;
    faxNumber?: Phone;
    emailWork?: Email;
    emailPrivate?: Email;
    informationSources?: InformationSourceId[];
    comments?: string;
    lastEvaluationAt?: DateTime;
}

// SubTables
export interface RasffNotification {
    number?: string;
    title?: string;
    notificationDate?: DateType;
    notificationUrl?: Url;
}

export interface Ingredient {
    order?: NonNegInteger;
    ingredient?: string;
    percentage?: string;
    hasAllergenicPotential?: boolean;
    isGeneticallyModified?: boolean;
}

export interface Allergen {
    allergen?: string;
    isIngredient?: boolean;
}
