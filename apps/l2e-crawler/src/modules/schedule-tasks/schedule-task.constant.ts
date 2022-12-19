export const TIME_OUT_TO_START_CRAWLER_IN_MILLISECONDS =
  process.env.NODE_ENV === 'test' ? 9999999 : 10000;
export const TIME_OUT_TO_START_HANDLE_REQUEST_WITHDRAW =
  process.env.NODE_ENV === 'test' ? 9999999 : 5000;
export const REQUEST_WITHDRAWN_TOKEN_INTERVAL =
  process.env.NODE_ENV === 'test' ? 9999999 : 10;
export const REQUEST_WITHDRAWN_NFT_INTERVAL =
  process.env.NODE_ENV === 'test' ? 9999999 : 10;
export const CHECK_WITHDRAWN_TRANSACTION_INTERVAL =
  process.env.NODE_ENV === 'test' ? 9999999 : 12;
