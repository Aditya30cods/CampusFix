import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Organization, User } from '../models.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
const publicUser = user => ({ id: user.id, name: user.name, email: user.email, role: user.role, department: user.department, organizationId: user.organizationId });
function tokenFor(user) { return jwt.sign({ sub: user.id, organizationId: user.organizationId.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }); }

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, organizationCode, department = '' } = req.body;
    if (!name?.trim() || !email || !/^\S+@\S+\.\S+$/.test(email) || !password || password.length < 8) return res.status(400).json({ message: 'Enter your name, a valid email, and a password with at least 8 characters.' });
    const org = await Organization.findOne({ slug: (organizationCode || 'campusfix').toLowerCase() });
    if (!org) return res.status(400).json({ message: 'Organization code was not found.' });
    const user = await User.create({ organizationId: org.id, name: name.trim(), email, passwordHash: await bcrypt.hash(password, 12), department });
    res.status(201).json({ token: tokenFor(user), user: publicUser(user) });
  } catch (e) { next(e); }
});
router.post('/login', async (req, res, next) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const org = await Organization.findOne({ slug: (req.body.organizationCode || 'campusfix').toLowerCase() });
    const user = org && await User.findOne({ organizationId: org.id, email });
    const portalRole = req.body.role;
    if (portalRole && !['student', 'faculty', 'staff', 'admin'].includes(portalRole)) return res.status(400).json({ message: 'Invalid sign-in space.' });
    if (!user || (portalRole && user.role !== portalRole) || !(await bcrypt.compare(req.body.password || '', user.passwordHash))) return res.status(401).json({ message: 'Email or password is incorrect for this sign-in space.' });
    res.json({ token: tokenFor(user), user: publicUser(user) });
  } catch (e) { next(e); }
});
router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));
router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const { name, department, currentPassword, newPassword } = req.body;
    if (name !== undefined && (typeof name !== 'string' || !name.trim() || name.trim().length > 100)) return res.status(400).json({ message: 'Name must be between 1 and 100 characters.' });
    if (department !== undefined && (typeof department !== 'string' || department.trim().length > 100)) return res.status(400).json({ message: 'Department must be 100 characters or fewer.' });
    if (newPassword !== undefined && (typeof newPassword !== 'string' || newPassword.length < 8)) return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    if (newPassword !== undefined && (typeof currentPassword !== 'string' || !currentPassword)) return res.status(400).json({ message: 'Enter your current password to change it.' });
    if (currentPassword !== undefined && newPassword === undefined) return res.status(400).json({ message: 'Enter a new password.' });
    if (name === undefined && department === undefined && newPassword === undefined) return res.status(400).json({ message: 'There are no profile changes to save.' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Account not found.' });
    if (newPassword !== undefined) {
      if (!(await bcrypt.compare(currentPassword, user.passwordHash))) return res.status(400).json({ message: 'Current password is incorrect.' });
      user.passwordHash = await bcrypt.hash(newPassword, 12);
    }
    if (name !== undefined) user.name = name.trim();
    if (department !== undefined) user.department = department.trim();
    await user.save();
    res.json({ user: publicUser(user) });
  } catch (e) { next(e); }
});
export default router;
