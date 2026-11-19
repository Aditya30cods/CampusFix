import mongoose from 'mongoose';

const { Schema, model } = mongoose;
const organizationSchema = new Schema({ name: { type: String, required: true }, slug: { type: String, required: true, unique: true }, type: { type: String, default: 'college' } }, { timestamps: true });
const userSchema = new Schema({ organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }, name: { type: String, required: true, trim: true }, email: { type: String, required: true, lowercase: true, trim: true }, passwordHash: { type: String, required: true }, role: { type: String, enum: ['student', 'faculty', 'staff', 'admin'], default: 'student' }, department: { type: String, default: '' } }, { timestamps: true });
userSchema.index({ organizationId: 1, email: 1 }, { unique: true });
const historySchema = new Schema({ status: { type: String, required: true }, note: { type: String, default: '' }, changedBy: { type: Schema.Types.ObjectId, ref: 'User' }, changedAt: { type: Date, default: Date.now } }, { _id: false });
const issueSchema = new Schema({ organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }, reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true }, title: { type: String, required: true, trim: true, maxlength: 120 }, description: { type: String, required: true, maxlength: 3000 }, category: { type: String, required: true }, location: { type: String, required: true }, department: { type: String, default: '' }, priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' }, status: { type: String, enum: ['open', 'assigned', 'in_progress', 'resolved', 'closed'], default: 'open', index: true }, imageUrl: { type: String, default: '' }, statusHistory: { type: [historySchema], default: [] } }, { timestamps: true });
issueSchema.index({ organizationId: 1, createdAt: -1 });
export const Organization = model('Organization', organizationSchema);
export const User = model('User', userSchema);
export const Issue = model('Issue', issueSchema);
