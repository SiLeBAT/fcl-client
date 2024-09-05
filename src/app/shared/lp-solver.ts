import { ConsoleTextColor, createColoredConsoleMsg } from '@app/tracing/util/console-utils';
import * as Solver from 'javascript-lp-solver';

export type VariableId = string;
export type ConstraintId = string;
export type Term = Record<VariableId, number>;
export type OptimizationType = 'min' | 'max';

interface Constraint {
    id: ConstraintId;
    label: string;
    term: Term;
    lb: number | null;
    ub: number | null;
    termValue: number | undefined;
}

interface Objective {
    term: Term;
    termValue: number | undefined;
    optimizationType: OptimizationType;
}

interface Differences {
    absDiff: number;
    relDiff: number;
}

function getRoundedValue(coeff: number, minMantissaLength = 3, epsilon = 1e-6): number {
    const absCoeff = Math.abs(coeff);
    const integerRoundBound = Math.pow(10, minMantissaLength - 1);
    if (Math.abs(coeff) >= integerRoundBound) {
        return Math.round(coeff);
    } else if (absCoeff <= epsilon) {
        return 0;
    } else {
        const logAbsValue = Math.log10(absCoeff);
        const dp = Math.floor(logAbsValue);
        const factor = Math.pow(10, minMantissaLength - dp - 1);
        return Math.round(coeff * factor) / factor;
    }
}

export class LPResult {
    feasible: boolean;
    bounded: boolean;
    objective: number;
    vars: Map<string, number>;

    constructor(result: any, lpModel: LPModel) {
        this.feasible = result['feasible'];
        this.bounded = result['bounded'];
        this.objective = result['result'];
        this.vars = new Map<string, number>();

        for (const variableId of lpModel.getVariableIds()) {
            this.vars.set(variableId, result[variableId]);
            if (isNaN(result[variableId])) {
                this.vars.set(variableId, 0);
            }
        }
    }
}

export function lpSolve(model: LPModel, timeLimit?: number): LPResult {
    const solver = Solver;

    let rawModel: any;
    if (timeLimit !== undefined && Number.isFinite(timeLimit)) {
        rawModel = {};
        Object.assign(rawModel, model.getModel());

        rawModel.options = {
            timeout: timeLimit
        };
    } else {
        rawModel = model.getModel();
    }
    const result: any = solver.Solve(rawModel);

    return new LPResult(result, model);
}

export class LPModel {
    private static readonly OBJECTIVE = 'objective';
    private static readonly CONSTRAINTS = 'constraints';
    private static readonly VARS = 'variables';
    private static readonly OPTYPE_MIN: OptimizationType = 'min';
    private static readonly OPTYPE_MAX: OptimizationType = 'max';
    private static readonly OPTYPE = 'opType';
    private static readonly OPTIMIZE = 'optimize';
    private static readonly BINS = 'binaries';

    private model: any = {
        variables: {},
        constraints: {},
        optimize: LPModel.OBJECTIVE
    };
    private constraintCount: number = 0;
    private constraintsLabelToIdMap = new Map<string, string>();
    private constraintIdToLabelMap = new Map<string, string>();
    private constraintIds: string[] = [];

    addConstraint(
        constraintLabel: string,
        min: number | null,
        max: number | null,
        term: Term
    ) {
        const constraintId: string = 'C' + (++this.constraintCount).toString();
        this.constraintsLabelToIdMap.set(constraintLabel, constraintId);
        this.constraintIdToLabelMap.set(constraintId, constraintLabel);
        this.constraintIds.push(constraintId);
        this.model[LPModel.CONSTRAINTS][constraintId] = {};
        if (min != null) {
            this.model[LPModel.CONSTRAINTS][constraintId][LPModel.OPTYPE_MIN] = min;
        }
        if (max != null) {
            this.model[LPModel.CONSTRAINTS][constraintId][LPModel.OPTYPE_MAX] = max;
        }
        for (const varName of Object.getOwnPropertyNames(term)) {
            if (!Object.prototype.hasOwnProperty.call(this.model[LPModel.VARS], varName)) {
                this.model[LPModel.VARS][varName] = {};
            }
            this.model[LPModel.VARS][varName][constraintId] = term[varName];
        }
    }

    addDoubleBoundConstraint(
        constraintsLabelPrefix: string,
        term: Term,
        boundTerm: Term
    ) {
        // add term <= boundTerm  aka. term - boundTerm <= 0
        this.addConstraint(
            constraintsLabelPrefix + 'UB', null, 0,
            this.mergeTerms(term, this.getMinusTerm(boundTerm))
        );
        // add term >= -boundTerm  aka. term + boundTerm >= 0
        this.addConstraint(
            constraintsLabelPrefix + 'LB', 0, null,
            this.mergeTerms(term, boundTerm)
        );
    }

    private mergeTerms(term1: Term, term2: Term): Term {
        const mergedTerm = { ...term1 };
        Object.keys(term2).forEach(key => {
            const oldValue = mergedTerm[key];
            if (oldValue === undefined) {
                mergedTerm[key] = term2[key];
            } else {
                mergedTerm[key] = oldValue + term2[key];
            }
        });
        return mergedTerm;
    }

