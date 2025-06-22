import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface UserProfile {
  name: string;
  email: string;
  nativeLanguage: string;
  englishLevel: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
  updatedAt: Date;
  totalEssaysWritten?: number;
  totalWordsWritten?: number;
  averageScore?: number;
  preferredTopics?: string[];
}

export interface EssayData {
  id?: string;
  userId: string;
  title: string;
  content: string;
  wordCount: number;
  overallScore?: number;
  suggestions?: any[];
  createdAt: Date;
  updatedAt: Date;
}

class UserService {
  private readonly USERS_COLLECTION = 'users';
  private readonly ESSAYS_COLLECTION = 'essays';

  async createUserProfile(userId: string, userData: Omit<UserProfile, 'totalEssaysWritten' | 'totalWordsWritten' | 'averageScore'>): Promise<void> {
    try {
      const userDocRef = doc(db, this.USERS_COLLECTION, userId);
      await setDoc(userDocRef, {
        ...userData,
        totalEssaysWritten: 0,
        totalWordsWritten: 0,
        averageScore: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('✅ User profile created successfully');
    } catch (error) {
      console.error('❌ Error creating user profile:', error);
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userDocRef = doc(db, this.USERS_COLLECTION, userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data() as DocumentData;
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as UserProfile;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userDocRef = doc(db, this.USERS_COLLECTION, userId);
      await updateDoc(userDocRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      console.log('✅ User profile updated successfully');
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      throw error;
    }
  }

  async saveEssay(essayData: Omit<EssayData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('🔄 Starting essay save process...', { userId: essayData.userId, title: essayData.title });
      
      const essayDocRef = doc(collection(db, this.ESSAYS_COLLECTION));
      const essayWithTimestamps = {
        ...essayData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      console.log('📝 Saving essay to Firestore...');
      await setDoc(essayDocRef, essayWithTimestamps);
      console.log('✅ Essay document saved successfully');
      
      // Update user statistics (don't let this fail the main save)
      try {
        console.log('📊 Updating user statistics...');
        await this.updateUserStats(essayData.userId, essayData.wordCount, essayData.overallScore);
        console.log('✅ User statistics updated successfully');
      } catch (statsError) {
        console.warn('⚠️ Failed to update user stats, but essay was saved:', statsError);
        // Don't throw - the essay save was successful
      }
      
      console.log('✅ Essay saved successfully with ID:', essayDocRef.id);
      return essayDocRef.id;
    } catch (error) {
      console.error('❌ Error saving essay:', error);
      throw error;
    }
  }

  async getUserEssays(userId: string, limit: number = 10): Promise<EssayData[]> {
    try {
      const essaysQuery = query(
        collection(db, this.ESSAYS_COLLECTION),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(essaysQuery);
      const essays: EssayData[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        essays.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as EssayData);
      });
      
      // Sort by creation date (newest first)
      essays.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      return essays.slice(0, limit);
    } catch (error) {
      console.error('❌ Error fetching user essays:', error);
      throw error;
    }
  }

  async updateEssay(essayId: string, updates: Partial<EssayData>): Promise<void> {
    try {
      const essayDocRef = doc(db, this.ESSAYS_COLLECTION, essayId);
      await updateDoc(essayDocRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Essay updated successfully');
    } catch (error) {
      console.error('❌ Error updating essay:', error);
      throw error;
    }
  }

  private async updateUserStats(userId: string, wordCount: number, score?: number): Promise<void> {
    try {
      console.log('📊 Fetching user profile for stats update...', { userId });
      const userProfile = await this.getUserProfile(userId);
      
      if (!userProfile) {
        console.warn('⚠️ User profile not found, skipping stats update:', userId);
        return;
      }

      console.log('📊 Current user stats:', {
        totalEssays: userProfile.totalEssaysWritten,
        totalWords: userProfile.totalWordsWritten,
        averageScore: userProfile.averageScore
      });

      const newTotalEssays = (userProfile.totalEssaysWritten || 0) + 1;
      const newTotalWords = (userProfile.totalWordsWritten || 0) + wordCount;
      
      let newAverageScore = userProfile.averageScore || 0;
      if (score && score > 0) {
        const currentTotalScore = (userProfile.averageScore || 0) * (userProfile.totalEssaysWritten || 0);
        newAverageScore = (currentTotalScore + score) / newTotalEssays;
      }

      const statsUpdate = {
        totalEssaysWritten: newTotalEssays,
        totalWordsWritten: newTotalWords,
        averageScore: Math.round(newAverageScore * 100) / 100 // Round to 2 decimal places
      };

      console.log('📊 Updating user stats with:', statsUpdate);
      await this.updateUserProfile(userId, statsUpdate);
      console.log('✅ User stats updated successfully');
    } catch (error) {
      console.error('❌ Error updating user stats:', error);
      // Don't throw error here to avoid breaking essay save
    }
  }

  async getUserStats(userId: string): Promise<{
    totalEssays: number;
    totalWords: number;
    averageScore: number;
    recentEssays: EssayData[];
  }> {
    try {
      const userProfile = await this.getUserProfile(userId);
      const recentEssays = await this.getUserEssays(userId, 5);
      
      return {
        totalEssays: userProfile?.totalEssaysWritten || 0,
        totalWords: userProfile?.totalWordsWritten || 0,
        averageScore: userProfile?.averageScore || 0,
        recentEssays
      };
    } catch (error) {
      console.error('❌ Error fetching user stats:', error);
      return {
        totalEssays: 0,
        totalWords: 0,
        averageScore: 0,
        recentEssays: []
      };
    }
  }
}

export const userService = new UserService(); 