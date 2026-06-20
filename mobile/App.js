import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const API_URL = 'http://127.0.0.1:8000';

export default function App() {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('police_delhi@gov.in');
  const [password, setPassword] = useState('police123');
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState('home');
  const [accidents, setAccidents] = useState([]);
  const [selected, setSelected] = useState(null);

  const login = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Login failed');
      setToken(data.access_token);
      setUser(data.user);
      await loadAccidents(data.access_token);
    } catch (err) {
      Alert.alert('Secure login failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAccidents = async (accessToken = token) => {
    try {
      const res = await fetch(`${API_URL}/accidents`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Unable to sync accidents');
      setAccidents(data);
      if (!selected && data.length) setSelected(data[0]);
    } catch (err) {
      Alert.alert('Sync failed', err.message);
    }
  };

  const updateStatus = async (role, status) => {
    if (!selected) return;
    const route = role === 'police' ? 'police-status' : 'hospital-status';
    const payload = role === 'police' ? { police_status: status } : { hospital_status: status };
    try {
      const res = await fetch(`${API_URL}/accidents/${selected.id}/${route}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Status update failed');
      setSelected(data);
      await loadAccidents();
    } catch (err) {
      Alert.alert('Update failed', err.message);
    }
  };

  if (!token) {
    return (
      <View style={styles.login}>
        <StatusBar style="light" />
        <View style={styles.logo}><Text style={styles.logoText}>S</Text></View>
        <Text style={styles.title}>Government Emergency Portal</Text>
        <Text style={styles.subtitle}>Field Responder Mobile Gateway</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Official Login ID</Text>
          <TextInput style={styles.input} autoCapitalize="none" value={email} onChangeText={setEmail} />
          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />
          <TouchableOpacity style={styles.primaryButton} onPress={login} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>SECURE LOGIN</Text>}
          </TouchableOpacity>
        </View>
        <Text style={styles.notice}>Authorized government officers only.</Text>
      </View>
    );
  }

  return (
    <View style={styles.app}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{user.role.toUpperCase()} - {user.name}</Text>
          <Text style={styles.headerSub}>{user.station_name || 'Central Government Command'}</Text>
        </View>
        <TouchableOpacity onPress={() => setToken('')} style={styles.logout}><Text style={styles.logoutText}>LOGOUT</Text></TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {['home', 'map', 'details', 'notifications'].map((item) => (
          <TouchableOpacity key={item} onPress={() => setScreen(item)} style={[styles.tab, screen === item && styles.tabActive]}>
            <Text style={[styles.tabText, screen === item && styles.tabTextActive]}>{item.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {screen === 'home' && <Home accidents={accidents} setSelected={setSelected} setScreen={setScreen} refresh={() => loadAccidents()} />}
      {screen === 'map' && <MapScreen accidents={accidents} selected={selected} />}
      {screen === 'details' && <Details accident={selected} user={user} updateStatus={updateStatus} />}
      {screen === 'notifications' && <Notifications accidents={accidents} />}
    </View>
  );
}

function Home({ accidents, setSelected, setScreen, refresh }) {
  const active = accidents.filter((a) => a.police_status !== 'resolved' || a.hospital_status !== 'treated');
  return (
    <ScrollView contentContainerStyle={styles.body}>
      <View style={styles.rowBetween}>
        <Text style={styles.section}>Live Accident Feed ({active.length})</Text>
        <TouchableOpacity onPress={refresh} style={styles.smallButton}><Text style={styles.smallButtonText}>SYNC</Text></TouchableOpacity>
      </View>
      {active.length === 0 ? <Empty /> : active.map((a) => (
        <TouchableOpacity key={a.id} style={styles.alertCard} onPress={() => { setSelected(a); setScreen('details'); }}>
          <View style={styles.redBar}><Text style={styles.redBarText}>INCIDENT #{a.id} - {a.severity.toUpperCase()}</Text></View>
          <Text style={styles.cardTitle}>{a.vehicle?.plate_number || `Vehicle ${a.vehicle_id}`}</Text>
          <Text style={styles.cardText}>{a.location_address}</Text>
          <View style={styles.statusGrid}>
            <Text style={styles.statusText}>Police: {a.police_status.toUpperCase()}</Text>
            <Text style={styles.statusText}>Hospital: {a.hospital_status.toUpperCase()}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function MapScreen({ accidents, selected }) {
  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.section}>Map Screen</Text>
      <View style={styles.mapMock}>
        <Text style={styles.mapTitle}>Live GPS Dispatch Map</Text>
        <Text style={styles.mapText}>Backend coordinates are synced. Add a React Native map provider key to render native map tiles.</Text>
        {(selected ? [selected] : accidents.slice(0, 5)).map((a) => (
          <View key={a.id} style={styles.coordinateRow}>
            <Text style={styles.coordinateText}>#{a.id}</Text>
            <Text style={styles.coordinateText}>{Number(a.latitude).toFixed(4)}, {Number(a.longitude).toFixed(4)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Details({ accident, user, updateStatus }) {
  if (!accident) return <View style={styles.body}><Empty text="Select an incident from Home." /></View>;
  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.section}>Accident Details</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Incident #{accident.id}</Text>
        <Text style={styles.severity}>{accident.severity.toUpperCase()}</Text>
        <Text style={styles.cardText}>{accident.location_address}</Text>
        <Info label="Impact force" value={`${accident.sensor_data?.impact_force || 'N/A'} N`} />
        <Info label="Speed at impact" value={`${accident.sensor_data?.speed_at_impact || 'N/A'} km/h`} />
        <Info label="Police status" value={accident.police_status.toUpperCase()} />
        <Info label="Hospital status" value={accident.hospital_status.toUpperCase()} />
        {(user.role === 'police' || user.role === 'superadmin') && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => updateStatus('police', 'dispatched')}><Text style={styles.buttonText}>POLICE DISPATCHED</Text></TouchableOpacity>
            <TouchableOpacity style={styles.successButton} onPress={() => updateStatus('police', 'resolved')}><Text style={styles.buttonText}>RESOLVED</Text></TouchableOpacity>
          </View>
        )}
        {(user.role === 'hospital' || user.role === 'superadmin') && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => updateStatus('hospital', 'dispatched')}><Text style={styles.buttonText}>AMBULANCE OUT</Text></TouchableOpacity>
            <TouchableOpacity style={styles.successButton} onPress={() => updateStatus('hospital', 'treated')}><Text style={styles.buttonText}>TREATED</Text></TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function Notifications({ accidents }) {
  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.section}>Push Notification History</Text>
      {accidents.map((a) => (
        <View key={a.id} style={styles.notification}>
          <Text style={styles.notificationTitle}>Dispatch Alert #{a.id}</Text>
          <Text style={styles.cardText}>{a.severity.toUpperCase()} accident at {a.location_address}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function Info({ label, value }) {
  return <View style={styles.info}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

function Empty({ text = 'No active dispatches in your sector.' }) {
  return <View style={styles.empty}><Text style={styles.emptyTitle}>Sector Clear</Text><Text style={styles.cardText}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#FFFFFF' },
  login: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#1E3A8A' },
  logo: { alignSelf: 'center', width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoText: { color: '#1E3A8A', fontSize: 36, fontWeight: '900' },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: '#BFDBFE', fontSize: 12, fontWeight: '800', textAlign: 'center', marginTop: 6, marginBottom: 26, textTransform: 'uppercase' },
  notice: { color: '#BFDBFE', textAlign: 'center', marginTop: 20, fontSize: 12, fontWeight: '700' },
  header: { paddingTop: 52, paddingHorizontal: 18, paddingBottom: 14, backgroundColor: '#1E3A8A', borderBottomColor: '#DC2626', borderBottomWidth: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  headerSub: { color: '#BFDBFE', fontSize: 10, fontWeight: '700', marginTop: 4 },
  logout: { backgroundColor: '#DC2626', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 4 },
  logoutText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  tabs: { flexDirection: 'row', borderBottomColor: '#BFDBFE', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#F0F4FF' },
  tabActive: { backgroundColor: '#1E3A8A' },
  tabText: { fontSize: 9, fontWeight: '900', color: '#1E3A8A' },
  tabTextActive: { color: '#FFFFFF' },
  body: { padding: 18, gap: 14 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  section: { color: '#1E3A8A', fontSize: 16, fontWeight: '900', textTransform: 'uppercase' },
  card: { backgroundColor: '#F0F4FF', borderColor: '#BFDBFE', borderWidth: 1, borderRadius: 8, padding: 18 },
  alertCard: { backgroundColor: '#FFFFFF', borderColor: '#BFDBFE', borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  redBar: { backgroundColor: '#DC2626', padding: 10 },
  redBarText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  cardTitle: { color: '#1E3A8A', fontSize: 16, fontWeight: '900', margin: 12, marginBottom: 6 },
  cardText: { color: '#475569', fontSize: 12, fontWeight: '600', lineHeight: 18, marginHorizontal: 12, marginBottom: 12 },
  label: { color: '#1E3A8A', fontSize: 10, fontWeight: '900', marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: '#FFFFFF', borderColor: '#BFDBFE', borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, height: 46, marginBottom: 16, color: '#0F172A' },
  primaryButton: { flex: 1, minHeight: 44, borderRadius: 6, backgroundColor: '#1E3A8A', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  successButton: { flex: 1, minHeight: 44, borderRadius: 6, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  buttonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  smallButton: { borderColor: '#BFDBFE', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  smallButtonText: { color: '#1E3A8A', fontSize: 10, fontWeight: '900' },
  statusGrid: { margin: 12, flexDirection: 'row', gap: 8 },
  statusText: { flex: 1, backgroundColor: '#F0F4FF', color: '#1E3A8A', padding: 8, fontSize: 10, fontWeight: '900' },
  mapMock: { minHeight: 420, borderRadius: 8, backgroundColor: '#F0F4FF', borderColor: '#BFDBFE', borderWidth: 1, padding: 16, justifyContent: 'center' },
  mapTitle: { color: '#1E3A8A', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  mapText: { color: '#475569', textAlign: 'center', marginVertical: 12, fontWeight: '700' },
  coordinateRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 6, padding: 10, marginTop: 8 },
  coordinateText: { color: '#1E3A8A', fontWeight: '900' },
  severity: { alignSelf: 'flex-start', backgroundColor: '#DC2626', color: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, marginHorizontal: 12, marginBottom: 10, fontWeight: '900' },
  info: { marginHorizontal: 12, marginBottom: 10, paddingBottom: 10, borderBottomColor: '#BFDBFE', borderBottomWidth: 1 },
  infoLabel: { color: '#64748B', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  infoValue: { color: '#1E3A8A', fontSize: 13, fontWeight: '900', marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 10, marginHorizontal: 12, marginTop: 8 },
  notification: { backgroundColor: '#FFFFFF', borderColor: '#BFDBFE', borderWidth: 1, borderRadius: 8, paddingTop: 12 },
  notificationTitle: { color: '#DC2626', fontSize: 14, fontWeight: '900', marginHorizontal: 12, marginBottom: 6 },
  empty: { backgroundColor: '#F0F4FF', borderColor: '#BFDBFE', borderWidth: 1, borderRadius: 8, padding: 30, alignItems: 'center' },
  emptyTitle: { color: '#16A34A', fontSize: 18, fontWeight: '900', marginBottom: 8 }
});
