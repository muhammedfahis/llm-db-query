import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  roleId: Types.ObjectId; firstName: string; lastName: string;
  email: string; passwordHash: string; phone: string; avatar: string;
  isActive: boolean; lastLogin: Date | null; createdAt: Date; updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    roleId:       { type: Schema.Types.ObjectId, ref: 'Role', required: true, index: true },
    firstName:    { type: String, required: true, trim: true, maxlength: 50 },
    lastName:     { type: String, required: true, trim: true, maxlength: 50 },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    phone:        { type: String, trim: true },
    avatar:       { type: String },
    isActive:     { type: Boolean, default: true },
    lastLogin:    { type: Date, default: null },
  },
  { timestamps: true }
);
userSchema.index({ roleId: 1, isActive: 1 });
export const User = model<IUser>('User', userSchema);
