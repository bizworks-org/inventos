"use client";
import { motion } from "motion/react";
import { Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VendorContactPanel({
  formData,
  handleInputChange,
  setFormData,
  normalizePhone,
}: {
  formData: any;
  handleInputChange: (field: string, value: string) => void;
  setFormData: (updater: any) => void;
  normalizePhone: (raw: string) => string;
}) {
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
            <Button
              type="button"
              onClick={() =>
                setFormData((f: any) => {
                  const contacts = Array.isArray(f.contacts)
                    ? [...f.contacts]
                    : [];
                  if (contacts.length >= 5) return f;
                  contacts.push({});
                  return { ...f, contacts };
                })
              }
              className="text-sm text-[#6366f1] hover:underline"
            >
              Add Contact
            </Button>
          </div>

          <div className="space-y-4">
            {((formData as any).contacts || []).map((c: any, idx: number) => (
              <div key={idx} className="p-4 border rounded-lg bg-[#fbfbff]">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium">Contact #{idx + 1}</div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={() =>
                        setFormData((f: any) => ({
                          ...f,
                          contacts: f.contacts.filter(
                            (_: any, i: number) => i !== idx
                          ),
                        }))
                      }
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
                        setFormData((f: any) => {
                          const contacts = [...f.contacts];
                          contacts[idx] = {
                            ...contacts[idx],
                            contactType: e.target.value,
                          };
                          return { ...f, contacts };
                        })
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
                      onChange={(e) =>
                        setFormData((f: any) => {
                          const contacts = [...f.contacts];
                          contacts[idx] = {
                            ...contacts[idx],
                            name: e.target.value,
                          };
                          return { ...f, contacts };
                        })
                      }
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
                        setFormData((f: any) => {
                          const contacts = [...f.contacts];
                          contacts[idx] = {
                            ...contacts[idx],
                            designation: e.target.value,
                          };
                          return { ...f, contacts };
                        })
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
                      value={c.phone || ""}
                      onChange={(e) =>
                        setFormData((f: any) => {
                          const contacts = [...f.contacts];
                          contacts[idx] = {
                            ...contacts[idx],
                            phone: normalizePhone(e.target.value),
                          };
                          return { ...f, contacts };
                        })
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
                      onChange={(e) =>
                        setFormData((f: any) => {
                          const contacts = [...f.contacts];
                          contacts[idx] = {
                            ...contacts[idx],
                            email: e.target.value,
                          };
                          return { ...f, contacts };
                        })
                      }
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
                        setFormData((f: any) => {
                          const contacts = [...f.contacts];
                          contacts[idx] = {
                            ...contacts[idx],
                            technicalDetails: e.target.value,
                          };
                          return { ...f, contacts };
                        })
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
                        setFormData((f: any) => {
                          const contacts = [...f.contacts];
                          contacts[idx] = {
                            ...contacts[idx],
                            billingDetails: e.target.value,
                          };
                          return { ...f, contacts };
                        })
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
    </motion.div>
  );
}
