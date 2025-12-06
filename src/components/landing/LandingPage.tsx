'use client';

import clsx from 'clsx';
import { motion, useInView } from 'motion/react';
import { useRef, useState, useEffect } from 'react';
import {
  Activity,
  Shield,
  FileCheck,
  Users,
  ArrowRight,
  CheckCircle,
  Server,
  Laptop,
  Smartphone,
  Database,
} from 'lucide-react';
import styles from './LandingPage.module.css';

function hexToRgba(hex: string, alpha: number) {
  const sanitized = hex.replace('#', '');
  const bigint = Number.parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface LandingPageProps {
  onEnterApp?: () => void;
}

export function LandingPage({ onEnterApp }: Readonly<LandingPageProps>) {
  return (
    <div className={styles.root}>
      <HeroSection onEnterApp={onEnterApp} />
      <ProductHighlights />
      <InteractiveDemoSection />
      <SocialProofSection />
      <CTABanner onEnterApp={onEnterApp} />
      <Footer />
    </div>
  );
}

// Hero Section with animated orbiting nodes
function HeroSection({ onEnterApp }: Readonly<{ onEnterApp?: () => void }>) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / globalThis.innerWidth - 0.5) * 20,
        y: (e.clientY / globalThis.innerHeight - 0.5) * 20,
      });
    };
    globalThis.addEventListener('mousemove', handleMouseMove);
    return () => globalThis.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className={styles.heroSection}>
      <div className={styles.heroGradient} />
      <div className={styles.heroGrid} />

      <OrbitingNodes mousePosition={mousePosition} />

      <div className={styles.heroContent}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <motion.h1
            className={styles.heroTitle}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            Track. Audit. Secure.
            <br />
            <span className={styles.heroTitleAccent}>All Your IT Assets in One Place.</span>
          </motion.h1>

          <motion.p
            className={styles.heroSubtitle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Event-driven IT Asset Management with real-time compliance and audit-ready workflows.
          </motion.p>

          <motion.div
            className={styles.ctaWrapper}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <CTAButton onClick={onEnterApp} />
          </motion.div>
        </motion.div>

        <motion.div
          className={styles.statsGrid}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          {[
            { label: 'Assets Tracked', value: '500K+' },
            { label: 'Compliance Rate', value: '99.9%' },
            { label: 'Time Saved', value: '80%' },
          ].map((stat) => (
            <div key={stat.label} className={styles.statItem}>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div
        className={styles.scrollIndicator}
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className={styles.scrollShell}>
          <motion.div
            className={styles.scrollDot}
            animate={{ y: [0, 16, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
}

// Orbiting nodes component
function OrbitingNodes({ mousePosition }: Readonly<{ mousePosition: { x: number; y: number } }>) {
  const nodes = [
    { icon: Server, color: '#6366f1', delay: 0, radius: 200, speed: 20 },
    { icon: Laptop, color: '#8b5cf6', delay: 1, radius: 250, speed: 25 },
    { icon: Smartphone, color: '#ec4899', delay: 2, radius: 200, speed: 30 },
    { icon: Database, color: '#14b8a6', delay: 3, radius: 250, speed: 22 },
  ];

  return (
    <div className={styles.orbitingNodes}>
      <motion.div
        className={styles.orbitHub}
        animate={{
          scale: [1, 1.1, 1],
          boxShadow: [
            '0 0 20px rgba(99, 102, 241, 0.5)',
            '0 0 40px rgba(99, 102, 241, 0.8)',
            '0 0 20px rgba(99, 102, 241, 0.5)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{
          x: mousePosition.x,
          y: mousePosition.y,
        }}
      />

      {nodes.map((node) => (
        <OrbitingNode
          key={node.color}
          icon={node.icon}
          color={node.color}
          delay={node.delay}
          radius={node.radius}
          speed={node.speed}
        />
      ))}
    </div>
  );
}

function OrbitingNode({
  icon: Icon,
  color,
  delay,
  radius,
  speed,
}: Readonly<{
  icon: any;
  color: string;
  delay: number;
  radius: number;
  speed: number;
}>) {
  return (
    <motion.div
      className={styles.orbitWrapper}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay }}
      style={{ top: '50%', left: '50%', marginLeft: -radius, marginTop: -radius }}
    >
      <motion.div
        className={styles.orbitTrack}
        animate={{ rotate: 360 }}
        transition={{ duration: speed, repeat: Infinity, ease: 'linear', delay }}
        style={{ width: radius * 2, height: radius * 2 }}
      >
        <motion.div
          className={styles.orbitIcon}
          style={{ backgroundColor: color }}
          whileHover={{ scale: 1.2 }}
          animate={{
            y: [0, -5, 0],
            boxShadow: [
              `0 0 20px ${color}80`,
              `0 0 30px ${color}`,
              `0 0 20px ${color}80`,
            ],
          }}
          transition={{
            y: { duration: 2, repeat: Infinity },
            boxShadow: { duration: 2, repeat: Infinity },
          }}
        >
          <Icon size={24} color="#ffffff" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// CTA Button with glow effect
function CTAButton({ children = 'Get Started', onClick }: { children?: React.ReactNode; onClick?: () => void }) {
  return (
    <motion.button
      className={styles.ctaButton}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <motion.div className={styles.ctaButtonGlow} />
      <span className={styles.ctaButtonText}>
        {children}
        <ArrowRight size={20} className={styles.arrowIcon} />
      </span>
      <motion.div
        className={styles.ripple}
        initial={{ scale: 0, opacity: 0.5 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 1, repeat: Infinity }}
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)',
        }}
      />
    </motion.button>
  );
}

// Product Highlights Section
function ProductHighlights() {
  const features = [
    {
      icon: Activity,
      title: 'Real-time Asset Tracking',
      description: 'Monitor all your IT assets in real-time with automated discovery and updates.',
      color: '#6366f1',
      animationType: 'pulse',
    },
    {
      icon: Shield,
      title: 'Automated Compliance',
      description: 'Stay compliant with automated workflows and audit-ready documentation.',
      color: '#8b5cf6',
      animationType: 'timeline',
    },
    {
      icon: FileCheck,
      title: 'Audit-Ready Reports',
      description: 'Generate comprehensive reports with a single click for audits and reviews.',
      color: '#ec4899',
      animationType: 'chart',
    },
    {
      icon: Users,
      title: 'Vendor & License Management',
      description: 'Centralize vendor relationships and optimize license utilization.',
      color: '#14b8a6',
      animationType: 'orbit',
    },
  ];

  return (
    <section className={clsx(styles.section, styles.sectionLight)}>
      <div className={styles.sectionInner}>
        <motion.div
          className={styles.sectionTitle}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className={styles.sectionHeading}>Powerful Features</h2>
          <p className={styles.sectionDescription}>
            Everything you need to manage your IT assets efficiently and securely
          </p>
        </motion.div>

        <div className={styles.featureGrid}>
          {features.map((feature, idx) => (
            <FeatureCard key={feature.title} feature={feature} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, index }: { feature: any; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const iconBackground = hexToRgba(feature.color, 0.15);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div className={styles.featureCard}>
        <motion.div
          className={styles.featureIcon}
          style={{ backgroundColor: iconBackground }}
          whileHover={{ scale: 1.08, rotate: 4 }}
        >
          <feature.icon size={32} style={{ color: feature.color }} />
          {feature.animationType === 'pulse' && (
            <motion.div
              className={styles.featurePulse}
              animate={{ scale: [1, 1.25, 1], opacity: [0.45, 0, 0.45] }}
              transition={{ duration: 2.2, repeat: Infinity }}
              style={{ backgroundColor: feature.color }}
            />
          )}
        </motion.div>
        <h3 className={styles.featureTitle}>{feature.title}</h3>
        <p className={styles.featureDescription}>{feature.description}</p>
        <div className={styles.featureArrow}>
          <ArrowRight size={22} color="#6366f1" />
        </div>
      </div>
    </motion.div>
  );
}

// Interactive Demo Section
function InteractiveDemoSection() {
  const [activeState, setActiveState] = useState(0);
  const states = ['Procured', 'In Use', 'Audited', 'Retired'];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveState((prev) => (prev + 1) % states.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className={clsx(styles.section, styles.sectionWhite)}>
      <div className={styles.sectionInner}>
        <motion.div
          className={styles.sectionTitle}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className={styles.sectionHeading}>See It In Action</h2>
          <p className={styles.sectionDescription}>
            Watch assets flow through their complete lifecycle
          </p>
        </motion.div>

        <div className={styles.demoContainer}>
          <motion.div
            className={styles.demoPanel}
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className={styles.lifecycle}>
              {states.map((state, idx) => (
                <div key={state} className={styles.lifecycleStep}>
                  <div className={styles.lifecycleHead}>
                    <motion.div
                      className={styles.lifecycleBubbleWrapper}
                      animate={{ scale: activeState === idx ? 1.1 : 1 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div
                        className={clsx(
                          styles.lifecycleBubble,
                          activeState === idx && styles.lifecycleBubbleActive,
                        )}
                      >
                        {idx + 1}
                      </div>
                      {activeState === idx && (
                        <motion.div
                          className={styles.lifecyclePulse}
                          initial={{ scale: 1, opacity: 0.45 }}
                          animate={{ scale: 1.55, opacity: 0 }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      )}
                    </motion.div>
                    {idx < states.length - 1 && (
                      <div className={styles.lifecycleConnector}>
                        <motion.div
                          className={styles.lifecycleConnectorFill}
                          initial={{ width: '0%' }}
                          animate={{ width: activeState > idx ? '100%' : '0%' }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    )}
                  </div>
                  <div
                    className={clsx(
                      styles.lifecycleLabel,
                      activeState === idx && styles.lifecycleLabelActive,
                    )}
                  >
                    {state}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.chartGrid}>
              {[1, 2, 3].map((item) => (
                <motion.div
                  key={item}
                  className={styles.chartCard}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: item * 0.12 }}
                >
                  <div className={styles.chartBarHolder}>
                    <motion.div
                      className={styles.chartBar}
                      initial={{ height: '0%' }}
                      animate={{ height: `${Math.random() * 60 + 40}%` }}
                      transition={{ duration: 1, delay: activeState * 0.2 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Social Proof Section
function SocialProofSection() {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'CTO, TechCorp',
      content: 'This platform transformed how we manage our IT assets. The automation saved us countless hours.',
      avatar: '👩‍💼',
    },
    {
      name: 'Michael Chen',
      role: 'IT Director, GlobalSoft',
      content: 'Outstanding compliance features. We passed our audit with flying colors thanks to the detailed reports.',
      avatar: '👨‍💼',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Operations Manager, DataFlow',
      content: 'The real-time tracking is a game-changer. We always know exactly where our assets are.',
      avatar: '👩‍💼',
    },
  ];

  const clients = ['TechCorp', 'GlobalSoft', 'DataFlow', 'CloudScale', 'SecureNet', 'InnovateLab'];

  return (
    <section className={clsx(styles.section, styles.sectionLight)}>
      <div className={styles.sectionInner}>
        <motion.div
          className={styles.sectionTitle}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className={styles.sectionHeading}>Trusted by Industry Leaders</h2>
        </motion.div>

        <motion.div
          className={styles.socialClients}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          {clients.map((client, idx) => (
            <motion.div
              key={client}
              className={styles.clientLogo}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.08 }}
            >
              {client}
            </motion.div>
          ))}
        </motion.div>

        <div className={styles.testimonialGrid}>
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
              whileHover={{ y: -10 }}
            >
              <div className={styles.testimonialCard}>
                <div className={styles.testimonialAvatar}>{testimonial.avatar}</div>
                <p className={styles.testimonialContent}>
                  “{testimonial.content}”
                </p>
                <div>
                  <div className={styles.testimonialName}>{testimonial.name}</div>
                  <div className={styles.testimonialRole}>{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Banner
function CTABanner({ onEnterApp }: Readonly<{ onEnterApp?: () => void }>) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <section className={styles.ctaSection}>
      <motion.div
        className={styles.ctaBackground}
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      />

      {isMounted && (
        <div className={styles.ctaShapeLayer}>
          {Array.from({ length: 5 }).map((_, idx) => {
            const viewportWidth = globalThis.window === undefined ? 1200 : globalThis.window.innerWidth;
            return (
              <motion.div
                key={idx + idx}
                className={styles.floatingShape}
                initial={{
                  x: Math.random() * viewportWidth,
                  y: Math.random() * 300,
                }}
                animate={{
                  x: Math.random() * viewportWidth,
                  y: Math.random() * 300,
                }}
                transition={{
                  duration: 20 + idx * 5,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
                style={{ width: 220 + idx * 30, height: 220 + idx * 30 }}
              />
            );
          })}
        </div>
      )}

      <div className={styles.ctaInner}>
        <motion.h2
          className={styles.ctaTitle}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Simplify IT Asset Management Today
        </motion.h2>

        <motion.p
          className={styles.ctaSubtitle}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          Join thousands of companies managing their IT assets smarter
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            className={styles.ctaPrimaryButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEnterApp}
          >
            <span>
              Start Free Trial
            </span>
            <motion.span animate={{ x: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <ArrowRight size={24} color="currentColor" />
            </motion.span>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  const footerLinks = {
    Product: ['Features', 'Pricing', 'Security', 'Roadmap'],
    Company: ['About', 'Blog', 'Careers', 'Contact'],
    Resources: ['Documentation', 'Help Center', 'API Reference', 'Community'],
    Legal: ['Privacy', 'Terms', 'Compliance', 'Cookies'],
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <motion.span className={styles.footerLogo} whileHover={{ scale: 1.04 }}>
              AssetFlow
            </motion.span>
            <p className={styles.footerDescription}>
              Next-generation IT asset management for modern enterprises.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className={styles.footerHeading}>{category}</h4>
              <ul className={styles.footerList}>
                {links.map((link) => (
                  <li key={link}>
                    <motion.a
                      href="#"
                      className={styles.footerLink}
                      whileHover={{ x: 6 }}
                    >
                      {link}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={styles.footerBottom}>
          <div className={styles.badgeRow}>
            {['ISO 27001', 'SOC 2 Type II', 'GDPR Compliant'].map((badge) => (
              <motion.div
                key={badge}
                className={styles.badge}
                whileHover={{
                  borderColor: '#6366f1',
                  boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)',
                }}
              >
                <CheckCircle className={styles.badgeIcon} />
                {badge}
              </motion.div>
            ))}
          </div>

          <div className={styles.copyright}>
            © 2025 AssetFlow. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LandingPage;
