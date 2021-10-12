import { injectable } from "inversify";
import { AbstractDialog } from "@theia/core/lib/browser";
import { DSMParameter, DSMParameterType } from "./dsm-parameter";

@injectable()
export class DSMDialog extends AbstractDialog<string> {
    private readonly fields: HTMLElement[];
    private readonly parameters: DSMParameter[];

    constructor(parameters: DSMParameter[]) {
        super({
            title: "Enter parameters"
        });

        this.parameters = parameters;
        this.fields = [];
        let lastParameter = parameters[parameters.length - 1];
        parameters.forEach(parameter => {
            if (parameter.type == DSMParameterType.String || parameter.type == DSMParameterType.Number) {
                this.fields.push(this.addInputField(parameter));
            } else if (parameter.type == DSMParameterType.Boolean) {
                this.fields.push(this.addSelectField(parameter));
            }
            if (parameter != lastParameter) {
                this.addSeparator();
            }
        })

        this.appendAcceptButton();
    }

    get value(): string {
        let result: string = '{';

        for (let i = 0; i < this.fields.length - 1; i++) {
            let json = DSMDialog.jsonify(this.fields[i], this.parameters[i]);
            if (json) {
                result += json;
            }
        }

        let lastIndex = this.fields.length - 1;
        let json = DSMDialog.jsonify(this.fields[lastIndex], this.parameters[lastIndex]);
        if (json) {
            result += json;
        }

        return result;
    }

    private addInputField(parameter: DSMParameter): HTMLInputElement {
        let field = document.createElement('input');
        field.type = 'text';
        field.className = 'theia-input';
        field.setAttribute('style', 'flex: 0;');
        field.placeholder = parameter.name;
        this.contentNode.appendChild(field);

        return field;
    }

    private addSelectField(parameter: DSMParameter): HTMLSelectElement {
        let label = document.createElement('div');
        label.textContent = parameter.name;
        label.title = parameter.name;
        label.setAttribute('style', 'margin-left: 5px; margin-bottom: 5px;');

        let field = document.createElement('select');
        field.className = 'theia-select';
        field.setAttribute('style', 'flex: 0;');

        let noneOption = document.createElement('option');
        noneOption.text = "";
        noneOption.value = "";

        let trueOption = document.createElement('option');
        trueOption.text = "true";
        trueOption.value = "true";

        let falseOption = document.createElement('option');
        falseOption.text = 'false';
        falseOption.value = 'false';

        field.add(noneOption, null);
        field.add(trueOption, null);
        field.add(falseOption, null);

        this.contentNode.appendChild(label);
        this.contentNode.appendChild(field);

        return field;
    }

    private addSeparator() {
        let div = document.createElement('div');
        div.setAttribute('style', 'margin-top: 10px;');
        this.contentNode.appendChild(div);
    }

    private static jsonify(field: HTMLElement, parameter: DSMParameter): string | undefined {
        if (field instanceof HTMLInputElement) {
            if (parameter.type == DSMParameterType.Number) {
                let number = Number(field.value);
                if (!isNaN(number)) {
                    return `"${parameter}":${number},`;
                } else {
                    console.log(`${field.value} is not a number`);
                }
            } else {
                return `"${parameter}":"${field.value}",`;
            }
        } else if (field instanceof HTMLSelectElement) {
            return `"${parameter}":${field.value},`;
        } else {
            console.log(`Unknown HTML element for parameter ${parameter.name}`);
        }
        return undefined;
    }
}
