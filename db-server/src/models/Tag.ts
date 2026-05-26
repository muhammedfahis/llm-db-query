import { Schema, model, Document } from 'mongoose';

export interface ITag extends Document {
  name: string; slug: string; color: string; createdAt: Date; updatedAt: Date;
}

const tagSchema = new Schema<ITag>(
  {
    name:  { type: String, required: true, unique: true, trim: true },
    slug:  { type: String, required: true, unique: true, lowercase: true, trim: true },
    color: { type: String, default: '#6366f1' },
  },
  { timestamps: true }
);
export const Tag = model<ITag>('Tag', tagSchema);
