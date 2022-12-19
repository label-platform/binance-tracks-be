/**
 * @description: 특정 소수점 이하를 내림 처리
 * @param value : 소수점 처리 할 값
 * @param decimalPoint : 해당 소수점 자리 이하를 내림 처리
 * @returns : 소수점 내림 처리된 값
 */
export const convertNumberWithDecimalFloor = (
  value: number,
  decimalPoint: number
) => {
  const decimal = Math.pow(10, decimalPoint);
  return parseFloat(
    (Math.floor(value * decimal) / decimal).toFixed(decimalPoint)
  );
};

/**
 * @description: 특정 소수점 이하를 올림 처리
 * @param value : 소수점 처리 할 값
 * @param decimalPoint : 해당 소수점 자리 이하를 올림 처리
 * @returns : 소수점 올림 처리된 값
 */
export const convertNumberWithDecimalCeil = (
  value: number,
  decimalPoint: number
) => {
  const decimal = Math.pow(10, decimalPoint);
  return parseFloat(
    (Math.ceil(value * decimal) / decimal).toFixed(decimalPoint)
  );
};

/**
 * @description: 특정 소수점 이하를 반올림 처리
 * @param value : 소수점 처리 할 값
 * @param decimalPoint : 해당 소수점 자리 이하를 반올림 처리
 * @returns : 소수점 반올림 처리된 값
 */
export const convertNumberWithDecimalRound = (
  value: number,
  decimalPoint: number
) => {
  const decimal = Math.pow(10, decimalPoint);
  return parseFloat(
    (Math.round(value * decimal) / decimal).toFixed(decimalPoint)
  );
};
