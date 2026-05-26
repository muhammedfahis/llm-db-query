import { Schema, model, Document, Types } from 'mongoose';

export interface IReview extends Document {
  userId: Types.ObjectId; productId: Types.ObjectId; orderId: Types.ObjectId | null;
  rating: number; title: string; body: string;
  isVerifiedPurchase: boolean; helpfulCount: number; createdAt: Date; updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    userId:             { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId:          { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    orderId:            { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    rating:             { type: Number, required: true, min: 1, max: 5 },
    title:              { type: String, required: true, trim: true, maxlength: 120 },
    body:               { type: String, required: true, maxlength: 2000 },
    isVerifiedPurchase: { type: Boolean, default: false },
    helpfulCount:       { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);
reviewSchema.index({ productId: 1, rating: -1 });
export const Review = model<IReview>('Review', reviewSchema);
