// Profile utility functions for formatting and validation

export function formatAcademicLevel(level: string): string {
  if (!level) return "";
  
  // Convert kebab-case to title case
  return level
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatPhoneNumber(phone: string): string {
  if (!phone) return "";
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Format Nigerian numbers
  if (digits.startsWith('234')) {
    // +234 format
    return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    // 0XX format
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  
  return phone; // Return original if can't format
}

export function getProfileCompletionSteps(role: "beneficiary" | "guardian"): string[] {
  const baseSteps = [
    "Basic Information (Name, Email, Phone)",
    "Personal Details (Date of Birth, Gender)",
    "Address Information",
  ];

  if (role === "beneficiary") {
    return [
      ...baseSteps,
      "Academic Information (Current Level, School)",
      "Emergency Contact Details",
    ];
  }

  if (role === "guardian") {
    return [
      ...baseSteps,
      "Guardian Information (Occupation, Relationship)",
    ];
  }

  return baseSteps;
}

export function validateNigerianPhone(phone: string): boolean {
  if (!phone) return false;
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Check for valid Nigerian patterns
  const validPatterns = [
    /^234[789][01]\d{8}$/, // +234 format (13 digits total)
    /^0[789][01]\d{8}$/,   // 0XX format (11 digits total)
  ];
  
  return validPatterns.some(pattern => pattern.test(digits));
}

export function formatDateForDisplay(dateString: string): string {
  if (!dateString) return "";
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Africa/Lagos',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getAgeFromDateOfBirth(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null;
  
  try {
    const birth = new Date(dateOfBirth);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  } catch {
    return null;
  }
}

export function isMinor(dateOfBirth: string): boolean {
  const age = getAgeFromDateOfBirth(dateOfBirth);
  return age !== null && age < 18;
}

export function formatAddress(address: {
  street: string;
  city: string;
  state: string;
  country?: string;
  postalCode?: string;
}): string {
  if (!address) return "";
  
  const parts = [
    address.street,
    address.city,
    address.state,
  ];
  
  if (address.postalCode) {
    parts.push(address.postalCode);
  }
  
  if (address.country && address.country !== "Nigeria") {
    parts.push(address.country);
  }
  
  return parts.filter(Boolean).join(", ");
}

// Profile completion percentage calculation
export function calculateProfileCompletion(
  user: any,
  role: "beneficiary" | "guardian" | "admin" | "reviewer" | "super_admin"
): {
  percentage: number;
  missingFields: string[];
  completedFields: string[];
} {
  const requiredFields: { field: string; label: string; check: (user: any) => boolean }[] = [
    { field: "firstName", label: "First Name", check: (u) => !!u.firstName },
    { field: "lastName", label: "Last Name", check: (u) => !!u.lastName },
    { field: "email", label: "Email", check: (u) => !!u.email },
    { field: "phone", label: "Phone Number", check: (u) => !!u.phone },
  ];

  // Add role-specific required fields
  if (role === "beneficiary" || role === "guardian") {
    requiredFields.push(
      { field: "dateOfBirth", label: "Date of Birth", check: (u) => !!u.profile?.dateOfBirth },
      { field: "gender", label: "Gender", check: (u) => !!u.profile?.gender },
      { field: "address", label: "Address", check: (u) => !!(u.profile?.address?.street && u.profile?.address?.city && u.profile?.address?.state) },
    );
  }

  if (role === "beneficiary") {
    requiredFields.push(
      { field: "currentLevel", label: "Academic Level", check: (u) => !!u.profile?.beneficiaryInfo?.currentLevel },
      { field: "currentSchool", label: "Current School", check: (u) => !!u.profile?.beneficiaryInfo?.currentSchool },
      { field: "emergencyContact", label: "Emergency Contact", check: (u) => !!(u.profile?.beneficiaryInfo?.emergencyContact?.name && u.profile?.beneficiaryInfo?.emergencyContact?.phone) },
    );
  }

  const completedFields: string[] = [];
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (field.check(user)) {
      completedFields.push(field.label);
    } else {
      missingFields.push(field.label);
    }
  }

  const percentage = Math.round((completedFields.length / requiredFields.length) * 100);

  return {
    percentage,
    missingFields,
    completedFields,
  };
}