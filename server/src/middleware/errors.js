export function errorHandler(err, _req, res, _next) {
  console.error(err);
  if (err.name === 'ValidationError') return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join(', ') });
  if (err.code === 11000) return res.status(409).json({ message: 'An account with that email already exists in this organization.' });
  res.status(err.status || 500).json({ message: err.status ? err.message : 'Something went wrong. Please try again.' });
}
