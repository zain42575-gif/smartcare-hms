import { useState } from 'react';
import { Activity, Stethoscope, FlaskConical, Pill, Heart, Users, Calendar, ArrowRight, MessageSquare, Phone, MapPin, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import api from '../api/client.js';

export default function LandingPage() {
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      const res = await api.post('/contact', formData);
      setSubmitStatus({ type: 'success', text: res.data.message || 'Thank you! Your message has been received.' });
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Failed to send message. Please try again.';
      setSubmitStatus({ type: 'error', text: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScroll = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const services = [
    { title: 'General Consultation', description: 'Comprehensive primary care, health screenings, and professional diagnosis by qualified family physicians.', icon: <Stethoscope size={28} /> },
    { title: 'Laboratory Diagnostics', description: 'State-of-the-art diagnostic testing, blood analysis, and pathology results logged directly to your profile.', icon: <FlaskConical size={28} /> },
    { title: 'Pharmacy Services', description: 'On-site medication dispensing with digital stock synchronization and automated low-stock safety limits.', icon: <Pill size={28} /> },
    { title: 'Radiology & Imaging', description: 'Advanced internal radiology including Chest X-Rays, ECGs, and scans compiled by expert technicians.', icon: <Sparkles size={28} /> },
    { title: 'Cardiology Support', description: 'Dedicated cardiovascular screening, stress tests, and specialized therapy mapping for heart health.', icon: <Heart size={28} /> },
    { title: 'Pediatric Care', description: 'Compassionate, round-the-clock clinical care and child development consultation for infants and children.', icon: <Users size={28} /> },
  ];

  return (
    <div className="landing-container">
      {/* 1. NAVBAR */}
      <header className="landing-navbar">
        <div className="landing-brand" onClick={() => handleScroll('home')} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <img src="/logo.jpg" alt="Al Hidayat Hospital Logo" style={{ height: '40px', width: 'auto', borderRadius: '4px' }} />
          <div style={{ color: 'white' }}>
            <strong style={{ color: 'white' }}>Al Hidayat Hospital</strong>
            <small style={{ color: '#e2e8f0' }}>HOSPITAL & DIAGNOSTICS</small>
          </div>
        </div>

        <nav className="landing-nav-links">
          <button onClick={() => handleScroll('home')}>Home</button>
          <button onClick={() => handleScroll('about')}>About Us</button>
          <button onClick={() => handleScroll('services')}>Services</button>
          <button onClick={() => handleScroll('contact')}>Contact Us</button>
        </nav>

        <div className="landing-nav-actions">
          <Link to="/login" className="landing-btn ghost" onClick={() => { if(user) logout(); }}>
            Sign In
          </Link>
          <Link to="/login?mode=register" className="landing-btn gradient" onClick={() => { if(user) logout(); }}>
            Register
          </Link>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section id="home" className="landing-hero">
        <div className="hero-content">
          <h1>We help people to get appointment in online</h1>
          <p>
            Al Hidayat Hospital offers patients advanced, integrated health management. 
            From booking appointments to reviewing lab results, everything is at your fingertips.
          </p>
          <div className="hero-ctas">
            {user ? (
              <Link to="/dashboard/appointments" className="landing-btn gradient large">
                Book Appointment <Calendar size={18} style={{ marginLeft: '8px' }} />
              </Link>
            ) : (
              <Link to="/login?mode=register" className="landing-btn gradient large">
                Book Appointment <Calendar size={18} style={{ marginLeft: '8px' }} />
              </Link>
            )}
            <button className="landing-btn ghost large" onClick={() => handleScroll('about')}>
              Learn More
            </button>
          </div>
        </div>

        {/* CSS Medical Illustration */}
        <div className="hero-illustration">
          <div className="circle-backdrop"></div>
          <div className="illustration-card main-card">
            <div className="card-avatar">
              <Stethoscope size={24} />
            </div>
            <div>
              <h4>24/7 Care Support</h4>
              <p>Physical consultations and checkups.</p>
            </div>
            <div className="status-badge success">Online</div>
          </div>
          
          <div className="illustration-card sub-card-1">
            <div className="card-avatar blue">
              <FlaskConical size={20} />
            </div>
            <div>
              <h4>Lab Results</h4>
              <p>Logged directly to patient files.</p>
            </div>
          </div>

          <div className="illustration-card sub-card-2">
            <div className="card-avatar orange">
              <Pill size={20} />
            </div>
            <div>
              <h4>Smart Pharmacy</h4>
              <p>Automatic stock inventory alerts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BIOGRAPHY / WHO WE ARE SECTION */}
      <section id="about" className="landing-about">
        <div className="about-visuals">
          <div className="visuals-backdrop"></div>
          
          <div className="biography-card bio-chat-1">
            <div className="chat-avatar">👨‍⚕️</div>
            <div className="chat-bubble">
              <strong>Dr. Hidayat Hussain - Chief Medical Officer</strong>
              <p>Welcome to Al Hidayat Hospital. How can we assist you today?</p>
            </div>
          </div>

          <div className="biography-card bio-chat-2">
            <div className="chat-avatar">👨‍💻</div>
            <div className="chat-bubble">
              <strong>Patient Account Portal</strong>
              <p>View medical history, diagnostics reports, and bill invoices instantly.</p>
            </div>
          </div>
        </div>

        <div className="about-info">
          <span className="info-tag">BIOGRAPHY</span>
          <h2>Who We Are</h2>
          <p>
            Al Hidayat Hospital is a full-service modern healthcare facility dedicated to bringing 
            excellence in medicine and compassionate care.
          </p>
          <p>
            Our online portal allows patients to skip long registration lines. By registering a 
            profile online, patients can manage scheduling, review lab diagnostics, and access pharmacy 
            bills immediately, reducing wait times and ensuring transparent care delivery.
          </p>
          <div className="about-stats">
            <div className="stat-box">
              <h3>100%</h3>
              <p>Secure Records</p>
            </div>
            <div className="stat-box">
              <h3>24hr</h3>
              <p>Diagnostics Turnaround</p>
            </div>
            <div className="stat-box">
              <h3>Zero</h3>
              <p>Double Bookings</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SERVICES SECTION */}
      <section id="services" className="landing-services">
        <div className="section-header">
          <span className="info-tag">OUR DEPARTMENTS</span>
          <h2>Our Services & Specialties</h2>
          <p>We provide comprehensive medical assistance backed by professional digital administration.</p>
        </div>

        <div className="services-grid">
          {services.map((svc, idx) => (
            <div key={idx} className="service-card">
              <div className="service-icon">{svc.icon}</div>
              <h3>{svc.title}</h3>
              <p>{svc.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CONTACT US SECTION */}
      <section id="contact" className="landing-contact">
        <div className="contact-details">
          <span className="info-tag">GET IN TOUCH</span>
          <h2>Contact Us</h2>
          <p>Reach out to our administrative support desk for technical assistance or clinical inquiries.</p>
          
          <div className="contact-info-list">
            <div className="contact-item">
              <div className="contact-icon"><MapPin size={20} /></div>
              <div>
                <strong>Location</strong>
                <p>GT Road Near UBL Bank, Teshil and District Kot Adu</p>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-icon"><Phone size={20} /></div>
              <div>
                <strong>Phone Support</strong>
                <p>+92 3037364446</p>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-icon"><Mail size={20} /></div>
              <div>
                <strong>Email Address</strong>
                <p>support@alhidayathospital.com</p>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-form-panel">
          <h3>Leave us a message</h3>
          <form onSubmit={handleContactSubmit}>
            <label>
              Full Name
              <input 
                type="text" 
                placeholder="Your name" 
                required 
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </label>
            <label>
              Email Address
              <input 
                type="email" 
                placeholder="Your email" 
                required 
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </label>
            <label>
              Message Content
              <textarea 
                rows={4} 
                placeholder="How can we help you?" 
                required
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              ></textarea>
            </label>

            {submitStatus && (
              <div style={{ 
                padding: '10px 14px', 
                borderRadius: '8px', 
                fontSize: '13px', 
                fontWeight: '500', 
                marginBottom: '12px',
                background: submitStatus.type === 'success' ? '#f0fdf4' : '#fef2f2',
                color: submitStatus.type === 'success' ? '#15803d' : '#b91c1c',
                border: `1px solid ${submitStatus.type === 'success' ? '#bbf7d0' : '#fecaca'}`
              }}>
                {submitStatus.text}
              </div>
            )}

            <button type="submit" className="landing-btn gradient" disabled={isSubmitting} style={{ width: '100%', marginTop: '12px' }}>
              {isSubmitting ? 'Sending...' : 'Send Message'} <ArrowRight size={16} style={{ marginLeft: '6px' }} />
            </button>
          </form>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <img src="/logo.jpg" alt="Logo" style={{ height: '32px', width: 'auto', borderRadius: '4px' }} />
            <strong style={{ fontSize: '20px', color: 'white' }}>Al Hidayat Hospital</strong>
          </div>
          <p>Providing premium diagnostic care and modern clinical operations.</p>
          <div className="footer-copyright">
            &copy; 2026 Al Hidayat Hospital. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
