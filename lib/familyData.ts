import { apiService, FamilyMember } from './api';

export const searchFamilyMembers = async (query: string | Partial<FamilyMember>): Promise<FamilyMember[]> => {
  try {
    // If query is a string (legacy support)
    if (typeof query === 'string') {
      if (!query.trim()) {
        return await apiService.getAllFamilyMembers();
      }
      
      // Create search query object from string
      const searchQuery: any = {};
      
      // Try to match against common fields
      if (query.trim()) {
        // If it looks like a person ID
        if (query.match(/^[A-Z]\d+$/)) {
          searchQuery.personId = query;
        }
        // If it looks like a family ID
        else if (query.match(/^F\d+$/)) {
          searchQuery.familyLineId = query;
        }
        // Otherwise search by name and other text fields
        else {
          searchQuery.firstName = query;
        }
      }
      
      return await apiService.searchFamilyMembers(searchQuery);
    }
    
    // If query is an object (advanced search)
    return await apiService.searchFamilyMembers(query);
  } catch (error) {
    console.error('Error searching family members:', error);
    return [];
  }
};

export const getAllFamilyMembers = async (): Promise<FamilyMember[]> => {
  try {
    return await apiService.getAllFamilyMembers();
  } catch (error) {
    console.error('Error getting all family members:', error);
    return [];
  }
};

export const registerFamilyMember = async (memberData: Partial<FamilyMember>): Promise<boolean> => {
  try {
    console.log('familyData.registerFamilyMember: Calling API...');
    const response = await apiService.registerFamilyMember(memberData);
    console.log('familyData.registerFamilyMember: API Response:', response);
    console.log('familyData.registerFamilyMember: Success status:', response.success);
    return response.success || false;
  } catch (error) {
    console.error('Error registering family member:', error);
    return false;
  }
};

export { FamilyMember };