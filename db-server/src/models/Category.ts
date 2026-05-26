import { Schema, model, Document, Types } from 'mongoose';

export interface ICategory extends Document {
  parentId: Types.ObjectId | null; name: string; slug: string;
  description: string; imageUrl: string; sortOrder: number;
  isActive: boolean; createdAt: Date; updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    parentId:    { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    name:        { type: String, required: true, trim: true },
    slug:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String },
    imageUrl:    { type: String },
    sortOrder:   { type: Number, default: 0 },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
);
categorySchema.index({ parentId: 1 });
export const Category = model<ICategory>('Category', categorySchema);
