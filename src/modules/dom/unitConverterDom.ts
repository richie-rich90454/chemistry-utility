import { Calculator } from "../calculator.js";
import { UnitConverter } from "../calculators/unitConverter.js";

/**
 * Legacy DOM path for the unit converter form. It reads the element ids the
 * old page wiring owned, delegates the math to the pure conversion API in
 * ../calculators/unitConverter.js, and renders what the legacy view
 * rendered. The component-driven UI in src/solid/ calls the pure API
 * directly and never instantiates this class.
 */
export class UnitConverterDom extends Calculator {
    constructor() {
        super("unit-converter-result", [
            "unit-converter-value",
            "unit-converter-from-unit",
            "unit-converter-to-unit",
            "unit-converter-category"
        ]);
    }

    protected performCalculation(): void {
        let valueInput = this.getInput("unit-converter-value");
        let value = valueInput.getValue();
        if (isNaN(value)) {
            let inputEl = document.getElementById("unit-converter-value") as HTMLInputElement;
            if (inputEl) {
                inputEl.classList.add("error");
            }
            throw new Error("Please enter a valid numeric value");
        }
        let fromSelect = document.getElementById("unit-converter-from-unit") as HTMLSelectElement;
        let toSelect = document.getElementById("unit-converter-to-unit") as HTMLSelectElement;
        let categorySelect = document.getElementById("unit-converter-category") as HTMLSelectElement;
        let fromUnit = fromSelect.value;
        let toUnit = toSelect.value;
        let category = categorySelect.value;

        if (toUnit === "all") {
            let results = UnitConverter.convertToAll(value, fromUnit, category);
            let html = "<p>Converting " + value + " " + fromUnit + " to all " + category + " units:</p>";
            html += "<table class=\"conversion-table\"><thead><tr><th>Unit</th><th>Value</th></tr></thead><tbody>";
            for (let i = 0; i < results.length; i++) {
                html += "<tr><td>" + results[i].unit + " (" + results[i].unitName + ")</td>";
                html += "<td>" + UnitConverter.formatValue(results[i].value) + "</td></tr>";
            }
            html += "</tbody></table>";
            this.resultDisplay.showResult(html);
        } else {
            let result = UnitConverter.convert(value, fromUnit, toUnit, category);
            let html = "<p>" + value + " " + fromUnit + " = " + UnitConverter.formatValue(result.value) + " " + result.unit + "</p>";
            this.resultDisplay.showResult(html);
        }
    }
}

export function calculateUnitConversion(): void {
    let converter = new UnitConverterDom();
    converter.calculate();
}
