import { apiRequest } from "./api";

export const billingService = {
  getCurrent() {
    return apiRequest("/payment/current", "GET");
  },
  createPaymentLink(payload) {
    return apiRequest("/payment/create-payment-link", "POST", payload, {
      notifyOnAuthError: false
    });
  },
  verifyPaymentLink(payload) {
    return apiRequest("/payment/verify-payment-link", "POST", payload, {
      notifyOnAuthError: false
    });
  },
  downgrade(payload = {}) {
    return apiRequest("/payment/downgrade", "POST", payload, {
      notifyOnAuthError: false
    });
  },
  getInvoices() {
    return apiRequest("/payment/invoices", "GET", null, {
      notifyOnAuthError: false
    });
  }
};
