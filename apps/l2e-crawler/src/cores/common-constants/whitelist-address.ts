export const WHITE_LIST_TOKEN_ADDRESS =
  process.env.WHITE_LIST_TOKEN_ADDRESS?.split(',').map((address) =>
    address.toLowerCase()
  );

export const WHITE_LIST_COLLECTION_ADDRESS =
  process.env.WHITE_LIST_COLLECTION_ADDRESS?.split(',').map((address) =>
    address.toLowerCase()
  );
