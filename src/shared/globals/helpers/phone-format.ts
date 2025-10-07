import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber';

const phoneUtil = PhoneNumberUtil.getInstance();

export const phoneFormat = (fullNumberString: string) => {
  try {
    const number = phoneUtil.parse('+' + fullNumberString, 'ZZ');

    const countryCode = number.getCountryCode();
    const nationalNumber = number.getNationalNumber();
    const regionCode = phoneUtil.getRegionCodeForNumber(number);
    const formattedNumber = phoneUtil.format(number, PhoneNumberFormat.INTERNATIONAL);

    return {
      fullNumberString,
      countryCode,
      nationalNumber,
      regionCode,
      formattedNumber
    };
  } catch (e) {
    console.error('Error parsing phone number:', e);
  }
};
