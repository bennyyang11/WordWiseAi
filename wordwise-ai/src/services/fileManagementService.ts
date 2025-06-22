import { userService } from './userService';
import type { EssayData } from './userService';
import { useWritingStore } from '../store/writingStore';

export interface FileMetadata {
  id: string;
  title: string;
  type: 'essay' | 'email' | 'letter' | 'report' | 'creative' | 'conversation';
  wordCount: number;
  overallScore?: number;
  createdAt: Date;
  updatedAt: Date;
  preview: string; // First 150 characters of content
}

export interface SaveResult {
  success: boolean;
  fileId?: string;
  error?: string;
}

export interface LoadResult {
  success: boolean;
  fileData?: EssayData;
  error?: string;
}

class FileManagementService {
  private currentFileId: string | null = null;
  private isAutoSaveEnabled: boolean = true;
  private autoSaveInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start auto-save if enabled
    this.startAutoSave();
  }

  // Save current document
  async saveCurrentDocument(userId: string, title?: string, type?: string): Promise<SaveResult> {
    console.log('🔄 FileManagementService: Starting save operation...', { userId, title, type });
    
    // Add a timeout to prevent hanging
    const saveTimeout = new Promise<SaveResult>((_, reject) => {
      setTimeout(() => reject(new Error('Save operation timed out after 30 seconds')), 30000);
    });

    const savePromise = this.performSave(userId, title, type);

    try {
      const result = await Promise.race([savePromise, saveTimeout]);
      console.log('✅ FileManagementService: Save completed:', result);
      return result;
    } catch (error) {
      console.error('💥 FileManagementService: Save failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Save failed' };
    }
  }

  private async performSave(userId: string, title?: string, _type?: string): Promise<SaveResult> {
    try {
      const store = useWritingStore.getState();
      const currentDoc = store.currentDocument;
      const analysisResult = store.analysisResult;

      if (!currentDoc) {
        return { success: false, error: 'No document to save' };
      }

      const essayData: any = {
        userId,
        title: title || currentDoc.title || 'Untitled Document',
        content: currentDoc.content || '',
        wordCount: currentDoc.wordCount || 0,
        suggestions: store.suggestions || [],
      };

      // Only include overallScore if it has a valid value
      if (analysisResult?.overallScore !== undefined && analysisResult?.overallScore !== null) {
        essayData.overallScore = analysisResult.overallScore;
      }

      let fileId: string;

      if (this.currentFileId) {
        // Update existing file
        await userService.updateEssay(this.currentFileId, essayData);
        fileId = this.currentFileId;
      } else {
        // Create new file
        fileId = await userService.saveEssay(essayData);
        this.currentFileId = fileId;
      }

      // Update the store with the saved file ID
      store.setCurrentDocument({
        ...currentDoc,
        id: fileId,
        title: essayData.title,
        updatedAt: new Date(),
      });

      return { success: true, fileId };
    } catch (error) {
      console.error('Error saving document:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Save failed' };
    }
  }

  // Load a specific file
  async loadFile(_fileId: string): Promise<LoadResult> {
    try {
      // For now, we'll use a simple approach since userService doesn't have getEssayById
      // We'll need to add this method to userService in the future
      console.warn('Direct file loading not yet implemented in userService');
      return { success: false, error: 'File loading not yet implemented' };
    } catch (error) {
      console.error('Error loading file:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Load failed' };
    }
  }

  // Get user's file list with metadata
  async getUserFiles(userId: string, limit: number = 20): Promise<FileMetadata[]> {
    try {
      const essays = await userService.getUserEssays(userId, limit);
      
      return essays.map(essay => ({
        id: essay.id || '',
        title: essay.title,
        type: 'essay' as const, // Default to essay, can be enhanced later
        wordCount: essay.wordCount,
        overallScore: essay.overallScore,
        createdAt: essay.createdAt,
        updatedAt: essay.updatedAt,
        preview: (essay.content || '').substring(0, 150) + ((essay.content || '').length > 150 ? '...' : '')
      }));
    } catch (error) {
      console.error('Error fetching user files:', error);
      return [];
    }
  }

  // Create a new document
  createNewDocument(type: 'essay' | 'email' | 'letter' | 'report' | 'creative' | 'conversation' = 'essay', title: string = 'Untitled Document'): void {
    const store = useWritingStore.getState();
    
    const newDocument = {
      id: `temp-${Date.now()}`, // Temporary ID until saved
      title,
      content: this.getTemplateContent(type),
      createdAt: new Date(),
      updatedAt: new Date(),
      type,
      wordCount: 0,
    };

    store.setCurrentDocument(newDocument);
    
    // Clear suggestions and analysis
    store.setSuggestions([]);
    
    // Reset file tracking
    this.currentFileId = null;
  }

  // Get template content based on document type
  private getTemplateContent(type: string): string {
    const templates = {
      essay: 'Start writing your essay here. WordWise AI will help you improve your grammar, vocabulary, and writing style as you type.',
      email: 'Dear [Recipient],\n\nI hope this email finds you well.\n\n[Your message here]\n\nBest regards,\n[Your name]',
      letter: 'Dear [Recipient],\n\nI am writing to [purpose of letter].\n\n[Main content]\n\nI look forward to your response.\n\nSincerely,\n[Your name]',
      report: 'REPORT TITLE\n\nExecutive Summary:\n[Brief overview]\n\n1. Introduction\n[Background information]\n\n2. Findings\n[Main findings]\n\n3. Recommendations\n[Your recommendations]\n\n4. Conclusion\n[Summary]',
      creative: 'Once upon a time...\n\n[Let your creativity flow here. Write a story, poem, or any creative piece.]',
      conversation: 'Hi there!\n\n[Start your casual conversation or message here.]'
    };

    return templates[type as keyof typeof templates] || templates.essay;
  }

  // Auto-save functionality
  private startAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = setInterval(() => {
      if (this.isAutoSaveEnabled && this.currentFileId) {
        const store = useWritingStore.getState();
        const currentDoc = store.currentDocument;
        
        if (currentDoc && currentDoc.content.trim().length > 0) {
          // Auto-save logic would go here
          // For now, we'll just log
          console.log('Auto-save triggered for file:', this.currentFileId);
        }
      }
    }, 30000); // Auto-save every 30 seconds
  }

  // Set current file ID (used when loading a file)
  setCurrentFileId(fileId: string | null): void {
    this.currentFileId = fileId;
  }

  // Get current file ID
  getCurrentFileId(): string | null {
    return this.currentFileId;
  }

  // Enable/disable auto-save
  setAutoSave(enabled: boolean): void {
    this.isAutoSaveEnabled = enabled;
    if (enabled) {
      this.startAutoSave();
    } else if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  // Check if current document has unsaved changes
  hasUnsavedChanges(): boolean {
    const store = useWritingStore.getState();
    const currentDoc = store.currentDocument;
    
    if (!currentDoc || !this.currentFileId) {
      return (currentDoc?.content || '').trim().length > 0;
    }

    // More sophisticated change tracking would go here
    // For now, we'll assume there are always potential changes
    return true;
  }
}

export const fileManagementService = new FileManagementService(); 