import { Vendor } from "../../../lib/data";

export function normalizePhone(raw: string) {
  const hasLeadingPlus = raw.trim().startsWith("+");
  const digits = (raw.match(/\d/g) || []).join("");
  const normalized = (hasLeadingPlus ? "+" : "") + digits;
  return normalized.slice(0, 21);
}

export function buildUpdatedVendor(
  vendor: any,
  formData: any,
  fieldDefs: any[],
  customFieldValues: Record<string, string>
): Vendor {
  const updated: any = {
    ...vendor,
    name: formData.name,
    type: formData.type,
    contactPerson: formData.contactPerson,
    email: formData.email,
    phone: formData.phone,
    status: formData.status,
    contractValue: Number.parseFloat(formData.contractValue || "0"),
    contractExpiry: formData.contractExpiry,
    rating: Number.parseFloat(formData.rating || "0"),
  };

  if (fieldDefs && fieldDefs.length > 0) {
    updated.customFields = Object.fromEntries(
      fieldDefs.map((def) => [def.key, customFieldValues[def.key] ?? ""])
    );
  }

  // extended fields
  const extended = [
    "legalName",
    "tradingName",
    "registrationNumber",
    "website",
    "incorporationDate",
    "incorporationCountry",
    "registeredOfficeAddress",
    "corporateOfficeAddress",
    "natureOfBusiness",
    "businessCategory",
    "serviceCoverageArea",
    "notes",
  ];
  for (const k of extended) {
    updated[k] = formData[k] ?? vendor[k] ?? undefined;
  }

  // contacts
  const contactsFromForm = formData.contacts;
  if (Array.isArray(contactsFromForm)) {
    updated.contacts = contactsFromForm.slice(0, 5).map((c: any) => ({ ...c }));
  } else if (vendor.contacts) {
    updated.contacts = vendor.contacts;
  }

  // financial
  updated.panTaxId = formData.panTaxId ?? vendor.panTaxId ?? undefined;
  updated.bankName = formData.bankName ?? vendor.bankName ?? undefined;
  updated.accountNumber =
    formData.accountNumber ?? vendor.accountNumber ?? undefined;
  updated.ifscSwiftCode =
    formData.ifscSwiftCode ?? vendor.ifscSwiftCode ?? undefined;
  updated.paymentTerms =
    formData.paymentTerms ?? vendor.paymentTerms ?? undefined;
  updated.preferredCurrency =
    formData.preferredCurrency ?? vendor.preferredCurrency ?? "INR";
  updated.vendorCreditLimit =
    formData.vendorCreditLimit ?? vendor.vendorCreditLimit ?? undefined;

  return updated as Vendor;
}
