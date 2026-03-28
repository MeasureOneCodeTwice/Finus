import type React from "react";

//Handles state when currency is changed
export const handleCurrencyChange = (
  event: React.ChangeEvent<HTMLInputElement>,
  setCurrency: React.Dispatch<React.SetStateAction<string>>,
): void => {
  let input = event.target.value;
  const pattern = /^\d*\.?\d{0,2}$/;

  console.log(input);
  console.log(pattern.test(input));
  //Determine if the input follows the format/pattern
  if (pattern.test(input)) {
    input = input.replace(/^0+(?=\d)/, "");
    setCurrency(input);
  }
};

export const handleCurrencyBlur = (
  event: React.ChangeEvent<HTMLInputElement>,
  currency: string,
  setCurrency: React.Dispatch<React.SetStateAction<string>>,
): void => {
  if (event.target.value !== "") {
    setCurrency(parseFloat(currency).toFixed(2));
  }
};

//Handles on change of whole numbers
export const handleNumberChange = (
  event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  setNumber: React.Dispatch<React.SetStateAction<string>>,
  min: number,
  max: number,
) => {
  let input = event.target.value;
  let changeNumber;
  const pattern = /^\d*\.?\d{0,2}$/;

  console.log(input);
  console.log(pattern.test(input));

  //Determine if the input follows the format/pattern
  if (pattern.test(input) || input === "") {
    input = input.replace(/^0+(?=\d)/, "");
    changeNumber = Number(input);

    if (changeNumber > max) {
      changeNumber = max;
    }

    if (changeNumber < min) {
      changeNumber = min;
    }
    console.log(changeNumber);
    setNumber(changeNumber.toString());
  }
};
