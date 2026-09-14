import React, { useEffect, useMemo, useState } from "react";
import {
  Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View, Switch, Platform
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";

const STORAGE_KEY = "stockify_inventory_v1";
const THEME_KEY = "stockify_dark_mode_v1";

const emptyForm = {
  nama: "",
  kode: "",
  ruangan: "Lab Komputer",
  jumlah: "",
  kondisi: "Baik",
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [data, setData] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [screen, setScreen] = useState("home");
  const [search, setSearch] = useState("");
  const [filterRuangan, setFilterRuangan] = useState("Semua");
  const [filterKondisi, setFilterKondisi] = useState("Semua");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1800);
    loadData();
    return () => clearTimeout(timer);
  }, []);

  async function loadData() {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const theme = await AsyncStorage.getItem(THEME_KEY);
      if (saved) setData(JSON.parse(saved));
      if (theme) setDark(theme === "1");
    } catch (e) {
      Alert.alert("Gagal", "Data lokal tidak dapat dibaca.");
    }
  }

  async function saveData(next) {
    setData(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  async function toggleDark(value) {
    setDark(value);
    await AsyncStorage.setItem(THEME_KEY, value ? "1" : "0");
  }

  const stats = useMemo(() => ({
    total: data.reduce((s, x) => s + Number(x.jumlah || 0), 0),
    baik: data.filter(x => x.kondisi === "Baik").reduce((s, x) => s + Number(x.jumlah || 0), 0),
    rusak: data.filter(x => x.kondisi !== "Baik").reduce((s, x) => s + Number(x.jumlah || 0), 0),
  }), [data]);

  const rooms = useMemo(() => ["Semua", ...Array.from(new Set(data.map(x => x.ruangan)))], [data]);

  const filtered = useMemo(() => data.filter(x => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || x.nama.toLowerCase().includes(q) || x.kode.toLowerCase().includes(q);
    const matchRoom = filterRuangan === "Semua" || x.ruangan === filterRuangan;
    const matchCondition = filterKondisi === "Semua" || x.kondisi === filterKondisi;
    return matchSearch && matchRoom && matchCondition;
  }), [data, search, filterRuangan, filterKondisi]);

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function submitForm() {
    if (!form.nama.trim() || !form.kode.trim() || !form.ruangan.trim() || !form.jumlah) {
      Alert.alert("Data belum lengkap", "Isi semua data barang terlebih dahulu.");
      return;
    }
    const qty = Number(form.jumlah);
    if (!Number.isInteger(qty) || qty <= 0) {
      Alert.alert("Jumlah tidak valid", "Jumlah barang harus berupa angka lebih dari 0.");
      return;
    }

    if (editingId) {
      const next = data.map(x => x.id === editingId ? { ...x, ...form, jumlah: qty } : x);
      await saveData(next);
      Alert.alert("Berhasil", "Data inventaris berhasil diperbarui.");
    } else {
      const item = { ...form, jumlah: qty, id: Date.now().toString() };
      await saveData([item, ...data]);
      Alert.alert("Berhasil", "Data inventaris berhasil ditambahkan.");
    }
    setForm(emptyForm);
    setEditingId(null);
    setScreen("list");
  }

  function editItem(item) {
    setForm({
      nama: item.nama, kode: item.kode, ruangan: item.ruangan,
      jumlah: String(item.jumlah), kondisi: item.kondisi
    });
    setEditingId(item.id);
    setScreen("form");
  }

  function deleteItem(id) {
    Alert.alert("Konfirmasi", "Apakah Anda yakin ingin menghapus data ini?", [
      { text: "Batal", style: "cancel" },
      { text: "Ya", style: "destructive", onPress: async () => {
        await saveData(data.filter(x => x.id !== id));
      }}
    ]);
  }

  async function clearAll() {
    Alert.alert("Hapus semua", "Hapus seluruh data inventaris?", [
      { text: "Batal", style: "cancel" },
      { text: "Ya", style: "destructive", onPress: async () => {
        await saveData([]);
      }}
    ]);
  }

  if (showSplash) {
    return (
      <View style={[styles.splash, { backgroundColor: dark ? "#020617" : "#0f172a" }]}>
        <View style={styles.logoCircle}><Text style={styles.logoText}>S</Text></View>
        <Text style={styles.splashTitle}>Stockify</Text>
        <Text style={styles.splashSub}>Sistem Inventaris Ruangan Komputer</Text>
        <View style={styles.loadingBar}><View style={styles.loadingFill}/></View>
        <Text style={styles.loadingText}>Memuat aplikasi...</Text>
      </View>
    );
  }

  const C = dark ? darkColors : lightColors;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.bg }]}>
      <StatusBar style={dark ? "light" : "dark"} />
      <View style={styles.header}>
        <View>
          <Text style={[styles.brand, { color: C.text }]}>Stockify</Text>
          <Text style={[styles.subtitle, { color: C.muted }]}>Inventaris Lab Komputer</Text>
        </View>
        <View style={styles.themeRow}>
          <Text style={[styles.smallText, { color: C.muted }]}>🌙</Text>
          <Switch value={dark} onValueChange={toggleDark} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {screen === "home" && (
          <>
            <Text style={[styles.greeting, { color: C.text }]}>Dashboard</Text>
            <Text style={[styles.muted, { color: C.muted }]}>Pantau stok barang secara cepat dan sederhana.</Text>

            <View style={styles.statsGrid}>
              <StatCard title="Total Barang" value={stats.total} icon="📦" C={C} />
              <StatCard title="Kondisi Baik" value={stats.baik} icon="✓" C={C} />
              <StatCard title="Barang Rusak" value={stats.rusak} icon="!" C={C} />
            </View>

            <SectionTitle title="Aksi Cepat" C={C} />
            <ActionButton title="＋ Tambah Inventaris" onPress={() => { setForm(emptyForm); setEditingId(null); setScreen("form"); }} primary />
            <ActionButton title="▣ Lihat Daftar Inventaris" onPress={() => setScreen("list")} />

            <SectionTitle title="Informasi" C={C} />
            <View style={[styles.infoBox, { backgroundColor: C.card, borderColor: C.border }]}>
              <Text style={[styles.infoText, { color: C.text }]}>Data tersimpan otomatis di penyimpanan lokal perangkat.</Text>
              <Text style={[styles.infoText, { color: C.muted }]}>Pembuat: Rendi Aldiano Eka Saputra</Text>
            </View>
          </>
        )}

        {screen === "form" && (
          <>
            <Text style={[styles.pageTitle, { color: C.text }]}>{editingId ? "Edit Inventaris" : "Tambah Inventaris"}</Text>
            <Field label="Nama Barang" value={form.nama} onChangeText={v => update("nama", v)} placeholder="Contoh: PC Lenovo" C={C} />
            <Field label="Kode Inventaris" value={form.kode} onChangeText={v => update("kode", v)} placeholder="Contoh: INV-PC-001" C={C} />
            <Field label="Nama Ruangan" value={form.ruangan} onChangeText={v => update("ruangan", v)} placeholder="Lab Komputer" C={C} />
            <Field label="Jumlah Barang" value={form.jumlah} onChangeText={v => update("jumlah", v.replace(/[^0-9]/g, ""))} placeholder="0" keyboardType="numeric" C={C} />

            <Text style={[styles.label, { color: C.text }]}>Kondisi Barang</Text>
            <View style={styles.chips}>
              {["Baik", "Rusak Ringan", "Rusak Berat"].map(k => (
                <TouchableOpacity key={k} onPress={() => update("kondisi", k)}
                  style={[styles.chip, { backgroundColor: form.kondisi === k ? "#2563eb" : C.card, borderColor: C.border }]}>
                  <Text style={{ color: form.kondisi === k ? "#fff" : C.text, fontWeight: "700" }}>{k}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <ActionButton title={editingId ? "Simpan Perubahan" : "Simpan Inventaris"} onPress={submitForm} primary />
            <ActionButton title="Batal" onPress={() => { setForm(emptyForm); setEditingId(null); setScreen("home"); }} />
          </>
        )}

        {screen === "list" && (
          <>
            <Text style={[styles.pageTitle, { color: C.text }]}>Daftar Inventaris</Text>
            <TextInput
              value={search} onChangeText={setSearch}
              placeholder="Cari nama atau kode inventaris..."
              placeholderTextColor={C.placeholder}
              style={[styles.search, { backgroundColor: C.card, borderColor: C.border, color: C.text }]}
            />
            <Text style={[styles.label, { color: C.text }]}>Filter Ruangan</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {rooms.map(r => <TouchableOpacity key={r} onPress={() => setFilterRuangan(r)}
                style={[styles.filterChip, { backgroundColor: filterRuangan === r ? "#2563eb" : C.card, borderColor: C.border }]}>
                <Text style={{ color: filterRuangan === r ? "#fff" : C.text }}>{r}</Text>
              </TouchableOpacity>)}
            </ScrollView>
            <Text style={[styles.label, { color: C.text }]}>Filter Kondisi</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {["Semua", "Baik", "Rusak Ringan", "Rusak Berat"].map(k => <TouchableOpacity key={k} onPress={() => setFilterKondisi(k)}
                style={[styles.filterChip, { backgroundColor: filterKondisi === k ? "#2563eb" : C.card, borderColor: C.border }]}>
                <Text style={{ color: filterKondisi === k ? "#fff" : C.text }}>{k}</Text>
              </TouchableOpacity>)}
            </ScrollView>

            {filtered.length === 0 ? (
              <View style={[styles.empty, { backgroundColor: C.card, borderColor: C.border }]}>
                <Text style={{ fontSize: 34 }}>📦</Text>
                <Text style={[styles.emptyTitle, { color: C.text }]}>Belum ada data</Text>
                <Text style={{ color: C.muted, textAlign: "center" }}>Tambahkan inventaris atau ubah kata pencarian.</Text>
              </View>
            ) : filtered.map(item => (
              <View key={item.id} style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: C.text }]}>{item.nama}</Text>
                  <Text style={{ color: C.muted }}>Kode: {item.kode}</Text>
                  <Text style={{ color: C.muted }}>Ruangan: {item.ruangan}</Text>
                  <Text style={{ color: C.muted }}>Jumlah: {item.jumlah}</Text>
                  <Text style={{ color: item.kondisi === "Baik" ? "#16a34a" : "#dc2626", fontWeight: "800", marginTop: 5 }}>
                    ● {item.kondisi}
                  </Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => editItem(item)} style={styles.editBtn}><Text style={styles.btnText}>Edit</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteItem(item.id)} style={styles.deleteBtn}><Text style={styles.btnText}>Hapus</Text></TouchableOpacity>
                </View>
              </View>
            ))}

            {data.length > 0 && <ActionButton title="Hapus Semua Data" onPress={clearAll} danger />}
          </>
        )}
      </ScrollView>

      <View style={[styles.nav, { backgroundColor: C.card, borderTopColor: C.border }]}>
        <NavButton title="⌂" label="Beranda" active={screen === "home"} onPress={() => setScreen("home")} C={C} />
        <NavButton title="＋" label="Tambah" active={screen === "form"} onPress={() => { setForm(emptyForm); setEditingId(null); setScreen("form"); }} C={C} />
        <NavButton title="▤" label="Inventaris" active={screen === "list"} onPress={() => setScreen("list")} C={C} />
      </View>
    </SafeAreaView>
  );
}

