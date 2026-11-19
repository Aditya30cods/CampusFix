import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowUpRight, BriefcaseBusiness, Check, Clock3, GraduationCap, ShieldCheck, Wrench } from 'lucide-react';
import { messageOf } from './api';
import { useAuth } from './state';
import './auth-portals.css';

const portals = [
  { id: 'student', label: 'Student', description: 'Report an issue and follow your requests.', icon: GraduationCap },
  { id: 'faculty', label: 'Faculty', description: 'Share campus issues and track your reports.', icon: BriefcaseBusiness },
  { id: 'staff', label: 'Staff', description: 'Manage the issues assigned to your team.', icon: Wrench },
  { id: 'admin', label: 'Admin', description: 'Oversee campus reports, people, and progress.', icon: ShieldCheck }
];

function AuthBrand() {
  return <div className="auth-brand"><div className="brand-mark"><Wrench size={19}/></div><span>campus<span className="brand-accent">fix</span></span></div>;
}

function AuthArtwork() {
  return <div className="auth-art"><AuthBrand/><div className="auth-art-content"><div className="auth-kicker"><span/> YOUR CAMPUS, IN GOOD HANDS</div><h1>Small fixes.<br/><em>Better days.</em></h1><p>One place to report, track, and resolve the things that make campus life better.</p><div className="auth-mini-cards"><div><div className="mini-check"><Check size={13}/></div><b>Easy reporting</b><small>A better way to speak up</small></div><div><div className="mini-clock"><Clock3 size={14}/></div><b>Clear progress</b><small>Know what’s happening</small></div></div></div><div className="auth-art-footer">MADE FOR CAMPUS COMMUNITIES <span>✳</span></div><div className="auth-orb orb-a"/><div className="auth-orb orb-b"/></div>;
}

export function LoginPortalChooser() {
  return <div className="auth-page"><AuthArtwork/><div className="auth-form-side"><div className="auth-form-wrap portal-chooser"><div className="mobile-auth-brand"><div className="brand-mark"><Wrench size={17}/></div><b>campus<span className="brand-accent">fix</span></b></div><div className="eyebrow">WELCOME TO CAMPUSFIX</div><h2>Choose your sign-in</h2><p className="auth-sub">Select the space for your campus role.</p><div className="portal-grid">{portals.map(({ id, label, description, icon: Icon }) => <Link className="portal-card" to={`/login/${id}`} key={id}><span className="portal-icon"><Icon size={19}/></span><span className="portal-copy"><b>{label}</b><small>{description}</small></span><ArrowUpRight size={16}/></Link>)}</div><div className="auth-switch">New to CampusFix? <Link to="/register">Create a student account</Link></div><div className="auth-legal">By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</div></div></div></div>;
}

export function RoleLoginPage() {
  const { role } = useParams();
  const portal = portals.find(item => item.id === role);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', organizationCode: 'campusfix' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!portal) return <Navigate to="/login" replace/>;

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login({ ...form, role: portal.id });
      navigate('/');
    } catch (loginError) {
      setError(messageOf(loginError));
    } finally {
      setBusy(false);
    }
  }

  const Icon = portal.icon;
  return <div className="auth-page"><AuthArtwork/><div className="auth-form-side"><div className="auth-form-wrap"><div className="mobile-auth-brand"><div className="brand-mark"><Wrench size={17}/></div><b>campus<span className="brand-accent">fix</span></b></div><Link className="portal-back" to="/login">← All sign-in spaces</Link><div className="portal-heading"><span className="portal-icon"><Icon size={19}/></span><div><div className="eyebrow">{portal.label.toUpperCase()} SIGN-IN</div><h2>Welcome back.</h2></div></div><p className="auth-sub">Sign in to your {portal.label.toLowerCase()} space.</p><form onSubmit={submit}><label>Email address<input required type="email" autoComplete="username" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="you@college.edu"/></label><label>Password<input required type="password" autoComplete="current-password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} placeholder="Your password"/></label>{error&&<div className="alert error" role="alert">{error}</div>}<button className="button primary auth-submit" disabled={busy}>{busy?'Please wait…':'Sign in as '+portal.label} <ArrowUpRight size={15}/></button></form>{portal.id==='staff'&&<div className="demo-note"><span><b>Staff demo account</b><br/>staff@campusfix.demo<br/>Password: CampusFix123!</span></div>}{portal.id==='student'&&<div className="auth-switch">New to CampusFix? <Link to="/register">Create a student account</Link></div>}<div className="portal-switch"><span>Other sign-in spaces</span><div>{portals.filter(item => item.id !== portal.id).map(item => <Link to={`/login/${item.id}`} key={item.id}>{item.label}</Link>)}</div></div><div className="auth-legal">By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</div></div></div></div>;
}
