import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Issue, Organization, User } from './models.js';
await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusfix');
let org = await Organization.findOneAndUpdate({ slug: 'campusfix' }, { name: 'CampusFix Demo College', slug: 'campusfix', type: 'college' }, { upsert: true, new: true });
const passwordHash = await bcrypt.hash('CampusFix123!', 12);
for (const user of [
  { name: 'Aarav Admin', email: 'admin@campusfix.demo', role: 'admin', department: 'Facilities' },
  { name: 'Rahul Staff', email: 'staff@campusfix.demo', role: 'staff', department: 'IT Services' },
  { name: 'Maya Student', email: 'student@campusfix.demo', role: 'student', department: 'Computer Science' }
]) await User.findOneAndUpdate({ organizationId: org.id, email: user.email }, { ...user, organizationId: org.id, passwordHash }, { upsert: true, new: true });
if (!await Issue.exists({ organizationId: org.id })) {
  const [student, staff, admin] = await Promise.all([User.findOne({ email: 'student@campusfix.demo' }), User.findOne({ email: 'staff@campusfix.demo' }), User.findOne({ email: 'admin@campusfix.demo' })]);
  const examples = [
    { title: 'Wi-Fi not working in Lab 3', description: 'Internet has been down since morning for the whole lab.', category: 'Network', location: 'Lab 3', priority: 'high', status: 'in_progress', reportedBy: student.id, assignedTo: staff.id, statusHistory: [{ status: 'open', note: 'Issue reported', changedBy: student.id }, { status: 'assigned', note: 'Assigned to IT Services', changedBy: admin.id }, { status: 'in_progress', note: 'Staff started work', changedBy: staff.id }] },
    { title: 'Projector not turning on', description: 'The projector in Room 204 does not power on.', category: 'Equipment', location: 'Room 204', priority: 'medium', status: 'open', reportedBy: student.id, statusHistory: [{ status: 'open', note: 'Issue reported', changedBy: student.id }] },
    { title: 'Leaking tap near library', description: 'Water is leaking continuously in the washroom.', category: 'Plumbing', location: 'Library', priority: 'low', status: 'resolved', reportedBy: student.id, assignedTo: staff.id, statusHistory: [{ status: 'open', note: 'Issue reported', changedBy: student.id }, { status: 'resolved', note: 'Repaired', changedBy: staff.id }] }
  ];
  await Issue.insertMany(examples.map(x => ({ ...x, organizationId: org.id, department: 'Computer Science' })));
}
console.log('Seed complete. Demo password: CampusFix123!'); await mongoose.disconnect();
