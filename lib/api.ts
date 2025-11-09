const API_BASE_URL = 'https://kul-setu-backend.onrender.com';

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface FamilyMember {
  personId: string;
  familyLineId: string;
  generation: number;
  firstName: string;
  gender: string;
  ethnicity?: string;
  motherId?: string;
  fatherId?: string;
  spouseId?: string;
  dob?: string;
  dod?: string;
  causeOfDeath?: string;
  eyeColor?: string;
  hairColor?: string;
  skinTone?: string;
  bloodGroup?: string;
  birthmark?: string;
  freckles?: string;
  baldness?: string;
  conditionDiabetes?: string;
  conditionHeartIssue?: string;
  conditionAsthma?: string;
  conditionColorBlindness?: string;
  leftHanded?: string;
  isTwin?: string;
  natureOfPerson?: string;
  recipesCuisine?: string;
  familyTraditions?: string;
  nativeLocation?: string;
  migrationPath?: string;
  socioeconomicStatus?: string;
  educationLevel?: string;
  otherDisease?: string;
  passion?: string;
  disability?: string;
}

export interface Ritual {
  reminderId: string;
  familyId: string;
  personId?: string;
  ritualType: string;
  ritualName: string;
  ritualDate: string;
  recurring: boolean;
  recurrencePattern?: string;
  location?: string;
  panditType?: string;
  kulDevta?: string;
  description?: string;
  notes?: string;
  reminderDaysBefore: number;
  isCompleted: boolean;
}