    private getMinusTerm(term: Term): Term {
        const minusTerm: Term = {};
        Object.keys(term).forEach(key => minusTerm[key] = -term[key]);
        return minusTerm;
    }

    setObjective(opType: OptimizationType, objective: Term) {
        this.model[LPModel.OPTYPE] = opType;
        for (const varName of Object.getOwnPropertyNames(objective)) {
            if (!Object.prototype.hasOwnProperty.call(this.model[LPModel.VARS], varName)) {
                this.model[LPModel.VARS][varName] = {};
            }
            this.model[LPModel.VARS][varName][LPModel.OBJECTIVE] = objective[varName];
        }
    }
    setBinaryVariables(vars: string[]) {
        const binaries = {};
        for (const varName of vars) {
            binaries[varName] = 1;
        }
        this.model[LPModel.BINS] = binaries;
        for (const varName of vars) {
            if (!Object.prototype.hasOwnProperty.call(this.model[LPModel.VARS], varName)) {
                this.model[LPModel.VARS][varName] = { [varName]: 1 };
            } else {
                this.model[LPModel.VARS][varName][varName] = 1;
            }
        }
    }

    setObjectiveCoefficient(variableId: VariableId, coeff: number) {
        if (!Object.prototype.hasOwnProperty.call(this.model[LPModel.VARS], variableId)) {
            this.model[LPModel.VARS][variableId] = { [variableId]: 1 };
        }
        this.model[LPModel.VARS][variableId][LPModel.OBJECTIVE] = coeff;
    }

    getModel(): any {
        return this.model;
    }

    getVariableIds(): string[] {
        return Object.getOwnPropertyNames(this.model[LPModel.VARS]);
    }

    getConstraintIds(): string[] {
        return Object.getOwnPropertyNames(this.model[LPModel.CONSTRAINTS]);
    }

    printConstraints(lpResult: LPResult | null): void {
        // eslint-disable-next-line no-console
        console.log('Constraints:');
        const sortedConstraintIds = this.getSortedConstraintIds();
        for (const constraintId of sortedConstraintIds) {
            const constraint = this.getConstraint(constraintId, lpResult);
            const conText = this.termToString(constraint.term, constraint.termValue, lpResult);

            const checkBounds = constraint.termValue !== undefined;
            const checkLB = checkBounds && constraint.lb !== null;
            const checkUB = checkBounds && constraint.ub !== null;
            const lbMsg = (
                checkLB ?
                    (
                        this.getResidualMsg(constraint.lb!, constraint.termValue!) +
                        this.getViolationMsg(constraint.lb!, constraint.termValue!)
                    ) :
                    ''
            );
            const ubMsg = (
                checkUB ?
                    (
                        this.getViolationMsg(constraint.termValue!, constraint.ub!) +
                        this.getResidualMsg(constraint.termValue!, constraint.ub!)
                    ) :
                    ''
            );
            const text =
                constraint.label +
                ' ' +
                lbMsg + (lbMsg === '' ? '' : ' ') +
                (constraint.lb === null ? '' : getRoundedValue(constraint.lb) + ' <= ') +
                conText +
                (constraint.termValue === undefined ? '' : (' = ' + getRoundedValue(constraint.termValue))) +
                (constraint.ub === null ? '' : ' <= ' + getRoundedValue(constraint.ub)) +
                (ubMsg === '' ? '' : ' ') + ubMsg;

            // eslint-disable-next-line no-console
            console.log(text);
        }
    }

    printObjective(lpResult: LPResult | null): void {
        const objective = this.getObjective(lpResult);

        const objectiveText = objective.optimizationType + ': ' + this.termToString(objective.term, objective.termValue, lpResult);

        // eslint-disable-next-line no-console
        console.log('Objective:\n' + objectiveText);
    }

    printVars(lpResult: LPResult): void {
        const variableIds = this.getSortedVariableIds();
        // eslint-disable-next-line no-console
        console.log('Variables:');
        for (const variableId of variableIds) {
            const roundedVarValue = getRoundedValue(this.getVariableValue(variableId, lpResult));
            // eslint-disable-next-line no-console
            console.log(variableId + ': ' + roundedVarValue);
        }
    }

    printResult(lpResult: LPResult): void {
        this.printObjective(lpResult);
        this.printConstraints(lpResult);
        this.printVars(lpResult);
    }

    private getTermVariables(term: Term): VariableId[] {
        return Object.keys(term);
    }

    private getSortedVariableIds(variableIds?: string[]): string[] {
        if (variableIds === undefined) {
            variableIds = this.getVariableIds();
        }
        return variableIds.slice().sort();
    }

    private getSortedConstraintIds(): string[] {
        return this.getConstraintIds().sort(
            (conId1, conId2) => this.constraintIdToLabelMap.get(conId1)!.localeCompare(this.constraintIdToLabelMap.get(conId2)!)
        );
    }

    private isVariableInConstraint(variableId: string, constraintId: string): boolean {
        return Object.prototype.hasOwnProperty.call(this.model[LPModel.VARS][variableId], constraintId);
    }

