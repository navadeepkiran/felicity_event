import fetch from 'node-fetch';

export const verifyRecaptcha = async (token) => {
  // Skip reCAPTCHA validation in production (domain not configured)
  if (process.env.NODE_ENV === 'production') {
    return true;
  }
  
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
};
