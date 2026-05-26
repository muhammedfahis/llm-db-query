import { Schema, model, Document, Types } from 'mongoose';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface IOrder extends Document {
  userId: Types.ObjectId; shippingAddressId: Types.ObjectId; status: OrderStatus;
  subtotal: number; tax: number; shippingCost: number; total: number;
  notes: string; trackingNumber: string | null; createdAt: Date; updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    userId:            { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    shippingAddressId: { type: Schema.Types.ObjectId, ref: 'Address', required: true },
    status:            { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'], default: 'pending' },
    subtotal:          { type: Number, required: true, min: 0 },
    tax:               { type: Number, required: true, min: 0 },
    shippingCost:      { type: Number, required: true, min: 0 },
    total:             { type: Number, required: true, min: 0 },
    notes:             { type: String, maxlength: 1000 },
    trackingNumber:    { type: String, default: null },
  },
  { timestamps: true }
);
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
export const Order = model<IOrder>('Order', orderSchema);
