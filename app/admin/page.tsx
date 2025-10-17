"use client";
import Link from 'next/link';
import { Users as UsersIcon, Shield } from 'lucide-react';

export default function AdminHomePage() {
  const cards = [
    {
      title: 'Users',
      desc: 'Create users, assign roles, and manage accounts.',
      href: '/admin/users',
      Icon: UsersIcon,
      gradient: 'from-[#6366f1] to-[#8b5cf6]',
    },
    {
      title: 'Roles & Permissions',
      desc: 'Configure what each role can do across the app.',
      href: '/admin/roles',
      Icon: Shield,
      gradient: 'from-[#10b981] to-[#14b8a6]',
    },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1a1d2e]">Admin</h1>
        <p className="text-[#64748b]">Manage users, roles, and permissions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {cards.map(({ title, desc, href, Icon, gradient }) => (
          <Link key={href} href={href} className="group">
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 h-full transition-all group-hover:shadow-lg group-hover:border-[#d1d5db]">
              <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#1a1d2e] mb-1">{title}</h3>
              <p className="text-sm text-[#64748b] mb-5">{desc}</p>
              <span className="inline-flex items-center text-sm font-medium text-[#1a1d2e]">
                Open <span className="ml-1 transition-transform group-hover:translate-x-0.5">→</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
