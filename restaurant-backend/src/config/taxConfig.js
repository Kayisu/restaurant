// Tax and Service Charge Configuration
export const TAX_CONFIG = {
  // VAT rate
  VAT_RATE: 0.10, // 10%
  
  // Service charge rate
  SERVICE_CHARGE_RATE: 0.05, // 5%
  
  // Minimum service charge
  MIN_SERVICE_CHARGE: 0.00,
  
  // Maximum service charge
  MAX_SERVICE_CHARGE: 100.00
};

// Tax calculation function
export const calculateTax = (subtotal) => {
  return parseFloat((subtotal * TAX_CONFIG.VAT_RATE).toFixed(2));
};

// Service charge calculation function
export const calculateServiceCharge = (subtotal) => {
  const serviceCharge = subtotal * TAX_CONFIG.SERVICE_CHARGE_RATE;
  return Math.max(
    TAX_CONFIG.MIN_SERVICE_CHARGE,
    Math.min(serviceCharge, TAX_CONFIG.MAX_SERVICE_CHARGE)
  );
};

// Toplam tutar hesaplama fonksiyonu
export const calculateTotal = (subtotal, taxAmount, serviceCharge, discountAmount = 0) => {
  return parseFloat((subtotal + taxAmount + serviceCharge - discountAmount).toFixed(2));
};
