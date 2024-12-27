import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import Icon from "react-native-vector-icons/Ionicons";
import { useTheme } from "./ThemeContext";
import { getTheme } from "./Theme";
import { useSession } from "../context/SessionContext";
import AppointmentDetailsScreen from "./AppointmentDetails";
import { handleError } from "../utils/errorHandler";
import NoAppointmentsPopup from "./Noappointmentspopup";
import axiosInstance from "../utils/axiosConfig";
import { Picker } from '@react-native-picker/picker';

interface Appointment {
  plan_id: string;
  patient_id: string;
  _id: string;
  therepy_type: string;
  therepy_link: string;
  therepy_start_time: string;
  therepy_end_time: string; 
  therepy_date: string;
  patient_name?: string;
  doctor_name?: string;
  doctor_id: string; 
  doctor_email: string;
}

const AllAppointmentsScreen: React.FC = () => {
  const { theme } = useTheme();
  const styles = getStyles(getTheme(theme));
  const { session } = useSession();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isAppointmentModalVisible, setIsAppointmentModalVisible] = useState(false);
  const [filterType, setFilterType] = useState('next7days');

  const fetchAppointments = async () => {
    if (!session.idToken) return;
    setLoading(true);
    try {
      const endpoint = showAllAppointments ? '/All/appointments' : '/appointments/getevents';
      const response = await axiosInstance.get(endpoint, {
        headers: { Authorization: `Bearer ${session.idToken}` },
      });
      setAppointments(response.data.appointments || response.data);
    } catch (error) {
      handleError(error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [showAllAppointments, session.idToken]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  const handleAppointmentPress = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsAppointmentModalVisible(true);
  };

  const closeAppointmentModal = () => {
    setIsAppointmentModalVisible(false);
    setSelectedAppointment(null);
  };

  const filterAppointments = (appointments: Appointment[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const appointmentDate = (appointment: Appointment) => new Date(appointment.therepy_date);
    
    switch (filterType) {
      case 'previous':
        return appointments.filter(appointment => 
          appointmentDate(appointment) < today
        );
      case 'next7days': {
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        return appointments.filter(appointment => {
          const date = appointmentDate(appointment);
          return date >= today && date <= nextWeek;
        });
      }
      default:
        return appointments;
    }
  };

  const sortAppointmentsByTime = (appointments: Appointment[]) => {
    return [...appointments].sort((a, b) => {
      const dateTimeA = new Date(`${a.therepy_date} ${a.therepy_start_time}`);
      const dateTimeB = new Date(`${b.therepy_date} ${b.therepy_start_time}`);
      return dateTimeA.getTime() - dateTimeB.getTime();
    });
  };

  const renderAppointment = ({ item }: { item: Appointment }) => (
    <TouchableOpacity
      style={styles.appointmentItem}
      onPress={() => handleAppointmentPress(item)}
    >
      <Icon
        name={item.therepy_type.toLowerCase().includes("video") ? "videocam-outline" : "person-outline"}
        size={24}
        color="#119FB3"
      />
      <View style={styles.appointmentInfo}>
        <View style={styles.appointmentMainInfo}>
          <View>
            <Text style={styles.dateText}>{item.therepy_date}</Text>
            <Text style={styles.appointmentTime}>{item.therepy_start_time}</Text>
            <Text style={styles.appointmentType}>{item.therepy_type}</Text>
          </View>
          {item.patient_name && (
            <Text style={styles.patientName} numberOfLines={1} ellipsizeMode="tail">
              {item.patient_name}
            </Text>
          )}
          {showAllAppointments && item.doctor_name && (
            <Text style={styles.doctorName} numberOfLines={1} ellipsizeMode="tail">
              Dr. {item.doctor_name}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const filteredAndSortedAppointments = sortAppointmentsByTime(filterAppointments(appointments));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#119FB3" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Appointments</Text>
      </View>

      <View style={styles.filterContainer}>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={filterType}
            onValueChange={(value) => setFilterType(value)}
            style={styles.picker}
          >
            <Picker.Item label="Next 7 Days" value="next7days" />
            <Picker.Item label="Previous Appointments" value="previous" />
          </Picker>
        </View>

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowAllAppointments(!showAllAppointments)}
        >
          <Text style={styles.toggleButtonText}>
            {showAllAppointments ? "Show My" : "Show All"}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#119FB3" />
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedAppointments}
          renderItem={renderAppointment}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={<NoAppointmentsPopup visible={true} />}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {isAppointmentModalVisible && selectedAppointment && (
        <View style={styles.fullScreenModal}>
          <AppointmentDetailsScreen
            appointment={selectedAppointment}
            onClose={closeAppointmentModal}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: '#119FB3',
    padding: 16,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  pickerContainer: {
    flex: 1,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
  },
  toggleButton: {
    backgroundColor: '#119FB3',
    padding: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  appointmentItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  appointmentInfo: {
    flex: 1,
    marginLeft: 16,
  },
  appointmentMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  appointmentTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  appointmentType: {
    fontSize: 14,
    color: '#666',
  },
  patientName: {
    fontSize: 14,
    color: '#000',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  doctorName: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  fullScreenModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    zIndex: 1000,
  },
});

export default AllAppointmentsScreen;