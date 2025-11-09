import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/utils';
import { apiService, Ritual, Festival } from '@/lib/api';
import { getUser } from '@/lib/auth';



export default function RitualsScreen() {
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [selectedTab, setSelectedTab] = useState<'calendar' | 'reminders' | 'festivals'>('calendar');
  const [loading, setLoading] = useState(false);
  const [userFamilyId, setUserFamilyId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedEventKind, setSelectedEventKind] = useState<'ritual' | 'festival'>('ritual');
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRitual, setNewRitual] = useState({
    ritualName: '',
    ritualType: '',
    description: '',
    panditType: '',
    kulDevta: '',
    location: '',
    recurring: false as boolean,
    recurrencePattern: 'one_time',
  });

  useEffect(() => {
    loadUserAndRituals();
  }, []);

  const loadUserAndRituals = async () => {
    try {
      const user = await getUser();
      const familyId = (user?.familyId ?? user?.familyLineId) ?? null;
      if (familyId) {
        setUserFamilyId(familyId);
        await loadRituals(familyId);
      }
      // Always fetch public festivals
      try {
        const f = await apiService.getFestivals();
        setFestivals(f);
      } catch (e) {
        console.error('Error loading festivals:', e);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadRituals = async (familyId: string) => {
    setLoading(true);
    try {
      const ritualsData = await apiService.getFamilyRituals(familyId);
      setRituals(ritualsData);
    } catch (error) {
      console.error('Error loading rituals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'barsi': return 'flower';
      case 'shraad': return 'leaf';
      case 'marriage': return 'heart';
      case 'pooja': return 'star';
      case 'worship': return 'pray';
      case 'kul_devta': return 'temple';
      case 'festival': return 'star';
      case 'birth': return 'gift';
      case 'death': return 'flower';
      default: return 'calendar';
    }
  };

  const getStatusColor = (isCompleted: boolean, ritualDate: string) => {
    if (isCompleted) return '#4CAF50';
    const today = new Date();
    const rDate = new Date(ritualDate);
    if (rDate < today) return '#FF9800'; // Past due
    return colors.primary; // Upcoming
  };

  const getStatusText = (isCompleted: boolean, ritualDate: string) => {
    if (isCompleted) return 'completed';
    const today = new Date();
    const rDate = new Date(ritualDate);
    if (rDate < today) return 'overdue';
    return 'upcoming';
  };

  // Helpers for calendar and grouping
  const dateKey = (d: Date | string) => {
    const dt = typeof d === 'string' ? new Date(d) : d;
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const monthLabel = (d: Date) => d.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  const daysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

  const startWeekday = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1).getDay(); // 0 Sun

  const ritualsByDay: Record<string, Ritual[]> = rituals.reduce((acc, r) => {
    const key = dateKey(r.ritualDate);
    (acc[key] ||= []).push(r);
    return acc;
  }, {} as Record<string, Ritual[]>);

  const festivalsByDay: Record<string, Festival[]> = festivals.reduce((acc, f) => {
    const key = dateKey(f.festivalDate);
    (acc[key] ||= []).push(f);
    return acc;
  }, {} as Record<string, Festival[]>);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const handleAddRitual = () => {
    // Toggle the inline create form; default to ritual tab and today as date
    if (selectedEventKind !== 'ritual') setSelectedEventKind('ritual');
    setShowAddForm((s) => !s);
  };

  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const submitRitual = async () => {
    if (!userFamilyId) {
      Alert.alert('Login required', 'Please log in to add a ritual');
      return;
    }
    if (!selectedDate) {
      Alert.alert('Select date', 'Please select a date on the calendar');
      return;
    }
    if (!newRitual.ritualName || !newRitual.ritualType) {
      Alert.alert('Missing fields', 'Please enter ritual name and type');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        familyId: userFamilyId,
        ritualType: newRitual.ritualType,
        ritualName: newRitual.ritualName,
        ritualDate: formatDate(selectedDate),
        recurring: newRitual.recurring,
        recurrencePattern: newRitual.recurrencePattern || 'one_time',
        location: newRitual.location?.trim() || '',
        panditType: newRitual.panditType?.trim() || '',
        kulDevta: newRitual.kulDevta?.trim() || '',
        description: newRitual.description?.trim() || '',
        notes: '',
        reminderDaysBefore: 7,
      };
      await apiService.createRitual(payload);
      Alert.alert('Success', 'Ritual reminder has been added');
      // refresh data and reset
      await loadRituals(userFamilyId);
      setShowAddForm(false);
      setNewRitual({
        ritualName: '', ritualType: '', description: '', panditType: '', kulDevta: '', location: '', recurring: false, recurrencePattern: 'one_time',
      });
    } catch (e: any) {
      console.error('Failed to create ritual', e);
      Alert.alert('Error', e?.message || 'Failed to add ritual');
    } finally {
      setLoading(false);
    }
  };

  const renderRitual = (ritual: Ritual, index?: number) => (
    <TouchableOpacity key={(ritual as any).id ?? (ritual as any).ritualId ?? `${ritual.ritualName}-${ritual.ritualDate}-${index ?? 0}`}
      style={styles.ritualCard}>
      <View style={styles.ritualHeader}>
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          style={styles.ritualIcon}
        >
          <Ionicons name={getTypeIcon(ritual.ritualType) as any} size={24} color="white" />
        </LinearGradient>
        <View style={styles.ritualInfo}>
          <Text style={styles.ritualTitle}>{ritual.ritualName}</Text>
          <Text style={styles.ritualDate}>{new Date(ritual.ritualDate).toLocaleDateString()}</Text>
          {ritual.location && (
            <Text style={styles.ritualMember}>{ritual.location}</Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ritual.isCompleted, ritual.ritualDate) }]}>
          <Text style={styles.statusText}>{getStatusText(ritual.isCompleted, ritual.ritualDate)}</Text>
        </View>
      </View>
      <Text style={styles.ritualDescription}>{ritual.description || 'No description available'}</Text>
      <View style={styles.ritualActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="eye" size={16} color={colors.primary} />
          <Text style={styles.actionText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share" size={16} color={colors.primary} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderFestival = (f: Festival, index?: number) => (
    <TouchableOpacity key={String((f as any).festivalId ?? index)} style={styles.ritualCard}>
      <View style={styles.ritualHeader}>
        <LinearGradient colors={[colors.primary, colors.accent]} style={styles.ritualIcon}>
          <Ionicons name="star" size={24} color="white" />
        </LinearGradient>
        <View style={styles.ritualInfo}>
          <Text style={styles.ritualTitle}>{f.festivalName}</Text>
          <Text style={styles.ritualDate}>{new Date(f.festivalDate).toDateString()}</Text>
          {!!f.region && <Text style={styles.ritualMember}>{f.region}</Text>}
        </View>
      </View>
      <Text style={styles.ritualDescription}>{f.description || '—'}</Text>
    </TouchableOpacity>
  );

  // Tabs content
  const renderCalendarTab = () => {
    const totalDays = daysInMonth(currentMonth);
    const leadingBlanks = startWeekday(currentMonth); // 0..6
    const cells: Array<{ date: Date | null; key: string } > = [];
    // Fill leading blanks
    for (let i = 0; i < leadingBlanks; i++) {
      cells.push({ date: null, key: `b-${i}` });
    }
    // Fill month days
    for (let d = 1; d <= totalDays; d++) {
      const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
      cells.push({ date: cellDate, key: dateKey(cellDate) });
    }
    // Ensure 6 rows of 7 cells = 42 cells
    while (cells.length % 7 !== 0) {
      const idx = cells.length;
      cells.push({ date: null, key: `t-${idx}` });
    }

    const selectedKey = selectedDate ? dateKey(selectedDate) : '';
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const ritualsForSelected = selectedDate ? (ritualsByDay[selectedKey] || []) : [];
  const festivalsForSelected = selectedDate ? (festivalsByDay[selectedKey] || []) : [];

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeaderRow}>
          <TouchableOpacity
            style={styles.monthNavBtn}
            onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
          >
            <Ionicons name="chevron-back" size={18} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{monthLabel(currentMonth)}</Text>
          <TouchableOpacity
            style={styles.monthNavBtn}
            onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
          >
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekHeader}>
          {dayNames.map((dn) => (
            <Text key={dn} style={styles.weekHeaderCell}>{dn}</Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {cells.map(({ date, key }) => {
            const isToday = date ? isSameDay(date, new Date()) : false;
            const hasRituals = date ? !!ritualsByDay[dateKey(date)] : false;
            const hasFestivals = date ? !!festivalsByDay[dateKey(date)] : false;
            const isSelected = date && selectedDate ? isSameDay(date, selectedDate) : false;
            return (
              <TouchableOpacity
                key={key}
                disabled={!date}
                onPress={() => {
                  if (!date) return;
                  setSelectedDate(date);
                  if (hasRituals) setSelectedEventKind('ritual');
                  else if (hasFestivals) setSelectedEventKind('festival');
                }}
                style={[
                  styles.dayCell,
                  !date && styles.dayCellEmpty,
                  isToday && styles.dayCellToday,
                  isSelected && styles.dayCellSelected,
                ]}
              >
                {date && <Text style={styles.dayNumber}>{date.getDate()}</Text>}
                {(hasRituals || hasFestivals) && (
                  <View style={styles.dotsRow}>
                    {hasRituals && (
                      <TouchableOpacity
                        onPress={() => {
                          if (!date) return;
                          setSelectedDate(date);
                          setSelectedEventKind('ritual');
                        }}
                      >
                        <View style={styles.dot} />
                      </TouchableOpacity>
                    )}
                    {hasFestivals && (
                      <TouchableOpacity
                        onPress={() => {
                          if (!date) return;
                          setSelectedDate(date);
                          setSelectedEventKind('festival');
                        }}
                      >
                        <View style={styles.dotFestival} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedEventKind === 'festival' ? 'Festivals' : 'Rituals'} on {selectedDate ? new Date(selectedDate).toDateString() : '—'}
          </Text>
          {selectedEventKind === 'ritual' && (
            <TouchableOpacity style={styles.addButton} onPress={handleAddRitual}>
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {/* Inline Create Ritual Form */}
        {selectedEventKind === 'ritual' && showAddForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Create Ritual</Text>
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Name</Text>
                <TextInput
                  placeholder="e.g., Satya Narayan Pooja"
                  value={newRitual.ritualName}
                  onChangeText={(t) => setNewRitual({ ...newRitual, ritualName: t })}
                  style={styles.input}
                />
              </View>
            </View>
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Type</Text>
                <TextInput
                  placeholder="festival | pooja | marriage | barsi ..."
                  value={newRitual.ritualType}
                  onChangeText={(t) => setNewRitual({ ...newRitual, ritualType: t })}
                  style={styles.input}
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Location</Text>
                <TextInput
                  placeholder="City / Temple"
                  value={newRitual.location}
                  onChangeText={(t) => setNewRitual({ ...newRitual, location: t })}
                  style={styles.input}
                />
              </View>
            </View>
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Pandit Type</Text>
                <TextInput
                  placeholder="Brahmin / Purohit / Jyotish"
                  value={newRitual.panditType}
                  onChangeText={(t) => setNewRitual({ ...newRitual, panditType: t })}
                  style={styles.input}
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Kul Devta</Text>
                <TextInput
                  placeholder="Family deity (optional)"
                  value={newRitual.kulDevta}
                  onChangeText={(t) => setNewRitual({ ...newRitual, kulDevta: t })}
                  style={styles.input}
                />
              </View>
            </View>
            <View style={styles.formRow}>
              <View style={[styles.formField, { flex: 1 }]}> 
                <Text style={styles.formLabel}>Recurring</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Switch value={newRitual.recurring} onValueChange={(v) => setNewRitual({ ...newRitual, recurring: v })} />
                  <Text style={styles.helperText}>{newRitual.recurring ? 'Enabled' : 'One-time'}</Text>
                </View>
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Recurrence</Text>
                <TextInput
                  placeholder="one_time | yearly | monthly"
                  value={newRitual.recurrencePattern}
                  onChangeText={(t) => setNewRitual({ ...newRitual, recurrencePattern: t })}
                  style={styles.input}
                />
              </View>
            </View>
            <View style={styles.formRow}>
              <View style={[styles.formField, { flex: 1 }]}> 
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  placeholder="Notes (optional)"
                  value={newRitual.description}
                  onChangeText={(t) => setNewRitual({ ...newRitual, description: t })}
                  style={[styles.input, { height: 80 }]}
                  multiline
                />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={submitRitual}>
                <Ionicons name="checkmark" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.addButton, { backgroundColor: '#999' }]} onPress={() => setShowAddForm(false)}>
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {selectedEventKind === 'festival'
          ? (
            festivalsForSelected.length > 0
              ? <View style={styles.ritualsList}>{festivalsForSelected.map((f, i) => renderFestival(f, i))}</View>
              : <View style={styles.emptyState}><Ionicons name="star-outline" size={48} color="#ccc" /><Text style={styles.emptySubtext}>No festivals on this date</Text></View>
          )
          : (
            ritualsForSelected.length > 0
              ? <View style={styles.ritualsList}>{ritualsForSelected.map((r, i) => renderRitual(r, i))}</View>
              : <View style={styles.emptyState}><Ionicons name="calendar-outline" size={64} color="#ccc" /><Text style={styles.emptyText}>No rituals on this date</Text><TouchableOpacity style={styles.emptyButton} onPress={handleAddRitual}><Text style={styles.emptyButtonText}>Add Ritual</Text></TouchableOpacity></View>
          )}
      </View>
    );
  };

  const renderRemindersTab = () => {
    const today = new Date();
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    const upcoming = rituals.filter(r => !r.isCompleted && new Date(r.ritualDate) >= today && new Date(r.ritualDate) <= in30);
    const overdue = rituals.filter(r => !r.isCompleted && new Date(r.ritualDate) < today);
    return (
      <View style={styles.ritualsContainer}>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Upcoming (next 30 days)</Text></View>
        {upcoming.length ? (
          <View style={styles.ritualsList}>{upcoming.map((r, i) => renderRitual(r, i))}</View>
        ) : (
          <View style={styles.emptyState}><Text style={styles.emptySubtext}>Nothing scheduled</Text></View>
        )}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}><Text style={styles.sectionTitle}>Overdue</Text></View>
        {overdue.length ? (
          <View style={styles.ritualsList}>{overdue.map((r, i) => renderRitual(r, i))}</View>
        ) : (
          <View style={styles.emptyState}><Text style={styles.emptySubtext}>All caught up</Text></View>
        )}
      </View>
    );
  };

  const renderFestivalsTab = () => {
    const list = festivals;
    return (
      <View style={styles.ritualsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Festivals & Sacred Days</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddRitual}>
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>
        {list.length ? (
          <View style={styles.ritualsList}>{list.map((f, i) => renderFestival(f, i))}</View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="star-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No festivals recorded</Text>
            <Text style={styles.emptySubtext}>Add community festivals, poojas, worship or Kul Devta events</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        style={styles.header}
      >
        <Ionicons name="calendar" size={48} color="white" />
        <Text style={styles.headerTitle}>Rituals & Ceremonies</Text>
        <Text style={styles.headerSubtitle}>
          Plan and celebrate family traditions with love and devotion
        </Text>
      </LinearGradient>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterButtons}>
            {[
              { key: 'calendar', label: 'Calendar', icon: 'calendar' },
              { key: 'reminders', label: 'Reminders', icon: 'alarm' },
              { key: 'festivals', label: 'Festivals', icon: 'star' },
            ].map((tab: any) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterButton, selectedTab === tab.key && styles.filterButtonActive]}
                onPress={() => setSelectedTab(tab.key)}
              >
                <Ionicons name={tab.icon} size={14} color={selectedTab === tab.key ? 'white' : '#666'} />
                <Text style={[styles.filterButtonText, selectedTab === tab.key && styles.filterButtonTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>
        {selectedTab === 'calendar' && renderCalendarTab()}
        {selectedTab === 'reminders' && renderRemindersTab()}
        {selectedTab === 'festivals' && renderFestivalsTab()}

        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionCard}>
              <Ionicons name="gift" size={32} color={colors.primary} />
              <Text style={styles.quickActionText}>Add Birthday</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard}>
              <Ionicons name="heart" size={32} color={colors.primary} />
              <Text style={styles.quickActionText}>Add Anniversary</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard}>
              <Ionicons name="star" size={32} color={colors.primary} />
              <Text style={styles.quickActionText}>Add Festival</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard}>
              <Ionicons name="flower" size={32} color={colors.primary} />
              <Text style={styles.quickActionText}>Add Ceremony</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  filterContainer: {
    paddingVertical: 16,
  },
  filterButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  // Calendar styles
  calendarContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: 2,
    marginTop: 6,
  },
  weekHeaderCell: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  dayCellEmpty: {
    opacity: 0.3,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dayCellSelected: {
    backgroundColor: 'rgba(255,140,0,0.08)',
  },
  dayNumber: {
    fontSize: 14,
    color: colors.foreground,
    fontWeight: '600',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  dotFestival: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD700',
  },
  ritualsContainer: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 8,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  formField: {
    flex: 1,
  },
  formLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: 'white',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
  },
  ritualsList: {
    gap: 16,
  },
  ritualCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ritualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ritualIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ritualInfo: {
    flex: 1,
  },
  ritualTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 2,
  },
  ritualDate: {
    fontSize: 14,
    color: '#666',
  },
  ritualMember: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  ritualDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  ritualActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    padding: 20,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 12,
    color: colors.foreground,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
});