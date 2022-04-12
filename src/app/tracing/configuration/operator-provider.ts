import { OperationType } from '../data.model';

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

const operatorMap: { [key in OperationType]: OperatorFunCreatorFun } = {
    [OperationType.LESS]: createLessOpFun,
    [OperationType.GREATER]: createGreaterOpFun,
    [OperationType.EQUAL]: createEqualOpFun,
    [OperationType.NOT_EQUAL]: createNotEqualOpFun,
    [OperationType.CONTAINS]: createContainsOpFun,
    [OperationType.REGEX_EQUAL]: createRegexEqualOpFun,
    [OperationType.REGEX_NOT_EQUAL]: createRegexNotEqualOpFun,
    [OperationType.REGEX_EQUAL_IGNORE_CASE]: createRegexEqualICOpFun,
    [OperationType.REGEX_NOT_EQUAL_IGNORE_CASE]: createRegexNotEqualICOpFun
};

export function createLessOpFun(strRefValue: string): OperatorFun {
    const numRefValue = +strRefValue;
    const isNumRef = !isNaN(numRefValue);

    return (
        isNumRef ?
            (x: SimpleValueType) => {
                if (x === undefined || x === null) {
                    return false;
                } else {
                    const xType = typeof x;
                    if (xType === 'number') {
                        return x < numRefValue;
                    } else if (xType === 'string') {
                        const numX = +(x as string);
                        const isNumX = !isNaN(numX);
                        if (isNumX) {
                            return numX < numRefValue;
                        }
                        return (x as string).localeCompare(strRefValue) < 0;
                    } else {
                        return (x + '').localeCompare(strRefValue) < 0;
                    }
                }
            } :
            (x: SimpleValueType) => valueToStr(x).localeCompare(strRefValue) < 0
    );
}

export function createGreaterOpFun(refValue: SimpleValueType): OperatorFun {
    const strRef = valueToStr(refValue);
    const numRef: number = typeof refValue === 'number' ? refValue : +strRef;
    const isNumRef = !isNaN(numRef);

    return (
        isNumRef ?
            (x: SimpleValueType) => {
                if (x === undefined || x === null) {
                    return false;
                } else {
                    const xType = typeof x;
                    if (xType === 'number') {
                        return x > numRef;
                    } else if (xType === 'string') {
                        const numX = +(x as string);
                        const isNumX = !isNaN(numX);
                        if (isNumX) {
                            return numX > numRef;
                        }
                        return (x as string).localeCompare(strRef) > 0;
                    } else {
                        return (x + '').localeCompare(strRef) > 0;
                    }
                }
            } :
            (x: SimpleValueType) => valueToStr(x).localeCompare(strRef) > 0
    );
}

export function createEqualOpFun(refValue: SimpleValueType): OperatorFun {
    const strRef = valueToStr(refValue);
    const strRefLCase = strRef.toLowerCase();
    const numRef = +strRef;
    const bolRef = (
        strRefLCase === 'true' || numRef === 1 ? true :
            strRefLCase === 'false' || numRef === 0 ? false :
                undefined
    );

    return (x: SimpleValueType) => {
        if (x === undefined || x === null) {
            return false;
        } else if (typeof x === 'boolean') {
            return x === bolRef;
        } else {
            return valueToStr(x) === strRef;
        }
    };
}

export function createNotEqualOpFun(refValue: SimpleValueType): OperatorFun {
    const strRef = valueToStr(refValue);
    const strRefLCase = strRef.toLowerCase();
    const numRef = +strRef;
    const bolRef = (
        strRefLCase === 'true' || numRef === 1 ? true :
            strRefLCase === 'false' || numRef === 0 ? false :
                undefined
    );

    return (x: SimpleValueType) => {
        if (x === undefined || x === null) {
            return false;
        } else if (typeof x === 'boolean') {
            return x !== bolRef;
        } else {
            return valueToStr(x) !== strRef;
        }
    };
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

export function createOperatorFun(operatorType: OperationType, refValue: SimpleValueType): OperatorFun {
    return operatorMap[operatorType](refValue);
}
