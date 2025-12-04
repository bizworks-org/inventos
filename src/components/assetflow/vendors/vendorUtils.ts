import { Vendor } from "../../../lib/data";

export function normalizePhone(raw: string) {
  const hasLeadingPlus = raw.trim().startsWith("+");
  const digits = raw.replace(/\D/g, "");
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
    contractValue: parseFloat(formData.contractValue || "0"),
    contractExpiry: formData.contractExpiry,
    rating: parseFloat(formData.rating || "0"),
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
    "incorporationDate",
    "incorporationCountry",
    "registeredOfficeAddress",
    "corporateOfficeAddress",
    "natureOfBusiness",
    "businessCategory",
    "serviceCoverageArea",
  ];
  for (const k of extended) {
    updated[k] = (formData as any)[k] ?? (vendor as any)[k] ?? undefined;
  }

  // contacts
  const contactsFromForm = (formData as any).contacts;
  if (Array.isArray(contactsFromForm)) {
    updated.contacts = contactsFromForm.slice(0, 5).map((c: any) => ({ ...c }));
  } else if ((vendor as any).contacts) {
    updated.contacts = (vendor as any).contacts;
  }

  // financial
  updated.panTaxId =
    (formData as any).panTaxId ?? (vendor as any).panTaxId ?? undefined;
  updated.bankName =
    (formData as any).bankName ?? (vendor as any).bankName ?? undefined;
  updated.accountNumber =
    (formData as any).accountNumber ??
    (vendor as any).accountNumber ??
    undefined;
  updated.ifscSwiftCode =
    (formData as any).ifscSwiftCode ??
    (vendor as any).ifscSwiftCode ??
    undefined;
  updated.paymentTerms =
    (formData as any).paymentTerms ?? (vendor as any).paymentTerms ?? undefined;
  updated.preferredCurrency =
    (formData as any).preferredCurrency ??
    (vendor as any).preferredCurrency ??
    "INR";
  updated.vendorCreditLimit =
    (formData as any).vendorCreditLimit ??
    (vendor as any).vendorCreditLimit ??
    undefined;

  return updated as Vendor;
}
