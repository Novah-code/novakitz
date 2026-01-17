'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import PaymentMethodModal from './PaymentMethodModal';
import '../styles/premium-prompt-modal.css';

interface PremiumPromptModalProps {
  user: User | null;
  onClose: () => void;
  language?: 'en' | 'ko';
}

export default function PremiumPromptModal({
  user,
  onClose,
  language = 'en'
}: PremiumPromptModalProps) {
  const [isPremium, setIsPremium] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [hasSeenPrompt, setHasSeenPrompt] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Helper function to reset the prompt for testing
  const resetPremiumPrompt = () => {
    if (user) {
      localStorage.removeItem(`premium_prompt_seen_${user.id}`);
      setHasSeenPrompt(false);
    }
  };

  // Removed gumroad URLs - using PaymentMethodModal instead

  useEffect(() => {
    if (!user) {
      setShowModal(false);
      return;
    }

    const checkPremiumAndPrompt = async () => {
      try {
        console.log('Checking premium status for user:', user.id);

        // Check if user has seen prompt recently (within 24 hours)
        const lastShownKey = `premium_prompt_last_shown_${user.id}`;
        const lastShownTime = localStorage.getItem(lastShownKey);

        if (lastShownTime) {
          const lastShown = new Date(lastShownTime);
          const now = new Date();
          const hoursSinceShown = (now.getTime() - lastShown.getTime()) / (1000 * 60 * 60);

          if (hoursSinceShown < 24) {
            console.log('Premium prompt shown within last 24 hours, skipping');
            setShowModal(false);
            return;
          }
        }

        // Get premium plan ID first
        const { data: premiumPlans } = await supabase
          .from('subscription_plans')
          .select('id')
          .eq('plan_slug', 'premium')
          .maybeSingle();

        const premiumPlanId = premiumPlans?.id;

        if (!premiumPlanId) {
          console.warn('Could not find premium plan');
          setIsPremium(false);
          setShowModal(true);
          return;
        }

        // Check subscription status
        const { data: subscription, error } = await supabase
          .from('user_subscriptions')
          .select('id, status, plan_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (error) {
          console.warn('Error querying subscriptions:', error);
          setIsPremium(false);
          setShowModal(true);
          return;
        }

        console.log('Subscription data:', subscription);

        if (subscription) {
          // User has an active subscription, check if it's premium
          const isPremium = subscription.plan_id === premiumPlanId;
          console.log('User is premium:', isPremium);
          setIsPremium(isPremium || false);

          // Only show prompt to free users
          if (!isPremium) {
            setShowModal(true);
          }
        } else {
          // No active subscription = free user
          console.log('No active subscription found - user is free');
          setIsPremium(false);
          setShowModal(true);
        }
      } catch (error) {
        console.error('Error checking premium status:', error);
        // On error, show the prompt to be safe
        setIsPremium(false);
        setShowModal(true);
      }
    };

    checkPremiumAndPrompt();
  }, [user]);

  const handleClose = () => {
    // Save the last shown time to localStorage - show prompt max once per day
    if (user) {
      const lastShownKey = `premium_prompt_last_shown_${user.id}`;
      localStorage.setItem(lastShownKey, new Date().toISOString());
    }
    setShowModal(false);
    onClose();
  };

  if (showPaymentModal && user) {
    return (
      <PaymentMethodModal
        onClose={() => {
          setShowPaymentModal(false);
          onClose();
        }}
        language={language}
        userId={user.id}
        userEmail={user.email || ''}
      />
    );
  }

  // DISABLED: Premium popup removed - users can upgrade from settings/profile
  return null;
}
