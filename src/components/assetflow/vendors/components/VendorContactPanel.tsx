"use client";
import { useEffect } from "react";
import { motion } from "motion/react";
import { Mail, Phone } from "lucide-react";

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? (crypto as any).randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const ensureContactsHaveIds = (
  contacts: any[],
  setFormData: (updater: any) => void
) => {
  if (!Array.isArray(contacts)) return;
  const needsId = contacts.some((c: any) => !c?.id);
  if (needsId) {
    setFormData((f: any) => ({
      ...f,
      contacts: f.contacts.map((c: any) =>
        c.id ? c : { ...c, id: generateId() }
      ),
    }));
  }
};

const handleAddContact = (
  formData: any,
  setFormData: (updater: any) => void
) => {
  setFormData((f: any) => {
    const contacts = Array.isArray(f.contacts) ? [...f.contacts] : [];
    if (contacts.length >= 5) return f;
    contacts.push({ id: generateId() });
    return { ...f, contacts };
  });
};

const handleRemoveContact = (
  contactId: string,
  setFormData: (updater: any) => void
) => {
  setFormData((f: any) => ({
    ...f,
    contacts: f.contacts.filter((ct: any) => ct.id !== contactId),
  }));
};

const handleContactFieldChange = (
  contactId: string,
  field: string,
  value: any,
  formData: any,
  setFormData: (updater: any) => void
) => {
  setFormData((f: any) => ({
    ...f,
    contacts: f.contacts.map((ct: any) =>
      ct.id === contactId ? { ...ct, [field]: value } : ct
    ),
  }));
};

interface ContactInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
}

const ContactInput = ({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  className = "",
}: ContactInputProps) => (
  <div>
    <label htmlFor={id} className="block text-xs text-[#1a1d2e] mb-1">
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 rounded-lg bg-white border ${className}`}
    />
  </div>
);

const ContactItem = ({
  contact,
  index,
  formData,
  setFormData,
  normalizePhone,
}: {
  contact: any;
  index: number;
  formData: any;
  setFormData: (updater: any) => void;
  normalizePhone: (raw: string) => string;
}) => {
  const updateField = (field: string, value: any) =>
    handleContactFieldChange(contact.id, field, value, formData, setFormData);

  return (
    <div className="p-4 border rounded-lg bg-[#fbfbff]">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-medium">Contact #{index + 1}</div>
        <button
          type="button"
          onClick={() => handleRemoveContact(contact.id, setFormData)}
          className="text-xs text-red-600"
        >
          Remove
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ContactInput
          id={`contact-${contact.id}-type`}
          label="Contact Type"
          value={contact.contactType || ""}
          onChange={(v) => updateField("contactType", v)}
        />
        <ContactInput
          id={`contact-${contact.id}-name`}
          label="Name"
          value={contact.name || ""}
          onChange={(v) => updateField("name", v)}
        />
        <ContactInput
          id={`contact-${contact.id}-designation`}
          label="Designation"
          value={contact.designation || ""}
          onChange={(v) => updateField("designation", v)}
        />
        <ContactInput
          id={`contact-${contact.id}-phone`}
          label="Phone"
          type="tel"
          value={contact.phone || ""}
          onChange={(v) => updateField("phone", normalizePhone(v))}
        />
        <ContactInput
          id={`contact-${contact.id}-email`}
          label="Email"
          type="email"
          value={contact.email || ""}
          onChange={(v) => updateField("email", v)}
        />
        <div className="md:col-span-2">
          <ContactInput
            id={`contact-${contact.id}-technical`}
            label="Technical Support Contact Details (optional)"
            value={contact.technicalDetails || ""}
            onChange={(v) => updateField("technicalDetails", v)}
          />
        </div>
        <div className="md:col-span-2">
          <ContactInput
            id={`contact-${contact.id}-billing`}
            label="Billing / Finance Contact Details (optional)"
            value={contact.billingDetails || ""}
            onChange={(v) => updateField("billingDetails", v)}
          />
        </div>
      </div>
    </div>
  );
};

export default function VendorContactPanel({
  formData,
  handleInputChange,
  setFormData,
  normalizePhone,
}: Readonly<{
  formData: any;
  handleInputChange: (field: string, value: string) => void;
  setFormData: (updater: any) => void;
  normalizePhone: (raw: string) => string;
}>) {
  // ensure existing contacts have ids (so we can use stable keys)
  useEffect(() => {
    ensureContactsHaveIds(formData?.contacts, setFormData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData?.contacts]);

  return (
    <motion.div
      id="panel-contact"
      role="tabpanel"
      aria-labelledby="tab-contact"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">
        Contact Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label
            htmlFor="contact-person"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Contact Person
          </label>
          <input
            id="contact-person"
            type="text"
            value={formData.contactPerson}
            onChange={(e) => handleInputChange("contactPerson", e.target.value)}
            placeholder="e.g., John Smith"
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e]"
          />
        </div>

        <div>
          <label
            htmlFor="contact-email"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Email
          </label>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#64748b]" />
            <input
              id="contact-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="contact@vendor.com"
              className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e]"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="contact-phone"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Phone
          </label>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-[#64748b]" />
            <input
              id="contact-phone"
              type="tel"
              inputMode="tel"
              pattern="^\+?\d{7,20}$"
              title="Enter digits only, optionally starting with + (7–20 digits)"
              value={formData.phone}
              onChange={(e) =>
                handleInputChange("phone", normalizePhone(e.target.value))
              }
              placeholder="+15551234567"
              className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.05)] text-[#1a1d2e]"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-[#1a1d2e]">
              Additional Contacts
            </h4>
            <button
              type="button"
              onClick={() => handleAddContact(formData, setFormData)}
              className="text-sm text-white hover:underline"
            >
              Add Contact
            </button>
          </div>

          <div className="space-y-4">
            {(formData.contacts || []).map((contact: any, index: number) => (
              <ContactItem
                key={contact.id}
                contact={contact}
                index={index}
                formData={formData}
                setFormData={setFormData}
                normalizePhone={normalizePhone}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
