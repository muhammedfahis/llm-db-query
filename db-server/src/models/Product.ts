import { Schema, model, Document, Types } from 'mongoose';

export interface IProduct extends Document {
  categoryId: Types.ObjectId; tagIds: Types.ObjectId[]; name: string; slug: string;
  description: string; sku: string; price: number; comparePrice: number | null;
  stock: number; images: string[]; avgRating: number; reviewCount: number;
  isActive: boolean; createdAt: Date; updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    categoryId:   { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    tagIds:       [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
    name:         { type: String, required: true, trim: true },
    slug:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    description:  { type: String },
    sku:          { type: String, required: true, unique: true, uppercase: true, trim: true },
    price:        { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, min: 0, default: null },
    stock:        { type: Number, required: true, min: 0, default: 0 },
    images:       [{ type: String }],
    avgRating:    { type: Number, min: 0, max: 5, default: 0 },
    reviewCount:  { type: Number, default: 0, min: 0 },
    isActive:     { type: Boolean, default: true },
  },
  { timestamps: true }
);
productSchema.index({ categoryId: 1 });
productSchema.index({ price: 1 });
productSchema.index({ avgRating: -1, reviewCount: -1 });
export const Product = model<IProduct>('Product', productSchema);
