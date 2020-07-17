import { ExtendedOperationType } from './configuration.model';

type SimpleValueType = string | number | boolean | undefined | null;
type OperatorFun = (value: SimpleValueType) => boolean;
type OperatorFunCreatorFun = (value: SimpleValueType) => OperatorFun;

function valueToStr(value: SimpleValueType): string {
    if (value === undefined || value === null) {
        return '';
    } else {
        return (
            typeof value === 'string'
                ? value
                : value.toString()
        );
    }
}

const operatorMap: { [key in ExtendedOperationType]: OperatorFunCreatorFun } = {
    [ExtendedOperationType.LESS]: createLessOpFun,
    [ExtendedOperationType.GREATER]: createGreaterOpFun,
    [ExtendedOperationType.EQUAL]: createEqualOpFun,
    [ExtendedOperationType.NOT_EQUAL]: createNotEqualOpFun,
    [ExtendedOperationType.CONTAINS]: createContainsOpFun,
    [ExtendedOperationType.REGEX_EQUAL]: createRegexEqualOpFun,
    [ExtendedOperationType.REGEX_NOT_EQUAL]: createRegexNotEqualOpFun,
    [ExtendedOperationType.REGEX_EQUAL_IGNORE_CASE]: createRegexEqualICOpFun,
    [ExtendedOperationType.REGEX_NOT_EQUAL_IGNORE_CASE]: createRegexNotEqualICOpFun
};

export function createLessOpFun(refValue: SimpleValueType): OperatorFun {
    const strRef = valueToStr(refValue);
    const numRef: number = typeof refValue === 'number' ? refValue : +strRef;
    const isNumRef = !isNaN(numRef);

    return (x: SimpleValueType) => {
        const strX = valueToStr(x);
        return isNumRef && typeof x === 'number' ?
            x < numRef :
            strX.localeCompare(strRef) < 0
        ;
    };
}

export function createGreaterOpFun(refValue: SimpleValueType): OperatorFun {
    const strRef = valueToStr(refValue);
    const numRef: number = typeof refValue === 'number' ? refValue : +strRef;
    const isNumRef = !isNaN(numRef);

    return (x: SimpleValueType) =>
        isNumRef && typeof x === 'number' ?
        x > numRef :
        valueToStr(x).localeCompare(strRef) > 0
    ;
}

export function createEqualOpFun(refValue: SimpleValueType): OperatorFun {
    const strRef = valueToStr(refValue);

    return (x: SimpleValueType) => valueToStr(x) === strRef;
}

export function createNotEqualOpFun(refValue: SimpleValueType): OperatorFun {
    const strRef = valueToStr(refValue);

    return (x: SimpleValueType) => valueToStr(x) !== strRef;
}

export function createContainsOpFun(refValue: SimpleValueType): OperatorFun {
    const strRef = valueToStr(refValue).toLowerCase();

    return (x: SimpleValueType) => valueToStr(x).toLowerCase().includes(strRef);
}

function createRegExp(pattern: string, ignoreCase?: boolean): RegExp {
    try {
        return new RegExp(pattern, ignoreCase ? 'i' : undefined);
    } catch (e) {}

    return null;
}

export function createRegexEqualOpFun(refValue: SimpleValueType): OperatorFun {
    const regex = createRegExp(valueToStr(refValue));

    return (x: SimpleValueType) => regex && regex.test(valueToStr(x));
}

export function createRegexNotEqualOpFun(refValue: SimpleValueType): OperatorFun {
    const regex = createRegExp(valueToStr(refValue));

    return (x: SimpleValueType) => regex && !regex.test(valueToStr(x));
}

export function createRegexEqualICOpFun(refValue: SimpleValueType): OperatorFun {
    const regex = createRegExp(valueToStr(refValue), true);

    return (x: SimpleValueType) => regex && regex.test(valueToStr(x));
}

export function createRegexNotEqualICOpFun(refValue: SimpleValueType): OperatorFun {
    const regex = createRegExp(valueToStr(refValue), true);

    return (x: SimpleValueType) => regex && !regex.test(valueToStr(x));
}

export function createOperatorFun(operatorType: ExtendedOperationType, refValue: SimpleValueType): OperatorFun {
    return operatorMap[operatorType](refValue);
}
