import { Calculator } from "./calculator.js";
import { ApiClient } from "./apiClient.js";
export abstract class ServerCalculator extends Calculator {
    protected calculatorType: string;
    constructor(calculatorType: string, resultElementId: string) {
        let inputElementIds: string[] = [];
        super(resultElementId, inputElementIds);
        this.calculatorType = calculatorType;
    }
    public async performCalculation(): Promise<void> {
        let client: ApiClient = ApiClient.getInstance();
        let inputs: Record<string, string> = this.gatherInputs();
        try {
            let response: { result: string } = await client.post<{ result: string }>("/api/v1/calculators/" + this.calculatorType, inputs);
            if (response && response.result) {
                this.resultDisplay.showResult(response.result);
            }
        } catch (error) {
            let message: string = "Calculation failed";
            if (error instanceof Error) {
                message = error.message;
            }
            this.resultDisplay.showError(message);
        }
    }
    protected gatherInputs(): Record<string, string> {
        let inputs: Record<string, string> = {};
        for (let i = 0; i < this.inputElements.length; i++) {
            let el: HTMLInputElement | HTMLSelectElement = this.inputElements[i].getElement() as HTMLInputElement | HTMLSelectElement;
            inputs[el.id] = el.value;
        }
        return inputs;
    }
    public getCalculatorType(): string {
        return this.calculatorType;
    }
}
