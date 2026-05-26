import { Schema, model, Document, Types } from 'mongoose';

export interface IOrderItem extends Document {
  orderId: Types.ObjectId; productId: Types.ObjectId;
  quantity: number; unitPrice: number; totalPrice: number;
  createdAt: Date; updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    orderId:    { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    productId:  { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    quantity:   { type: Number, required: true, min: 1 },
    unitPrice:  { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);
orderItemSchema.index({ orderId: 1, productId: 1 });
export const OrderItem = model<IOrderItem>('OrderItem', orderItemSchema);
