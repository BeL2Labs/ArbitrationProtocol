export const isSameEVMAddress = (address1: string, address2: string): boolean => {
  return address1?.toLowerCase() === address2?.toLowerCase();
}

export const EVM_NULL_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000";

export const isEVMNullAddress = (address: string): boolean => {
  return address === EVM_NULL_BYTES32;
}