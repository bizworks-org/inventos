"use client";

export default function AdminRolesPermissionsPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1a1d2e]">Roles & Permissions</h1>
        <p className="text-[#64748b]">Configure role capabilities. (You can manage permissions on the Users page for now.)</p>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
        <p className="text-[#64748b]">This page can be extended to manage roles and permissions in greater detail. For now, use the Role Permissions section on the Users page.</p>
      </div>
    </>
  );
}
