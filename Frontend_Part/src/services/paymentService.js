import { apiRequest } from "./api";

export const paymentService = {
  createPaymentLink() {
    return apiRequest("/payment/create-payment-link", "POST");
  },
  verifyPayment(payload) {
    return apiRequest("/payment/verify", "POST", payload);
  },
  verifyPaymentLink(payload) {
    return apiRequest("/payment/verify-payment-link", "POST", payload);
  },
  getInvoices() {
    return apiRequest("/payment/invoices", "GET");
  },
  downgradePlan() {
    return apiRequest("/payment/downgrade", "POST");
  }
};
