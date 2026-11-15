import type { DonationReceiptData } from './generate-donation-receipt';

export const generateDonationReceipt = async (data: DonationReceiptData) => {
  const mod = await import('./generate-donation-receipt');
  return mod.generateDonationReceipt(data);
};

export default generateDonationReceipt;
