"use client";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Contact = {
  contactType?: string;
  name?: string;
  designation?: string;
  phone?: string;
  email?: string;
  technicalDetails?: string;
  billingDetails?: string;
};

type Props = {
  formData: any;
  setFormData: (updater: any) => void;
  handleInputChange: (f: string, v: string) => void;
  normalizePhone: (s: string) => string;
};

export default function VendorInfoAndContacts({
  formData,
  setFormData,
  handleInputChange,
  normalizePhone,
}: Readonly<Props>) {
  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="h-5 w-5 text-[#6366f1]" />
        <h3 className="text-lg font-semibold text-[#1a1d2e]">
          Vendor Information
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Basic details */}
        <div className="md:col-span-2">
          <label
            htmlFor="vendorName"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Vendor Name *
          </label>
          <input
            id="vendorName"
            type="text"
            required
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="e.g., Microsoft Corporation"
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="legalName"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Vendor Legal Name
          </label>
          <input
            id="legalName"
            type="text"
            value={formData.legalName}
            onChange={(e) => handleInputChange("legalName", e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="tradingName"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Trading / Brand Name
          </label>
          <input
            id="tradingName"
            type="text"
            value={formData.tradingName}
            onChange={(e) => handleInputChange("tradingName", e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
          />
        </div>

        <div>
          <label
            htmlFor="registrationNumber"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Company Registration Number / GSTIN
          </label>
          <input
            id="registrationNumber"
            type="text"
            value={formData.registrationNumber}
            onChange={(e) =>
              handleInputChange("registrationNumber", e.target.value)
            }
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
          />
        </div>

        <div>
          <label
            htmlFor="website"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Website
          </label>
          <input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => handleInputChange("website", e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="registeredOfficeAddress"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Registered Office Address
          </label>
          <input
            id="registeredOfficeAddress"
            type="text"
            value={formData.registeredOfficeAddress}
            onChange={(e) =>
              handleInputChange("registeredOfficeAddress", e.target.value)
            }
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="corporateOfficeAddress"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Corporate Office Address
          </label>
          <input
            id="corporateOfficeAddress"
            type="text"
            value={formData.corporateOfficeAddress}
            onChange={(e) =>
              handleInputChange("corporateOfficeAddress", e.target.value)
            }
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
          />
        </div>

        <div>
          <label
            htmlFor="natureOfBusiness"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Nature of Business
          </label>
          <input
            id="natureOfBusiness"
            type="text"
            value={formData.natureOfBusiness}
            onChange={(e) =>
              handleInputChange("natureOfBusiness", e.target.value)
            }
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
          />
        </div>

        <div>
          <label
            htmlFor="businessCategory"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Business Category
          </label>
          <input
            id="businessCategory"
            type="text"
            value={formData.businessCategory}
            onChange={(e) =>
              handleInputChange("businessCategory", e.target.value)
            }
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="serviceCoverageArea"
            className="block text-sm font-medium text-[#1a1d2e] mb-2"
          >
            Service Coverage Area
          </label>
          <input
            id="serviceCoverageArea"
            type="text"
            value={formData.serviceCoverageArea}
            onChange={(e) =>
              handleInputChange("serviceCoverageArea", e.target.value)
            }
            className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
          />
        </div>
      </div>

      {/* Contacts Section */}
      <div className="mt-6 bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-[#1a1d2e] mb-4">
          Contact Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label
              htmlFor="vendor-contactPerson"
              className="block text-sm font-medium text-[#1a1d2e] mb-2"
            >
              Contact Person *
            </label>
            <input
              id="vendor-contactPerson"
              type="text"
              required
              value={formData.contactPerson}
              onChange={(e) =>
                handleInputChange("contactPerson", e.target.value)
              }
              className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
            />
          </div>

          <div>
            <label
              htmlFor="vendor-email"
              className="block text-sm font-medium text-[#1a1d2e] mb-2"
            >
              Email *
            </label>
            <input
              id="vendor-email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
            />
          </div>

          <div>
            <label
              htmlFor="vendor-phone"
              className="block text-sm font-medium text-[#1a1d2e] mb-2"
            >
              Phone *
            </label>
            <input
              id="vendor-phone"
              type="tel"
              inputMode="tel"
              pattern="^\+?\d{7,20}$"
              title="Enter digits only, optionally starting with + (7–20 digits)"
              required
              value={formData.phone}
              onChange={(e) =>
                handleInputChange("phone", normalizePhone(e.target.value))
              }
              className="w-full px-4 py-2.5 rounded-lg bg-[#f8f9ff] border"
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-[#1a1d2e]">
              Additional Contacts
            </h4>
            <Button
              type="button"
              onClick={() => {
                setFormData((f: any) => {
                  const contacts: Contact[] = Array.isArray(f.contacts)
                    ? [...f.contacts]
                    : [];
                  if (contacts.length >= 5) return f;
                  contacts.push({});
                  return { ...f, contacts };
                });
              }}
              className="text-sm text-[#6366f1] hover:underline"
            >
              Add Contact
            </Button>
          </div>
          <div className="space-y-4">
            {(formData.contacts || []).map((c: Contact, idx: number) => (
              <div
                key={`${c.email || c.name || "contact"}-${idx}`}
                className="p-4 border rounded-lg bg-[#fbfbff]"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium">Contact #{idx + 1}</div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={() =>
                        setFormData((f: any) => ({
                          ...f,
                          contacts: f.contacts.filter(
                            (_: Contact, i: number) => i !== idx
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
                      htmlFor={`additional-${idx}-type`}
                      className="block text-xs text-[#1a1d2e] mb-1"
                    >
                      Contact Type
                    </label>
                    <input
                      id={`additional-${idx}-type`}
                      type="text"
                      value={c.contactType || ""}
                      onChange={(e) =>
                        setFormData((f: any) => {
                          const contacts: Contact[] = [...f.contacts];
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
                      htmlFor={`additional-${idx}-name`}
                      className="block text-xs text-[#1a1d2e] mb-1"
                    >
                      Name
                    </label>
                    <input
                      id={`additional-${idx}-name`}
                      type="text"
                      value={c.name || ""}
                      onChange={(e) =>
                        setFormData((f: any) => {
                          const contacts: Contact[] = [...f.contacts];
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
                      htmlFor={`additional-${idx}-designation`}
                      className="block text-xs text-[#1a1d2e] mb-1"
                    >
                      Designation
                    </label>
                    <input
                      id={`additional-${idx}-designation`}
                      type="text"
                      value={c.designation || ""}
                      onChange={(e) =>
                        setFormData((f: any) => {
                          const contacts: Contact[] = [...f.contacts];
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
                      htmlFor={`additional-${idx}-phone`}
                      className="block text-xs text-[#1a1d2e] mb-1"
                    >
                      Phone
                    </label>
                    <input
                      id={`additional-${idx}-phone`}
                      type="tel"
                      inputMode="tel"
                      pattern="^\+?\d{7,20}$"
                      title="Enter digits only, optionally starting with + (7–20 digits)"
                      value={c.phone || ""}
                      onChange={(e) =>
                        setFormData((f: any) => {
                          const contacts: Contact[] = [...f.contacts];
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
                      htmlFor={`additional-${idx}-email`}
                      className="block text-xs text-[#1a1d2e] mb-1"
                    >
                      Email
                    </label>
                    <input
                      id={`additional-${idx}-email`}
                      type="email"
                      value={c.email || ""}
                      onChange={(e) =>
                        setFormData((f: any) => {
                          const contacts: Contact[] = [...f.contacts];
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
                      htmlFor={`additional-${idx}-technical`}
                      className="block text-xs text-[#1a1d2e] mb-1"
                    >
                      Technical Support Contact Details (optional)
                    </label>
                    <input
                      id={`additional-${idx}-technical`}
                      type="text"
                      value={c.technicalDetails || ""}
                      onChange={(e) =>
                        setFormData((f: any) => {
                          const contacts: Contact[] = [...f.contacts];
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
                      htmlFor={`additional-${idx}-billing`}
                      className="block text-xs text-[#1a1d2e] mb-1"
                    >
                      Billing / Finance Contact Details (optional)
                    </label>
                    <input
                      id={`additional-${idx}-billing`}
                      type="text"
                      value={c.billingDetails || ""}
                      onChange={(e) =>
                        setFormData((f: any) => {
                          const contacts: Contact[] = [...f.contacts];
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
    </div>
  );
}
