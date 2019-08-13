import * as Solver from 'javascript-lp-solver';

export class LPResult {
    feasible: boolean;
    bounded: boolean;
    objective: number;
    vars: Map<String, number>;

    constructor(result: any, lpModel: LPModel) {
        this.feasible = result['feasible'];
        this.bounded = result['bounded'];
        this.objective = result['result'];
        this.vars = new Map();

        for (const varName of lpModel.getVariableNames()) {
            this.vars.set(varName, result[varName.toString()]);
            if (isNaN(result[varName.toString()])) {
                this.vars.set(varName, 0);
            }
        }
    }
}

export function lpSolve(model: LPModel): LPResult {
    const solver = Solver;

    const result: any = solver.Solve(model.getModel());

    return new LPResult(result, model);
}

export class LPModel {
    private static readonly OBJECTIVE = 'objective';
    private static readonly CONSTRAINTS = 'constraints';
    private static readonly VARS = 'variables';
    static readonly MIN = 'min';
    static readonly MAX = 'max';
    private static readonly OPTYPE = 'opType';
    private static readonly OPTIMIZE = 'optimize';
    private static readonly BINS = 'binaries';

    private model: any = {
        variables: {},
        constraints: {},
        optimize: LPModel.OBJECTIVE
    };
    private constraintCount: number = 0;
    private constraintsLabelToIdMap: Map<string, string> = new Map();
    private constraintIdToLabelMap: Map<string, string> = new Map();
    private constraintIds: string[] = [];

    constructor() {}

    addConstraint(
        constraintLabel: string,
        min: number,
        max: number,
        constraint: Object
    ) {
        const constraintId: string = 'C' + (++this.constraintCount).toString();
        this.constraintsLabelToIdMap.set(constraintLabel, constraintId);
        this.constraintIdToLabelMap.set(constraintId, constraintLabel);
        this.constraintIds.push(constraintId);
        this.model[LPModel.CONSTRAINTS][constraintId] = {};
        if (min != null) {
            this.model[LPModel.CONSTRAINTS][constraintId][LPModel.MIN] = min;
        }
        if (max != null) {
            this.model[LPModel.CONSTRAINTS][constraintId][LPModel.MAX] = max;
        }
        for (const varName of Object.getOwnPropertyNames(constraint)) {
            if (!this.model[LPModel.VARS].hasOwnProperty(varName)) {
                this.model[LPModel.VARS][varName] = {};
            }
            this.model[LPModel.VARS][varName][constraintId] = constraint[varName];
        }
    }

    setObjective(opType: String, objective: Object) {
        this.model[LPModel.OPTYPE] = opType;
        for (const varName of Object.getOwnPropertyNames(objective)) {
            if (!this.model[LPModel.VARS].hasOwnProperty(varName)) {
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
            if (!this.model[LPModel.VARS].hasOwnProperty(varName)) {
                this.model[LPModel.VARS][varName] = { [varName]: 1 };
            } else {
                this.model[LPModel.VARS][varName][varName] = 1;
            }
        }
    }

    setObjectiveCoefficient(varName: string, coeff: number) {
        if (!this.model[LPModel.VARS].hasOwnProperty(varName)) {
            this.model[LPModel.VARS][varName] = { [varName]: 1 };
        }
        this.model[LPModel.VARS][varName][LPModel.OBJECTIVE] = coeff;
    }

    getModel(): any {
        return this.model;
    }

    getVariableNames(): String[] {
        return Object.getOwnPropertyNames(this.model[LPModel.VARS]);
    }

    printConstraints(lpResult: LPResult) {
        const varNames: string[] = Object.getOwnPropertyNames(this.model[LPModel.VARS]);
        for (const conName of Object.getOwnPropertyNames(this.model[LPModel.CONSTRAINTS])) {
            let conTerm: string = '';
            let conValue: number = lpResult ? 0.0 : null;
            for (const varName of varNames) {
                if (this.model[LPModel.VARS][varName].hasOwnProperty(conName)) {
                    const conVarCoeff: number = this.model[LPModel.VARS][varName][conName];

                    if (Math.abs(conVarCoeff) !== 1) {
                        if (conVarCoeff < 0) {
                            conTerm += ' ' + conVarCoeff.toString() + ' ' + varName;
                        } else {
                            conTerm += ' +' + conVarCoeff.toString() + ' ' + varName;
                        }
                    } else {
                        conTerm += ' ' + (conVarCoeff < 0 ? '-' : '+') + ' ' + varName;
                    }

                    if (lpResult) {
                        const varValue: number = lpResult.vars.get(varName);
                        conTerm += '[' + varValue.toString() + ']';
                        conValue += conVarCoeff * varValue;
                    }
                }
            }
            const conLabel: string = this.constraintIdToLabelMap.get(conName) + ': ';
            const text: string =
                conLabel +
                ' ' +
                (this.model[LPModel.CONSTRAINTS][conName][LPModel.MIN] != null
                ? this.model[LPModel.CONSTRAINTS][conName][LPModel.MIN].toString() + '<='
                : '') +
                conTerm +
                (lpResult ? ' = ' + conValue.toString() : '') +
                (this.model[LPModel.CONSTRAINTS][conName][LPModel.MAX] != null
                ? '<=' + this.model[LPModel.CONSTRAINTS][conName][LPModel.MAX].toString()
                : '');
        }
    }

    printObjective(lpResult: LPResult) {
        const objectiveName: string = this.model[LPModel.OPTIMIZE];
        const objectiveType: string = this.model[LPModel.OPTYPE];
        let text: string = objectiveType + ': ';
        for (const varName of Object.getOwnPropertyNames(this.model[LPModel.VARS])) {
            if (this.model[LPModel.VARS][varName].hasOwnProperty(objectiveName)) {
                if (this.model[LPModel.VARS][varName][objectiveName] < 0) {
                    text += ' ' + this.model[LPModel.VARS][varName][objectiveName] + ' ' + varName;
                } else {
                    text += ' +' + this.model[LPModel.VARS][varName][objectiveName] + ' ' + varName;
                }
                if (lpResult) {
                    text += '[' + lpResult.vars.get(varName).toString() + ']';
                }
            }
        }
        if (lpResult) {
            text += ' = ' + lpResult.objective.toString();
        }
    }
}
