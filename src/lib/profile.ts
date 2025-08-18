import { supabase, UserProfile, UserProfileInsert, UserProfileUpdate } from './supabase';

export class ProfileService {
  /**
   * Get user profile by user ID
   */
  static async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  }

  /**
   * Create or update user profile
   */
  static async upsertProfile(profileData: UserProfileInsert | UserProfileUpdate): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(profileData)
        .select()
        .single();

      if (error) {
        console.error('Error upserting profile:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Profile upsert error:', error);
      return null;
    }
  }

  /**
   * Update specific profile fields
   */
  static async updateProfile(userId: string, updates: UserProfileUpdate): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Profile update error:', error);
      return null;
    }
  }

  /**
   * Check if user has completed their profile
   */
  static async isProfileCompleted(userId: string): Promise<boolean> {
    const profile = await this.getProfile(userId);
    return profile?.profile_completed ?? false;
  }

  /**
   * Mark profile as completed
   */
  static async markProfileCompleted(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ profile_completed: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Error marking profile as completed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Profile completion error:', error);
      return false;
    }
  }

  /**
   * Get user's interests for dream analysis
   */
  static async getUserInterests(userId: string): Promise<string[]> {
    const profile = await this.getProfile(userId);
    return profile?.interests ?? [];
  }

  /**
   * Get user's sleep schedule for dream timing analysis
   */
  static async getSleepSchedule(userId: string): Promise<UserProfile['sleep_schedule'] | null> {
    const profile = await this.getProfile(userId);
    return profile?.sleep_schedule ?? null;
  }

  /**
   * Add or remove interest from user's interests
   */
  static async toggleInterest(userId: string, interest: string): Promise<boolean> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile) return false;

      const currentInterests = profile.interests ?? [];
      const newInterests = currentInterests.includes(interest)
        ? currentInterests.filter(i => i !== interest)
        : [...currentInterests, interest];

      const updated = await this.updateProfile(userId, { interests: newInterests });
      return !!updated;
    } catch (error) {
      console.error('Interest toggle error:', error);
      return false;
    }
  }

  /**
   * Get profile completion percentage for progress tracking
   */
  static getProfileCompletionPercentage(profile: UserProfile): number {
    if (!profile) return 0;

    const fields = [
      profile.full_name,
      profile.age,
      profile.occupation,
      profile.interests?.length,
      profile.bio,
      profile.dream_goals,
      profile.sleep_schedule?.bedtime,
      profile.sleep_schedule?.wake_time
    ];

    const completedFields = fields.filter(field => {
      if (typeof field === 'string') return field.trim().length > 0;
      if (typeof field === 'number') return field > 0;
      return !!field;
    }).length;

    return Math.round((completedFields / fields.length) * 100);
  }
}