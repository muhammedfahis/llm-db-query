import { Schema, model, Document } from 'mongoose';

export interface IRole extends Document {
  name: string; slug: string; description: string;
  permissions: string[]; isActive: boolean;
  createdAt: Date; updatedAt: Date;
}

const roleSchema = new Schema<IRole>(
  {
    name:        { type: String, required: true, unique: true, trim: true, maxlength: 80 },
    slug:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, maxlength: 500 },
    permissions: [{ type: String }],
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
);
roleSchema.index({ isActive: 1 });
export const Role = model<IRole>('Role', roleSchema);
