import { HEADPHONE_EARNING_RATE, TIME_REWARD_TOKEN } from "../constants";

export const calculationTokenBySecond = (second: number, battery: number, efficiencyStat: number) => {
  return efficiencyStat * Math.floor(second / TIME_REWARD_TOKEN)
}

export const calculationTokenBasedOnBattery = (battery) => {
  const data = HEADPHONE_EARNING_RATE.find((headphoneData) => {
    return headphoneData.start < battery && headphoneData.end >= battery;
  })
  return data.value;
}
