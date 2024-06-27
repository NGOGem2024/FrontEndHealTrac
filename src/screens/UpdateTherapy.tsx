import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { useSession } from "../context/SessionContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
}

interface TherapyResponse {
  therepys: Therapy[];
  responseData: {
    HostJoinUrl: string;
  };
}

type PatientScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, "Patient">;
  route: { params: { patientId: string } };
};

const TherapyTable: React.FC<PatientScreenProps> = ({ route }) => {
  const { session } = useSession();
  const { patientId } = route.params;
  const [therapies, setTherapies] = useState<Therapy[] | undefined>(undefined);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [showHostPopup, setShowHostPopup] = useState<boolean>(false);
  const [showRecPopup, setShowRecPopup] = useState<boolean>(false);
  const [showStartTherapyBut, setShowStartTherapyBut] =
    useState<boolean>(false);
  const [joinurl, setJoinurl] = useState<string>("");
  const [recUrl, setRecUrl] = useState<string>("");
  const [iframeUrl, setIframeUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    therapyType: "",
    remarks: "",
    therapyDate: new Date(),
    startTime: new Date(),
    endTime: new Date(),
  });
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showStartPicker, setShowStartPicker] = useState<boolean>(false);
  const [showEndPicker, setShowEndPicker] = useState<boolean>(false);
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
    fetchTherapies();
  }, [patientId, session]);

  const fetchTherapies = async () => {
    try {
      const response = await fetch(
        `http://192.168.31.171:5000/therepy/${patientId}`
      );
      const data = await response.json();
      setTherapies(data.therepys);
    } catch (error) {
      console.error("Error fetching therapy data:", error);
    }
  };

  const handleAddTherapy = async () => {
    if (!googleToken) {
      const newTokens = await refreshGoogleTokens();
      if (!newTokens) {
        throw new Error("Failed to refresh Google token");
      }
      setGoogleToken(newTokens.accessToken);
    }
    if (!session) {
      Alert.alert("Error", "Please log in to add a therapy.");
      return;
    }
    try {
      const formatTime = (date: Date) => {
        return date.toTimeString().split(" ")[0].substr(0, 5);
      };

      const requestBody = {
        contactId: patientId,
        message: "Please click the following LiveSwitch conversation link.",
        type: "LiveConversation",
        autoStartRecording: true,
        sendSmsNotification: true,
        remarks: formData.remarks,
        therepy_type: formData.therapyType,
        therepy_date: formData.therapyDate.toISOString().split("T")[0],
        therepy_start_time: formatTime(formData.startTime),
        therepy_end_time: formatTime(formData.endTime),
      };

      const response = await fetch(
        `http://192.168.31.171:5000/therepy/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + googleToken,
            refresh_token: session.refresh_token,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (response.ok) {
        const data: TherapyResponse = await response.json();
        await fetchTherapies(); // Refresh the therapies list
        setJoinurl(data.responseData.HostJoinUrl);
        setShowHostPopup(true);
        setShowPopup(false);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to add therapy.");
      }
    } catch (error) {
      setError("An error occurred while adding therapy.");
    }
  };

  const handleRecTherapy = async () => {
    try {
      const response = await fetch(`http://192.168.31.171:5000/recording`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

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

  const handleStartTherapy = (joinUrl: string) => {
    setIframeUrl(joinUrl);
    setShowStartTherapyBut(true);
  };

  const handleStopTherapy = () => {
    setIframeUrl("");
    setShowStartTherapyBut(false);
  };

  const handleChange = (name: string, value: any) => {
    setFormData({ ...formData, [name]: value });
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || formData.therapyDate;
    setShowDatePicker(Platform.OS === "ios");
    handleChange("therapyDate", currentDate);
  };

  const onStartChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || formData.startTime;
    setShowStartPicker(Platform.OS === "ios");
    handleChange("startTime", currentDate);
  };

  const onEndChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || formData.endTime;
    setShowEndPicker(Platform.OS === "ios");
    handleChange("endTime", currentDate);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Therapy Table</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={therapies}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.therapyItem}>
            <Text>Type: {item.therepy_type}</Text>
            <Text>Date: {item.therepy_date}</Text>
            <Text>Start Time: {item.therepy_start_time}</Text>
            <Text>End Time: {item.therepy_end_time}</Text>
            <Text>Remarks: {item.therepy_remarks}</Text>
            <TouchableOpacity style={styles.join}>
              <LinearGradient colors={["#d3eaf2", "#d3eaf2"]}>
                <Button
                  color="#2a7fba"
                  title="Join"
                  onPress={() => handleStartTherapy(item.therepy_link)}
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      />
      <View style={styles.btnContainer}>
        <View style={styles.btn}>
          <Button
            color="#2a7fba"
            title="Add Therapy"
            onPress={() => setShowPopup(true)}
          />
        </View>
        <View style={styles.btn}>
          <Button
            color="#2a7fba"
            title="Get Recording"
            onPress={handleRecTherapy}
          />
        </View>
      </View>
      <Modal visible={showPopup} animationType="slide">
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add New Therapy</Text>
          <TextInput
            style={styles.input}
            placeholder="Therapy Type"
            value={formData.therapyType}
            onChangeText={(value) => handleChange("therapyType", value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Remarks"
            value={formData.remarks}
            onChangeText={(value) => handleChange("remarks", value)}
          />
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Text style={styles.input}>
              Therapy Date: {formData.therapyDate.toDateString()}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={formData.therapyDate}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}
          <TouchableOpacity onPress={() => setShowStartPicker(true)}>
            <Text style={styles.input}>
              Start Time: {formatTime(formData.startTime)}
            </Text>
          </TouchableOpacity>
          {showStartPicker && (
            <DateTimePicker
              value={formData.startTime}
              mode="time"
              display="default"
              onChange={onStartChange}
            />
          )}
          <TouchableOpacity onPress={() => setShowEndPicker(true)}>
            <Text style={styles.input}>
              End Time: {formatTime(formData.endTime)}
            </Text>
          </TouchableOpacity>
          {showEndPicker && (
            <DateTimePicker
              value={formData.endTime}
              mode="time"
              display="default"
              onChange={onEndChange}
            />
          )}
          <Button
            color="#2a7fba"
            title="Add Therapy"
            onPress={handleAddTherapy}
          />
          <Button
            color="#d9534f"
            title="Cancel"
            onPress={() => setShowPopup(false)}
          />
        </View>
      </Modal>
      <Modal visible={showHostPopup} animationType="slide">
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Join Therapy Session</Text>
          <Text>{joinurl}</Text>
          <Button
            color="#2a7fba"
            title="Join"
            onPress={() => {
              setShowHostPopup(false);
              setShowStartTherapyBut(true);
            }}
          />
          <Button
            color="#d9534f"
            title="Close"
            onPress={() => setShowHostPopup(false)}
          />
        </View>
      </Modal>
      <Modal visible={showRecPopup} animationType="slide">
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Recording URL</Text>
          <Text>{recUrl}</Text>
          <Button
            color="#d9534f"
            title="Close"
            onPress={() => setShowRecPopup(false)}
          />
        </View>
      </Modal>
      {showStartTherapyBut && (
        <Modal visible={true} animationType="slide">
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Therapy Session</Text>
            <Text>{iframeUrl}</Text>
            <Button
              color="#d9534f"
              title="Stop Therapy"
              onPress={handleStopTherapy}
            />
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  btnContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  btn: { margin: 8 },
  therapyItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#ccc" },
  input: { borderBottomWidth: 1, borderBottomColor: "#ccc", marginBottom: 16 },
  modalContent: { flex: 1, padding: 16, justifyContent: "center" },
  modalTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  error: { color: "red", marginBottom: 16 },
  join: { marginTop: 10, backgroundColor: "#d3eaf2", borderRadius: 5 },
});

export default TherapyTable;
