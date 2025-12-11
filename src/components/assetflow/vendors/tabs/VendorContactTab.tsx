"use client";
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Phone } from "lucide-react";
import { normalizePhone } from "../vendorUtils";

type Props = {
  formData: any;
  handleInputChange: (f: string, v: string) => void;
  setFormData: (updater: any) => void;
};

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? (crypto as any).randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export default function VendorContactTab({
  formData,
  handleInputChange,
  setFormData,
}: Readonly<Props>) {
  useEffect(() => {
    if (!Array.isArray(formData?.contacts)) return;
    const needsId = formData.contacts.some((c: any) => !c?.id);
    if (needsId) {
      setFormData((f: any) => ({
        ...f,
        contacts: (f.contacts || []).map((c: any) => ({
          ...c,
          id: c?.id ?? generateId(),
        })),
      }));
    }
  }, [formData?.contacts, setFormData]);

  // Helpers to reduce nesting and centralize state updates
  const addContact = () => {
    setFormData((f: any) => {
      const contacts = Array.isArray(f.contacts) ? [...f.contacts] : [];
      if (contacts.length >= 5) return f;
      contacts.push({ id: generateId() });
      return { ...f, contacts };
    });
  };

  const removeContact = (index: number) => {
    setFormData((f: any) => ({
      ...f,
      contacts: (f.contacts || []).filter((_: any, i: number) => i !== index),
    }));
  };

  const updateContactField = (
    index: number,
    field: string,
    value: any
  ) => {
    setFormData((f: any) => {
      const contacts = Array.isArray(f.contacts) ? [...f.contacts] : [];
      contacts[index] = { ...(contacts[index]), [field]: value };
      return { ...f, contacts };
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
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
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
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
              className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
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
              className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-[#1a1d2e]">
              Additional Contacts
            </h4>
            <Button
              type="button"
              onClick={addContact}
              className="text-sm text-[#6366f1] hover:underline"
            >
              Add Contact
            </Button>
          </div>

          <div className="space-y-4">
            {(formData?.contacts || []).map((c: any, idx: number) => (
              <div key={c.id} className="p-4 border rounded-lg bg-[#fbfbff]">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium">Contact #{idx + 1}</div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => removeContact(idx)}
                      className="text-xs text-red-600"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor={`contact-${idx}-type`}
                      className="block text-xs text-[#1a1d2e] mb-1"
                    >
                      Contact Type
                    </label>
                    <input
                      id={`contact-${idx}-type`}
                      type="text"
                      value={c.contactType || ""}
                      onChange={(e) =>
                        updateContactField(idx, "contactType", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-lg bg-white border"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`contact-${idx}-name`}
                      className="block text-xs text-[#1a1d2e] mb-1"
                    >
                      Name
                    </label>
                    <input
                      id={`contact-${idx}-name`}
                      type="text"
                      value={c.name || ""}
                      onChange={(e) => updateContactField(idx, "name", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`contact-${idx}-designation`}
                      className="block text-xs text-[#1a1d2e] mb-1"
                    >
                      Designation
                    </label>
                    <input
                      id={`contact-${idx}-designation`}
                      type="text"
                      value={c.designation || ""}
                      onChange={(e) =>
                        updateContactField(idx, "designation", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-lg bg-white border"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`contact-${idx}-phone`}
                      className="block text-xs text-[#1a1d2e] mb-1"
                    >
                      Phone
                    </label>
                    <input
                      id={`contact-${idx}-phone`}
                      type="tel"
                      inputMode="tel"
                      pattern="^\+?\d{7,20}$"
                      title="Enter digits only, optionally starting with + (7–20 digits)"
                      value={c.phone || ""}
                      onChange={(e) =>
                        updateContactField(idx, "phone", normalizePhone(e.target.value))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-white border"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`contact-${idx}-email`}
                      className="block text-xs text-[#1a1d2e] mb-1"
                    >
                      Email
                    </label>
                    <input
                      id={`contact-${idx}-email`}
                      type="email"
                      value={c.email || ""}
                      onChange={(e) => updateContactField(idx, "email", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label
                      htmlFor={`contact-${idx}-technical`}
                      className="block text-xs text-[#1a1d2e] mb-1"
                    >
                      Technical Support Contact Details (optional)
                    </label>
                    <input
                      id={`contact-${idx}-technical`}
                      type="text"
                      value={c.technicalDetails || ""}
                      onChange={(e) =>
                        updateContactField(idx, "technicalDetails", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-lg bg-white border"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label
                      htmlFor={`contact-${idx}-billing`}
                      className="block text-xs text-[#1a1d2e] mb-1"
                    >
                      Billing / Finance Contact Details (optional)
                    </label>
                    <input
                      id={`contact-${idx}-billing`}
                      type="text"
                      value={c.billingDetails || ""}
                      onChange={(e) =>
                        updateContactField(idx, "billingDetails", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-lg bg-white border"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