function StatCard({ title, value, icon, C }) {
  return <View style={[styles.stat, { backgroundColor: C.card, borderColor: C.border }]}>
    <Text style={{ fontSize: 22 }}>{icon}</Text>
    <Text style={[styles.statValue, { color: C.text }]}>{value}</Text>
    <Text style={[styles.statTitle, { color: C.muted }]}>{title}</Text>
  </View>;
}

function Field({ label, C, ...props }) {
  return <View>
    <Text style={[styles.label, { color: C.text }]}>{label}</Text>
    <TextInput {...props} placeholderTextColor={C.placeholder}
      style={[styles.input, { backgroundColor: C.card, borderColor: C.border, color: C.text }]} />
  </View>;
}

function SectionTitle({ title, C }) {
  return <Text style={[styles.sectionTitle, { color: C.text }]}>{title}</Text>;
}

function ActionButton({ title, onPress, primary, danger }) {
  return <TouchableOpacity onPress={onPress}
    style={[styles.action, primary && styles.primary, danger && styles.danger]}>
    <Text style={styles.actionText}>{title}</Text>
  </TouchableOpacity>;
}

function NavButton({ title, label, active, onPress, C }) {
  return <TouchableOpacity onPress={onPress} style={styles.navItem}>
    <Text style={{ fontSize: 22, color: active ? "#2563eb" : C.muted }}>{title}</Text>
    <Text style={{ fontSize: 11, color: active ? "#2563eb" : C.muted, fontWeight: active ? "800" : "500" }}>{label}</Text>
  </TouchableOpacity>;
}

