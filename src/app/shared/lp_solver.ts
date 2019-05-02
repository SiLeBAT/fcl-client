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
    private model: any = {
        variables: {},
        constraints: {},
        optimize: 'objective'
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
        this.model['constraints'][constraintId] = {};
        if (min != null) {
            this.model['constraints'][constraintId]['min'] = min;
        }
        if (max != null) {
            this.model['constraints'][constraintId]['max'] = max;
        }
        for (const varName of Object.getOwnPropertyNames(constraint)) {
            if (!this.model['variables'].hasOwnProperty(varName)) {
                this.model['variables'][varName] = {};
            }
            this.model['variables'][varName][constraintId] = constraint[varName];
        }
    }

    setObjective(opType: String, objective: Object) {
        this.model['opType'] = opType;
        for (const varName of Object.getOwnPropertyNames(objective)) {
            if (!this.model['variables'].hasOwnProperty(varName)) {
                this.model['variables'][varName] = {};
            }
            this.model['variables'][varName]['objective'] = objective[varName];
        }
    }
    setBinaryVariables(vars: string[]) {
        const binaries = {};
        for (const varName of vars) {
            binaries[varName] = 1;
        }
        this.model['binaries'] = binaries;
        for (const varName of vars) {
            if (!this.model['variables'].hasOwnProperty(varName)) {
                this.model['variables'][varName] = { [varName]: 1 };
            } else {
                this.model['variables'][varName][varName] = 1;
            }
        }
    }

    setObjectiveCoefficient(varName: string, coeff: number) {
        if (!this.model['variables'].hasOwnProperty(varName)) {
            this.model['variables'][varName] = { [varName]: 1 };
        }
        this.model['variables'][varName]['objective'] = coeff;
    }

    getModel(): any {
        return this.model;
    }

    getVariableNames(): String[] {
        return Object.getOwnPropertyNames(this.model['variables']);
    }

    printConstraints(lpResult: LPResult) {
        const varNames: string[] = Object.getOwnPropertyNames(this.model['variables']);
        for (const conName of Object.getOwnPropertyNames(this.model['constraints'])) {
            let conTerm: string = '';
            let conValue: number = lpResult ? 0.0 : null;
            for (const varName of varNames) {
                if (this.model['variables'][varName].hasOwnProperty(conName)) {
                    const conVarCoeff: number = this.model['variables'][varName][conName];

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
                (this.model['constraints'][conName]['min'] != null
                ? this.model['constraints'][conName]['min'].toString() + '<='
                : '') +
                conTerm +
                (lpResult ? ' = ' + conValue.toString() : '') +
                (this.model['constraints'][conName]['max'] != null
                ? '<=' + this.model['constraints'][conName]['max'].toString()
                : '');

            // console.log(text);
        }
    }

    printObjective(lpResult: LPResult) {
        const objectiveName: string = this.model['optimize'];
        const objectiveType: string = this.model['opType'];
        let text: string = objectiveType + ': ';
        for (const varName of Object.getOwnPropertyNames(this.model['variables'])) {
            if (this.model['variables'][varName].hasOwnProperty(objectiveName)) {
                if (this.model['variables'][varName][objectiveName] < 0) {
                    text +=
            ' ' +
            this.model['variables'][varName][objectiveName] +
            ' ' +
            varName;
                } else {
                    text +=
            ' +' +
            this.model['variables'][varName][objectiveName] +
            ' ' +
            varName;
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
