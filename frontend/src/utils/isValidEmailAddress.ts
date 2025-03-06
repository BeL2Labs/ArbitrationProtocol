import * as EmailValidator from 'email-validator';

export const isValidEmailAddress = (email: string): boolean => {
  return EmailValidator.validate(email);
}