const lightColors = { bg: "#f8fafc", card: "#ffffff", text: "#0f172a", muted: "#64748b", border: "#e2e8f0", placeholder: "#94a3b8" };
const darkColors = { bg: "#020617", card: "#0f172a", text: "#f8fafc", muted: "#94a3b8", border: "#1e293b", placeholder: "#64748b" };

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { fontSize: 27, fontWeight: "900" },
  subtitle: { fontSize: 12, marginTop: 1 },
  themeRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  container: { padding: 18, paddingBottom: 100 },
  greeting: { fontSize: 25, fontWeight: "900", marginTop: 4 },
  pageTitle: { fontSize: 24, fontWeight: "900", marginBottom: 15 },
  muted: { marginTop: 4, lineHeight: 20 },
  smallText: { fontSize: 16 },
  statsGrid: { flexDirection: "row", gap: 8, marginTop: 18 },
  stat: { flex: 1, padding: 13, borderRadius: 16, borderWidth: 1, minHeight: 112 },
  statValue: { fontSize: 25, fontWeight: "900", marginTop: 5 },
  statTitle: { fontSize: 11, marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginTop: 22, marginBottom: 10 },
  action: { paddingVertical: 14, borderRadius: 13, alignItems: "center", marginBottom: 9, backgroundColor: "#334155" },
  primary: { backgroundColor: "#2563eb" },
  danger: { backgroundColor: "#dc2626" },
  actionText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  infoBox: { borderWidth: 1, padding: 15, borderRadius: 15, gap: 8 },
  infoText: { fontSize: 13, lineHeight: 19 },
  label: { fontSize: 13, fontWeight: "800", marginBottom: 7, marginTop: 7 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12, fontSize: 15, marginBottom: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 15 },
  chip: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
  search: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12, fontSize: 14, marginBottom: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 20, borderWidth: 1, marginRight: 7 },
  card: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: "row", gap: 10 },
  cardTitle: { fontSize: 17, fontWeight: "900", marginBottom: 4 },
  cardActions: { justifyContent: "center", gap: 7 },
  editBtn: { backgroundColor: "#2563eb", paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 },
  deleteBtn: { backgroundColor: "#dc2626", paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 11 },
  empty: { padding: 30, borderRadius: 16, borderWidth: 1, alignItems: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "800", marginVertical: 7 },
  nav: { position: "absolute", bottom: 0, left: 0, right: 0, height: 68, borderTopWidth: 1, flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  navItem: { alignItems: "center", minWidth: 75 },
  splash: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 },
  logoCircle: { width: 100, height: 100, borderRadius: 28, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  logoText: { color: "#fff", fontSize: 58, fontWeight: "900" },
  splashTitle: { color: "#fff", fontSize: 36, fontWeight: "900" },
  splashSub: { color: "#cbd5e1", textAlign: "center", marginTop: 7, fontSize: 13 },
  loadingBar: { width: 180, height: 5, backgroundColor: "#334155", borderRadius: 5, marginTop: 28, overflow: "hidden" },
  loadingFill: { width: "65%", height: "100%", backgroundColor: "#60a5fa" },
  loadingText: { color: "#94a3b8", fontSize: 12, marginTop: 9 }
});
