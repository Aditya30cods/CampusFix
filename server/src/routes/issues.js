import { Router } from 'express';
import { Issue, User } from '../models.js';
import { allowRoles, requireAuth } from '../middleware/auth.js';
const router = Router();
router.use(requireAuth);
const populate = [{ path: 'reportedBy', select: 'name email department' }, { path: 'assignedTo', select: 'name email department' }];
function scope(user) { return user.role === 'admin' ? { organizationId: user.organizationId } : user.role === 'staff' ? { organizationId: user.organizationId, assignedTo: user.id } : { organizationId: user.organizationId, reportedBy: user.id }; }

router.post('/suggest', allowRoles('student', 'faculty', 'admin'), async (req, res, next) => {
  try {
    const { title = '', description = '', location = '' } = req.body;
    const text = `${title} ${description}`.toLowerCase();
    let suggestion;
    if (process.env.AI_SERVICE_URL) {
      try {
        const response = await fetch(`${process.env.AI_SERVICE_URL.replace(/\/$/, '')}/suggest`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title, description, location }), signal: AbortSignal.timeout(1800) });
        if (response.ok) suggestion = await response.json();
      } catch { /* Use local heuristic if the optional service is not running. */ }
    }
    if (!suggestion) {
      const rules = { Network: ['wifi internet network router connectivity offline', 'high'], Equipment: ['projector computer screen printer broken device equipment', 'medium'], Plumbing: ['water tap leak pipe toilet drain plumbing', 'medium'], Electrical: ['power light electricity socket wiring switch', 'high'], Facilities: ['chair door window desk room building facility', 'low'], Cleaning: ['trash garbage dirty cleaning spill', 'low'], Safety: ['danger unsafe hazard emergency injury fire smoke', 'urgent'] };
      const scores = Object.fromEntries(Object.entries(rules).map(([category, [words]]) => [category, words.split(' ').filter(word => text.includes(word)).length]));
      const category = Object.keys(scores).reduce((best, key) => scores[key] > scores[best] ? key : best, 'Facilities');
      let priority = rules[category][1];
      if (/danger|smoke|fire|exposed wire|injury/.test(text)) priority = 'urgent';
      else if (/entire|everyone|completely|down/.test(text) && priority === 'medium') priority = 'high';
      suggestion = { category, priority, confidence: Math.min(1, (scores[category] || 0) / Math.max(1, Object.values(scores).reduce((a,b) => a+b, 0))), method: 'keyword baseline' };
    }
    const terms = `${title} ${location}`.trim().split(/\s+/).filter(w => w.length > 3).slice(0, 5);
    const duplicates = terms.length ? await Issue.find({ organizationId: req.user.organizationId, location: new RegExp(location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), $or: terms.map(word => ({ title: new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })) }).select('title location status').limit(3) : [];
    res.json({ ...suggestion, duplicates });
  } catch (e) { next(e); }
});

router.get('/', async (req, res, next) => { try { const { status, category, search } = req.query; const filter = scope(req.user); if (status) filter.status = status; if (category) filter.category = category; if (search) { const safeSearch = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); filter.$or = [{ title: new RegExp(safeSearch, 'i') }, { location: new RegExp(safeSearch, 'i') }]; } const issues = await Issue.find(filter).populate(populate).sort({ createdAt: -1 }).limit(250); res.json({ issues }); } catch (e) { next(e); } });
router.post('/', allowRoles('student', 'faculty', 'admin'), async (req, res, next) => {
  try {
    const { title, description, category, location, priority, imageUrl = '', department = '' } = req.body;
    if (![title, description, category, location].every(v => typeof v === 'string' && v.trim())) return res.status(400).json({ message: 'Title, description, category, and location are required.' });
    if (imageUrl && !/^https:\/\//i.test(imageUrl)) return res.status(400).json({ message: 'Image URL must use HTTPS.' });
    const issue = await Issue.create({ organizationId: req.user.organizationId, reportedBy: req.user.id, title: title.trim(), description: description.trim(), category, location: location.trim(), priority: ['low','medium','high','urgent'].includes(priority) ? priority : 'medium', imageUrl, department: department.trim(), statusHistory: [{ status: 'open', note: 'Issue reported', changedBy: req.user.id }] });
    res.status(201).json({ issue: await issue.populate(populate) });
  } catch (e) { next(e); }
});
router.get('/:id', async (req, res, next) => { try { const issue = await Issue.findOne({ _id: req.params.id, ...scope(req.user) }).populate(populate); if (!issue) return res.status(404).json({ message: 'Issue not found.' }); res.json({ issue }); } catch (e) { next(e); } });
router.patch('/:id', allowRoles('staff', 'admin'), async (req, res, next) => {
  try {
    const issue = await Issue.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!issue) return res.status(404).json({ message: 'Issue not found.' });
    if (req.user.role === 'staff' && String(issue.assignedTo) !== req.user.id) return res.status(403).json({ message: 'This issue is not assigned to you.' });
    const { status, assignedTo, note, priority } = req.body;
    if (status && !['open','assigned','in_progress','resolved','closed'].includes(status)) return res.status(400).json({ message: 'Invalid status.' });
    if (assignedTo !== undefined) {
      if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admins can assign issues.' });
      const staff = await User.findOne({ _id: assignedTo, organizationId: req.user.organizationId, role: 'staff' });
      if (!staff) return res.status(400).json({ message: 'Choose a staff member from this organization.' });
      issue.assignedTo = staff.id;
      if (issue.status === 'open') issue.status = 'assigned';
    }
    if (priority && req.user.role === 'admin' && ['low','medium','high','urgent'].includes(priority)) issue.priority = priority;
    if (status) issue.status = status;
    if (status || assignedTo !== undefined) issue.statusHistory.push({ status: issue.status, note: String(note || (assignedTo !== undefined ? 'Assignment updated' : 'Status updated')).slice(0, 300), changedBy: req.user.id });
    await issue.save(); res.json({ issue: await issue.populate(populate) });
  } catch (e) { next(e); }
});
export default router;
