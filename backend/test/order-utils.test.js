import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateOrderTotals, getPaymentDetails } from '../src/utils/order.js';

test('calculateOrderTotals returns rounded tax and total', () => {
  const totals = calculateOrderTotals(125.55);

  assert.deepEqual(totals, {
    subtotal: 125.55,
    tax: 10.04,
    total: 135.59
  });
});

test('getPaymentDetails marks demo pay-now orders as paid and confirmed', () => {
  const details = getPaymentDetails('pay_now_demo');

  assert.deepEqual(details, {
    paymentStatus: 'paid',
    orderStatus: 'confirmed'
  });
});

test('getPaymentDetails keeps offline payment methods pending', () => {
  const details = getPaymentDetails('cash_on_delivery');

  assert.deepEqual(details, {
    paymentStatus: 'pending',
    orderStatus: 'pending'
  });
});
