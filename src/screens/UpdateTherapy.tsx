import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ImageBackground,
  Modal,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { openBrowserAsync } from "expo-web-browser";
import { useSession } from "../context/SessionContext";
import { refreshGoogleTokens } from "../context/SessionContext";

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
  const { session } = useSession();
  const patientId = route.params?.patientId;

  const [therapies, setTherapies] = useState<Therapy[] | undefined>(undefined);
  const [pastTherapies, setPastTherapies] = useState<Therapy[]>([]);
  const [upcomingTherapies, setUpcomingTherapies] = useState<Therapy[]>([]);
  const [showPastTherapies, setShowPastTherapies] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRecPopup, setShowRecPopup] = useState<boolean>(false);
  const [recUrl, setRecUrl] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [googleToken, setGoogleToken] = useState(null);

  useEffect(() => {
    const getGoogleToken = async () => {
      try {
        const newTokens = await refreshGoogleTokens();
        if (newTokens) {
          setGoogleToken(newTokens.accessToken);
        }
      } catch (error) {
        console.error("Error retrieving Google token:", error);
      }
    };

    getGoogleToken();
  }, []);

  useEffect(() => {
    if (!patientId) {
      setError("No patient ID provided.");
      return;
    }

    fetchTherapies();
  }, [patientId, session]);

  const fetchTherapies = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://healtrackapp-production.up.railway.app/therepy/${patientId}`,
        {
          headers: {
            Authorization: "Bearer " + session.access_token,
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
      setError("Failed to fetch therapy data. Please try again.");
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

  const handleRecTherapy = async () => {
    try {
      const response = await fetch(
        `https://healtrackapp-production.up.railway.app/recording`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + session.access_token,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRecUrl(data.RecordingLink);
        setShowRecPopup(true);
      } else {
        setError("Failed to fetch recording URL.");
      }
    } catch (error) {
      setError("An error occurred while fetching recording URL.");
    }
  };

  const handleJoinSession = (joinUrl: string) => {
    openBrowserAsync(joinUrl);
  };

  const renderTherapyItem = ({ item }: { item: Therapy }) => (
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
        <Text style={styles.therapyText}>Remarks: {item.therepy_remarks}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.joinButton]}
          onPress={() => handleJoinSession(item.therepy_link)}
        >
          <Text style={styles.buttonText}>Join Session</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.recordButton]}
          onPress={handleRecTherapy}
        >
          <Text style={styles.buttonText}>Get Recording</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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

        <Modal visible={showRecPopup} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Recording URL</Text>
              <Text>{recUrl}</Text>
              <TouchableOpacity
                style={[styles.modalButton, styles.closeButton]}
                onPress={() => setShowRecPopup(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
};

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
    width: "40%",
    elevation: 2,
  },
  joinButton: {
    backgroundColor: "#119FB3",
  },
  recordButton: {
    backgroundColor: "#2596be",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    width: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#119FB3",
    marginBottom: 10,
    textAlign: "center",
  },
  modalButton: {
    backgroundColor: "#119FB3",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginTop: 20,
  },
  closeButton: {
    backgroundColor: "#FF6B6B",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default TherapyHistory;
