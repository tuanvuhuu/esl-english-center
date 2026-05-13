export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const re = /^(0|\+84)[0-9]{9}$/;
  return re.test(phone.replace(/\s/g, ''));
};

export const validateName = (name: string): boolean => {
  return !!(name && name.trim().length >= 2);
};

export const validateAge = (age: string | number): boolean => {
  const num = typeof age === 'string' ? parseInt(age, 10) : age;
  return !isNaN(num) && num >= 0 && num <= 100;
};

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateForm = (
  form: Record<string, any>, 
  requiredFields: string[]
): ValidationResult => {
  const errors: Record<string, string> = {};
  requiredFields.forEach(field => {
    if (!form[field] || form[field].toString().trim() === '') {
      errors[field] = `${field} is required`;
    }
  });
  return { isValid: Object.keys(errors).length === 0, errors };
};
