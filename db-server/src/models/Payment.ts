import { Schema, model, Document, Types } from 'mongoose';

export type PaymentMethod = 'credit_card' | 'debit_card' | 'paypal' | 'crypto' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface IPayment extends Document {
  orderId: Types.ObjectId; method: PaymentMethod; status: PaymentStatus;
  amount: number; currency: string; transactionId: string;
  processedAt: Date | null; createdAt: Date; updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId:       { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    method:        { type: String, enum: ['credit_card', 'debit_card', 'paypal', 'crypto', 'bank_transfer'], required: true },
    status:        { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    amount:        { type: Number, required: true, min: 0 },
    currency:      { type: String, default: 'USD', uppercase: true, trim: true },
    transactionId: { type: String, required: true, unique: true, trim: true },
    processedAt:   { type: Date, default: null },
  },
  { timestamps: true }
);
paymentSchema.index({ orderId: 1, status: 1 });
export const Payment = model<IPayment>('Payment', paymentSchema);
