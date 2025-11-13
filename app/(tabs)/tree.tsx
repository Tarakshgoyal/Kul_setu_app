import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients } from '@/lib/utils';
import { getUser } from '@/lib/auth';
import { FamilyMember } from '@/lib/familyData';

const { width } = Dimensions.get('window');

const API_BASE = (process as any)?.env?.EXPO_PUBLIC_API_URL ?? 'https://kul-setu-backend.onrender.com';

type Member = {
  id: string;
  name: string;
  gender: 'male' | 'female';
  age?: number;
  spouse?: {
    name: string;
    status: 'married' | 'divorced';
  };
  exSpouses?: {
    name: string;
    status: 'divorced';
  }[];
};

type Generation = {
  level: number;
  members: Member[];
};

const MemberCard = ({ member }: { member: Member }) => {
  return (
    <View style={styles.memberCardWrapper}>
      <View style={styles.memberCard}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: member.gender === 'male' ? '#3B82F6' : '#EC4899' },
            ]}
          >
            <Text style={styles.avatarText}>{member.name.charAt(0)}</Text>
          </View>
        </View>

        {/* Name */}
        <Text style={styles.memberName} numberOfLines={1}>
          {member.name}
        </Text>
        {member.age && <Text style={styles.memberAge}>{member.age} yrs</Text>}
      </View>

      {/* Spouse Info */}
      {member.spouse && (
        <View style={styles.spouseSection}>
          <View style={styles.spouseHeader}>
            {member.spouse.status === 'married' ? (
              <Ionicons name="heart" size={14} color="#EF4444" />
            ) : (
              <Ionicons name="heart-dislike" size={14} color="#9CA3AF" />
            )}
            <View
              style={[
                styles.statusBadge,
                member.spouse.status === 'married'
                  ? styles.marriedBadge
                  : styles.divorcedBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  member.spouse.status === 'married'
                    ? styles.marriedBadgeText
                    : styles.divorcedBadgeText,
                ]}
              >
                {member.spouse.status === 'married' ? 'Married' : 'Divorced'}
              </Text>
            </View>
          </View>

          <View style={styles.spouseCard}>
            <View style={styles.spouseAvatarContainer}>
              <View
                style={[
                  styles.spouseAvatar,
                  {
                    backgroundColor:
                      member.gender === 'male' ? '#EC4899' : '#3B82F6',
                  },
                ]}
              >
                <Text style={styles.spouseAvatarText}>
                  {member.spouse.name.charAt(0)}
                </Text>
              </View>
            </View>
            <Text style={styles.spouseName} numberOfLines={1}>
              {member.spouse.name}
            </Text>
          </View>
        </View>
      )}

      {/* Ex-Spouses */}
      {member.exSpouses && member.exSpouses.length > 0 && (
        <View style={styles.exSpousesSection}>
          <View style={styles.exSpouseHeader}>
            <Ionicons name="heart-dislike" size={12} color="#9CA3AF" />
            <Text style={styles.exSpouseLabel}>Ex-spouse(s)</Text>
          </View>
          {member.exSpouses.map((ex, index) => (
            <View key={index} style={styles.exSpouseCard}>
              <Text style={styles.exSpouseName}>{ex.name}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default function FamilyTreePage() {
  const [zoom, setZoom] = useState(100);
  const [loading, setLoading] = useState(true);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [treeData, setTreeData] = useState<{ generations: Generation[] }>({ generations: [] });

  useEffect(() => {
    loadFamilyMembers();
  }, []);

  const loadFamilyMembers = async () => {
    setLoading(true);
    try {
      // Get logged-in user's family line ID
      const user = await getUser();
      const userFamilyLineId = user?.familyLineId || user?.familyId || '';
      
      console.log('Tree - User familyLineId:', userFamilyLineId);

      const response = await fetch(`${API_BASE}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const allMembers: FamilyMember[] = await response.json();
        
        console.log('Tree - Total members fetched:', allMembers.length);
        console.log('Tree - Sample member familyLineId:', allMembers[0]?.familyLineId);

        // Filter members by family line ID - only show members from user's family
        // Check both familyLineId and familyId fields
        const familyMembers = userFamilyLineId
          ? allMembers.filter(member => 
              member.familyLineId === userFamilyLineId || 
              (member as any).familyId === userFamilyLineId
            )
          : allMembers;
        
        console.log('Tree - Filtered members:', familyMembers.length);

        setFamilyMembers(familyMembers);
        buildTreeData(familyMembers);
      }
    } catch (error) {
      console.error('Error loading family members:', error);
    } finally {
      setLoading(false);
    }
  };  const buildTreeData = (members: FamilyMember[]) => {
    // Group by generation
    const genMap = new Map<number, FamilyMember[]>();

    members.forEach((member) => {
      const gen = member.generation || 1;
      if (!genMap.has(gen)) {
        genMap.set(gen, []);
      }
      genMap.get(gen)!.push(member);
    });

    // Sort generations
    const sortedGens = Array.from(genMap.keys()).sort((a, b) => a - b);

    // Build generations with spouse info
    const generations: Generation[] = sortedGens.map((level) => {
      const genMembers = genMap.get(level)!;
      const processedIds = new Set<string>();
      const membersWithSpouses: Member[] = [];

      genMembers.forEach((member) => {
        if (processedIds.has(member.personId)) return;

        const spouse = member.spouseId
          ? members.find((m) => m.personId === member.spouseId)
          : undefined;

        // If spouse exists and is male while current member is female, skip this member
        // The male partner will be processed and will display above
        if (spouse && member.gender === 'F' && (spouse.gender === 'M' || spouse.gender === 'Male')) {
          return; // Skip, will be processed when male partner is encountered
        }

        if (spouse) {
          processedIds.add(spouse.personId);
        }

        const getAge = (dob?: string, dod?: string) => {
          if (!dob) return undefined;
          const birthDate = new Date(dob);
          const endDate = dod ? new Date(dod) : new Date();
          return endDate.getFullYear() - birthDate.getFullYear();
        };

        // Determine marriage status: if spouse exists, they're married (unless we have divorce info)
        const spouseInfo = spouse
          ? {
              name: spouse.firstName || 'Unknown',
              status: 'married' as 'married' | 'divorced',
            }
          : undefined;

        membersWithSpouses.push({
          id: member.personId,
          name: member.firstName || 'Unknown',
          gender: member.gender === 'M' || member.gender === 'Male' ? 'male' : 'female',
          age: getAge(member.dob, member.dod),
          spouse: spouseInfo,
        });

        processedIds.add(member.personId);
      });

      return {
        level,
        members: membersWithSpouses,
      };
    });

    setTreeData({ generations });
  };

  const totalMembers = familyMembers.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#FF9500', '#FFB700']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.headerIcon}>
          <Ionicons name="git-network-outline" size={32} color="white" />
        </View>
        <Text style={styles.headerTitle}>Family Tree</Text>
        <Text style={styles.headerSubtitle}>
          Visualize your family connections
        </Text>
      </LinearGradient>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.controlsLeft}>
          <Text style={styles.zoomLabel}>Zoom: {zoom}%</Text>
        </View>

        <View style={styles.controlsRight}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setZoom(Math.max(50, zoom - 10))}
          >
            <Ionicons name="remove" size={16} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setZoom(Math.min(150, zoom + 10))}
          >
            <Ionicons name="add" size={16} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setZoom(100)}
          >
            <Ionicons name="expand" size={16} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <Ionicons name="heart" size={12} color="#EF4444" />
          <Text style={styles.legendText}>Married</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="heart-dislike" size={12} color="#9CA3AF" />
          <Text style={styles.legendText}>Divorced</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.genderDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.legendText}>Male</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.genderDot, { backgroundColor: '#EC4899' }]} />
          <Text style={styles.legendText}>Female</Text>
        </View>
      </View>

      {/* Tree Visualization */}
      <ScrollView style={styles.treeContent}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#FF9500" />
            <Text style={styles.loadingText}>Loading family tree...</Text>
          </View>
        ) : (
          <View
            style={[
              styles.treeWrapper,
              { transform: [{ scale: zoom / 100 }] },
            ]}
          >
            <View style={styles.generationsContainer}>
              {treeData.generations.map((generation, genIndex) => (
                <View key={generation.level} style={styles.generationBlock}>
                  {/* Generation Label */}
                  <View style={styles.generationBadge}>
                    <Text style={styles.generationBadgeText}>
                      Generation {generation.level}
                    </Text>
                  </View>

                  {/* Members */}
                  <View style={styles.membersRow}>
                    {generation.members.map((member) => (
                      <View key={member.id} style={styles.memberContainer}>
                        <MemberCard member={member} />

                        {/* Connection Line to Next Generation */}
                        {genIndex < treeData.generations.length - 1 && (
                          <View style={styles.connectionLine} />
                        )}
                      </View>
                    ))}
                  </View>

                  {/* Horizontal Line Connecting Siblings */}
                  {generation.members.length > 1 &&
                    genIndex < treeData.generations.length - 1 && (
                      <View style={styles.horizontalLine} />
                    )}
                </View>
              ))}
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="people" size={24} color="#FF9500" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Family Tree Overview</Text>
                <Text style={styles.infoStats}>
                  {treeData.generations.length} generations • {totalMembers}{' '}
                  members
                </Text>
                <View style={styles.infoDetails}>
                  <Text style={styles.infoDetailText}>
                    • View marriage and divorce relationships
                  </Text>
                  <Text style={styles.infoDetailText}>
                    • Track family connections across generations
                  </Text>
                  <Text style={styles.infoDetailText}>
                    • Tap on any member to view full details
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: 'center',
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  controlsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoomLabel: {
    color: '#6B7280',
    fontSize: 14,
  },
  controlsRight: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  genderDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  treeContent: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  treeWrapper: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  generationsContainer: {
    gap: 48,
  },
  generationBlock: {
    position: 'relative',
  },
  generationBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
  },
  generationBadgeText: {
    fontSize: 14,
    color: '#FF9500',
  },
  membersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 32,
  },
  memberContainer: {
    position: 'relative',
  },
  memberCardWrapper: {
    alignItems: 'center',
    gap: 8,
  },
  memberCard: {
    width: 128,
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  memberName: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  memberAge: {
    fontSize: 12,
    color: '#6B7280',
  },
  spouseSection: {
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  spouseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  marriedBadge: {
    backgroundColor: '#D1FAE5',
  },
  marriedBadgeText: {
    color: '#059669',
  },
  divorcedBadge: {
    backgroundColor: '#F3F4F6',
  },
  divorcedBadgeText: {
    color: '#6B7280',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  spouseCard: {
    width: 112,
    backgroundColor: '#F9FAFB',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  spouseAvatarContainer: {
    marginBottom: 4,
  },
  spouseAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spouseAvatarText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  spouseName: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
  },
  exSpousesSection: {
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  exSpouseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exSpouseLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  exSpouseCard: {
    width: 96,
    backgroundColor: '#F9FAFB',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  exSpouseName: {
    fontSize: 10,
    color: '#6B7280',
  },
  connectionLine: {
    position: 'absolute',
    left: '50%',
    top: '100%',
    width: 2,
    height: 48,
    backgroundColor: '#D1D5DB',
    marginLeft: -1,
  },
  horizontalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '100%',
    marginTop: 48,
    height: 2,
    backgroundColor: '#E5E7EB',
    opacity: 0.3,
  },
  infoCard: {
    marginTop: 32,
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.2)',
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoIconContainer: {
    marginTop: 4,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  infoStats: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  infoDetails: {
    gap: 4,
  },
  infoDetailText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