export interface Festival {
  festivalId: number | string;
  festivalName: string;
  festivalDate: string; // ISO date
  festivalType?: string;
  description?: string;
  region?: string;
  isPublic?: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  familyId?: string;
  personId?: string;
  familyLineId?: string;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`API Error [${response.status}]:`, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error(`API request timeout for ${endpoint}`);
        throw new Error('Request timeout - please check your internet connection');
      }
      
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Authentication
  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    console.log('API service: Making login request to', `${API_BASE_URL}/auth/login`);
    console.log('API service: Login payload:', { email, password: '***' });
    
    const result = await this.request<{ success: boolean; user?: User; error?: string }>(
      '/auth/login',
      {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }
    );
    
    console.log('API service: Login response:', result);
    return result;
  }

  async signup(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    familyId?: string;
    personId?: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Family Members
  async registerFamilyMember(memberData: Partial<FamilyMember>): Promise<ApiResponse<any>> {
    return this.request('/register', {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  }

  async searchFamilyMembers(query: Partial<FamilyMember>): Promise<FamilyMember[]> {
    return this.request('/search', {
      method: 'POST',
      body: JSON.stringify(query),
    });
  }

  async getAllFamilyMembers(): Promise<FamilyMember[]> {
    return this.request('/family-members');
  }

  // Rituals
  async createRitual(ritualData: Partial<Ritual>): Promise<ApiResponse<any>> {
    return this.request('/rituals/create', {
      method: 'POST',
      body: JSON.stringify(ritualData),
    });
  }

  async getFamilyRituals(familyId: string, filters?: {
    type?: string;
    showCompleted?: boolean;
    upcomingOnly?: boolean;
  }): Promise<Ritual[]> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.showCompleted !== undefined) params.append('showCompleted', filters.showCompleted.toString());
    if (filters?.upcomingOnly !== undefined) params.append('upcomingOnly', filters.upcomingOnly.toString());
    
    const queryString = params.toString();
    return this.request(`/rituals/${familyId}${queryString ? `?${queryString}` : ''}`);
  }

  async getUpcomingRituals(familyId?: string, daysAhead: number = 30): Promise<Ritual[]> {
    const params = new URLSearchParams();
    if (familyId) params.append('familyId', familyId);
    params.append('daysAhead', daysAhead.toString());
    
    return this.request(`/rituals/upcoming?${params.toString()}`);
  }

  async updateRitual(reminderId: string, updates: Partial<Ritual>): Promise<ApiResponse<any>> {
    return this.request(`/rituals/update/${reminderId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteRitual(reminderId: string): Promise<ApiResponse<any>> {
    return this.request(`/rituals/delete/${reminderId}`, {
      method: 'DELETE',
    });
  }

  async getRitualTypes(): Promise<{
    ritual_types: Array<{ value: string; label: string }>;
    recurrence_patterns: string[];
    pandit_types: string[];
  }> {
    return this.request('/rituals/types');
  }

  // Festivals (public)
  async getFestivals(): Promise<Festival[]> {
    return this.request('/festivals');
  }

  // Statistics
  async getStats(): Promise<{
    totalMembers: number;
    totalFamilies: number;
    families: Record<string, number>;
  }> {
    return this.request('/stats');
  }

  // Health check
  async healthCheck(): Promise<{ status: string; message: string }> {
    return this.request('/health');
  }

  // Notifications
  async getNotifications(email?: string): Promise<Array<{
    notificationId: string;
    title: string;
    message: string;
    type: string;
    createdAt: string;
    isRead: boolean;
    familyLineId?: string;
  }>> {
    const params = email ? `?email=${encodeURIComponent(email)}` : '';
    return this.request(`/notifications${params}`);
  }

  // ============== FAMILY POSTS / SOCIAL FEED ==============
  
  async createPost(data: {
    userId: string;
    content: string;
    imageUrl?: string;
    videoUrl?: string;
  }): Promise<{
    success: boolean;
    post?: any;
    message?: string;
    error?: string;
  }> {
    return this.request('/posts/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async getPostsFeed(params: {
    familyLineId: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    success: boolean;
    posts: Array<{
      id: string;
      userId: string;
      userName: string;
      content: string;
      imageUrl?: string;
      videoUrl?: string;
      timestamp: string;
      likes: number;
      comments: number;
      isLiked: boolean;
    }>;
    count: number;
  }> {
    const queryParams = new URLSearchParams();
    queryParams.append('familyLineId', params.familyLineId);
    if (params.userId) queryParams.append('userId', params.userId);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    
    return this.request(`/posts/feed?${queryParams.toString()}`);
  }

  async likePost(postId: string, userId: string): Promise<{
    success: boolean;
    action: 'liked' | 'unliked';
    isLiked: boolean;
    likesCount: number;
  }> {
    return this.request(`/posts/like/${postId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
  }

  async addComment(postId: string, data: {
    userId: string;
    comment: string;
  }): Promise<{
    success: boolean;
    commentId?: string;
    commentsCount?: number;
    error?: string;
  }> {
    return this.request(`/posts/comment/${postId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async getPostComments(postId: string): Promise<{
    success: boolean;
    comments: Array<{
      id: string;
      userId: string;
      userName: string;
      text: string;
      timestamp: string;
    }>;
    count: number;
  }> {
    return this.request(`/posts/comments/${postId}`);
  }

  async deletePost(postId: string, userId: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    return this.request(`/posts/delete/${postId}?userId=${userId}`, {
      method: 'DELETE',
    });
  }

  async uploadMedia(fileUri: string, fileName: string, fileType: string): Promise<{
    success: boolean;
    url?: string;
    error?: string;
  }> {
    try {
      // Convert file URI to base64
      const base64 = await this.convertToBase64(fileUri);
      
      return this.request('/upload/media', {
        method: 'POST',
        body: JSON.stringify({
          file: base64,
          fileName: fileName,
          fileType: fileType
        }),
      });
    } catch (error) {
      console.error('Error uploading media:', error);
      return {
        success: false,
        error: 'Failed to upload media'
      };
    }
  }

  private async convertToBase64(uri: string): Promise<string> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert to base64'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting to base64:', error);
      throw error;
    }
  }

  // ============== STORY ENDPOINTS ==============
  
  async createStory(data: {
    userId: string;
    userName: string;
    familyLineId: string;
    mediaUrl: string;
    mediaType: 'image' | 'video';
  }): Promise<{
    success: boolean;
    story?: {
      storyId: string;
      userId: string;
      userName: string;
      familyLineId: string;
      mediaUrl: string;
      mediaType: string;
      createdAt: string;
      expiresAt: string;
      viewsCount: number;
    };
    error?: string;
  }> {
    return this.request('/stories/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getStories(familyLineId: string): Promise<{
    success: boolean;
    stories?: Array<{
      userId: string;
      userName: string;
      hasStory: boolean;
      stories: Array<{
        storyId: string;
        mediaUrl: string;
        mediaType: string;
        createdAt: string;
        expiresAt: string;
        viewsCount: number;
      }>;
    }>;
    count?: number;
    error?: string;
  }> {
    return this.request(`/stories/${familyLineId}`, {
      method: 'GET',
    });
  }

  async viewStory(storyId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    return this.request(`/stories/view/${storyId}`, {
      method: 'POST',
    });
  }

  async deleteStory(storyId: string, userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    return this.request(`/stories/delete/${storyId}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
    });
  }
}

export const apiService = new ApiService();