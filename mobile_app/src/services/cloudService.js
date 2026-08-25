import { supabase } from './supabaseClient';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

// Helper to extract query params from URL
const extractParams = (url) => {
  const params = {};
  const hashPart = url.split('#')[1];
  if (hashPart) {
    hashPart.split('&').forEach(pair => {
      const [key, val] = pair.split('=');
      params[decodeURIComponent(key)] = decodeURIComponent(val || '');
    });
  }
  const queryPart = url.split('?')[1]?.split('#')[0];
  if (queryPart) {
    queryPart.split('&').forEach(pair => {
      const [key, val] = pair.split('=');
      params[decodeURIComponent(key)] = decodeURIComponent(val || '');
    });
  }
  return params;
};

export const cloudService = {
  // GitHub Sign In
  signInWithGitHub: async () => {
    try {
      const redirectTo = makeRedirectUri();
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No URL returned from Supabase");

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success') {
        const params = extractParams(result.url);
        
        if (params.error) throw new Error(params.error);
        
        if (params.access_token) {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });

          if (sessionError) throw sessionError;
          
          const user = sessionData.user;
          
          // Fetch or initialize profile
          const profile = await cloudService.getUserProfile(user.id);
          if (!profile) {
            // Initialize basic profile
            const newProfile = {
              uid: user.id,
              name: user.user_metadata?.full_name || user.user_metadata?.preferred_username || '',
              email: user.email,
              age: '',
              medicalHistory: '',
              profileComplete: false
            };
            await cloudService.saveUserProfile(user.id, newProfile);
            return newProfile;
          }
          return profile;
        }
      }
      
      return null; // Cancelled by user
    } catch (error) {
      console.error('Supabase GitHub Sign-In Error:', error);
      return { error: true, message: error.message };
    }
  },

  // Sign out
  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign-Out Error:', error);
    }
  },

  // Save/Update Profile to Supabase
  saveUserProfile: async (uid, data) => {
    try {
      const { error } = await supabase
        .from('users')
        .upsert({ id: uid, ...data }, { onConflict: 'id' });
        
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving profile:', error);
      return false;
    }
  },

  // Get Profile from Supabase
  getUserProfile: async (uid) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  },

  // Save ECG Session to Supabase
  saveSession: async (uid, sessionData) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .insert({
          user_id: uid,
          start_time: new Date(sessionData.startTime).toISOString(),
          duration: sessionData.duration,
          avg_bpm: sessionData.avgBpm,
          total_samples: sessionData.totalSamples,
          quality: sessionData.quality,
          created_at: new Date().toISOString()
        });
        
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving session:', error);
      return false;
    }
  },

  // Get User Sessions from Supabase
  getUserSessions: async (uid) => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Map back to app format
      return data.map(session => ({
        id: session.id,
        startTime: new Date(session.start_time).getTime(),
        duration: session.duration,
        avgBpm: session.avg_bpm,
        totalSamples: session.total_samples,
        quality: session.quality
      }));
    } catch (error) {
      console.error('Error getting sessions:', error);
      return [];
    }
  }
};
