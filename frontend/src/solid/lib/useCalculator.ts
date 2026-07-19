import {createSignal} from "solid-js";
import {Calculator, CalculatorResult} from "../../modules/calculator.js";
function useCalculator(calculator: Calculator): {
    inputs: () => Record<string, string>;
    setInputs: (next: Record<string, string>) => void;
    result: () => CalculatorResult;
    calculate: () => void;
} {
    let [inputs, setInputsSignal] = createSignal<Record<string, string>>({});
    let [result, setResult] = createSignal<CalculatorResult>({value: "", explanation: ""});
    function setInputs(next: Record<string, string>): void {
        setInputsSignal(next);
    }
    function calculate(): void {
        let next = calculator.calculatePure(inputs());
        setResult(next);
    }
    return {
        inputs: inputs,
        setInputs: setInputs,
        result: result,
        calculate: calculate
    };
}
export {useCalculator};