    private getCoeff(variableId: VariableId, constraintId: ConstraintId): number | undefined {
        return this.model[LPModel.VARS][variableId][constraintId];
    }

    private getLB(constraintId: ConstraintId): number | null {
        const lb = this.model[LPModel.CONSTRAINTS][constraintId][LPModel.OPTYPE_MIN];
        return lb === null || lb === undefined ? null : lb;
    }

    private getUB(constraintId: ConstraintId): number | null {
        const ub = this.model[LPModel.CONSTRAINTS][constraintId][LPModel.OPTYPE_MAX];
        return ub === null || ub === undefined ? null : ub;
    }

    private getTermValue(term: Term, lpResult: LPResult): number {
        let value = 0;
        for (const variableId of Object.keys(term)) {
            value += term[variableId] * this.getVariableValue(variableId, lpResult);
        }
        return value;
    }

    private getVariableValue(variableId: VariableId, lpResult: LPResult): number {
        return lpResult.vars.get(variableId)!;
    }

    private getDifferences(lessOrEqValue: number, greaterOrEqValue: number): Differences {
        const absDiff = Math.abs(lessOrEqValue - greaterOrEqValue);
        return {
            absDiff: absDiff,
            relDiff: absDiff / Math.max(Math.abs(lessOrEqValue), Math.abs(greaterOrEqValue))
        };
    }

    private getViolationMsg(lessOrEqValue: number, greaterOrEqValue: number, violationTreshold?: number): string {
        violationTreshold = violationTreshold || 1e-6;
        if (lessOrEqValue <= greaterOrEqValue) {
            return '';
        } else {
            const diffs = this.getDifferences(lessOrEqValue, greaterOrEqValue);
            if (diffs.relDiff > violationTreshold && diffs.absDiff > violationTreshold) {
                const text = '[aV: ' + getRoundedValue(diffs.absDiff) + ', rV: ' + getRoundedValue(diffs.relDiff) + ']';
                return createColoredConsoleMsg(text, ConsoleTextColor.RED);
            } else {
                return '';
            }
        }
    }

    private getResidualMsg(lessOrEqValue: number, greaterOrEqValue: number, residualTreshold?: number): string {
        residualTreshold = residualTreshold || 1e-6;
        if (lessOrEqValue >= greaterOrEqValue) {
            return '';
        } else {
            const absResidual = greaterOrEqValue - lessOrEqValue;
            const relResidual = absResidual / Math.max(Math.abs(lessOrEqValue), Math.abs(greaterOrEqValue));
            if (relResidual > residualTreshold && absResidual > residualTreshold) {
                const text = '[aR: ' + getRoundedValue(absResidual) + ', rR: ' + getRoundedValue(relResidual) + ']';
                return createColoredConsoleMsg(text, ConsoleTextColor.GREEN);
            } else {
                return '';
            }
        }
    }

    private getConstraint(constraintId: ConstraintId, lpResult: LPResult | null): Constraint {
        const term = this.getTerm(constraintId);
        return {
            id: constraintId,
            label: this.constraintIdToLabelMap.get(constraintId)!,
            term: term,
            lb: this.getLB(constraintId),
            ub: this.getUB(constraintId),
            termValue: lpResult === null ? undefined : this.getTermValue(term, lpResult)
        };
    }

    private termToString(term: Term, termValue: number | undefined, lpResult: LPResult | null): string {
        let result = '';
        const variableIds = this.getSortedVariableIds(this.getTermVariables(term));
        for (const variableId of variableIds) {
            const coeff = term[variableId];
            const absCoeff = Math.abs(coeff);
            const roundedAbsCoeff = getRoundedValue(absCoeff);
            const absSubTerm = (roundedAbsCoeff !== 1 ? roundedAbsCoeff + ' ' : '') + variableId;
            const isFirstTerm = result === '';
            const strOperator = isFirstTerm ? (coeff < 0 ? '-' : '') : (coeff < 0 ? ' - ' : ' + ');
            result += strOperator + absSubTerm;

            if (lpResult !== null) {
                const variableValue = this.getVariableValue(variableId, lpResult);
                const roundedVariableValue = getRoundedValue(variableValue);
                result += '[' + roundedVariableValue + ']';
            }
        }
        result += (termValue === undefined ? '' : (' = ' + getRoundedValue(termValue)));
        return result;
    }

    private getTerm(id: string, variableIds?: VariableId[]): Term {
        variableIds = variableIds !== undefined ? variableIds : this.getVariableIds();
        const term: Term = {};
        variableIds.forEach(variableId => {
            if (this.isVariableInConstraint(variableId, id)) {
                term[variableId] = this.getCoeff(variableId, id)!;
            }
        });
        return term;
    }

    private getObjective(lpResult: LPResult | null): Objective {
        const term = this.getTerm(LPModel.OPTIMIZE);
        const termValue = lpResult === null ? undefined : this.getTermValue(term, lpResult);
        return {
            term: term,
            termValue: termValue,
            optimizationType: this.getOptimizationType()
        };
    }

    private getOptimizationType(): OptimizationType {
        return this.model[LPModel.OPTYPE];
    }
}
