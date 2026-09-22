export type SubscriptionTier = 'free' | 'pro_monthly' | 'pro_annual';

export interface SubscriptionState {
  tier: SubscriptionTier;
  isPro: boolean;
  validUntil: string | null;
  planName: string;
  autoRenew: boolean;
}

const SUB_STORAGE_KEY = 'kpss_user_subscription_v1';

const DEFAULT_SUBSCRIPTION: SubscriptionState = {
  tier: 'free',
  isPro: false,
  validUntil: null,
  planName: 'Ücretsiz Öğrenci Paketi',
  autoRenew: false,
};

class SubscriptionService {
  private state: SubscriptionState = this.loadState();

  private loadState(): SubscriptionState {
    if (typeof window === 'undefined') return DEFAULT_SUBSCRIPTION;
    try {
      const stored = localStorage.getItem(SUB_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('loadState error in subscriptionService:', e);
    }
    return DEFAULT_SUBSCRIPTION;
  }

  public getSubscription(): SubscriptionState {
    return this.state;
  }

  public isPro(): boolean {
    return this.state.isPro;
  }

  public upgradeToPlan(tier: SubscriptionTier): SubscriptionState {
    const now = new Date();
    let validUntilDate: Date;

    if (tier === 'pro_monthly') {
      validUntilDate = new Date(now.setMonth(now.getMonth() + 1));
    } else if (tier === 'pro_annual') {
      validUntilDate = new Date(now.setFullYear(now.getFullYear() + 1));
    } else {
      validUntilDate = now;
    }

    const newState: SubscriptionState = {
      tier,
      isPro: tier !== 'free',
      validUntil: validUntilDate.toISOString().split('T')[0],
      planName: tier === 'pro_annual' ? 'KPSS Yıllık VIP Paketi' : tier === 'pro_monthly' ? 'KPSS Aylık PRO' : 'Ücretsiz Öğrenci Paketi',
      autoRenew: true,
    };

    this.state = newState;
    if (typeof window !== 'undefined') {
      localStorage.setItem(SUB_STORAGE_KEY, JSON.stringify(newState));
      window.dispatchEvent(new CustomEvent('kpss_subscription_changed', { detail: newState }));
    }

    return newState;
  }

  public cancelSubscription(): void {
    const newState: SubscriptionState = {
      ...DEFAULT_SUBSCRIPTION,
    };
    this.state = newState;
    if (typeof window !== 'undefined') {
      localStorage.setItem(SUB_STORAGE_KEY, JSON.stringify(newState));
      window.dispatchEvent(new CustomEvent('kpss_subscription_changed', { detail: newState }));
    }
  }
}

export const subscriptionService = new SubscriptionService();
