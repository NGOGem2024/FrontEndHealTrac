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
  Modal,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { MaterialIcons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { openBrowserAsync } from "expo-web-browser";
import { useSession } from "../context/SessionContext";
import EditTherapy from "./Update";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const [editingTherapy, setEditingTherapy] = useState<Therapy | null>(null);
  const [showRemarksPopup, setShowRemarksPopup] = useState(false);
  // const [selectedTherapyRemarks, setSelectedTherapyRemarks] = useState("");
  const [selectedTherapyId, setSelectedTherapyId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [improvements, setImprovements] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [therapyToDelete, setTherapyToDelete] = useState<Therapy | null>(null);

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
        const past = data.therepys.filter((therapy: Therapy) => {
          const therapyEndTime = new Date(
            `${therapy.therepy_date}T${therapy.therepy_end_time}`
          );
          return therapyEndTime < now;
        });
        const upcoming = data.therepys.filter((therapy: Therapy) => {
          const therapyEndTime = new Date(
            `${therapy.therepy_date}T${therapy.therepy_end_time}`
          );
          return therapyEndTime >= now;
        });

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

  const handleDeleteTherapy = (therapy: Therapy) => {
    setTherapyToDelete(therapy);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteTherapy = async () => {
    if (!therapyToDelete) return;

    try {
      await refreshAllTokens();
      const response = await fetch(
        `https://healtrackapp-production.up.railway.app/therapy/delete/${therapyToDelete._id}`,
        {
          method: "delete",
          headers: {
            Authorization: `Bearer ${session.tokens.idToken}`,
            auth: `Bearer ${session.tokens.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Remove the deleted therapy from the state
      setUpcomingTherapies((prevTherapies) =>
        prevTherapies.filter((therapy) => therapy._id !== therapyToDelete._id)
      );

      Alert.alert("Success", "Therapy deleted successfully");
    } catch (error) {
      console.error("Error deleting therapy:", error);
      Alert.alert("Error", "Failed to delete therapy");
    } finally {
      setShowDeleteConfirmation(false);
      setTherapyToDelete(null);
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

  const handleEditTherapy = (therapy: Therapy) => {
    setEditingTherapy(therapy);
  };

  const handleUpdateTherapy = async (updatedTherapy: Therapy) => {
    try {
      await refreshAllTokens();
      const liveSwitchToken = await AsyncStorage.getItem("liveSwitchToken");
      const response = await fetch(
        `https://healtrackapp-production.up.railway.app/therepy/update/${updatedTherapy._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.tokens.idToken}`,
            auth: `Bearer ${session.tokens.accessToken}`,
            "X-liveSwitch-token": liveSwitchToken,
          },
          body: JSON.stringify(updatedTherapy),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedData = await response.json();
      setTherapies((prevTherapies) =>
        prevTherapies?.map((therapy) =>
          therapy._id === updatedData.therapy._id
            ? updatedData.therapy
            : therapy
        )
      );
      setEditingTherapy(null);
      Alert.alert("Success", "Therapy updated successfully");
      fetchTherapies(); // Refresh the list after update
    } catch (error) {
      console.error("Error updating therapy:", error);
      Alert.alert("Error", "Failed to update therapy");
    }
  };

  const handleTherapyDone = (therapy: Therapy) => {
    // setSelectedTherapyRemarks(therapy.therepy_remarks);
    setSelectedTherapyId(therapy._id);
    setRemarks(therapy.therepy_remarks || "");
    setImprovements("");
    setShowRemarksPopup(true);
  };

  const handleSaveRemarks = async () => {
    try {
      await refreshAllTokens();
      const response = await fetch(
        ` https://healtrackapp-production.up.railway.app/therepy/update/${selectedTherapyId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.tokens.idToken}`,
            auth: `Bearer ${session.tokens.accessToken}`,
          },
          body: JSON.stringify({
            therepy_remarks: remarks,
            improvements: improvements,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update the local state
      setTherapies((prevTherapies) =>
        prevTherapies?.map((therapy) =>
          therapy._id === selectedTherapyId
            ? {
                ...therapy,
                therepy_remarks: remarks,
                improvements: improvements,
              }
            : therapy
        )
      );

      setShowRemarksPopup(false);
      Alert.alert("Success", "Remarks and improvements saved successfully");
    } catch (error) {
      console.error("Error saving remarks and improvements:", error);
      Alert.alert("Error", "Failed to save remarks and improvements");
    }
  };

  const renderTherapyItem = ({ item }: { item: Therapy }) => {
    const now = new Date();
    const therapyStartTime = new Date(
      `${item.therepy_date}T${item.therepy_start_time}`
    );
    const therapyEndTime = new Date(
      `${item.therepy_date}T${item.therepy_end_time}`
    );
    const isUpcoming = therapyStartTime > now;
    const isOngoing = now >= therapyStartTime && now <= therapyEndTime;
    const isPast = now > therapyEndTime;

    return (
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.therapyCard}>
          {isUpcoming && (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditTherapy(item)}
              >
                <MaterialIcons name="edit" size={24} color="#119FB3" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteTherapy(item)}
              >
                <MaterialIcons name="delete" size={24} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          )}
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
            <Text style={styles.therapyText}>
              Remarks: {item.therepy_remarks}
            </Text>
          </View>
          <View style={styles.buttonContainer}>
            {!isPast && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.joinButton,
                  isUpcoming && styles.disabledButton,
                ]}
                onPress={() => handleJoinSession(item.therepy_link)}
                disabled={isUpcoming}
              >
                <Text style={styles.buttonText}>
                  {isOngoing ? "Join Session" : "Upcoming"}
                </Text>
              </TouchableOpacity>
            )}
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
      {editingTherapy && (
        <EditTherapy
          therapy={editingTherapy}
          onUpdate={handleUpdateTherapy}
          onCancel={() => setEditingTherapy(null)}
        />
      )}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showRemarksPopup}
        onRequestClose={() => setShowRemarksPopup(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Therapy Ended</Text>

            <Text style={styles.inputLabel}>Remarks:</Text>
            <TextInput
              style={styles.input}
              multiline
              numberOfLines={5}
              value={remarks}
              onChangeText={setRemarks}
              placeholder="Enter remarks here"
            />

            <Text style={styles.inputLabel}>Improvements:</Text>
            <TextInput
              style={styles.input}
              multiline
              numberOfLines={4}
              value={improvements}
              onChangeText={setImprovements}
              placeholder="Enter Improvements"
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => setShowRemarksPopup(false)}
              >
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={handleSaveRemarks}
              >
                <Text style={styles.textStyle}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDeleteConfirmation}
        onRequestClose={() => setShowDeleteConfirmation(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Confirm Deletion</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete this therapy?
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => setShowDeleteConfirmation(false)}
              >
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonDelete]}
                onPress={confirmDeleteTherapy}
              >
                <Text style={styles.textStyle}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  actionButtonsContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    zIndex: 1,
  },
  editButton: {
    marginRight: 10,
  },
  deleteButton: {
    marginLeft: 10,
  },
  scrollView: {
    flex: 1,
  },
  buttonDelete: {
    backgroundColor: "#FF6B6B",
  },
  doneButton: {
    backgroundColor: "#119FB3",
  },
  loadingText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 16,
  },
  buttonSave: {
    backgroundColor: "#119FB3",
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
  inputLabel: {
    alignSelf: "flex-start",
    marginBottom: 5,
    fontSize: 16,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#119FB3",
    borderRadius: 5,
    height: 40,
    marginBottom: 20,
    width: "100%",
    padding: 10,
    textAlignVertical: "top",
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
    width: "100%",
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: windowWidth > 360 ? 150 : "50%",
    elevation: 2,
    justifyContent: "space-between",
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
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    // margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "85%",
    maxWidth: 400,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#119FB3",
  },
  modalText: {
    marginBottom: 10,
    textAlign: "center",
    fontSize: 16,
  },
  remarksText: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 14,
    color: "#333",
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    minWidth: 100,
  },
  buttonClose: {
    backgroundColor: "#119FB3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default TherapyHistory;
