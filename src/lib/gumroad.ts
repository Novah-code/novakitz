/**
 * Gumroad integration utilities
 */

/**
 * Verify a license key with Gumroad API
 */
export async function verifyGumroadLicense(licenseKey: string): Promise<{
  valid: boolean;
  productId?: string;
  email?: string;
  name?: string;
  error?: string;
}> {
  try {
    const gumroadSecret = process.env.GUMROAD_API_SECRET;

    if (!gumroadSecret) {
      console.warn('⚠️ GUMROAD_API_SECRET not configured');
      return {
        valid: false,
        error: 'Gumroad API not configured'
      };
    }

    // Call Gumroad API to verify license
    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        product_id: process.env.GUMROAD_PRODUCT_ID || '',
        license_key: licenseKey,
        increment_uses_count: 'false'
      }).toString()
    });

    if (!response.ok) {
      console.error('Gumroad API error:', response.statusText);
      return {
        valid: false,
        error: 'Failed to verify license with Gumroad'
      };
    }

    const data = await response.json();

    if (data.success) {
      return {
        valid: true,
        productId: data.product_id,
        email: data.license?.email || data.email,
        name: data.license?.name || data.name
      };
    } else {
      return {
        valid: false,
        error: data.error || 'License verification failed'
      };
    }
  } catch (error) {
    console.error('Error verifying Gumroad license:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get Gumroad product URL for purchase
 */
export function getGumroadProductUrl(): string {
  return process.env.NEXT_PUBLIC_GUMROAD_PRODUCT_URL || 'https://gumroad.com/products/premium';
}

/**
 * Format license key for display
 */
export function formatLicenseKey(key: string): string {
  if (key.length <= 8) return key;
  return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
}

/**
 * Check if a subscription is within valid period
 */
export function isSubscriptionValid(expiresAt?: string | null): boolean {
  if (!expiresAt) {
    // No expiry date means perpetual license
    return true;
  }

  const expiryDate = new Date(expiresAt);
  const now = new Date();

  return expiryDate > now;
}

/**
 * Get days until subscription expiry
 */
export function getDaysUntilExpiry(expiresAt?: string | null): number | null {
  if (!expiresAt) {
    return null; // No expiry
  }

  const expiryDate = new Date(expiresAt);
  const now = new Date();
  const daysRemaining = Math.ceil(
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return Math.max(0, daysRemaining);
}
