import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  FlatList,
  Linking,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import axios from "axios";
import Icon from "react-native-vector-icons/Ionicons";
import { useTheme } from "./ThemeContext";
import { getTheme } from "./Theme";
import { useNavigation } from "@react-navigation/native";
import { useSession } from "../context/SessionContext";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RefreshControl } from "react-native";
import AppointmentDetailsScreen from "./AppointmentDetails";

interface DoctorInfo {
  _id: string;
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_email: string;
  doctor_phone: string;
  organization_name?: string;
  is_admin: boolean;
  qualification: string;
  patients?: any[];
}

interface Appointment {
  _id: string;
  therepy_type: string;
  therepy_link: string;
  therepy_start_time: string;
  therepy_date: string;
  patient_name?: string;
  doctor_name?: string;
}

type RootStackParamList = {
  AllPatients: undefined;
  AllDoctors: undefined;
  Logout: undefined;
  DoctorRegister: undefined;
};

type DashboardScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

type Item = {
  icon: string;
  label: string;
  screen?: keyof RootStackParamList | undefined;
};

const API_BASE_URL = "https://healtrackapp-production.up.railway.app";

const DoctorDashboard: React.FC = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(getTheme(theme)), [theme]);
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const { session, refreshAllTokens } = useSession();

  const [refreshing, setRefreshing] = useState(false);
  const [doctorLoading, setDoctorLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);

  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const { width } = useWindowDimensions();

  const fetchDoctorInfo = useCallback(async () => {
    if (!session?.tokens?.idToken) return;

    setDoctorLoading(true);
    try {
      await refreshAllTokens();
      const doctorResponse = await axios.get(`${API_BASE_URL}/doctor`, {
        headers: { Authorization: `Bearer ${session.tokens.idToken}` },
      });

      setDoctorInfo(doctorResponse.data);
    } catch (error) {
      console.error("Error fetching doctor info:", error);
    } finally {
      setDoctorLoading(false);
    }
  }, [session, refreshAllTokens]);

  const fetchAppointments = useCallback(async () => {
    if (!session?.tokens?.idToken) return;

    setAppointmentsLoading(true);
    try {
      const appointmentsResponse = await axios.get(
        `${API_BASE_URL}/appointments/getevents`,
        {
          headers: { Authorization: `Bearer ${session.tokens.idToken}` },
        }
      );
      setAppointments(appointmentsResponse.data.appointments);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setAppointments([]);
        console.log("No therapies available for today");
      } else {
        console.error("Error fetching appointments:", error);
      }
    } finally {
      setAppointmentsLoading(false);
    }
  }, [session]);

  const fetchAllAppointments = useCallback(async () => {
    if (!session?.tokens?.idToken) return;

    try {
      const allAppointmentsResponse = await axios.get(
        `${API_BASE_URL}/All/appointments`,
        {
          headers: { Authorization: `Bearer ${session.tokens.idToken}` },
        }
      );
      setAllAppointments(allAppointmentsResponse.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setAllAppointments([]);
      } else {
        console.error("Error fetching all appointments:", error);
      }
    }
  }, [session]);

  useEffect(() => {
    if (session?.tokens?.accessToken) {
      fetchDoctorInfo();
      fetchAppointments();
      fetchAllAppointments();
    } else {
      setDoctorLoading(false);
      setAppointmentsLoading(false);
    }
  }, [session, fetchDoctorInfo, fetchAppointments, fetchAllAppointments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDoctorInfo();
    await fetchAppointments();
    await fetchAllAppointments();
    setRefreshing(false);
  }, [fetchDoctorInfo, fetchAppointments]);

  const items: Item[] = useMemo(
    () => [
      {
        icon: "medical-outline",
        label: "All Doctors",
        screen: "AllDoctors",
      },
      { icon: "list-outline", label: "View Patients", screen: "AllPatients" },
      {
        icon: "add-circle-outline",
        label: "Add Doctor",
        screen: doctorInfo?.is_admin ? "DoctorRegister" : undefined,
      },
    ],
    [doctorInfo]
  );

  const formatDate = useCallback((date: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(date).toLocaleDateString("en-US", options);
  }, []);

  const sortAppointmentsByTime = useCallback((appointments: Appointment[]) => {
    return appointments.sort((a, b) => {
      const dateTimeA = new Date(`${a.therepy_date} ${a.therepy_start_time}`);
      const dateTimeB = new Date(`${b.therepy_date} ${b.therepy_start_time}`);
      return dateTimeA.getTime() - dateTimeB.getTime();
    });
  }, []);

  const todayAppointments = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const filteredAppointments = appointments.filter(
      (appointment) => appointment.therepy_date === today
    );
    return sortAppointmentsByTime(filteredAppointments);
  }, [appointments, sortAppointmentsByTime]);

  const renderAppointment = useCallback(
    ({ item }: { item: Appointment }) => (
      <TouchableOpacity
        style={styles.appointmentItem}
        onPress={() => setSelectedAppointment(item)}
      >
        <Icon
          name={
            item.therepy_type.toLowerCase().includes("video")
              ? "videocam-outline"
              : "person-outline"
          }
          size={24}
          color={styles.iconColor.color}
        />
        <View style={styles.appointmentInfo}>
          <View style={styles.appointmentMainInfo}>
            <View>
              <Text style={styles.appointmentTime}>
                {item.therepy_start_time}
              </Text>
              <Text style={styles.appointmentType}>{item.therepy_type}</Text>
            </View>
            {item.patient_name && (
              <Text
                style={styles.patientName}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.patient_name}
              </Text>
            )}
            {showAllAppointments && item.doctor_name && (
              <Text
                style={styles.doctorName}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Dr. {item.doctor_name}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    ),
    [styles, showAllAppointments]
  );

  const handleNavigation = useCallback(
    (screen?: keyof RootStackParamList) => {
      if (screen) {
        navigation.navigate(screen);
      }
    },
    [navigation]
  );

  const handleLogout = useCallback(() => {
    navigation.navigate("Logout");
  }, [navigation]);

  const toggleAllAppointments = useCallback(() => {
    setShowAllAppointments((prev) => !prev);
  }, []);
  if (doctorLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#119FB3" />
        <Text style={styles.loadingText}>Loading Doctor Dashboard...</Text>
      </View>
    );
  }

  if (!session?.tokens?.accessToken) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          Please log in to view the dashboard.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {selectedAppointment ? (
        <AppointmentDetailsScreen
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.header}>
            <Text style={styles.headerText}>
              {doctorInfo?.is_admin ? "Admin Dashboard" : "Doctor Dashboard"}
            </Text>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleLogout}
              >
                <Icon name="log-out-outline" size={30} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {doctorInfo && (
            <View style={styles.profileSection}>
              <Image
                source={require("../assets/profile.png")}
                style={styles.profilePhoto}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  Dr. {doctorInfo.doctor_first_name}{" "}
                  {doctorInfo.doctor_last_name}
                </Text>
                <Text style={styles.profileDetailText}>
                  {doctorInfo.qualification}
                </Text>
                {doctorInfo.organization_name && (
                  <Text style={styles.profileOrg}>
                    {doctorInfo.organization_name}
                  </Text>
                )}
                <View style={styles.profileDetail}>
                  <Icon
                    name="mail-outline"
                    size={16}
                    color={styles.profileDetailIcon.color}
                  />
                  <Text style={styles.profileDetailText}>
                    {doctorInfo.doctor_email}
                  </Text>
                </View>
                <View style={styles.profileDetail}>
                  <Icon
                    name="call-outline"
                    size={16}
                    color={styles.profileDetailIcon.color}
                  />
                  <Text style={styles.profileDetailText}>
                    {doctorInfo.doctor_phone}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {doctorInfo?.patients?.length || 0}
              </Text>
              <Text style={styles.statLabel}>Patient Joined</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{todayAppointments.length}</Text>
              <Text style={styles.statLabel}>Appointments</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Management</Text>
            <View style={styles.cardContainer}>
              {items.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.card,
                    !item.screen && { opacity: 0.5 },
                    { width: (width - 64) / 3 },
                  ]}
                  onPress={() => item.screen && handleNavigation(item.screen)}
                  disabled={!item.screen}
                >
                  <Icon
                    name={item.icon}
                    size={32}
                    color={styles.cardIcon.color}
                  />
                  <Text style={styles.cardText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.section}>
            <View style={styles.appointmentHeader}>
              <Text style={styles.sectionTitle}>
                {showAllAppointments
                  ? "All Appointments"
                  : "Today's Appointments"}
              </Text>
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={toggleAllAppointments}
              >
                <Text style={styles.toggleButtonText}>
                  {showAllAppointments ? "Show My" : "Show All"}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.dateText}>
              {formatDate(new Date().toISOString())}
            </Text>
            {showAllAppointments ? (
              <FlatList
                data={sortAppointmentsByTime(allAppointments)}
                renderItem={renderAppointment}
                keyExtractor={(item) => item._id}
                scrollEnabled={false}
              />
            ) : todayAppointments.length > 0 ? (
              <FlatList
                data={todayAppointments}
                renderItem={renderAppointment}
                keyExtractor={(item) => item._id}
                scrollEnabled={false}
              />
            ) : (
              <Text style={styles.noAppointmentsText}>
                No appointments scheduled for today.
              </Text>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};
const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.background,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: theme.colors.text,
    },
    noAppointmentsText: {
      fontSize: 16,
      color: theme.colors.text,
      textAlign: "center",
      marginTop: 20,
      backgroundColor: "white",
      borderRadius: 5,
      // height:25,
      paddingVertical: 5,
    },
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
      backgroundColor: "#119FB3",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      paddingTop: 40,
      // backgroundColor: theme.colors.primary,
      backgroundColor: "#119FB3",
    },
    appointmentHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    toggleButton: {
      backgroundColor: theme.colors.card,
      padding: 8,
      borderRadius: 8,
    },
    toggleButtonText: {
      color: theme.colors.text,
      fontWeight: "bold",
    },
    doctorName: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.8,
      marginLeft: 8,
      flex: 1,
      textAlign: "right",
    },
    headerText: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.colors.card,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerIcon: {
      color: theme.colors.card,
    },
    iconButton: {
      marginLeft: 16,
    },
    notificationBadge: {
      backgroundColor: theme.colors.notification,
      borderRadius: 10,
      width: 20,
      height: 20,
      justifyContent: "center",
      alignItems: "center",
      position: "absolute",
      top: -5,
      right: -5,
    },
    notificationText: {
      color: theme.colors.card,
      fontSize: 12,
      fontWeight: "bold",
    },
    profileSection: {
      flexDirection: "row",
      padding: 24,
      backgroundColor: theme.colors.card,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 150,
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    profilePhoto: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginRight: 20,
    },
    profileInfo: {
      flex: 1,
      justifyContent: "center",
      marginBottom: 20,
    },
    profileName: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.colors.text,
      marginBottom: 4,
    },
    profileOrg: {
      fontSize: 18,
      // color: theme.colors.primary,
      color: "#119FB3",
      marginBottom: 12,
    },
    profileDetail: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 2,
    },
    profileDetailIcon: {
      // color: theme.colors.primary,
      color: "#119FB3",
      marginRight: 8,
    },
    profileDetailText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    statsSection: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 10,
      alignItems: "center",
      // backgroundColor: theme.colors.cardBackground,
      padding: 10,
      marginHorizontal: 16,
      borderRadius: 50,
      borderBottomRightRadius: 10,
      borderTopLeftRadius: 10,
      borderBottomLeftRadius: 10,
      marginTop: -20,
      left: -110,
      elevation: 5,
      shadowColor: "#000",
      backgroundColor: "#119FB3",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    statItem: {
      alignItems: "center",
    },
    statDivider: {
      height: "70%",
      width: 1,
      backgroundColor: theme.colors.border,
    },
    statNumber: {
      fontSize: 28,
      fontWeight: "bold",
      // color: theme.colors.primary,
      color: "#FFFFF",
    },
    statLabel: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.7,
    },
    section: {
      display: "flex",
      margin: 16,

      marginBottom: 0,
      backgroundColor: "#119FB3",
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: theme.colors.text,
      marginBottom: 12,
    },
    dateText: {
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: 12,
    },
    appointmentItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    appointmentInfo: {
      flex: 1,
      marginLeft: 16,
    },
    appointmentMainInfo: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    appointmentTime: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.colors.text,
    },
    appointmentType: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.7,
    },
    patientName: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.8,
      marginLeft: 8,
      flex: 1,
      textAlign: "right",
    },
    joinButton: {
      backgroundColor: "#119FB3",
      padding: 8,
      borderRadius: 8,
      marginLeft: 8,
    },
    joinButtonText: {
      color: "white",
      fontWeight: "bold",
    },
    iconColor: {
      // color: theme.colors.primary,
      color: "#119FB3",
    },
    cardContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    card: {
      backgroundColor: theme.colors.card,
      padding: 16,
      borderRadius: 16,
      marginBottom: 16,
      alignItems: "center",
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    backcover: {
      position: "absolute",
      flex: 1,
      resizeMode: "cover",
    },
    cardIcon: {
      // color: theme.colors.primary,
      color: "#119FB3",
    },
    cardText: {
      color: theme.colors.text,
      marginTop: 8,
      textAlign: "center",
      fontSize: 12,
    },
  });

export default DoctorDashboard;
