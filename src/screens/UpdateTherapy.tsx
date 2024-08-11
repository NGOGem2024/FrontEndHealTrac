import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ImageBackground,
  Alert,
  RefreshControl,
  ScrollView,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { MaterialIcons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { openBrowserAsync } from "expo-web-browser";
import { useSession } from "../context/SessionContext";

interface Therapy {
  _id: string;
  patient_id: string;
  therepy_id: string;
  therepy_type: string;
  therepy_remarks: string;
  therepy_link: string;
  therepy_date: string;
  therepy_start_time?: string;
  therepy_end_time?: string;
  therepy_cost?: string;
}

type TherapyHistoryScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, "TherapyHistory">;
  route: { params: { patientId: string } };
};

const TherapyHistory: React.FC<TherapyHistoryScreenProps> = ({
  navigation,
  route,
}) => {
  const { session, refreshAllTokens } = useSession();
  const patientId = route.params?.patientId;

  const [therapies, setTherapies] = useState<Therapy[] | undefined>(undefined);
  const [pastTherapies, setPastTherapies] = useState<Therapy[]>([]);
  const [upcomingTherapies, setUpcomingTherapies] = useState<Therapy[]>([]);
  const [showPastTherapies, setShowPastTherapies] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!patientId) {
      setError("No patient ID provided.");
      return;
    }

    fetchTherapies();
  }, [patientId, session]);

  const fetchTherapies = async () => {
    setIsLoading(true);
    await refreshAllTokens();
    try {
      const response = await fetch(
        `https://healtrackapp-production.up.railway.app/therepy/${patientId}`,
        {
          headers: {
            Authorization: "Bearer " + session.tokens.idToken,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.therepys && Array.isArray(data.therepys)) {
        setTherapies(data.therepys);
        const now = new Date();
        const past = data.therepys.filter(
          (therapy: Therapy) => new Date(therapy.therepy_date) < now
        );
        const upcoming = data.therepys.filter(
          (therapy: Therapy) => new Date(therapy.therepy_date) >= now
        );

        setPastTherapies(past);
        setUpcomingTherapies(upcoming);
      } else {
        console.error("Unexpected data structure:", data);
        setError("Unexpected data structure received from server");
      }
    } catch (error) {
      console.error("Error fetching therapy data:", error);
      Alert.alert("No therapies found", "You are new..");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const selectTherapyType = (type: "past" | "upcoming") => {
    setShowPastTherapies(type === "past");
    toggleDropdown();
  };

  const handleRecTherapy = async (therepy_id: string) => {
    const recordingUrl = `https://app.contact.liveswitch.com/conversations/${therepy_id}`;
    try {
      await openBrowserAsync(recordingUrl);
    } catch (error) {
      console.error("Error opening recording URL:", error);
      Alert.alert("Error", "Failed to open the recording. Please try again.");
    }
  };

  const handleJoinSession = (joinUrl: string) => {
    openBrowserAsync(joinUrl);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchTherapies();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const renderTherapyItem = ({ item }: { item: Therapy }) => {
    const isPassedSession = new Date(item.therepy_date) < new Date();

    return (
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.therapyCard}>
          <View style={styles.therapyHeader}>
            <MaterialIcons name="event" size={24} color="#119FB3" />
            <Text style={styles.therapyType}>{item.therepy_type}</Text>
          </View>
          <View style={styles.therapyDetails}>
            <Text style={styles.therapyText}>Date: {item.therepy_date}</Text>
            <Text style={styles.therapyText}>
              Start Time: {item.therepy_start_time}
            </Text>
            <Text style={styles.therapyText}>
              End Time: {item.therepy_end_time}
            </Text>
            <Text style={styles.therapyText}>Cost: {item.therepy_cost}</Text>
            <Text style={styles.therapyText}>
              Remarks: {item.therepy_remarks}
            </Text>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.joinButton,
                isPassedSession && styles.disabledButton,
              ]}
              onPress={() => handleJoinSession(item.therepy_link)}
              disabled={isPassedSession}
            >
              <Text style={styles.buttonText}>Join Session</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.recordButton]}
              onPress={() => handleRecTherapy(item.therepy_id)}
            >
              <Text style={styles.buttonText}>Get Recording</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <ImageBackground
      source={require("../assets/bac2.jpg")}
      style={styles.backgroundImage}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Therapy Session</Text>
        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          onPress={toggleDropdown}
          style={styles.dropdownButton}
        >
          <Text style={styles.dropdownButtonText}>
            {showPastTherapies ? "Past Therapies" : "Upcoming Therapies"}
          </Text>
          <Icon
            name={isDropdownOpen ? "chevron-up" : "chevron-down"}
            size={16}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        {isDropdownOpen && (
          <View style={styles.dropdownContent}>
            <TouchableOpacity
              onPress={() => selectTherapyType("past")}
              style={styles.dropdownItem}
            >
              <Text>Past Therapies</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => selectTherapyType("upcoming")}
              style={styles.dropdownItem}
            >
              <Text>Upcoming Therapies</Text>
            </TouchableOpacity>
          </View>
        )}

        {isLoading ? (
          <Text style={styles.loadingText}>Loading therapies...</Text>
        ) : (
          <FlatList
            data={showPastTherapies ? pastTherapies : upcomingTherapies}
            keyExtractor={(item) => item._id}
            renderItem={renderTherapyItem}
            ListEmptyComponent={
              <Text style={styles.noTherapyText}>
                No {showPastTherapies ? "past" : "upcoming"} therapies available
              </Text>
            }
          />
        )}
      </View>
    </ImageBackground>
  );
};

const windowWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "rgba(17, 159, 179, 0.1)",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginTop: 20,
  },
  error: {
    color: "#FF6B6B",
    marginBottom: 16,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 16,
  },
  therapyCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  therapyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  therapyType: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#119FB3",
    marginLeft: 8,
  },
  therapyDetails: {
    marginBottom: 12,
  },
  therapyText: {
    fontSize: 14,
    color: "#333333",
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: windowWidth > 360 ? 150 : "40%",
    elevation: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  joinButton: {
    backgroundColor: "#119FB3",
  },
  recordButton: {
    backgroundColor: "#2596be",
  },
  disabledButton: {
    backgroundColor: "#A0A0A0",
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: windowWidth > 360 ? 16 : 14,
  },
  noTherapyText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 16,
    marginTop: 20,
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(17, 159, 179, 0.8)",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  dropdownButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  dropdownContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 10,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
});

export default TherapyHistory;
