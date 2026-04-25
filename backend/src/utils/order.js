export const TAX_RATE = 0.08;

export function calculateOrderTotals(subtotal, taxRate = TAX_RATE) {
  const safeSubtotal = Number(subtotal) || 0;
  const tax = Number((safeSubtotal * taxRate).toFixed(2));
  const total = Number((safeSubtotal + tax).toFixed(2));

  return {
    subtotal: Number(safeSubtotal.toFixed(2)),
    tax,
    total
  };
}

export function getPaymentDetails(paymentMethod) {
  if (paymentMethod === 'pay_now_demo') {
    return {
      paymentStatus: 'paid',
      orderStatus: 'confirmed'
    };
  }

  return {
    paymentStatus: 'pending',
    orderStatus: 'pending'
  };
}
