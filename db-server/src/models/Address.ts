import { Schema, model, Document, Types } from 'mongoose';

export interface IAddress extends Document {
  userId: Types.ObjectId; label: 'home' | 'work' | 'other';
  street: string; city: string; state: string; country: string;
  zipCode: string; isDefault: boolean; createdAt: Date; updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    label:    { type: String, enum: ['home', 'work', 'other'], default: 'home' },
    street:   { type: String, required: true, trim: true },
    city:     { type: String, required: true, trim: true },
    state:    { type: String, required: true, trim: true },
    country:  { type: String, required: true, trim: true },
    zipCode:  { type: String, required: true, trim: true },
    isDefault:{ type: Boolean, default: false },
  },
  { timestamps: true }
);
addressSchema.index({ userId: 1, isDefault: 1 });
export const Address = model<IAddress>('Address', addressSchema);
